import type { Game } from './game'
import { WIDTH, HEIGHT, TILE } from './types'
import { background, fill, sprite, label, drawBlock, coinArt, playerArt, enemyArt, grass, flag, castle, scenery } from './art'
export class Renderer {
  ctx:CanvasRenderingContext2D
  constructor(public canvas:HTMLCanvasElement){this.ctx=canvas.getContext('2d',{alpha:false})!;canvas.width=WIDTH;canvas.height=HEIGHT}
  draw(g:Game){
    const c=this.ctx,t=g.age,w=g.world;c.imageSmoothingEnabled=false;c.save()
    const title=['title','levels','help','win'].includes(g.mode)
    background(c,title?'meadow':w.theme,title?0:g.camera,t)
    if(title){this.title(t);c.restore();return}
    if(g.shake>0&&!matchMedia('(prefers-reduced-motion: reduce)').matches)c.translate((Math.random()-.5)*g.shake*16,(Math.random()-.5)*g.shake*12)
    scenery(c,w.theme,g.camera,t);c.translate(-Math.round(g.camera),0)
    const from=g.camera-80,to=g.camera+WIDTH+80
    // Decorations are deterministic so camera movement never changes the world.
    for(const b of w.blocks){if(b.broken||b.x<from||b.x>to)continue
      if(b.kind==='ground'&&!w.blocks.some(a=>!a.broken&&a.x===b.x&&a.y===b.y-TILE)){
        if(w.theme==='meadow'||w.theme==='sky')grass(c,b.x,b.y,Math.floor(b.x/40),t)
        if((w.theme==='cave'||w.theme==='bonus')&&Math.floor(b.x/40)%5===0){fill(c,'#64a8ab',b.x+8,b.y-15,7,15);fill(c,'#95d9cb',b.x+11,b.y-22,3,22);fill(c,'#428a9c',b.x+18,b.y-10,8,10)}
      }
    }
    if(w.theme!=='bonus'){
      if(w.theme!=='castle'){castle(c,w.goal+110,480,w.theme);flag(c,w.goal+8,180,g.mode==='clear',t,true)}
      else{fill(c,'#212735',w.goal+8,353,62,127);fill(c,'#d2af78',w.goal+3,346,8,134);fill(c,'#d2af78',w.goal+70,346,8,134);fill(c,'#d2af78',w.goal+3,342,75,8);sprite(c,'princess',w.goal+22,430,3);if(!g.bossWon)for(let i=0;i<6;i++)fill(c,'#aaa4a0',w.goal+9+i*12,350,4,130)}
    }
    if(w.checkpoint)flag(c,w.checkpoint,392,g.checkpoint,t)
    // Plants draw behind pipe rims.
    for(const e of w.enemies)if(e.kind==='plant'&&e.x>from&&e.x<to)enemyArt(c,e,t)
    for(const item of w.pickups)if(item.active&&item.emerge>0)this.item(g,item)
    for(const b of w.blocks)if(b.x+b.w>from&&b.x<to){const top=b.kind==='ground'&&!w.blocks.some(a=>!a.broken&&a.x===b.x&&a.y===b.y-TILE);drawBlock(c,b,w.theme,t,top)}
    for(const platform of w.platforms){
      fill(c,'#496453',platform.x,platform.y,platform.w,18);fill(c,'#e3d098',platform.x,platform.y,platform.w,5);fill(c,'#a58d62',platform.x+3,platform.y+6,platform.w-6,8)
      for(let i=0;i<platform.w;i+=20)fill(c,'#735f4c',platform.x+i,platform.y+5,2,10)
      fill(c,'#8b9a7c77',platform.homeX+platform.w/2,platform.homeY-90,2,80)
    }
    for(const item of w.pickups)if(item.active&&item.emerge<=0&&item.x>from&&item.x<to)this.item(g,item)
    if(w.warp&&g.player.x>w.warp.x-180&&g.player.x<w.warp.x+180){label(c,'↓',w.warp.x+40,w.warp.y-17+Math.sin(t*3)*3,19,'#f7edbb')}
    if(w.exit){label(c,'↓ 返回地面',w.exit.x+40,w.exit.y-22+Math.sin(t*3)*3,13,'#f7edbb')}
    for(const e of w.enemies)if(e.kind!=='plant'&&e.x>from&&e.x<to)enemyArt(c,e,t)
    playerArt(c,g.player,t)
    for(const s of g.shots){const x=s.x+s.w/2,y=s.y+s.h/2;fill(c,'#da563c',x-8,y-8,16,16);fill(c,'#ffb855',x-6,y-6,12,12);fill(c,'#fff0b0',x-3,y-3,6,6)}
    for(const p of g.particles){c.globalAlpha=Math.min(1,p.life*3);if(p.text)label(c,p.text,p.x,p.y,p.size,p.color);else fill(c,p.color,p.x,p.y,p.size,p.size)}c.globalAlpha=1
    c.restore()
    const boss=w.enemies.find(e=>e.kind==='boss'&&e.alive)
    if(boss&&Math.abs(boss.x-g.player.x)<800){fill(c,'#1b2c38dd',WIDTH/2-135,HEIGHT-40,270,24);fill(c,'#675363',WIDTH/2-50,HEIGHT-32,174,8);fill(c,'#ea8762',WIDTH/2-50,HEIGHT-32,174*boss.hp/8,8);label(c,'城堡守卫',WIDTH/2-90,HEIGHT-24,11,'#fff0c2')}
    if(g.flash>0){c.fillStyle=`rgba(255,242,200,${g.flash*1.4})`;c.fillRect(0,0,WIDTH,HEIGHT)}
    // Very subtle edge vignette, preserving the bright central playfield.
    const vignette=c.createRadialGradient(480,250,230,480,270,650);vignette.addColorStop(0,'#163e3000');vignette.addColorStop(1,'#163e3029');c.fillStyle=vignette;c.fillRect(0,0,WIDTH,HEIGHT)
  }
  item(g:Game,item:Game['world']['pickups'][number]){
    const c=this.ctx,t=g.age
    if(item.kind==='coin')coinArt(c,item.x,item.y+Math.sin(t*3+item.x)*2,t+item.x*.04)
    else if(item.kind==='medal'){
      const y=item.y+Math.sin(t*2.5)*5;c.save();c.globalAlpha=.12+.08*Math.sin(t*3);c.fillStyle='#ffe7a0';c.beginPath();c.arc(item.x+17,y+17,28,0,Math.PI*2);c.fill();c.restore();sprite(c,'star',item.x+1,y+1,2);fill(c,'#fff8d2',item.x+34,y-4,3,3)
    }else sprite(c,item.kind==='life'?'mushroom':item.kind,item.x-1,item.y,2,false,item.kind==='life'?'life':'')
  }
  title(t:number){
    const c=this.ctx
    // A little living diorama, used by the opening screen and world selector.
    fill(c,'#559151',0,431,WIDTH,8);fill(c,'#c4d78a',0,429,WIDTH,3)
    for(let x=0;x<WIDTH;x+=40){drawBlock(c,{x,y:440,w:40,h:40,kind:'ground',broken:false,bump:0},'meadow',t,false);drawBlock(c,{x,y:480,w:40,h:40,kind:'ground',broken:false,bump:0},'meadow',t,false);grass(c,x,430,x,t)}
    fill(c,'#365b3c',0,433,WIDTH,8)
    for(let x=580;x<=700;x+=40)drawBlock(c,{x,y:271,w:40,h:40,kind:x===620?'question':'brick',broken:false,bump:0},'meadow',t,true)
    coinArt(c,627,224+Math.sin(t*2)*5,t,true);coinArt(c,670,224+Math.sin(t*2+1)*5,t+.2,true)
    drawBlock(c,{x:782,y:351,w:80,h:40,kind:'pipe',broken:false,bump:0,pipeTop:true},'meadow',t,true);drawBlock(c,{x:782,y:391,w:80,h:40,kind:'pipe',broken:false,bump:0},'meadow',t,true)
    const jump=Math.max(0,Math.sin(t*1.9))*66
    c.save();c.translate(643,427-jump);c.scale(2,2);sprite(c,'tall',-16,-46,2);c.restore()
    sprite(c,'goomba',887+Math.sin(t)*13,399,2,true)
    for(let i=0;i<7;i++){const x=510+noiseLocal(i)*410,y=140+noiseLocal(i+9)*260+Math.sin(t+i)*9;fill(c,'#fff0ba99',x,y,3,3)}
    label(c,'01 — 青风草原',855,508,11,'#f2e5b5')
  }
}
const noiseLocal=(n:number)=>(Math.sin(n*137+24)*4726)%1*.5+.5
