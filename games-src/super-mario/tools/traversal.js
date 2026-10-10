(() => {
  // Beam search uses the actual game update, with enemies removed, to verify
  // that each terrain layout can be traversed without teleporting the player.
  const g=__mario,saved=localStorage.getItem('yumo.super-mario.v1'),report=[]
  const original={down:g.input.down,pressed:g.input.pressed,released:g.input.released,burst:g.burst,sfx:g.sound.effect,toast:g.toast,score:g.addScore}
  let held=false,jumpEdge=false,releaseEdge=false,dir=1
  g.input.down=a=>a==='right'?dir===1:a==='left'?dir===-1:a==='run'?true:a==='jump'?held:false
  g.input.pressed=a=>a==='jump'&&jumpEdge;g.input.released=a=>a==='jump'&&releaseEdge
  g.burst=()=>{};g.sound.effect=()=>{};g.toast=()=>{};g.addScore=()=>{}
  const snapshot=(history='')=>({p:{...g.player},platforms:g.world.platforms.map(p=>({...p})),held,history})
  const restore=s=>{g.player={...s.p};g.world.platforms=s.platforms.map(p=>({...p}));g.mode='playing';g.clock=300;g.shots=[];g.particles=[];held=s.held;g.combo=0}
  try {
    for(let level=0;level<4;level++){
      g.start(level);g.screen('playing');g.world.enemies=[];g.world.pickups=[];g.bossWon=true;g.checkpoint=true
      for(let i=0;i<30;i++)g.update(1/60)
      let beam=[snapshot()],bestX=0,solution=null,maxBeam=110
      const visited=new Map()
      for(let iteration=0;iteration<1200&&!solution;iteration++){
        const next=[]
        for(const state of beam){
          for(const a of [0,1,2]){
            restore(state);const jump=a===1;dir=a===2?0:1;jumpEdge=jump&&!held;releaseEdge=!jump&&held;held=jump
            for(let tick=0;tick<6;tick++){
              g.update(1/60);jumpEdge=false;releaseEdge=false
              if(g.mode==='clear'){solution=state.history+a;break}
              if(g.mode!=='playing')break
            }
            if(solution)break
            if(g.mode!=='playing'||g.player.y>540)continue
            bestX=Math.max(bestX,g.player.x)
            const p=g.player,key=[Math.round(p.x/8),Math.round(p.y/8),Math.round(p.vx/45),Math.round(p.vy/65),held,p.grounded,level===2?iteration%70:0].join(',')
            if(visited.has(key)&&visited.get(key)<=iteration)continue
            visited.set(key,iteration)
            next.push(snapshot(state.history+a))
          }
          if(solution)break
        }
        next.sort((a,b)=>b.p.x-a.p.x+(a.p.y-b.p.y)*.12)
        beam=next.slice(0,maxBeam)
        if(!beam.length)break
      }
      report.push({level:level+1,reachable:!!solution,maxX:Math.round(bestX),goal:g.world.goal,actions:solution,visited:visited.size})
    }
    return report
  }finally{
    g.input.down=original.down;g.input.pressed=original.pressed;g.input.released=original.released;g.burst=original.burst;g.sound.effect=original.sfx;g.toast=original.toast;g.addScore=original.score
    if(saved===null)localStorage.removeItem('yumo.super-mario.v1');else localStorage.setItem('yumo.super-mario.v1',saved)
    g.home()
  }
})()
