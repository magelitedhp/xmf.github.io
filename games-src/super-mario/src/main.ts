import './style.css'
import { Game, type Mode } from './game'
import { Renderer } from './render'
import { worlds } from './levels'
import { writeSave } from './save'

const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T
const game=new Game(),renderer=new Renderer($<HTMLCanvasElement>('game')),overlay=$('overlay')
document.body.classList.toggle('fit-screen',parent===window)
window.addEventListener('message',event=>{
  if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='yumo:mario-fullscreen')return
  document.body.classList.toggle('fit-screen',event.data.active===true)
})
const scoreString=(n:number)=>String(n).padStart(6,'0')
const medals=(bits:number)=>[0,1,2].map(i=>`<span class="${bits&(1<<i)?'gold':''}">★</span>`).join('')
const action=(id:string,fn:()=>void)=>$(id)?.addEventListener('click',()=>{void game.sound.unlock();fn()})
const closePanel=()=>{game.screen('title')}
function screen(){
  const mode=game.mode,gameplay=!['title','levels','help','win'].includes(mode)
  $('hud').classList.toggle('hidden',!gameplay);$('medals').classList.toggle('hidden',!gameplay)
  overlay.classList.toggle('backdrop',['paused','clear','gameover','levels','help','win','intro'].includes(mode))
  if(mode==='title'){
    overlay.innerHTML=`<section class="title-screen"><div class="title-top"><i>M</i> YUMO ORIGINAL / 04</div><h1>SUPER<br><em>MARIO.</em></h1><h2>超级玛丽 · 蘑菇王国冒险</h2><p>顶起一块砖，跃过一片云。<br>把那些简单的快乐，再玩一遍。</p><div class="title-actions"><button id="start" class="primary">开始冒险 <span>▶</span></button><button id="worlds" class="secondary">世界地图</button><button id="help" class="secondary" aria-label="查看操作说明">?</button></div><div class="title-bottom">4 WORLDS · 12 STAR MEDALS · ONE BIG ADVENTURE</div><div class="title-stamp">LET’S PLAY<b>1985</b>ONCE AGAIN</div></section>`
    action('start',()=>game.start(0));action('worlds',()=>game.screen('levels'));action('help',()=>game.screen('help'))
  }else if(mode==='levels'){
    overlay.innerHTML=`<section class="panel"><span class="eyebrow">CHOOSE YOUR NEXT ADVENTURE</span><h2>下一站，去哪里？</h2><p>通关解锁下一世界，收集每一枚星章。</p><div class="level-grid">${worlds.map((w,i)=>`<button class="level-card" id="level-${i}" ${i>game.save.unlocked?'disabled':''}><b>${i>game.save.unlocked?'◈':'0'+(i+1)} / ${w.mark}</b><small>${w.name}</small><span>${[0,1,2].map(j=>game.save.medals[i]&(1<<j)?'★':'☆').join('')}</span></button>`).join('')}</div><p>最高得分 ${scoreString(game.save.best)}</p><button id="back" class="secondary">返回标题</button></section>`
    worlds.forEach((_,i)=>action(`level-${i}`,()=>game.start(i)));action('back',closePanel)
  }else if(mode==='help'){
    overlay.innerHTML=`<section class="panel"><span class="eyebrow">A SMALL GUIDE TO BIG ADVENTURES</span><h2>每一跳，都有惊喜。</h2><div class="help-grid"><b>← → / A D</b><span>左右移动；按住 Shift / J 冲刺。</span><b>空格 / Z / K</b><span>跳跃。长按跳得更高，踩中敌人时按住可弹得更高。</span><b>↓ / S</b><span>蹲下；站在标有箭头的水管上按下，进入隐藏房间。</span><b>X / 冲刺键</b><span>获得火焰花后发射火球；龟壳可以踢向敌人。</span><b>Esc / P</b><span>暂停。切到其他窗口时也会自动暂停。</span><b>★ 星章</b><span>每关三枚。金币累计 100 枚奖励一条生命，旗帜点亮检查点。</span></div><p>手机支持多指同时操作；横屏游玩有更开阔的视野。</p><button id="back" class="primary">准备好了</button></section>`;action('back',closePanel)
  }else if(mode==='intro'){
    const world=worlds[game.world.index]
    overlay.innerHTML=`<section class="intro-panel"><span class="eyebrow">WORLD 1 — ${game.world.index+1}</span><div class="world-mark">${world.mark}</div><h2>${world.name}</h2><p>MARIO × ${game.lives}${game.checkpoint?' / CHECKPOINT':''}</p></section>`
  }else if(mode==='paused'){
    overlay.innerHTML=`<section class="panel"><span class="eyebrow">TAKE A LITTLE BREATHER</span><h2>世界在等你。</h2><p>暂停一下，下一跳会更从容。</p><div class="panel-actions"><button id="resume" class="primary">继续冒险 ▶</button><button id="home" class="secondary">返回标题</button></div></section>`;action('resume',()=>game.resume());action('home',()=>game.home())
  }else if(mode==='clear'){
    overlay.innerHTML=`<section class="panel"><span class="eyebrow">WORLD ${game.world.index+1} / COMPLETE</span><h2>${game.world.index===3?'公主得救了！':'漂亮的一跃。'}</h2><p>${worlds[game.world.index].name} · 已完成</p><div class="big-medals">${medals(game.medals)}</div><div class="stats"><div><b>${scoreString(game.score)}</b><small>冒险得分</small></div><div><b>+${game.clearBonus}</b><small>时间奖励</small></div><div><b>${game.coins}</b><small>金币收集</small></div></div><div class="panel-actions"><button id="next" class="primary">${game.world.index===3?'冒险的终章':'下一世界'} →</button><button id="home" class="secondary">返回标题</button></div></section>`;action('next',()=>game.next());action('home',()=>game.home())
  }else if(mode==='gameover'){
    overlay.innerHTML=`<section class="panel"><span class="eyebrow">EVERY HERO TRIES AGAIN</span><h2>再来一次，就差一点。</h2><p>这段冒险的得分是 ${scoreString(game.score)}。<br>已解锁的世界和通关星章会一直为你保留。</p><div class="panel-actions"><button id="retry" class="primary">重新挑战 ↻</button><button id="home" class="secondary">返回标题</button></div></section>`;action('retry',()=>game.start(game.world.index));action('home',()=>game.home())
  }else if(mode==='win'){
    const count=game.save.medals.reduce((sum,bits)=>sum+[0,1,2].filter(i=>bits&(1<<i)).length,0)
    overlay.innerHTML=`<section class="panel"><span class="eyebrow">THANK YOU FOR PLAYING</span><h2>冒险会结束，<br>快乐不会。</h2><p>你越过草原、穿过地底、踏上云端，<br>终于让蘑菇王国迎来了新的清晨。</p><div class="stats"><div><b>${scoreString(game.score)}</b><small>本次得分</small></div><div><b>${count} / 12</b><small>累计星章</small></div></div><p>独立代码与像素绘画 · Yumo Play Department</p><div class="panel-actions"><button id="worlds" class="primary">收集剩余星章</button><button id="home" class="secondary">返回标题</button></div></section>`;action('worlds',()=>game.screen('levels'));action('home',()=>game.home())
  }else overlay.innerHTML=''
}
game.onScreen=screen;game.onToast=text=>{$('toast').textContent=text;$('toast').classList.add('show')}
action('pause',()=>game.mode==='paused'?game.resume():game.pause())
function soundLabel(){$('sound').textContent=game.sound.enabled?'♫ 声音开启':'♪ 声音关闭';$('sound').setAttribute('aria-pressed',String(game.sound.enabled))}
action('sound',()=>{game.sound.toggle();game.save.sound=game.sound.enabled;writeSave(game.save);soundLabel()})
soundLabel();screen()
let last=performance.now(),accumulator=0,lastHud='',lastMode:Mode=game.mode
function frame(now:number){
  accumulator+=Math.min(.1,(now-last)/1000);last=now
  while(accumulator>=1/60){game.step(1/60);accumulator-=1/60}
  renderer.draw(game)
  const hudKey=[game.score,game.coins,game.lives,game.world.index,Math.ceil(game.clock),game.medals,game.world.theme].join(':')
  if(hudKey!==lastHud){
    $('score').textContent=scoreString(game.score);$('coins').textContent=String(game.coins).padStart(2,'0');$('hearts').textContent=`♥ ×${game.lives}`;$('world-name').textContent=game.world.name;$('world').textContent=`WORLD 1—${game.world.index+1}`;$('timer').textContent=String(Math.ceil(game.clock)).padStart(3,'0')
    for(const [i,el]of [...$('medals').children].entries())el.classList.toggle('found',!!(game.medals&(1<<i)))
    lastHud=hudKey
  }
  if(game.toastTime===0)$('toast').classList.remove('show')
  if(lastMode!==game.mode){lastMode=game.mode;if(game.mode==='playing')$('game').focus({preventScroll:true})}
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
// The site iframe reserves exactly enough room for the canvas and touch controls.
let lastHeight=0
new ResizeObserver(()=>{
  const height=Math.ceil($('cabinet').getBoundingClientRect().height)
  if(height!==lastHeight){lastHeight=height;if(parent!==window)parent.postMessage({type:'yumo:mario-height',height},location.origin==='null'?'*':location.origin)}
}).observe($('cabinet'))
// Debug builds and release checks can access state only through an explicit URL opt-in.
if(new URLSearchParams(location.search).has('debug'))Object.assign(window,{__mario:game,__renderer:renderer})
