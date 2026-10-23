import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,access,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {syncPages} from '../scripts/sync-pages.mjs';

test('Pages sync publishes the game entry and new chunks while preserving domain and docs',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'yumo-pages-'));
  try{
    for(const dir of ['dist/assets','dist/games/pvz-kindergarten/native','docs/assets'])await mkdir(path.join(root,dir),{recursive:true});
    const files={
      'dist/index.html':'<script src="./assets/new.js"></script>',
      'dist/assets/new.js':'pvz-kindergarten',
      'dist/.nojekyll':'',
      'dist/games/pvz-kindergarten/index.html':'original-layout preview',
      'dist/games/pvz-kindergarten/native/availability.json':'{"resourcesReady":false}',
      'docs/assets/old.js':'stale',
      'docs/CNAME':'www.xuxy.cloud',
      'docs/music-api.md':'manual documentation',
      'docs/reader-default-books.md':'default books',
      'docs/reader-sources.md':'reader sources',
    };
    for(const[file,body]of Object.entries(files))await writeFile(path.join(root,file),body);
    await syncPages(root);
    for(const[file,body]of Object.entries(files)){
      if(file.startsWith('dist/'))assert.equal(await readFile(path.join(root,'docs',file.slice(5)),'utf8'),body);
      else if(!file.includes('/assets/'))assert.equal(await readFile(path.join(root,file),'utf8'),body);
    }
    await assert.rejects(access(path.join(root,'docs/assets/old.js')));
  }finally{await rm(root,{recursive:true,force:true});}
});

test('Pages sync refuses a missing build before altering existing published assets',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'yumo-pages-'));
  try{
    await mkdir(path.join(root,'docs/assets'),{recursive:true});
    await writeFile(path.join(root,'docs/assets/old.js'),'keep');
    await assert.rejects(syncPages(root));
    assert.equal(await readFile(path.join(root,'docs/assets/old.js'),'utf8'),'keep');
  }finally{await rm(root,{recursive:true,force:true});}
});
