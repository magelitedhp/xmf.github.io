export const TILE = 40, WIDTH = 960, HEIGHT = 540
export type Theme = 'meadow' | 'cave' | 'sky' | 'castle' | 'bonus'
export type BlockKind = 'ground' | 'brick' | 'question' | 'used' | 'stone' | 'pipe' | 'bridge'
export type ItemKind = 'coin' | 'mushroom' | 'flower' | 'star' | 'life'
export interface Rect { x:number; y:number; w:number; h:number }
export interface Block extends Rect { kind:BlockKind; content?:ItemKind; bump:number; broken:boolean; pipeTop?:boolean }
export interface Pickup extends Rect { kind:ItemKind | 'medal'; vx:number; vy:number; active:boolean; emerge:number; id:number; baseY:number }
export interface Enemy extends Rect { kind:'goomba'|'turtle'|'shell'|'plant'|'boss'; vx:number; vy:number; alive:boolean; grounded:boolean; phase:number; hit:number; homeX:number; homeY:number; hp:number }
export interface Platform extends Rect { homeX:number; homeY:number; axis:'x'|'y'; range:number; speed:number; phase:number; dx:number; dy:number }
export interface Particle { x:number;y:number;vx:number;vy:number;life:number;max:number;size:number;color:string;gravity:number; text?:string }
export interface Projectile extends Rect { vx:number;vy:number;life:number;hostile:boolean }
export interface Player extends Rect { vx:number;vy:number;facing:number;grounded:boolean;coyote:number;buffer:number;power:0|1|2;invincible:number;star:number;fireCooldown:number;walk:number;dead:number;duck:boolean }
export interface World {
  theme:Theme;name:string;subtitle:string;index:number;width:number;blocks:Block[];enemies:Enemy[];pickups:Pickup[];platforms:Platform[];
  spawn:{x:number;y:number};goal:number;checkpoint:number;checkpointY:number;warp?:{x:number;y:number};exit?:{x:number;y:number};bossGate?:number;
}
export const overlap = (a:Rect,b:Rect) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y
export const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v))
export const approach=(v:number,t:number,d:number)=>v<t?Math.min(t,v+d):Math.max(t,v-d)
