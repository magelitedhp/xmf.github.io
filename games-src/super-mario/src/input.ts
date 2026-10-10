export type Action='left'|'right'|'down'|'jump'|'run'|'fire'|'pause'|'start'
const keys:Record<string,Action>={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowDown:'down',KeyS:'down',Space:'jump',KeyZ:'jump',KeyK:'jump',ArrowUp:'jump',KeyW:'jump',ShiftLeft:'run',ShiftRight:'run',KeyJ:'run',KeyX:'fire',Escape:'pause',KeyP:'pause',Enter:'start'}
export class Input {
  private keyboard=new Set<string>()
  private pointers=new Map<number,{action:Action;button:HTMLElement}>()
  private edges=new Set<Action>()
  private releases=new Set<Action>()
  constructor(public gesture:()=>void, public blur:()=>void){
    window.addEventListener('keydown',e=>{
      const a=keys[e.code];if(!a)return
      if(e.target instanceof HTMLElement && e.target.closest('button,a,input') && e.code!=='Escape')return
      e.preventDefault();if(e.repeat)return
      this.gesture();if(!this.down(a))this.edges.add(a);this.keyboard.add(e.code)
    })
    window.addEventListener('keyup',e=>{const a=keys[e.code];if(!a)return;this.keyboard.delete(e.code);if(!this.down(a))this.releases.add(a)})
    window.addEventListener('blur',()=>{this.clear();this.blur()})
    document.addEventListener('visibilitychange',()=>{if(document.hidden){this.clear();this.blur()}})
    for(const button of document.querySelectorAll<HTMLElement>('[data-key]')){
      button.addEventListener('pointerdown',e=>{e.preventDefault();this.gesture();const action=button.dataset.key as Action;if(!this.down(action))this.edges.add(action);this.pointers.set(e.pointerId,{action,button});button.classList.add('pressed');button.setPointerCapture(e.pointerId)})
      const release=(e:PointerEvent)=>{const p=this.pointers.get(e.pointerId);if(!p)return;this.pointers.delete(e.pointerId);if(![...this.pointers.values()].some(v=>v.button===p.button))p.button.classList.remove('pressed');if(!this.down(p.action))this.releases.add(p.action)}
      button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release)
      button.addEventListener('contextmenu',e=>e.preventDefault())
    }
  }
  down(action:Action){return [...this.keyboard].some(k=>keys[k]===action)||[...this.pointers.values()].some(p=>p.action===action)}
  pressed(action:Action){return this.edges.has(action)}
  released(action:Action){return this.releases.has(action)}
  end(){this.edges.clear();this.releases.clear()}
  clear(){this.keyboard.clear();for(const p of this.pointers.values())p.button.classList.remove('pressed');this.pointers.clear();this.end()}
}
