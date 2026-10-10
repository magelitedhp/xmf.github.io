import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {viewport,navigate,evaluate,send,sleep,key,close,errors} from './browser.mjs'
const out='games-src/super-mario/.build/verification',report={}
const shot=async name=>{const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(`${out}/${name}.png`,Buffer.from(r.data,'base64'))}
try{
  await viewport(1280,800);await navigate('games/super-mario/index.html?debug');await evaluate('document.querySelector("#start").click()');await sleep(1800)
  const x=await evaluate('__mario.player.x');await key('ArrowRight');await key('ShiftLeft');await key('Space');await sleep(220);await key('Space',false);await sleep(200);await key('ArrowRight',false);await key('ShiftLeft',false)
  report.keyboard=await evaluate('({x:__mario.player.x,y:__mario.player.y,mode:__mario.mode})');assert.ok(report.keyboard.x>x+45);assert.equal(report.keyboard.mode,'playing')
  await key('Escape');await sleep(80);assert.equal(await evaluate('__mario.mode'),'paused');await key('Escape',false);await key('Escape');await key('Escape',false);await sleep(80);assert.equal(await evaluate('__mario.mode'),'playing')
  report.layouts=[]
  for(const [width,height]of [[320,740],[390,844],[844,390],[1024,768]]){
    await viewport(width,height,true);await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});await navigate('games/super-mario/index.html?debug')
    const layout=await evaluate(`(()=>{const c=document.querySelector('canvas').getBoundingClientRect(),b=document.querySelector('#touch-controls').getBoundingClientRect(),o=document.querySelector('#start').getBoundingClientRect();return{width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,canvasBottom:c.bottom,controlsTop:b.top,controlsBottom:b.bottom,visible:b.height>0,startVisible:o.top>=c.top&&o.bottom<=c.bottom}})()`)
    assert.equal(layout.overflow,false);assert.ok(layout.startVisible);assert.ok(layout.controlsTop>=layout.canvasBottom-1);assert.ok(layout.controlsBottom<=height+1);report.layouts.push(layout)
    await shot(`layout-${width}`)
  }
  await viewport(390,844,true);await navigate('games/super-mario/index.html?debug');await evaluate('document.querySelector("#start").click()');await sleep(1750)
  const points=await evaluate(`['right','run','jump'].map((key,id)=>{const r=document.querySelector('[data-key="'+key+'"]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,id}})`)
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[points[0]]});await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points.slice(0,2)});await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});await sleep(130)
  report.touch=await evaluate(`({right:__mario.input.down('right'),run:__mario.input.down('run'),jump:__mario.input.down('jump'),vy:__mario.player.vy})`)
  assert.ok(report.touch.right&&report.touch.run&&report.touch.jump&&report.touch.vy<0)
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(100)
  assert.equal(await evaluate('__mario.input.down("jump")||__mario.input.down("right")||__mario.input.down("run")'),false)
  await viewport(1440,1000);await send('Emulation.setTouchEmulationEnabled',{enabled:false});await navigate('#/games');assert.ok(await evaluate('document.body.innerText.includes("超级玛丽")'))
  await evaluate('[...document.querySelectorAll(".arcade-filters button")].find(b=>b.textContent==="动作").click()');assert.ok(await evaluate('[...document.querySelectorAll(".game-card")].some(c=>c.textContent.includes("超级玛丽"))'))
  await shot('arcade-list')
  await navigate('#/games/super-mario');await evaluate('document.querySelector("iframe").scrollIntoView({block:"center"})');await sleep(1000)
  report.iframe=await evaluate(`(()=>{const f=document.querySelector('iframe'),d=f.contentDocument,c=d.querySelector('#cabinet').getBoundingClientRect();return{loaded:!!d.querySelector('canvas'),height:f.getBoundingClientRect().height,contentHeight:c.height,overflow:d.documentElement.scrollWidth>f.clientWidth}})()`)
  assert.ok(report.iframe.loaded&&!report.iframe.overflow);assert.ok(Math.abs(report.iframe.height-report.iframe.contentHeight)<3);await shot('arcade-game')
  // Fullscreen is initiated by an actual pointer click for user activation.
  const rect=await evaluate(`(()=>{const e=document.querySelector('.fullscreen-button');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`)
  await send('Input.dispatchMouseEvent',{type:'mousePressed',...rect,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...rect,button:'left',clickCount:1});await sleep(700)
  report.fullscreen=await evaluate(`(()=>{const f=document.querySelector('iframe'),d=f.contentDocument,r=f.getBoundingClientRect(),c=d.querySelector('#cabinet').getBoundingClientRect();return{active:!!document.fullscreenElement,iframeHeight:r.height,contentHeight:c.height,innerWidth:f.contentWindow.innerWidth}})()`)
  assert.ok(report.fullscreen.active);assert.ok(report.fullscreen.contentHeight<=report.fullscreen.iframeHeight+2);await shot('fullscreen-desktop')
  await evaluate('document.exitFullscreen()')
  assert.equal(errors.length,0);report.runtimeErrors=errors
  await fs.writeFile(`${out}/layout.json`,JSON.stringify(report,null,2));console.log(report)
}finally{await close()}
