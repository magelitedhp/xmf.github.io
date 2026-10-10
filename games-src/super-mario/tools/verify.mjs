import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {viewport,navigate,evaluate,errors,close} from './browser.mjs'
try {
  await viewport(1280,800);await navigate('games/super-mario/index.html?debug')
  const result=await evaluate(await fs.readFile('games-src/super-mario/tools/scenarios.js','utf8'))
  assert.equal(errors.length,0,'Browser runtime errors')
  const html=await fs.readFile('games-src/super-mario/output/super-mario.html')
  assert.deepEqual(html,await fs.readFile('public/games/super-mario/index.html'))
  assert.ok(!/<script[^>]+src=|<link[^>]+href=|@import|url\(https?:/i.test(html.toString()),'Standalone HTML loads external dependencies')
  const report={...result,runtimeErrors:errors,singleFileBytes:html.length,outputsMatch:true}
  await fs.writeFile('games-src/super-mario/.build/verification/mechanics.json',JSON.stringify(report,null,2))
  console.log(JSON.stringify(report,null,2))
} finally {await close()}
