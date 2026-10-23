const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');

export async function downloadPart(part,{
  baseUrl=location.href,fetcher=fetch,cacheStorage=globalThis.caches,
  onProgress=()=>{},onCacheWarning=()=>{},attempts=3,
  sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),timeoutMs=180000,
}={}){
  const url=new URL('native/'+part.file,baseUrl).href;
  const key=url+'?sha256='+part.sha256;
  let cache;
  try{cache=await cacheStorage?.open('pvz-kindergarten-resources-v1');}
  catch{onCacheWarning('浏览器资源缓存不可用，本次直接下载');}
  if(cache){
    try{
      const stored=await cache.match(key);
      if(stored){
        const bytes=new Uint8Array(await stored.arrayBuffer());
        if(bytes.length===part.bytes&&await digest(bytes)===part.sha256){onProgress(bytes.length,{cached:true});return bytes;}
        await cache.delete(key);
      }
    }catch{onCacheWarning('读取资源缓存失败，本次重新下载');}
  }
  for(let attempt=0;attempt<attempts;attempt++){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      onProgress(0,{attempt});
      const response=await fetcher(url,{signal:controller.signal,cache:'no-cache'});
      if(!response.ok)throw new Error('HTTP '+response.status);
      let bytes;
      if(response.body?.getReader){
        bytes=new Uint8Array(part.bytes);
        const reader=response.body.getReader();let offset=0;
        try{
          while(true){
            const {done,value}=await reader.read();if(done)break;
            if(offset+value.length>bytes.length)throw new Error('资源包大小超过清单');
            bytes.set(value,offset);offset+=value.length;onProgress(offset,{attempt});
          }
          if(offset!==bytes.length)throw new Error('资源包下载不完整');
        }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
      }else bytes=new Uint8Array(await response.arrayBuffer());
      if(bytes.length!==part.bytes||await digest(bytes)!==part.sha256)throw new Error('资源包校验失败');
      onProgress(bytes.length,{attempt});
      if(cache){
        try{
          await cache.put(key,new Response(bytes,{headers:{'Content-Type':'application/zip'}}));
          // Evict only obsolete versions of this same part, never game saves.
          for(const request of await cache.keys())if(request.url!==key&&new URL(request.url).pathname===new URL(url).pathname)await cache.delete(request);
        }catch{onCacheWarning('浏览器缓存空间不足，本次仍可继续游戏');}
      }
      return bytes;
    }catch(error){
      if(attempt===attempts-1)throw new Error(part.file+'：'+(error.name==='AbortError'?'下载超时':error.message));
      await sleep(700*(attempt+1));
    }finally{clearTimeout(timer);}
  }
}
