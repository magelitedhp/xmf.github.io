import fs from 'node:fs/promises'
import {viewport,navigate,evaluate,send,sleep,close,errors} from './browser.mjs'
const out='games-src/super-mario/.build/verification'
await fs.mkdir(out,{recursive:true})
async function shot(name){const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(`${out}/${name}.png`,Buffer.from(r.data,'base64'))}
await viewport(1280,800)
await navigate('games/super-mario/index.html?debug')
await shot('title-desktop')
await evaluate('document.querySelector("#start").click()');await sleep(1800)
await shot('world-1')
for(let i=1;i<4;i++){
 await evaluate(`__mario.start(${i});__mario.player.power=2;__mario.player.x=${i===3?4380:1300};__mario.camera=__mario.player.x-300`);await sleep(1700);await shot(`world-${i+1}`)
}
await viewport(390,844,true);await navigate('games/super-mario/index.html?debug');await shot('title-mobile')
console.log(await evaluate('({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,canvas:document.querySelector("canvas").getBoundingClientRect().toJSON(),controls:document.querySelector("#touch-controls").getBoundingClientRect().toJSON()})'))
console.log({errors});await close()
