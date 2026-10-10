// Builds Garden Guard into a single self-contained HTML file.
//   node build.mjs           one-off build
//   node build.mjs --watch   rebuild on change
//
// Intermediate artifacts are kept on purpose:
//   .build/debug/  readable bundle + sourcemap
//   .build/min/    minified js + css that get inlined
//   .build/meta.json  esbuild metafile (bundle analysis)
// Final output: output/garden-guard.html (also copied to the site's public/ folder).
import * as esbuild from 'esbuild'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildCover } from './tools/build-cover.mjs'

const root = path.dirname(fileURLToPath(import.meta.url))
const buildDir = path.join(root, '.build')
const outDir = path.join(root, 'output')
const siteCopy = path.resolve(root, '../../public/games/garden-guard/index.html')
const watch = process.argv.includes('--watch')

const common = {
  entryPoints: [path.join(root, 'src/main.ts')],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  legalComments: 'none',
  logLevel: 'warning',
}

async function inline() {
  const [tpl, js, css] = await Promise.all([
    fs.readFile(path.join(root, 'index.html'), 'utf8'),
    fs.readFile(path.join(buildDir, 'min/main.js'), 'utf8'),
    fs.readFile(path.join(buildDir, 'min/main.css'), 'utf8'),
  ])
  const safeJs = js.replace(/<\/script/gi, '<\\/script')
  const html = tpl.replace('/*__STYLE__*/', () => css.trim()).replace('/*__SCRIPT__*/', () => safeJs.trim())
  await fs.mkdir(outDir, { recursive: true })
  await fs.writeFile(path.join(outDir, 'garden-guard.html'), html)
  await fs.mkdir(path.dirname(siteCopy), { recursive: true })
  await fs.writeFile(siteCopy, html)
  await buildCover(root)
  console.log(`[garden-guard] output/garden-guard.html  ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`)
}

const inlinePlugin = {
  name: 'inline-html',
  setup(build) {
    build.onEnd(async (res) => {
      if (res.errors.length) return
      await fs.writeFile(path.join(buildDir, 'meta.json'), JSON.stringify(res.metafile, null, 2))
      await inline()
    })
  },
}

await fs.mkdir(buildDir, { recursive: true })

const debug = { ...common, outdir: path.join(buildDir, 'debug'), sourcemap: true }
const min = { ...common, outdir: path.join(buildDir, 'min'), minify: true, metafile: true, plugins: [inlinePlugin] }

if (watch) {
  const [a, b] = await Promise.all([esbuild.context(debug), esbuild.context(min)])
  await Promise.all([a.watch(), b.watch()])
  console.log('[garden-guard] watching src/ …')
} else {
  await esbuild.build(debug)
  await esbuild.build(min)
}
