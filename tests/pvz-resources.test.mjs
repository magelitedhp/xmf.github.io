import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {downloadPart} from '../games-src/pvz-kindergarten/native-download.mjs';
import {verifyResourceBundle} from '../games-src/pvz-kindergarten/native-manifest.mjs';

const bytes=new Uint8Array([1,2,3,4]);
const part={file:'resources-00.zip',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
const baseUrl='https://example.test/games/pvz-kindergarten/index.html';
const options={baseUrl,sleep:async()=>{}};
function memoryCache(){
  const store=new Map();
  const cache={
    match:async key=>store.get(key)?.clone(),
    put:async(key,response)=>store.set(key,response.clone()),
    delete:async key=>store.delete(typeof key==='string'?key:key.url),
    keys:async()=>[...store.keys()].map(url=>({url})),
  };
  return {store,cache,storage:{open:async()=>cache}};
}

test('resource download streams progress and subsequent loads use a verified persistent cache',async()=>{
  const {store,storage}=memoryCache();let calls=0;const progress=[];
  const fetcher=async()=>{calls++;return new Response(bytes);};
  assert.deepEqual(await downloadPart(part,{...options,fetcher,cacheStorage:storage,onProgress:n=>progress.push(n)}),bytes);
  assert.equal(calls,1);assert.equal(store.size,1);assert.ok(progress.includes(bytes.length));
  let cached=false;
  assert.deepEqual(await downloadPart(part,{...options,fetcher,cacheStorage:storage,onProgress:(_,info)=>{cached=info.cached===true;}}),bytes);
  assert.equal(cached,true);assert.equal(calls,1);
});

test('corrupt cache is replaced and only obsolete versions of the same part are evicted',async()=>{
  const {store,storage}=memoryCache();
  const url=new URL('native/'+part.file,baseUrl).href;
  const key=url+'?sha256='+part.sha256;
  store.set(key,new Response(new Uint8Array([9,9,9,9])));
  store.set(url+'?sha256=old',new Response(bytes));
  store.set(new URL('native/resources-01.zip?sha256=keep',baseUrl).href,new Response(bytes));
  let calls=0;
  await downloadPart(part,{...options,cacheStorage:storage,fetcher:async()=>{calls++;return new Response(bytes);}});
  assert.equal(calls,1);assert.equal(store.size,2);
  assert.deepEqual(new Uint8Array(await store.get(key).arrayBuffer()),bytes);
});

test('HTTP failures and truncated downloads retry before succeeding',async()=>{
  let calls=0;const delays=[];
  const result=await downloadPart(part,{...options,cacheStorage:null,sleep:async ms=>delays.push(ms),fetcher:async()=>{
    calls++;
    if(calls===1)return new Response('unavailable',{status:503});
    if(calls===2)return new Response(bytes.slice(0,2));
    return new Response(bytes);
  }});
  assert.deepEqual(result,bytes);assert.equal(calls,3);assert.deepEqual(delays,[700,1400]);
});

test('checksum failures stop after three attempts without poisoning cache',async()=>{
  const {store,storage}=memoryCache();let calls=0;
  await assert.rejects(downloadPart(part,{...options,cacheStorage:storage,fetcher:async()=>{calls++;return new Response(new Uint8Array([4,3,2,1]));}}),/资源包校验失败/);
  assert.equal(calls,3);assert.equal(store.size,0);
});

test('cache access or quota failures do not prevent a successful download',async()=>{
  for(const storage of [{open:async()=>{throw Error('disabled');}},{open:async()=>({...memoryCache().cache,put:async()=>{throw Error('quota');}})}]){
    const warnings=[];
    const result=await downloadPart(part,{...options,cacheStorage:storage,fetcher:async()=>new Response(bytes),onCacheWarning:message=>warnings.push(message)});
    assert.deepEqual(result,bytes);assert.equal(warnings.length,1);
  }
});

test('build verification distinguishes absent preview data from a complete resource bundle',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'yumo-pvz-manifest-'));
  try{
    assert.deepEqual(await verifyResourceBundle(dir),{resourcesReady:false});
    await writeFile(path.join(dir,part.file),bytes);
    await writeFile(path.join(dir,'resources.json'),JSON.stringify({format:1,files:1,parts:[part]}));
    assert.deepEqual(await verifyResourceBundle(dir),{resourcesReady:true,files:1,parts:1,downloadBytes:bytes.length});
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('build verification blocks missing, truncated or checksum-mismatched resource bundles',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'yumo-pvz-manifest-'));
  try{
    await writeFile(path.join(dir,'resources.json'),JSON.stringify({format:1,files:1,parts:[part]}));
    await assert.rejects(verifyResourceBundle(dir),{code:'ENOENT'});
    await writeFile(path.join(dir,part.file),bytes.slice(0,1));
    await assert.rejects(verifyResourceBundle(dir),/size mismatch/);
    await writeFile(path.join(dir,part.file),new Uint8Array([4,3,2,1]));
    await assert.rejects(verifyResourceBundle(dir),/checksum mismatch/);
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('build verification rejects unsafe names, duplicate parts and files too large for ordinary Git',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'yumo-pvz-manifest-'));
  try{
    await writeFile(path.join(dir,part.file),bytes);
    for(const parts of [[{...part,file:'../outside.zip'}],[part,part],[{...part,bytes:100*1024*1024}]]){
      await writeFile(path.join(dir,'resources.json'),JSON.stringify({format:1,files:1,parts}));
      await assert.rejects(verifyResourceBundle(dir),/Invalid game-resource part/);
    }
  }finally{await rm(dir,{recursive:true,force:true});}
});
