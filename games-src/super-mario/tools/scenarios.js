(() => {
  const g=window.__mario,report={},saved=localStorage.getItem('yumo.super-mario.v1')
  const assert=(ok,message)=>{if(!ok)throw Error(message)}
  const frames=n=>{for(let i=0;i<n;i++)g.step(1/60)}
  const down=code=>window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}))
  const up=code=>window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}))
  const reset=(index=0)=>{g.start(index);g.screen('playing');g.sound.enabled=false;g.world.enemies=[];frames(30)}
  const jumpHeight=hold=>{reset();const floor=g.player.y;down('Space');frames(hold);up('Space');let highest=g.player.y;for(let i=0;i<70;i++){frames(1);highest=Math.min(highest,g.player.y)}return floor-highest}
  try {
    const short=jumpHeight(3),long=jumpHeight(17);assert(long>short+40,`Variable jump missing: ${short}, ${long}`);report.jump={short,long}
    reset();down('ArrowRight');frames(45);up('ArrowRight');const walking=g.player.x
    reset();down('ArrowRight');down('ShiftLeft');frames(45);up('ArrowRight');up('ShiftLeft');assert(g.player.x>walking+45,'Sprint acceleration missing');report.sprint={walking,running:g.player.x}
    reset();g.player.x=328;down('Space');frames(24);up('Space');assert(g.coins===1,'Question block did not award coin');assert(g.world.blocks.find(b=>b.x===320&&b.y===360).kind==='used','Question block did not become used');report.question=true
    reset();g.player.x=565;down('Space');frames(23);up('Space');const mushroom=g.world.pickups.find(p=>p.kind==='mushroom');assert(!!mushroom,'Mushroom did not emerge');frames(35);g.player.x=mushroom.x;g.player.y=mushroom.y-6;frames(2);assert(g.player.power===1,'Mushroom collection failed');report.mushroom=true
    reset();g.player.power=1;g.player.x=485;frames(1);down('Space');frames(25);up('Space');assert(g.world.blocks.find(b=>b.x===480&&b.y===360).broken,'Big Mario could not break brick');report.breakBrick=true
    // Coyote time and jump buffering are checked at real collision boundaries.
    reset();g.player.x=27*40+34;g.player.vx=310;down('ArrowRight');down('ShiftLeft');frames(2);assert(!g.player.grounded,'Did not step past gap edge');down('Space');frames(1);assert(g.player.vy<0,'Coyote jump failed');up('Space');report.coyote=true
    reset();g.player.x=100;g.player.y=420;g.player.vy=200;g.player.grounded=false;g.player.coyote=0;down('Space');frames(8);assert(g.player.vy<0,'Buffered jump failed');up('Space');report.bufferedJump=true
    g.start(0);g.screen('playing');frames(30);let e=g.world.enemies.find(e=>e.kind==='goomba');g.player.x=e.x;g.player.y=e.y-35;g.player.vy=150;g.player.grounded=false;frames(3);assert(!e.alive,'Stomp failed');assert(g.player.vy<0,'Stomp bounce failed');report.stomp=true
    g.start(0);g.screen('playing');let turtle=g.world.enemies.find(e=>e.kind==='turtle');g.player.x=turtle.x;g.player.y=350;frames(40);assert(turtle.kind==='shell','Turtle did not become shell: '+JSON.stringify({turtle,player:g.player,mode:g.mode}));g.player.x=turtle.x-22;g.player.y=turtle.y;g.player.vy=0;frames(1);assert(Math.abs(turtle.vx)>300,'Shell kick failed');report.shell=true
    reset();g.player.power=2;down('KeyX');frames(1);up('KeyX');assert(g.shots.length===1,'Fireball not spawned');report.fireball=true
    reset();g.player.power=1;g.hurt();assert(g.player.power===0&&g.player.invincible>1,'Damage should shrink Mario');g.hurt();assert(g.mode==='playing','Damage cooldown failed');report.damage=true
    reset();g.player.x=g.world.checkpoint+10;frames(1);assert(g.checkpoint,'Checkpoint not activated');g.player.y=700;frames(1);assert(g.mode==='dying','Fall did not kill Mario');frames(112);assert(g.lives===2&&g.player.x===g.checkpointSpawn.x,'Checkpoint respawn failed');report.checkpoint=true
    reset();const entry=g.world.warp;g.player.x=entry.x+26;g.player.y=entry.y-g.player.h;g.player.vy=0;g.player.grounded=true;down('ArrowDown');frames(1);assert(g.world.theme==='bonus','Secret room entry failed');up('ArrowDown');frames(61);const exit=g.world.exit;g.player.x=exit.x+26;g.player.y=exit.y-g.player.h;g.player.vy=0;g.player.grounded=true;down('ArrowDown');frames(1);up('ArrowDown');assert(g.world.theme==='meadow'&&!g.returnWorld,'Secret room return failed');report.secretRoom=true
    reset();const medal=g.world.pickups.find(p=>p.kind==='medal');g.player.x=medal.x;g.player.y=medal.y;frames(1);assert(g.medals===1&&!medal.active,'Star medal collection failed');g.coins=99;g.coin(100,100);assert(g.lives===4,'100-coin extra life failed');report.medalAndExtraLife=true
    g.start(3);g.screen('playing');const boss=g.world.enemies.find(e=>e.kind==='boss');g.player.x=boss.x-200;g.player.star=10;for(let i=0;i<8;i++){boss.hit=0;g.hitBoss(boss)}assert(g.bossWon&&!boss.alive,'Boss defeat failed');g.player.x=g.world.goal;frames(1);assert(g.mode==='clear','Castle completion failed');g.next();assert(g.mode==='win','Finale not reachable');report.bossAndEnding=true
    reset();g.pause();const x=g.player.x,time=g.clock;down('ArrowRight');frames(60);assert(g.player.x===x&&g.clock===time,'Pause should freeze game');up('ArrowRight');g.resume();assert(g.mode==='playing','Resume failed');report.pause=true
    return report
  } finally {
    if(saved===null)localStorage.removeItem('yumo.super-mario.v1');else localStorage.setItem('yumo.super-mario.v1',saved)
    g.input.clear();g.home()
  }
})()
