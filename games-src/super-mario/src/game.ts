import { createWorld } from './levels'
import { Sound } from './audio'
import { Input } from './input'
import { readSave, writeSave } from './save'
import { TILE, WIDTH, clamp, approach, overlap, type Player, type World, type Rect, type Block, type Enemy, type Particle, type Projectile, type Pickup } from './types'
export type Mode='title'|'intro'|'playing'|'paused'|'dying'|'clear'|'gameover'|'win'|'levels'|'help'
export class Game {
  mode:Mode='title'; world=createWorld(0);player:Player=this.newPlayer();sound=new Sound();input:Input;save=readSave()
  particles:Particle[]=[];shots:Projectile[]=[];camera=0;age=0;clock=300;score=0;coins=0;lives=3;medals=0;checkpoint=false;shake=0;flash=0
  modeTime=0;toastTime=0;checkpointSpawn?:{x:number;y:number};returnWorld?:{world:World;x:number;y:number};warpCooldown=0;combo=0;bossWon=false;clearBonus=0
  onScreen:()=>void=()=>{};onToast:(text:string)=>void=()=>{}
  constructor(){this.sound.enabled=this.save.sound;this.input=new Input(()=>void this.sound.unlock(),()=>this.pause());this.player.x=700;this.player.y=448}
  newPlayer():Player{return{x:100,y:400,w:24,h:32,vx:0,vy:0,facing:1,grounded:false,coyote:0,buffer:0,power:0,invincible:0,star:0,fireCooldown:0,walk:0,dead:0,duck:false}}
  screen(mode:Mode){this.mode=mode;this.modeTime=0;this.input.clear();this.onScreen()}
  start(index=0){this.score=0;this.coins=0;this.lives=3;this.medals=0;this.checkpoint=false;this.checkpointSpawn=undefined;this.returnWorld=undefined;this.player=this.newPlayer();this.load(index);void this.sound.unlock()}
  load(index:number,retry=false){
    this.world=createWorld(index);this.returnWorld=undefined;this.clock=300;this.camera=0;this.shots=[];this.particles=[];this.combo=0;this.bossWon=false
    const power=retry?0:this.player.power;this.player=this.newPlayer();this.player.power=power
    if(!retry){this.medals=0;this.checkpoint=false;this.checkpointSpawn=undefined}
    const spawn=this.checkpointSpawn??this.world.spawn;this.player.x=spawn.x;this.player.y=spawn.y
    this.camera=clamp(this.player.x-WIDTH*.35,0,this.world.width-WIDTH)
    for(const item of this.world.pickups)if(item.kind==='medal'&&(this.medals&(1<<item.id)))item.active=false
    this.screen('intro')
  }
  next(){if(this.world.index===3){this.screen('win');return}this.load(this.world.index+1)}
  pause(){if(this.mode==='playing')this.screen('paused')}
  resume(){if(this.mode==='paused'){this.screen('playing');document.querySelector<HTMLCanvasElement>('#game')?.focus({preventScroll:true});void this.sound.unlock()}}
  home(){this.returnWorld=undefined;this.world=createWorld(0);this.camera=0;this.particles=[];this.shots=[];this.player=this.newPlayer();this.screen('title')}
  toast(text:string){this.toastTime=3;this.onToast(text)}
  addScore(value:number,x?:number,y?:number){this.score+=value;if(x!==undefined&&y!==undefined)this.particles.push({x,y,vx:0,vy:-35,life:1,max:1,size:12,color:'#fff7c2',gravity:0,text:`+${value}`})}
  burst(x:number,y:number,color:string,count=10,power=1){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=(70+Math.random()*170)*power;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-70,life:.35+Math.random()*.35,max:.7,size:2+Math.random()*5,color,gravity:600})}}
  solidNear(rect:Rect,margin=70){return this.world.blocks.filter(b=>!b.broken&&b.x+b.w>rect.x-margin&&b.x<rect.x+rect.w+margin&&b.y+b.h>rect.y-margin&&b.y<rect.y+rect.h+margin)}
  coin(x:number,y:number){this.coins++;this.addScore(100,x,y);this.sound.effect('coin');this.burst(x,y,'#ffdf66',6,.5);if(this.coins%100===0){this.lives++;this.toast('100 枚金币 · 额外生命 +1');this.sound.effect('power')}}
  bump(b:Block){
    if(b.bump>0)return
    b.bump=.2;this.sound.effect('bump')
    for(const e of this.world.enemies)if(e.alive&&e.x+e.w>b.x&&e.x<b.x+b.w&&Math.abs(e.y+e.h-b.y)<12)this.defeat(e)
    if(b.kind==='question'){
      b.kind='used';const kind=b.content??'coin'
      if(kind==='coin'){this.coin(b.x+20,b.y-15);return}
      const itemKind=kind==='mushroom'&&this.player.power>0?'flower':kind
      this.world.pickups.push({x:b.x+5,y:b.y,w:30,h:30,baseY:b.y,kind:itemKind,vx:itemKind==='flower'?0:95,vy:0,active:true,emerge:.45,id:-1});this.sound.effect('power')
    }else if(b.kind==='brick'&&this.player.power>0){b.broken=true;this.sound.effect('break');this.burst(b.x+20,b.y+20,this.world.theme==='meadow'?'#b87b46':'#849fa2',12);this.addScore(50);this.shake=.12}
  }
  hurt(){
    const p=this.player;if(p.invincible>0||p.star>0||this.mode!=='playing')return
    if(p.power>0){p.power=0;p.invincible=2.2;p.y+=p.h-32;p.h=32;this.shake=.25;this.flash=.14;this.sound.effect('hurt');this.burst(p.x+12,p.y,'#fff4c8',12)}else this.die()
  }
  die(){if(this.mode!=='playing')return;this.player.vy=-510;this.player.vx=0;this.screen('dying');this.sound.effect('die');this.shake=.2;this.record()}
  defeat(e:Enemy){
    if(!e.alive)return;e.alive=false;this.addScore(e.kind==='boss'?5000:200,e.x+e.w/2,e.y);this.burst(e.x+e.w/2,e.y+e.h/2,e.kind==='goomba'?'#dbac70':'#afce79',12);this.sound.effect('stomp')
    if(e.kind==='boss'){this.bossWon=true;this.shake=.65;this.sound.effect('win');this.toast('城堡守卫已击败 · 去迎接公主吧！')}
  }
  hitBoss(e:Enemy,damage=1){if(e.hit>0)return;e.hp-=damage;e.hit=.65;this.sound.effect('hurt');this.shake=.18;this.burst(e.x+50,e.y+40,'#ffb45f',8);if(e.hp<=0)this.defeat(e)}
  collect(p:Pickup){
    p.active=false
    if(p.kind==='coin'){this.coin(p.x+9,p.y);return}
    if(p.kind==='medal'){this.medals|=1<<p.id;this.addScore(1000,p.x,p.y);this.sound.effect('medal');this.burst(p.x+15,p.y+15,'#ffe88a',24);this.toast('星章入手！每个世界藏着三枚星章。');return}
    if(p.kind==='star'){this.player.star=11;this.toast('星星无敌！向前冲吧。')}
    else if(p.kind==='life'){this.lives++;this.toast('额外生命 +1')}
    else{this.player.power=p.kind==='flower'?2:Math.max(1,this.player.power) as 1|2;this.player.invincible=1;this.toast(p.kind==='flower'?'火焰形态 · X 或按住冲刺键发射火球':'超级形态 · 可以顶碎砖块了')}
    this.addScore(1000,p.x,p.y);this.sound.effect('power');this.burst(p.x+15,p.y+15,'#ffedaf',18)
  }
  record(){this.save.best=Math.max(this.save.best,this.score);writeSave(this.save)}
  clear(){
    if(this.mode!=='playing')return
    this.clearBonus=Math.floor(this.clock)*10;this.addScore(this.clearBonus);const index=this.world.index
    this.save.medals[index]|=this.medals;this.save.unlocked=Math.max(this.save.unlocked,Math.min(3,index+1));this.save.clears[index]++;this.record()
    this.screen('clear');this.sound.effect('flag');for(let i=0;i<5;i++)this.burst(this.player.x+Math.random()*300-80,80+Math.random()*160,['#fff1a3','#ec7859','#b9d97f'][i%3],22)
  }
  warp(){
    const p=this.player,w=this.world;if(this.warpCooldown>0||!p.grounded||!this.input.down('down'))return
    const target=w.exit??w.warp;if(!target||Math.abs(p.x+p.w/2-target.x-40)>30||Math.abs(p.y+p.h-target.y)>8)return
    if(w.exit&&this.returnWorld){const ret=this.returnWorld;this.world=ret.world;p.x=ret.x;p.y=ret.y;this.returnWorld=undefined;this.toast('回到地面 · 冒险继续')}
    else if(w.warp){this.returnWorld={world:w,x:target.x+TILE*2+12,y:400};this.world=createWorld(w.index,true);p.x=100;p.y=400;this.toast('发现金币密室！右侧水管可以返回。')}
    p.vx=0;p.vy=0;this.camera=clamp(p.x-300,0,this.world.width-WIDTH);this.shots=[];this.warpCooldown=1;this.sound.effect('power');this.flash=.18
  }
  step(dt:number){
    this.age+=dt;this.modeTime+=dt;this.shake=Math.max(0,this.shake-dt);this.flash=Math.max(0,this.flash-dt);this.toastTime=Math.max(0,this.toastTime-dt)
    this.sound.update(this.mode==='playing',this.world.theme,this.player.star>0)
    if(this.input.pressed('pause')){if(this.mode==='playing')this.pause();else if(this.mode==='paused')this.resume()}
    if(this.mode==='intro'&&this.modeTime>1.5){this.screen('playing');if(this.world.index===0&&!this.checkpoint)this.toast('方向键移动 · 空格跳跃 · 按住 Shift 跑得更快')}
    if(this.mode==='dying'){
      this.player.vy+=1200*dt;this.player.y+=this.player.vy*dt
      if(this.modeTime>1.8){this.lives--;if(this.lives>0)this.load(this.returnWorld?.world.index??this.world.index,true);else this.screen('gameover')}
    }
    if(this.mode==='playing')this.update(dt)
    if(this.mode==='clear'){this.player.facing=1;this.player.walk+=dt*100;if(this.player.x<this.world.goal+110)this.player.x+=70*dt}
    if(this.mode!=='paused')for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.gravity*dt}
    this.particles=this.particles.filter(p=>p.life>0).slice(-300)
    this.input.end()
  }
  update(dt:number){
    const p=this.player,w=this.world;this.warpCooldown=Math.max(0,this.warpCooldown-dt);this.clock-=dt;if(this.clock<=0){this.clock=0;this.die();return}
    for(const b of w.blocks)b.bump=Math.max(0,b.bump-dt)
    for(const platform of w.platforms){const x=platform.x,y=platform.y;platform.phase+=dt*platform.speed;if(platform.axis==='x')platform.x=platform.homeX+Math.sin(platform.phase)*platform.range;else platform.y=platform.homeY-Math.sin(platform.phase)*platform.range;platform.dx=platform.x-x;platform.dy=platform.y-y}
    p.invincible=Math.max(0,p.invincible-dt);p.star=Math.max(0,p.star-dt);p.fireCooldown=Math.max(0,p.fireCooldown-dt)
    const wasGrounded=p.grounded;p.coyote=wasGrounded?.11:Math.max(0,p.coyote-dt);p.buffer=this.input.pressed('jump')?.13:Math.max(0,p.buffer-dt)
    p.duck=p.power>0&&this.input.down('down')&&p.grounded
    const height=p.power>0&&!p.duck?48:32
    if(height!==p.h){const r={x:p.x,y:p.y+p.h-height,w:p.w,h:height};if(height<p.h||!this.solidNear(r).some(b=>overlap(r,b))){p.y=r.y;p.h=height}else p.duck=true}
    const direction=Number(this.input.down('right'))-Number(this.input.down('left')),run=this.input.down('run'),max=run?310:195
    if(direction&&!p.duck){p.vx=approach(p.vx,direction*max,(wasGrounded?1150:740)*dt);p.facing=direction}else p.vx=approach(p.vx,0,(wasGrounded?1250:170)*dt)
    if(p.buffer>0&&p.coyote>0&&!p.duck){p.vy=run?-725:-670;p.grounded=false;p.coyote=0;p.buffer=0;this.sound.effect('jump');this.burst(p.x+12,p.y+p.h,'#f2e5bc',5,.25)}
    if(this.input.released('jump')&&p.vy<-250)p.vy=-250
    if(p.power===2&&(this.input.pressed('fire')||run)&&p.fireCooldown===0&&this.shots.filter(s=>!s.hostile).length<3){
      this.shots.push({x:p.x+(p.facing>0?p.w:-10),y:p.y+p.h*.45,w:12,h:12,vx:p.facing*440,vy:150,life:2.5,hostile:false});p.fireCooldown=.3;this.sound.effect('fire')
    }
    p.vy=Math.min(880,p.vy+1850*dt);p.walk+=Math.abs(p.vx)*dt
    p.x+=p.vx*dt
    for(const b of this.solidNear(p))if(overlap(p,b)){if(p.vx>0)p.x=b.x-p.w;else if(p.vx<0)p.x=b.x+b.w;p.vx=0}
    p.x=clamp(p.x,0,w.width-p.w)
    const previousBottom=p.y+p.h;p.y+=p.vy*dt;p.grounded=false
    for(const b of this.solidNear(p))if(overlap(p,b)){
      if(p.vy>0){p.y=b.y-p.h;p.grounded=true;p.vy=0}
      else if(p.vy<0){p.y=b.y+b.h;p.vy=25;this.bump(b)}
    }
    for(const platform of w.platforms)if(p.vy>=0&&p.x+p.w>platform.x&&p.x<platform.x+platform.w&&previousBottom<=platform.y+Math.abs(platform.dy)+3&&p.y+p.h>=platform.y){p.y=platform.y-p.h;p.vy=0;p.grounded=true;p.x+=platform.dx}
    if(p.grounded){this.combo=0;if(!wasGrounded&&p.vy>=0)this.burst(p.x+12,p.y+p.h,'#e5ddb1',4,.2)}
    if(p.y>660){this.die();return}
    if(!this.checkpoint&&w.checkpoint&&p.x>w.checkpoint){this.checkpoint=true;this.checkpointSpawn={x:w.checkpoint+30,y:w.checkpointY};this.addScore(500);this.sound.effect('checkpoint');this.toast('检查点已点亮 · 失败后从这里继续');this.burst(w.checkpoint,400,'#d0e690',20)}
    this.warp()
    if(this.world!==w)return
    for(const item of w.pickups){
      if(!item.active)continue
      if(item.emerge>0){item.y-=70*dt;item.emerge=Math.max(0,item.emerge-dt);continue}
      if(item.kind!=='coin'&&item.kind!=='medal'&&item.kind!=='flower'){
        item.vy=Math.min(700,item.vy+1200*dt);item.x+=item.vx*dt
        for(const b of this.solidNear(item))if(overlap(item,b)){item.x=item.vx>0?b.x-item.w:b.x+b.w;item.vx*=-1}
        item.y+=item.vy*dt;for(const b of this.solidNear(item))if(overlap(item,b)&&item.vy>0){item.y=b.y-item.h;item.vy=item.kind==='star'?-420:0}
        if(item.y>650)item.active=false
      }
      if(overlap(p,item))this.collect(item)
    }
    for(const e of w.enemies){
      if(!e.alive||Math.abs(e.x-p.x)>1000)continue
      this.updateEnemy(e,dt)
      if(!e.alive)continue
      const hitbox=e.kind==='plant'?{...e,y:e.y+5,h:e.h-10}:e
      if(!overlap(p,hitbox)||this.mode!=='playing')continue
      if(p.star>0){if(e.kind==='boss')this.hitBoss(e,2);else this.defeat(e);continue}
      if(e.kind==='plant'){this.hurt();continue}
      if(e.kind==='boss'){
        if(p.vy>60&&previousBottom<e.y+24){p.y=e.y-p.h;p.vy=this.input.down('jump')?-560:-420;this.hitBoss(e)}else this.hurt();continue
      }
      if(p.vy>50&&previousBottom<=e.y+16){
        p.y=e.y-p.h;p.vy=this.input.down('jump')?-560:-380;this.combo++;this.sound.effect('stomp')
        if(e.kind==='turtle'){e.kind='shell';e.y+=e.h-22;e.h=22;e.vx=0;e.hit=.25;this.addScore(100,e.x,e.y)}
        else if(e.kind==='shell'){e.vx=e.vx===0?(p.x<e.x?400:-400):0;e.hit=.25}
        else this.defeat(e)
      }else if(e.kind==='shell'&&e.vx===0){e.vx=p.x<e.x?400:-400;e.hit=.3;this.sound.effect('stomp')}
      else if(e.hit<=0)this.hurt()
    }
    this.updateShots(dt)
    const desired=clamp(p.x-WIDTH*.37+p.vx*.25,0,w.width-WIDTH);this.camera+=(desired-this.camera)*(1-Math.exp(-6*dt))
    if(w.theme==='castle'&&!this.bossWon&&p.x>w.goal-100)p.x=w.goal-100
    if(p.x>=w.goal&&(w.theme!=='castle'||this.bossWon))this.clear()
    if(run&&p.grounded&&Math.abs(p.vx)>230&&Math.random()<.22)this.burst(p.x+12,p.y+p.h,'#e3d9a0',1,.2)
  }
  updateEnemy(e:Enemy,dt:number){
    const p=this.player;e.phase+=dt;e.hit=Math.max(0,e.hit-dt)
    if(e.kind==='plant'){
      const cycle=e.phase%5,near=Math.abs(p.x-e.homeX)<75;e.y=e.homeY+44-(near&&cycle>3?0:Math.max(0,Math.sin(cycle/5*Math.PI*2))*65)
      if(e.y>e.homeY+22)return
      return
    }
    if(e.kind==='boss'){
      e.vx=Math.sin(e.phase*.9)*70
      if(e.grounded&&e.phase%3<dt){e.vy=-570;this.shake=.2}
      if(e.phase%1.5<dt){this.shots.push({x:e.x-12,y:e.y+35,w:22,h:18,vx:-240,vy:(p.y-e.y)*.25,life:4.5,hostile:true});this.sound.effect('fire')}
    }
    e.vy=Math.min(800,e.vy+1500*dt)
    e.x+=e.vx*dt
    for(const b of this.solidNear(e))if(overlap(e,b)){e.x=e.vx>0?b.x-e.w:b.x+b.w;e.vx*=-1;break}
    if(e.kind==='turtle'&&e.grounded){const front={x:e.vx>0?e.x+e.w+3:e.x-5,y:e.y+e.h+3,w:3,h:8};if(!this.solidNear(front).some(b=>overlap(front,b)))e.vx*=-1}
    e.y+=e.vy*dt;e.grounded=false
    for(const b of this.solidNear(e))if(overlap(e,b)&&e.vy>=0){e.y=b.y-e.h;e.vy=0;e.grounded=true}
    if(e.y>650){e.alive=false;return}
    if(e.kind==='boss')e.x=clamp(e.x,108*TILE,120*TILE)
    if(e.kind==='shell'&&Math.abs(e.vx)>100){for(const other of this.world.enemies)if(other!==e&&other.alive&&overlap(e,other)){if(other.kind==='boss'){this.hitBoss(other,2);e.alive=false}else this.defeat(other)}}
  }
  updateShots(dt:number){
    for(const s of this.shots){
      s.life-=dt;s.x+=s.vx*dt;if(!s.hostile)s.vy+=1000*dt
      if(this.solidNear(s).some(b=>overlap(s,b))){s.life=0;this.burst(s.x,s.y,'#ffbe60',5,.4);continue}
      s.y+=s.vy*dt
      for(const b of this.solidNear(s))if(overlap(s,b)){if(!s.hostile&&s.vy>0){s.y=b.y-s.h;s.vy=-320}else s.life=0}
      if(s.hostile){if(overlap(s,this.player)){this.hurt();s.life=0}}
      else for(const e of this.world.enemies)if(e.alive&&overlap(s,e)){if(e.kind==='boss')this.hitBoss(e);else this.defeat(e);s.life=0;break}
      if(Math.random()<.6)this.particles.push({x:s.x+s.w/2,y:s.y+s.h/2,vx:0,vy:0,life:.2,max:.2,color:'#ffad4b',size:4,gravity:0})
    }
    this.shots=this.shots.filter(s=>s.life>0&&s.y<600)
  }
}
