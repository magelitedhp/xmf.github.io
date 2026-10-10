import { palette, sprites } from './sprites'
import { WIDTH, HEIGHT, type Theme, type Block, type Enemy, type Player } from './types'
type Ctx=CanvasRenderingContext2D
const atlas=new Map<string,HTMLCanvasElement>()
export const fill=(c:Ctx,color:string,x:number,y:number,w:number,h:number)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
export function sprite(c:Ctx,name:string,x:number,y:number,scale=2,flip=false,variant=''){
  const key=name+variant
  if(!atlas.has(key)){
    const pixels=sprites[name];if(!pixels)return
    const cv=document.createElement('canvas');cv.width=Math.max(...pixels.map(r=>r.length));cv.height=pixels.length;const ctx=cv.getContext('2d')!
    for(let y=0;y<pixels.length;y++)for(let x=0;x<pixels[y].length;x++){
      const k=pixels[y][x];if(k==='.')continue
      let color=palette[k];if(!color)continue
      if(variant==='fire'){if(k==='R')color='#fff1cf';if(k==='H')color='#fff9e8';if(k==='r')color='#ddc69c';if(k==='B')color='#e85031';if(k==='b')color='#9f3034'}
      if(variant==='life'&&k==='R')color='#63a95a'
      ctx.fillStyle=color;ctx.fillRect(x,y,1,1)
    }atlas.set(key,cv)
  }
  const cv=atlas.get(key)!;c.save();c.translate(Math.round(x+(flip?cv.width*scale:0)),Math.round(y));c.scale(flip?-scale:scale,scale);c.imageSmoothingEnabled=false;c.drawImage(cv,0,0);c.restore()
}
export function label(c:Ctx,text:string,x:number,y:number,size=14,color='#fff4d1',align:CanvasTextAlign='center'){
  c.font=`700 ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;c.textAlign=align;c.fillStyle='#19393188';c.fillText(text,Math.round(x)+1,Math.round(y)+2);c.fillStyle=color;c.fillText(text,Math.round(x),Math.round(y))
}
function poly(c:Ctx,color:string,points:number[][]){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fill()}
const noise=(n:number)=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v)}
export function cloud(c:Ctx,x:number,y:number,s=1,opacity=1){
  c.save();c.globalAlpha=opacity;c.translate(Math.round(x),Math.round(y));c.scale(s,s)
  fill(c,'#b7d9cc',6,22,94,13);fill(c,'#f9f7df',0,14,98,15);fill(c,'#f9f7df',14,5,66,15);fill(c,'#f9f7df',27,0,31,10);fill(c,'#ffffff99',29,2,27,3);fill(c,'#fdfbe8',-6,21,12,7);c.restore()
}
export function background(c:Ctx,theme:Theme,camera:number,time:number){
  const dark=theme==='cave'||theme==='bonus'||theme==='castle'
  const gradient=c.createLinearGradient(0,0,0,540)
  if(theme==='castle'){gradient.addColorStop(0,'#202634');gradient.addColorStop(.8,'#504152');gradient.addColorStop(1,'#b45e43')}
  else if(dark){gradient.addColorStop(0,'#182e40');gradient.addColorStop(1,'#355d65')}
  else{gradient.addColorStop(0,theme==='sky'?'#83bccc':'#8dcbce');gradient.addColorStop(.7,'#d0e5c5');gradient.addColorStop(1,'#eaf0ca')}
  c.fillStyle=gradient;c.fillRect(0,0,WIDTH,HEIGHT)
  if(!dark){
    c.save();const sunX=790-camera*.035;const glow=c.createRadialGradient(sunX,103,10,sunX,103,110);glow.addColorStop(0,'#ffefc588');glow.addColorStop(1,'#ffefc500');c.fillStyle=glow;c.fillRect(sunX-110,0,220,220);fill(c,'#fff0c3',sunX-24,74,48,48);fill(c,'#fff0c3',sunX-30,80,60,36);c.restore()
    for(let i=-1;i<8;i++){const spacing=230;let x=i*spacing-camera*.13+time*2;x=((x+350)%1800+1800)%1800-350;cloud(c,x,70+noise(i+10)*130,.55+noise(i+90)*1.05,.85)}
    for(let layer=0;layer<3;layer++){
      const colors=theme==='sky'?['#b3d6d0','#9fcbb8','#80b8a0']:['#bad7b3','#98c69a','#70ae7b']
      const base=340+layer*47,amp=theme==='sky'?35:70,points:number[][]=[[0,540]]
      for(let x=0;x<=976;x+=8){const wx=x+camera*(.09+layer*.08);points.push([x,base-Math.sin(wx/(130-layer*20))*amp-Math.cos(wx/73)*amp*.25])}points.push([WIDTH,540]);poly(c,colors[layer],points)
    }
    if(theme==='sky')for(let i=-1;i<7;i++)cloud(c,i*240-camera*.2%240,385+noise(i)*45,2,.55)
    else for(let i=-1;i<10;i++){
      const x=i*160-(camera*.4%160),y=393+noise(i+8)*36
      fill(c,'#629369',x+28,y,9,70);fill(c,'#83b77a',x,y-12,70,32);fill(c,'#83b77a',x+10,y-30,50,22);fill(c,'#95c48a',x+15,y-28,40,6)
    }
  }else if(theme==='castle'){
    const offset=camera*.35%220
    for(let i=-1;i<6;i++){
      const x=i*220-offset
      fill(c,'#2b2c3c',x,78,72,390);fill(c,'#423e4b',x-7,74,86,15);fill(c,'#4c4350',x+6,98,7,350)
      fill(c,'#141f30',x+100,134,54,140);fill(c,'#141f30',x+110,120,34,14);fill(c,'#b56e4d',x+103,180,48,88);fill(c,'#df9a5b',x+112,217,30,51);fill(c,'#302e3f',x+122,130,7,150);fill(c,'#302e3f',x+96,205,65,7)
      for(let j=0;j<4;j++)fill(c,'#171f3066',x+18,138+j*69,44,3)
    }
    for(let i=0;i<32;i++){const x=(i*67-camera*.12)%1000,y=530-((time*(12+noise(i)*18)+i*39)%540);fill(c,'#f5ac6580',x,y,2,3)}
  }else{
    for(let i=-1;i<18;i++){
      const x=i*84-camera*.22%84,h=45+noise(i+44)*90
      poly(c,'#203b4c',[[x,0],[x+70,0],[x+50,h],[x+35,h+28],[x+23,h-10]])
      poly(c,'#274956',[[x+5,540],[x+25,350+noise(i+11)*90],[x+46,430],[x+75,540]])
    }
    for(let i=0;i<32;i++){
      const x=((i*137-camera*.3)%1020+1020)%1020,y=70+noise(i+92)*330,a=.25+.25*Math.sin(time*2+i)
      c.globalAlpha=a;fill(c,'#a3e9d8',x,y,3,3);c.globalAlpha=1
    }
  }
}
const tileCache=new Map<string,HTMLCanvasElement>()
function tile(kind:string,theme:Theme,top:boolean,seed:number){
  const key=`${kind}-${theme}-${top}-${seed%4}`
  if(tileCache.has(key))return tileCache.get(key)!
  const cv=document.createElement('canvas');cv.width=40;cv.height=40;const c=cv.getContext('2d')!,dark=theme==='cave'||theme==='bonus',castle=theme==='castle'
  if(kind==='ground'){
    fill(c,castle?'#443d49':dark?'#365761':'#b08451',0,0,40,40);fill(c,castle?'#655362':dark?'#49737a':'#c29860',0,2,40,5)
    for(let i=0;i<7;i++){const x=noise(seed*10+i)*36,y=8+noise(i*3+seed)*28;fill(c,castle?'#302e3c':dark?'#264751':'#906640',x,y,4,3);if(i%2===0)fill(c,castle?'#7a6170':dark?'#6b9894':'#d9ae75',x+1,y-2,3,2)}
    if(top){fill(c,castle?'#9991a0':dark?'#71b6ac':'#639a4b',0,0,40,10);fill(c,castle?'#b1a6ae':dark?'#9dddd0':'#c5d884',0,0,40,3);fill(c,castle?'#726776':dark?'#447e7c':'#44773b',0,10,40,4);if(!castle&&!dark)for(let i=0;i<5;i++)fill(c,'#639a4b',i*9,10,5,5+noise(i+seed)*4)}
  }else if(kind==='brick'){
    const colors=castle?['#8a6970','#493b4c','#b1928b']:dark?['#609397','#284c5b','#a2c6b8']:['#c78349','#825338','#e5b373']
    fill(c,colors[1],0,0,40,40);for(let row=0;row<2;row++){const offset=row?0:-10;for(let col=0;col<3;col++){fill(c,colors[0],offset+col*22+1,row*20+1,20,18);fill(c,colors[2],offset+col*22+2,row*20+2,18,3);fill(c,colors[1],offset+col*22+18,row*20+6,2,12)}}
  }else if(kind==='stone'){
    fill(c,castle?'#5a5160':dark?'#466872':'#ad9268',0,0,40,40);fill(c,castle?'#a4989a':dark?'#94b5ae':'#e1cd98',1,1,38,5);fill(c,castle?'#8a7c86':dark?'#77a59f':'#c4ad7b',1,5,5,30);fill(c,'#20363b55',35,5,5,35);fill(c,'#20363b55',5,35,30,5);fill(c,'#ffffff13',9,9,22,20)
  }else if(kind==='used'){
    fill(c,dark?'#56737a':'#97764e',0,0,40,40);fill(c,dark?'#739392':'#b39463',3,3,34,34);fill(c,'#0003',6,6,3,3);fill(c,'#0003',31,6,3,3);fill(c,'#0003',6,31,3,3);fill(c,'#0003',31,31,3,3)
  }
  tileCache.set(key,cv);return cv
}
export function drawBlock(c:Ctx,b:Block,theme:Theme,time:number,top:boolean){
  if(b.broken)return
  const x=Math.round(b.x),y=Math.round(b.y-Math.sin(b.bump/.2*Math.PI)*9)
  if(b.kind==='question'){
    fill(c,'#9d672d',x,y+3,40,37);fill(c,'#f0b74e',x+2,y,36,37);fill(c,'#ffe693',x+3,y+1,34,4);fill(c,'#cc8b33',x+35,y+6,3,28)
    const glow=Math.sin(time*4+b.x)*.1+.9;c.globalAlpha=glow
    fill(c,'#fff2b9',x+12,y+8,15,4);fill(c,'#fff2b9',x+10,y+11,5,6);fill(c,'#fff2b9',x+23,y+11,5,9);fill(c,'#fff2b9',x+18,y+19,9,4);fill(c,'#fff2b9',x+17,y+21,5,5);fill(c,'#fff2b9',x+17,y+29,5,5);c.globalAlpha=1
    for(const [dx,dy]of [[4,5],[32,5],[4,30],[32,30]])fill(c,'#9d682f',x+dx,y+dy,3,3)
  }else if(b.kind==='pipe'){
    const body=c.createLinearGradient(x,0,x+b.w,0);body.addColorStop(0,'#2f6447');body.addColorStop(.12,'#78ab5d');body.addColorStop(.28,'#b0cf78');body.addColorStop(.39,'#78ad5e');body.addColorStop(.75,'#53864d');body.addColorStop(1,'#274e3b');c.fillStyle=body;c.fillRect(x+5,y,b.w-10,b.h)
    fill(c,'#d9e9a8',x+17,y,4,b.h);fill(c,'#315b40',x+62,y,4,b.h)
    if(b.pipeTop){fill(c,'#244f39',x-3,y-3,b.w+6,24);c.fillStyle=body;c.fillRect(x-1,y,b.w+2,18);fill(c,'#d1e89a',x+1,y+1,b.w-2,4);fill(c,'#416b40',x+1,y+16,b.w-2,4)}
  }else c.drawImage(tile(b.kind,theme,top,Math.floor(b.x/40)),x,y)
}
export function coinArt(c:Ctx,x:number,y:number,time:number,big=false){
  const w=Math.max(3,Math.abs(Math.cos(time*4))*14),h=big?28:22
  fill(c,'#b4802f',x+10-w/2,y+3,w,h);fill(c,'#ffd061',x+9-w/2,y,w,h);fill(c,'#fff0a1',x+9-w/2,y+2,Math.max(2,w*.22),h-4);if(w>8)fill(c,'#ce983a',x+9,y+5,2,h-10)
}
export function playerArt(c:Ctx,p:Player,time:number){
  if(p.invincible>0&&Math.floor(time*14)%2)return
  c.save();if(p.star>0)c.filter=`hue-rotate(${Math.floor(time*500)%360}deg) brightness(1.15)`
  const big=p.power>0&&!p.duck,name=big?'tall':'mario',h=big?46:32,walking=p.grounded&&Math.abs(p.vx)>15
  let x=p.x-4,y=p.y+p.h-h
  if(walking)y-=Math.floor(p.walk/10)%2*2
  if(!p.grounded){c.translate(Math.round(x+16),Math.round(y+h));c.rotate(p.vx*.0001);c.translate(-Math.round(x+16),-Math.round(y+h))}
  sprite(c,name,x,y,2,p.facing<0,p.power===2?'fire':'')
  if(walking&&Math.floor(p.walk/13)%3===1){fill(c,'#3b2b31',x+6,y+h-5,11,5);fill(c,'#3b2b31',x+24,y+h-2,8,4)}
  if(p.duck){fill(c,'#e74732',x+7,y+5,17,4)}
  c.restore()
}
export function enemyArt(c:Ctx,e:Enemy,time:number){
  if(!e.alive)return
  if(e.hit>0&&e.kind==='boss'&&Math.floor(time*20)%2)return
  const bob=e.grounded?Math.floor(time*7+e.phase)%2:0
  if(e.kind==='boss'){boss(c,e.x,e.y,time);return}
  if(e.kind==='plant'){sprite(c,'plant',e.x-7,e.y,2.5);return}
  const name=e.kind==='goomba'?'goomba':e.kind==='shell'?'shell':'turtle';sprite(c,name,e.x-1,e.y+bob,2,e.vx>0)
  if(e.kind==='shell'&&e.vx!==0){c.globalAlpha=.3;fill(c,'#fff0a3',e.x-(e.vx>0?15:-36),e.y+10,10,3);c.globalAlpha=1}
}
function boss(c:Ctx,x:number,y:number,time:number){
  c.save();c.translate(Math.round(x),Math.round(y));const bob=Math.sin(time*3)*2
  poly(c,'#324e40',[[20,40],[34,18],[65,14],[91,32],[99,65],[83,83],[27,80]])
  poly(c,'#6a9c54',[[30,37],[40,22],[65,18],[86,33],[92,64],[79,74],[30,74]])
  for(const [sx,sy]of [[38,20],[58,15],[78,23],[89,43],[88,65]])poly(c,'#f2dab1',[[sx-5,sy+8],[sx+3,sy-12],[sx+10,sy+7]])
  fill(c,'#cb8c49',14,41,30,42);fill(c,'#f2c678',12,45,25,32);fill(c,'#a4663d',17,52,18,3);fill(c,'#a4663d',17,64,18,3)
  fill(c,'#e6a85f',-6,18+bob,41,34);fill(c,'#f2c574',-15,32+bob,42,23);fill(c,'#a95738',-15,45+bob,38,8);fill(c,'#fff2c9',-9,44+bob,5,5);fill(c,'#fff2c9',9,45+bob,5,5)
  fill(c,'#ed7744',8,9+bob,26,12);fill(c,'#f8b756',13,4+bob,12,6);fill(c,'#fff3d2',-1,24+bob,12,12);fill(c,'#372e34',0,27+bob,4,8);fill(c,'#4e4b35',-4,20+bob,19,5)
  poly(c,'#e9d7b2',[[22,18],[24,1],[36,18]])
  fill(c,'#ce9958',-1,60,18,17);fill(c,'#2e3540',-2,69,21,8);fill(c,'#f2d0a0',-6,73,7,6)
  fill(c,'#c88d4b',20,79,22,17);fill(c,'#eec87e',10,89,34,9);fill(c,'#c88d4b',69,78,21,18);fill(c,'#eec87e',61,89,34,9)
  poly(c,'#87aa56',[[90,68],[118,55],[111,74],[91,83]]);c.restore()
}
export function grass(c:Ctx,x:number,y:number,seed:number,time:number){
  fill(c,'#4b843e',x+5,y-7,2,8);fill(c,'#73a850',x+2,y-9,2,5);fill(c,'#73a850',x+8,y-11,2,7)
  if(noise(seed)>.6){const dx=Math.floor(Math.sin(time+seed)*1.5);fill(c,'#679451',x+20,y-12,2,12);fill(c,seed%2?'#fff0a8':'#efaa9b',x+16+dx,y-16,10,6);fill(c,'#efc05c',x+20+dx,y-14,3,3)}
}
export function flag(c:Ctx,x:number,y:number,active:boolean,time:number,finish=false){
  fill(c,'#385f4a',x+1,y,5,finish?300:85);fill(c,'#e0dcb1',x,y,2,finish?300:85);fill(c,'#eccb6b',x-3,y-6,10,10)
  const color=active?'#e95a40':'#829775',wave=Math.sin(time*4)*3
  poly(c,color,[[x+5,y+5],[x+(finish?64:40),y+8+wave],[x+(finish?57:35),y+31+wave],[x+5,y+28]])
  if(finish){label(c,'M',x+28,y+25,18,'#fff3c3')}
}
export function castle(c:Ctx,x:number,y:number,theme:Theme){
  const stone=theme==='castle'?'#b99c87':'#cbb99a',shadow=theme==='castle'?'#7b6471':'#9c987e'
  fill(c,shadow,x,y-135,130,135);fill(c,stone,x+7,y-130,116,130);fill(c,shadow,x-9,y-152,148,20)
  for(let i=0;i<5;i++)fill(c,stone,x-9+i*33,y-166,20,25)
  for(let row=0;row<5;row++){fill(c,shadow,x+7,y-115+row*24,116,2);for(let j=0;j<4;j++)fill(c,shadow,x+row%2*14+j*32,y-114+row*24,2,22)}
  fill(c,'#34483d',x+46,y-58,39,58);fill(c,'#34483d',x+51,y-65,29,7);fill(c,'#dbc99a',x+46,y-64,5,64);fill(c,'#dbc99a',x+80,y-64,5,64)
  for(const dx of [19,96]){fill(c,'#46554b',x+dx,y-111,15,24);fill(c,'#273b36',x+dx+4,y-111,4,24)}
}
export function scenery(c:Ctx,theme:Theme,camera:number,time:number){
  if(theme==='castle'){
    const lava=c.createLinearGradient(0,483,0,540);lava.addColorStop(0,'#ffcb63');lava.addColorStop(.15,'#f68b43');lava.addColorStop(1,'#a53f43');c.fillStyle=lava;c.fillRect(0,491,WIDTH,49)
    for(let x=-30;x<WIDTH;x+=30){const y=491+Math.sin(time*3+x*.025)*4;fill(c,'#ffd76c',x,y,20,5);fill(c,'#e86b43',x+10,512+Math.sin(x)*5,18,3)}
  }else if(theme==='meadow'){
    c.fillStyle='#8dc3b6';c.fillRect(0,513,WIDTH,27);for(let x=-10;x<WIDTH;x+=43)fill(c,'#c7e1c2',x+Math.sin(time+x)*4-camera*.1%20,522,25,2)
  }
}
