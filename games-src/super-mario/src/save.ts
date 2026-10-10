export interface Save {unlocked:number;best:number;medals:number[];sound:boolean;clears:number[]}
const key='yumo.super-mario.v1'
export function readSave():Save{
  const base:Save={unlocked:0,best:0,medals:[0,0,0,0],sound:true,clears:[0,0,0,0]}
  try{
    const s=JSON.parse(localStorage.getItem(key)||'null')
    if(!s||typeof s!=='object')return base
    if(Number.isInteger(s.unlocked))base.unlocked=Math.max(0,Math.min(3,s.unlocked))
    if(Number.isFinite(s.best))base.best=Math.max(0,Math.floor(s.best))
    if(typeof s.sound==='boolean')base.sound=s.sound
    for(let i=0;i<4;i++){if(Number.isInteger(s.medals?.[i]))base.medals[i]=s.medals[i]&7;if(Number.isFinite(s.clears?.[i]))base.clears[i]=Math.max(0,s.clears[i])}
  }catch{/* file:// and privacy modes may block storage. */}return base
}
export function writeSave(s:Save){try{localStorage.setItem(key,JSON.stringify(s))}catch{/* A full or disabled local store does not interrupt a run. */}}
