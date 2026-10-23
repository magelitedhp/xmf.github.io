import test from 'node:test';
import assert from 'node:assert/strict';
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
