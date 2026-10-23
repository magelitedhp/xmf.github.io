import {adaptResources} from './native-compat.mjs';
import {downloadPart} from './native-download.mjs';
const $=id=>document.getElementById(id);
let started=false,savesMounted=false,syncing=null,queued=false;
let runtimeReady=null;
const errors=[],warnings=[];
const status=text=>{$('load-status').textContent=text;};
function fail(error){const message=String(error?.message||error);errors.push(message);$('loader').hidden=false;$('error').hidden=false;$('error').textContent=message;status('游戏加载未完成');}
function notifyHeight(){if(parent!==window)requestAnimationFrame(()=>parent.postMessage({type:'yumo:pvz-height',height:document.documentElement.scrollHeight},location.origin))}
function validResourcePath(path){return typeof path==='string'&&!path.startsWith('/')&&!path.includes('\\')&&!path.includes('\0')&&path.split('/').every(p=>p&&p!=='.'&&p!=='..');}
function writeFile(path,bytes){if(!validResourcePath(path))throw new Error('资源路径不正确');const parts=path.split('/');parts.pop();if(parts.length)Module.FS.mkdirTree('/'+parts.join('/'));if(/\.(txt|xml)$/i.test(path)&&!(bytes[0]===255&&bytes[1]===254)&&!(bytes[0]===254&&bytes[1]===255)){try{new TextDecoder('utf-8',{fatal:true}).decode(bytes)}catch{try{bytes=new TextEncoder().encode('\ufeff'+new TextDecoder('gb18030',{fatal:true}).decode(bytes))}catch{/* Some legacy bitmap font data is binary, not encoded text. */}}}Module.FS.writeFile('/'+path,bytes);}
async function checkedFetch(url){const response=await fetch(url,{cache:'no-cache'});if(!response.ok)throw new Error(`${url}：HTTP ${response.status}`);return response;}
function ensureRuntime(){return runtimeReady??=new Promise((resolve,reject)=>{
  window.Module={canvas:$('canvas'),noInitialRun:true,locateFile:file=>new URL('native/'+file,location.href).href,onRuntimeInitialized:resolve,onAbort:what=>{const error=new Error(String(what));reject(error);fail(error)},print:text=>{window.pvzNative.lastLog=String(text);console.log(text)},printErr:text=>{const line=String(text);if(warnings.length>=300)warnings.shift();warnings.push(line);if(line.includes('FATAL ERROR'))window.pvzNative.nativeFailure=true;console.warn(text)}};
  const script=document.createElement('script');script.src='native/pvz-portable.js';script.onerror=()=>reject(new Error('WebAssembly 引擎加载失败'));document.body.append(script);
});}
async function loadResources(){
  const availability=await(await checkedFetch('native/availability.json')).json();
  if(availability.resourcesReady!==true){
    window.pvzNative.pendingRelease=true;
    status('移植预览 · 游戏资源尚未发布');
    $('runtime-status').textContent='当前为移植预览，暂不可在线游玩';
    $('progress').hidden=true;
    $('release-note').hidden=false;
    return false;
  }
  const manifest=await(await checkedFetch('native/resources.json')).json();
  if(manifest.format!==1||!Array.isArray(manifest.parts)||!manifest.parts.length||manifest.parts.length>64)throw new Error('资源清单格式不正确');
  const names=new Set();for(const part of manifest.parts){if(!/^resources-\d{2}\.zip$/.test(part.file)||names.has(part.file)||!Number.isSafeInteger(part.bytes)||part.bytes<1||part.bytes>=100*1024*1024||!/^[a-f0-9]{64}$/.test(part.sha256))throw new Error('资源清单路径不正确');names.add(part.file);}
  const total=manifest.parts.reduce((n,p)=>n+p.bytes,0);let loaded=0,count=0;
  await ensureRuntime();
  for(let i=0;i<manifest.parts.length;i++){
    const part=manifest.parts[i];
    const bytes=await downloadPart(part,{onProgress:(size,info)=>{const progress=(loaded+size)/total;$('progress').value=progress;status(`${info.cached?'正在读取缓存':'正在下载资源'} ${Math.floor(progress*100)}% · ${(loaded+size>>20)} / ${Math.ceil(total/1048576)} MiB${info.attempt?' · 重试 '+info.attempt:''}`)},onCacheWarning:message=>{if(!warnings.includes(message))warnings.push(message)}});
    status(`正在解压原始资源 ${i+1} / ${manifest.parts.length}…`);
    const zip=await JSZip.loadAsync(bytes);
    for(const entry of Object.values(zip.files)){if(entry.dir)continue;if(!validResourcePath(entry.name)||entry._data.uncompressedSize>128*1024*1024)throw new Error('无效的资源包条目');writeFile(entry.name,await entry.async('uint8array'));count++}
    loaded+=part.bytes;$('progress').value=loaded/total;
    await new Promise(resolve=>setTimeout(resolve,0));
  }
  const properties=Module.FS.readdir('/').find(n=>n.toLowerCase()==='properties');if(!properties)throw new Error('资源包中缺少 properties');
  await adaptResources(properties);window.pvzNative.resourceReady=true;window.pvzNative.fileCount=count;
  return true;
}
async function prepareSaves(){if(savesMounted)return;Module.FS.mkdirTree('/saves');Module.FS.mount(Module.FS.filesystems.IDBFS,{},'/saves');savesMounted=true;await new Promise(resolve=>Module.FS.syncfs(true,error=>{if(error)warnings.push(String(error));resolve()}));}
function syncSaves(){if(!savesMounted)return Promise.resolve();if(syncing){queued=true;return syncing}syncing=new Promise(resolve=>Module.FS.syncfs(false,error=>{if(error)warnings.push(String(error));resolve()})).finally(()=>{syncing=null;if(queued){queued=false;void syncSaves()}});return syncing;}
function allSaves(dir='/saves'){const result=[];for(const name of Module.FS.readdir(dir)){if(name==='.'||name==='..')continue;const path=dir+'/'+name;const stat=Module.FS.stat(path);if(Module.FS.isDir(stat.mode))result.push(...allSaves(path));else result.push(path)}return result;}
async function exportSaves(){if(!started)return;try{await ensureRuntime();await prepareSaves();await syncSaves();const zip=new JSZip();for(const path of allSaves())zip.file(path.slice(7),Module.FS.readFile(path));const url=URL.createObjectURL(await zip.generateAsync({type:'blob'}));const link=document.createElement('a');link.href=url;link.download='pvz-kindergarten-saves.zip';link.click();setTimeout(()=>URL.revokeObjectURL(url),2000)}catch(error){fail(error)}}
async function importSaves(file){if(!started||!file||file.size>32*1024*1024)return;try{await ensureRuntime();await prepareSaves();const zip=await JSZip.loadAsync(file);const entries=Object.values(zip.files).filter(e=>!e.dir);if(entries.length>1000)throw new Error('存档数量过多');for(const entry of entries){if(!validResourcePath(entry.name)||entry._data.uncompressedSize>16*1024*1024)throw new Error('无效的存档文件');const bytes=await entry.async('uint8array');const path='/saves/'+entry.name;Module.FS.mkdirTree(path.slice(0,path.lastIndexOf('/')));Module.FS.writeFile(path,bytes)}await syncSaves();$('runtime-status').textContent='存档已恢复，重新打开游戏后生效';}catch(error){fail(error)}}
window.pvzNative={resourceReady:false,started:false,fileCount:0,errors,warnings,syncSaves,exportSaves};
async function boot(){try{if(!await loadResources()){notifyHeight();return}status('正在启动原版游戏…');await prepareSaves();started=true;window.pvzNative.started=true;$('runtime-status').textContent='幼儿园版 V0.9.5 · 浏览器移植测试版';for(const id of ['save-export','save-import','keyboard'])$(id).disabled=false;$('loader').hidden=true;$('canvas').focus({preventScroll:true});Module.callMain([]);notifyHeight()}catch(error){fail(error)}}
$('save-export').onclick=()=>void exportSaves();$('save-import').onclick=()=>$('import-save').click();$('import-save').onchange=e=>void importSaves(e.target.files[0]);$('keyboard').onclick=()=>$('pvz-soft-keyboard').focus();
$('canvas').addEventListener('contextmenu',e=>e.preventDefault());window.onGameExit=()=>{void syncSaves();window.pvzNative.exited=true;};
document.addEventListener('visibilitychange',()=>{if(document.hidden)void syncSaves()});window.addEventListener('pagehide',()=>void syncSaves());setInterval(()=>{if(started&&!window.pvzNative.exited)void syncSaves()},5000);
window.addEventListener('message',e=>{if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='yumo:pvz-fullscreen')return;document.body.classList.toggle('fullscreen',!!e.data.active);notifyHeight()});
new ResizeObserver(notifyHeight).observe($('canvas-container'));window.addEventListener('resize',notifyHeight);notifyHeight();void boot();
