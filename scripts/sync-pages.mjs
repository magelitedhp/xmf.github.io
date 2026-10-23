import path from 'node:path';
import {access, cp, mkdir, readdir, realpath, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const preserved=new Set(['CNAME','music-api.md','reader-default-books.md','reader-sources.md']);

export async function syncPages(root=projectRoot){
  root=await realpath(root);
  const dist=path.join(root,'dist');
  const docs=path.join(root,'docs');
  await access(path.join(dist,'index.html'));
  await mkdir(docs,{recursive:true});
  // Refuse linked directories before replacing managed, hashed build assets.
  for(const directory of [dist,docs]){
    if(path.relative(root,await realpath(directory))!==path.basename(directory))throw new Error('Publish directory must stay inside the project');
  }
  const assets=path.join(docs,'assets');
  try{
    if(path.relative(docs,await realpath(assets))!=='assets')throw new Error('Asset directory must stay inside docs');
    await rm(assets,{recursive:true});
  }catch(error){if(error.code!=='ENOENT')throw error;}
  for(const entry of await readdir(dist)){
    if(preserved.has(entry))continue;
    await cp(path.join(dist,entry),path.join(docs,entry),{recursive:true});
  }
  console.log('Synced dist -> docs; preserved domain and documentation.');
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await syncPages();
