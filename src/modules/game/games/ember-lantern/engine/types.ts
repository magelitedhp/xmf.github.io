export type EnemyKind = 'slime' | 'bat' | 'archer' | 'brute' | 'wisp' | 'warden' | 'frost'

export interface Body {
  x: number
  y: number
  w: number
  h: number
  vx: number
  vy: number
  onGround: boolean
}

export interface Stats {
  damage: number
  critChance: number
  critMult: number
  attackSpeed: number
  moveSpeed: number
  maxJumps: number
  dashCdMult: number
  dashDamage: number
  slashWave: number
  thorns: number
  killHeal: number
  emberBurst: number
  armor: number
}

export const baseStats = (): Stats => ({
  damage: 1,
  critChance: 0.05,
  critMult: 1.8,
  attackSpeed: 1,
  moveSpeed: 1,
  maxJumps: 2,
  dashCdMult: 1,
  dashDamage: 0,
  slashWave: 0,
  thorns: 0,
  killHeal: 0,
  emberBurst: 0,
  armor: 0,
})

export interface Player extends Body {
  face: 1 | -1
  hp: number
  maxHp: number
  jumps: number
  invuln: number
  hurtT: number
  attackT: number
  attackDur: number
  combo: number
  comboWindow: number
  attackCd: number
  hitIds: Set<number>
  dashT: number
  dashCd: number
  dashHitIds: Set<number>
  jumpBuffer: number
  coyote: number
  dropT: number
  stats: Stats
}

export interface Enemy extends Body {
  id: number
  kind: EnemyKind
  hp: number
  maxHp: number
  dmg: number
  face: 1 | -1
  state: string
  stateT: number
  t: number
  hurtT: number
  flying: boolean
  boss: boolean
  weight: number
  dead: boolean
  phase: number
  aux: number
  tx: number
  ty: number
}

export type ProjectileKind = 'orb' | 'arrow' | 'shock' | 'icicle' | 'slash'

export interface Projectile {
  kind: ProjectileKind
  x: number
  y: number
  w: number
  h: number
  vx: number
  vy: number
  gravity: number
  dmg: number
  life: number
  delay: number
  friendly: boolean
  pierce: boolean
  color: string
  hitIds: Set<number>
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  color: string
  size: number
  gravity: number
}

export interface FloatText {
  x: number
  y: number
  text: string
  color: string
  life: number
  big: boolean
}

export interface Pickup {
  x: number
  y: number
  vx: number
  vy: number
  t: number
}

export interface SpawnMark {
  kind: EnemyKind
  x: number
  bottom: number
  t: number
  max: number
}

export interface Decor {
  far: { x: number; w: number; h: number }[]
  near: { x: number; w: number; h: number }[]
  lanterns: { x: number; y: number; len: number }[]
  stars: { x: number; y: number; p: number }[]
}

export interface RunStats {
  kills: number
  damage: number
  time: number
  maxCombo: number
}
