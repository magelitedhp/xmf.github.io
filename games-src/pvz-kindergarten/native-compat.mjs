import {buildCompiledPak} from './native-pak.mjs';
export async function adaptResources(properties){
  const entries=[];
  function visit(dir){for(const name of Module.FS.readdir(dir)){if(name==='.'||name==='..')continue;const path=dir+'/'+name;const stat=Module.FS.stat(path);if(Module.FS.isDir(stat.mode))visit(path);else if(name.endsWith('.compiled')||/^_|_\.(png|gif|jpg)$/i.test(name))entries.push([path.slice(1),Module.FS.readFile(path)])}}
  // Original PC compiled records are byte-identical on wasm32. A PAK-backed
  // definition bypasses the native loose-file timestamp check for absent XML.
  try{Module.FS.stat('/main.pak')}catch{
    for(const directory of ['/compiled','/images','/reanim','/data'])try{visit(directory)}catch{}
    if(entries.length)Module.FS.writeFile('/main.pak',buildCompiledPak(entries));
  }
  const path='/'+properties+'/'+Module.FS.readdir('/'+properties).find(n=>n.toLowerCase()==='resources.xml');
  const original=new TextDecoder().decode(Module.FS.readFile(path)).replace(/^\uFEFF/,'');const xml=new DOMParser().parseFromString(original,'text/xml');
  const response=await fetch('native/compat.json');if(!response.ok)throw new Error('资源兼容表加载失败');const compat=await response.json();
  for(const[expected,actual]of Object.entries(compat.compiledAliases||{})){try{Module.FS.writeFile('/'+expected,Module.FS.readFile('/'+actual))}catch{window.pvzNative.warnings.push('动画大小写适配失败：'+expected)}}
  if(compat.missing.length)window.pvzNative.warnings.push('未匹配引擎资源：'+compat.missing.join(', '));
  for(const[group,images]of Object.entries(compat.groups)){let node=Array.from(xml.querySelectorAll('Resources')).find(n=>n.getAttribute('id')===group);if(!node){node=xml.createElement('Resources');node.setAttribute('id',group);xml.documentElement.append(node)}const defaults=xml.createElement('SetDefaults');defaults.setAttribute('path','');defaults.setAttribute('idprefix','');node.append(defaults);for(const def of images){const image=xml.createElement('Image');image.setAttribute('id',def.id);image.setAttribute('path',def.path);node.append(image)}}
  for(const[group,sounds]of Object.entries(compat.soundGroups||{})){let node=Array.from(xml.querySelectorAll('Resources')).find(n=>n.getAttribute('id')===group);if(!node){node=xml.createElement('Resources');node.setAttribute('id',group);xml.documentElement.append(node)}const defaults=xml.createElement('SetDefaults');defaults.setAttribute('path','');defaults.setAttribute('idprefix','');node.append(defaults);for(const def of sounds){const sound=xml.createElement('Sound');sound.setAttribute('id',def.id);sound.setAttribute('path',def.path);node.append(sound)}}
  Module.FS.writeFile(path,new TextEncoder().encode(new XMLSerializer().serializeToString(xml)));
}
