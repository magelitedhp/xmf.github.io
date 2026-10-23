import {readFile,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';

export async function verifyResourceBundle(directory){
  let manifest;
  try{manifest=JSON.parse(await readFile(path.join(directory,'resources.json'),'utf8'));}
  catch(error){if(error.code==='ENOENT')return {resourcesReady:false};throw error;}
  if(manifest.format!==1||!Number.isSafeInteger(manifest.files)||manifest.files<1||!Array.isArray(manifest.parts)||!manifest.parts.length||manifest.parts.length>64)throw new Error('Invalid game-resource manifest');
  const names=new Set();let downloadBytes=0;
  for(const part of manifest.parts){
    if(!/^resources-\d{2}\.zip$/.test(part.file)||names.has(part.file)||!Number.isSafeInteger(part.bytes)||part.bytes<1||part.bytes>=100*1024*1024||!/^[a-f0-9]{64}$/.test(part.sha256))throw new Error('Invalid game-resource part');
    names.add(part.file);
    const filename=path.join(directory,part.file);
    if((await stat(filename)).size!==part.bytes)throw new Error('Game-resource size mismatch: '+part.file);
    const hash=createHash('sha256');
    for await(const chunk of createReadStream(filename))hash.update(chunk);
    if(hash.digest('hex')!==part.sha256)throw new Error('Game-resource checksum mismatch: '+part.file);
    downloadBytes+=part.bytes;
  }
  return {resourcesReady:true,files:manifest.files,parts:manifest.parts.length,downloadBytes};
}
