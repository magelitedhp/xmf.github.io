import fs from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import assert from 'node:assert/strict'
import {viewport,navigate,evaluate,send,sleep,close,errors} from './browser.mjs'
const report={}
try{
  await viewport(1280,720)
  const file=pathToFileURL(path.resolve('games-src/super-mario/output/super-mario.html')).href
  await send('Page.navigate',{url:file+'?debug'});await sleep(1000)
  assert.equal(await evaluate('location.protocol'),'file:')
  await evaluate('document.querySelector("#start").click()');await sleep(1700)
  report.offline=await evaluate('({mode:__mario.mode,resources:performance.getEntriesByType("resource").map(r=>r.name),external:performance.getEntriesByType("resource").filter(r=>/^https?:/.test(r.name)).length})')
  assert.equal(report.offline.mode,'playing');assert.equal(report.offline.external,0)
  report.renderTiming=await evaluate(`(()=>{const g=__mario,samples=[];g.sound.enabled=false;for(let level=0;level<4;level++){g.start(level);g.screen('paused');g.player.x=level===3?4450:2200;g.camera=g.player.x-300;for(let i=0;i<10;i++)__renderer.draw(g);const times=[];for(let i=0;i<80;i++){const t=performance.now();__renderer.draw(g);times.push(performance.now()-t)}times.sort((a,b)=>a-b);samples.push({world:level+1,medianMs:times[40],p95Ms:times[76]})}return samples})()`)
  await viewport(390,844,true);await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});await navigate('#/games/super-mario');await evaluate('document.querySelector("iframe").scrollIntoView({block:"center"})');await sleep(1000)
  const one=await evaluate('document.querySelector("iframe").getBoundingClientRect().height');await sleep(600);const two=await evaluate('document.querySelector("iframe").getBoundingClientRect().height');assert.ok(Math.abs(one-two)<2,'Iframe height feedback loop')
  report.mobileEmbedded=await evaluate(`(()=>{const f=document.querySelector('iframe'),d=f.contentDocument,c=d.querySelector('canvas').getBoundingClientRect(),b=d.querySelector('#touch-controls').getBoundingClientRect();return{width:f.clientWidth,height:f.clientHeight,overflow:d.documentElement.scrollWidth>f.clientWidth,controlsVisible:b.top>=c.bottom-1&&b.bottom<=f.clientHeight+1}})()`)
  assert.ok(!report.mobileEmbedded.overflow&&report.mobileEmbedded.controlsVisible)
  await viewport(844,390,true);await sleep(500)
  const rect=await evaluate(`(()=>{const e=document.querySelector('.fullscreen-button');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`)
  await send('Input.dispatchMouseEvent',{type:'mousePressed',...rect,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...rect,button:'left',clickCount:1});await sleep(600)
  report.mobileFullscreen=await evaluate(`(()=>{const f=document.querySelector('iframe'),d=f.contentDocument,c=d.querySelector('canvas').getBoundingClientRect(),b=d.querySelector('#touch-controls').getBoundingClientRect(),s=d.querySelector('#start').getBoundingClientRect();return{active:!!document.fullscreenElement,height:f.clientHeight,contentHeight:d.querySelector('#cabinet').getBoundingClientRect().height,controlsTop:b.top,canvasBottom:c.bottom,controlsBottom:b.bottom,startVisible:s.top>=c.top&&s.bottom<c.bottom}})()`)
  assert.ok(report.mobileFullscreen.active);assert.ok(report.mobileFullscreen.controlsBottom<=report.mobileFullscreen.height+1);assert.ok(report.mobileFullscreen.controlsTop>=report.mobileFullscreen.canvasBottom-1);assert.ok(report.mobileFullscreen.startVisible,'Fullscreen title button clipped')
  const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile('games-src/super-mario/.build/verification/fullscreen-mobile.png',Buffer.from(screenshot.data,'base64'))
  await evaluate('document.exitFullscreen()');assert.equal(errors.length,0);report.runtimeErrors=errors
  await fs.writeFile('games-src/super-mario/.build/verification/release.json',JSON.stringify(report,null,2));console.log(report)
}finally{await close()}
