import fs from 'node:fs/promises'
import {navigate,evaluate,close} from './browser.mjs'
try{
  await navigate('games/super-mario/index.html?debug')
  const result=await evaluate(await fs.readFile('games-src/super-mario/tools/traversal.js','utf8'))
  await fs.writeFile('games-src/super-mario/.build/verification/traversal.json',JSON.stringify(result,null,2))
  console.log(result.map(({actions,...r})=>({...r,actionSteps:actions?.length})))
  if(result.some(r=>!r.reachable))process.exitCode=1
}finally{await close()}
