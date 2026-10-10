import * as esbuild from 'esbuild'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildCover } from './tools/build-cover.mjs'
const root=path.dirname(fileURLToPath(import.meta.url))
const buildDir=path.join(root,'.build'),out=path.join(root,'output'),site=path.resolve(root,'../../public/games/super-mario')
await fs.mkdir(buildDir,{recursive:true});await fs.mkdir(out,{recursive:true});await fs.mkdir(site,{recursive:true})
async function inline(result){
  if(result.errors.length)return
  const [template,js,css]=await Promise.all([fs.readFile(path.join(root,'index.html'),'utf8'),fs.readFile(path.join(buildDir,'min/main.js'),'utf8'),fs.readFile(path.join(buildDir,'min/main.css'),'utf8')])
  const html=template.replace('/*__STYLE__*/',()=>css.trim()).replace('/*__SCRIPT__*/',()=>js.replace(/<\/script/gi,'<\\/script').trim())
  await fs.writeFile(path.join(buildDir,'meta.json'),JSON.stringify(result.metafile,null,2))
  await fs.writeFile(path.join(out,'super-mario.html'),html);await fs.writeFile(path.join(site,'index.html'),html)
  await buildCover(root,site)
  console.log(`[super-mario] 单文件 HTML ${(Buffer.byteLength(html)/1024).toFixed(1)} KB · 源码、中间产物与封面已保留`)
}
const common={entryPoints:[path.join(root,'src/main.ts')],bundle:true,format:'iife',target:'es2020',legalComments:'none',logLevel:'warning'}
const debug={...common,outdir:path.join(buildDir,'debug'),sourcemap:true}
const min={...common,outdir:path.join(buildDir,'min'),minify:true,metafile:true,plugins:[{name:'standalone-html',setup(build){build.onEnd(inline)}}]}
if(process.argv.includes('--watch')){const contexts=await Promise.all([esbuild.context(debug),esbuild.context(min)]);await Promise.all(contexts.map(c=>c.watch()));console.log('[super-mario] watching src/ …')}
else{await esbuild.build(debug);await esbuild.build(min)}
