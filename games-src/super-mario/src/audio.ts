import type { Theme } from './types'
export class Sound {
  context?:AudioContext
  enabled=true
  private next=0
  private beat=0
  private master?:GainNode
  async unlock(){
    if(!this.enabled)return
    try{if(!this.context){this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=.3;this.master.connect(this.context.destination)}if(this.context.state==='suspended')await this.context.resume()}catch{/* Browsers without WebAudio can still play. */}
  }
  toggle(){this.enabled=!this.enabled;if(this.master&&this.context)this.master.gain.setTargetAtTime(this.enabled?.3:0,this.context.currentTime,.03);if(this.enabled)void this.unlock()}
  tone(note:number,time:number,duration=.12,type:OscillatorType='square',volume=.14,slide?:number){
    if(!this.enabled||!this.context||!this.master)return
    const osc=this.context.createOscillator(),gain=this.context.createGain(),f=440*2**((note-69)/12)
    osc.type=type;osc.frequency.setValueAtTime(f,time);if(slide)osc.frequency.exponentialRampToValueAtTime(440*2**((slide-69)/12),time+duration)
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.006);gain.gain.exponentialRampToValueAtTime(.001,time+duration)
    osc.connect(gain);gain.connect(this.master);osc.start(time);osc.stop(time+duration+.02)
  }
  effect(name:'jump'|'coin'|'bump'|'break'|'stomp'|'power'|'hurt'|'die'|'flag'|'fire'|'medal'|'checkpoint'|'win'){
    if(!this.context||!this.enabled)return
    const t=this.context.currentTime
    if(name==='jump')this.tone(56,t,.16,'square',.15,80)
    if(name==='coin'){this.tone(88,t,.07,'square',.12);this.tone(95,t+.055,.23,'sine',.32)}
    if(name==='bump')this.tone(44,t,.08,'triangle',.45,30)
    if(name==='break'){this.tone(43,t,.12,'sawtooth',.14,20);this.tone(67,t,.09,'triangle',.23,33)}
    if(name==='stomp')this.tone(61,t,.14,'square',.18,35)
    if(name==='power'||name==='checkpoint'||name==='medal'){[60,64,67,72,76,79].forEach((n,i)=>this.tone(n,t+i*.065,.14,'square',.13))}
    if(name==='hurt'){this.tone(78,t,.2,'sawtooth',.2,35)}
    if(name==='die'){[72,75,72,68,65,60,48].forEach((n,i)=>this.tone(n,t+i*.14,.18,'triangle',.4))}
    if(name==='fire')this.tone(66,t,.1,'sawtooth',.12,30)
    if(name==='flag'||name==='win'){[60,64,67,72,67,72,76,79,84].forEach((n,i)=>this.tone(n,t+i*.12,.22,'square',.16))}
  }
  update(playing:boolean,theme:Theme,star:boolean){
    if(!this.context||!this.enabled)return
    const now=this.context.currentTime
    if(!playing){this.next=now+.1;return}
    if(this.next<now-.2)this.next=now
    const step=star?.105:theme==='castle'?.18:theme==='cave'?.19:.16
    while(this.next<now+.1){
      const melody=[72,0,76,79,76,74,72,0,69,72,76,0,74,71,67,0,69,0,72,76,79,76,74,0,71,74,77,0,76,72,67,0]
      const minor=theme==='cave'||theme==='castle',transpose=minor?-3:star?12:0,root=[48,45,53,55][Math.floor(this.beat/8)%4]+transpose
      const n=melody[this.beat%melody.length]
      if(n)this.tone(n+transpose,this.next,step*.8,theme==='cave'?'sine':'triangle',.19)
      if(this.beat%2===0)this.tone(root+(this.beat%4===2?12:0),this.next,step*.8,'triangle',.2)
      if(this.beat%4===1)this.tone(root+19,this.next,.06,'square',.035)
      this.next+=step;this.beat++
    }
  }
}
