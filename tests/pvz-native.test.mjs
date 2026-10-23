import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {buildCompiledPak} from '../games-src/pvz-kindergarten/native-pak.mjs';

test('native resource PAK preserves compiled animation and alpha-mask payloads with a valid index',()=>{
  const entries=[['compiled/reanim/SelectorScreen.reanim.compiled',new Uint8Array([0xd4,0xfe,0xad,0xde,1,2,3])],['reanim/SelectorScreen_BG_Center_.png',new Uint8Array([137,80,78,71])]];
  const encrypted=buildCompiledPak(entries);const data=encrypted.map(value=>value^0xf7);const view=new DataView(data.buffer);
  assert.equal(view.getUint32(0,true),0xbac04ac0);assert.equal(view.getUint32(4,true),0);
  let offset=8;const sizes=[];
  for(const[path,bytes]of entries){assert.equal(data[offset++],0);const size=data[offset++];assert.equal(new TextDecoder().decode(data.subarray(offset,offset+size)),path);offset+=size;assert.equal(view.getUint32(offset,true),bytes.length);sizes.push(bytes.length);offset+=12;}
  assert.equal(data[offset++],0x80);
  for(let i=0;i<entries.length;i++){assert.deepEqual(data.slice(offset,offset+sizes[i]),entries[i][1]);offset+=sizes[i];}
  assert.equal(offset,data.length);assert.deepEqual(entries[0][1],new Uint8Array([0xd4,0xfe,0xad,0xde,1,2,3]));
});
test('native PAK refuses unsafe paths, ambiguous case-only duplicates and oversized names',()=>{
  for(const path of ['../secret','/absolute','reanim/../secret','a\\b','a\0b','a//b','a'.repeat(256)])assert.throws(()=>buildCompiledPak([[path,new Uint8Array([1])]]));
  assert.throws(()=>buildCompiledPak([['reanim/A.png',new Uint8Array()],['reanim/a.png',new Uint8Array()]]));
});

async function bootLoader(resourcesReady, ok=true){
  const source=(await readFile(new URL('../games-src/pvz-kindergarten/native-loader.mjs',import.meta.url),'utf8')).replace(/^import[^\n]*\n/gm,'');
  const elements=new Map(['load-status','runtime-status','loader','error','progress','release-note','canvas','canvas-container','save-export','save-import','keyboard','import-save','pvz-soft-keyboard'].map(id=>[id,{hidden:['error','release-note'].includes(id),disabled:true,addEventListener(){}}]));
  const requests=[],scripts=[];
  const window={addEventListener(){}};
  const document={getElementById:id=>elements.get(id),documentElement:{scrollHeight:642},addEventListener(){},createElement:()=>({}),body:{append:script=>scripts.push(script)}};
  const context=vm.createContext({window,parent:window,document,location:{origin:'https://example.test'},ResizeObserver:class{observe(){}},setInterval(){},adaptResources(){},downloadPart(){},fetch:async url=>{
    requests.push(url);
    return {ok,status:ok?200:503,json:async()=>url.endsWith('availability.json')?{resourcesReady}:{format:1,parts:[{file:'resources-00.zip',bytes:1,sha256:'0'.repeat(64)}]}};
  }});
  new vm.Script(source).runInContext(context);
  for(let i=0;i<4;i++)await new Promise(resolve=>setImmediate(resolve));
  return {state:window.pvzNative,elements,requests,scripts};
}

test('static preview shows pending release without fetching absent data or starting WASM',async()=>{
  const {state,elements,requests,scripts}=await bootLoader(false);
  assert.equal(state.pendingRelease,true);
  assert.equal(state.started,false);
  assert.equal(state.errors.length,0);
  assert.deepEqual(requests,['native/availability.json']);
  assert.equal(scripts.length,0);
  assert.equal(elements.get('release-note').hidden,false);
  assert.equal(elements.get('progress').hidden,true);
  for(const id of ['save-export','save-import','keyboard'])assert.equal(elements.get(id).disabled,true);
});

test('available local resources still start the native engine automatically without file selection',async()=>{
  const {state,requests,scripts}=await bootLoader(true);
  assert.deepEqual(requests,['native/availability.json','native/resources.json']);
  assert.equal(scripts.length,1);
  assert.equal(scripts[0].src,'native/pvz-portable.js');
  assert.equal(state.errors.length,0);
  assert.notEqual(state.pendingRelease,true);
});

test('availability network failures are reported rather than incorrectly labelled pending',async()=>{
  const {state,elements,scripts}=await bootLoader(false,false);
  assert.match(state.errors[0],/HTTP 503/);
  assert.equal(elements.get('error').hidden,false);
  assert.notEqual(state.pendingRelease,true);
  assert.equal(scripts.length,0);
});
