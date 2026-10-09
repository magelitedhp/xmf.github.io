import type { PeaKind } from '../art/items'
import type { PlantId } from '../data/plants'
import type { ArmorKind, ZombieDef, ZombieId } from '../data/zombies'

export interface Plant {
  uid: number
  id: PlantId
  row: number
  col: number
  x: number
  y: number
  hp: number
  maxHp: number
  age: number
  /** Generic countdown (shooting, sun production, fuse…). */
  timer: number
  /** Second-shot delay for repeaters. */
  timer2: number
  anim: number
  state: string
  stateT: number
  flash: number
  dead: boolean
  /** Squash jump / chomper target. */
  target: number
  fromX: number
  toX: number
  lookX: number
}

export type ZombieState = 'walk' | 'eat' | 'vault' | 'smash' | 'throw' | 'angry' | 'fly' | 'dying' | 'ash' | 'squashed' | 'mowed'

export interface Zombie {
  uid: number
  id: ZombieId
  def: ZombieDef
  row: number
  x: number
  y: number
  lift: number
  hp: number
  maxHp: number
  armor: number
  armorMax: number
  armorKind: ArmorKind | null
  speed: number
  state: ZombieState
  stateT: number
  phase: number
  deathT: number
  slow: number
  flash: number
  hasArm: boolean
  hasHead: boolean
  hasPole: boolean
  hasImp: boolean
  angry: boolean
  target: number
  biteT: number
  wave: number
  /** Fly / vault interpolation endpoints. */
  fromX: number
  toX: number
  remove: boolean
}

export interface Shot {
  kind: PeaKind
  row: number
  x: number
  y: number
  ty: number
  dmg: number
  torch: number
  t: number
  dead: boolean
}

export interface Lob {
  row: number
  x0: number
  y0: number
  target: number
  tx: number
  ty: number
  t: number
  dur: number
  dmg: number
  dead: boolean
}

export interface Sun {
  x: number
  y: number
  vx: number
  vy: number
  floor: number
  t: number
  life: number
  value: number
  state: 'fall' | 'pop' | 'idle' | 'collect'
  fromX: number
  fromY: number
  ct: number
  dead: boolean
}

export interface Mower {
  row: number
  x: number
  state: 'idle' | 'run' | 'gone'
  t: number
}

export type ParticleKind =
  | 'dot'
  | 'splat'
  | 'smoke'
  | 'fire'
  | 'boom'
  | 'text'
  | 'head'
  | 'arm'
  | 'armor'
  | 'leaf'
  | 'shock'
  | 'ice'

export interface Particle {
  kind: ParticleKind
  x: number
  y: number
  vx: number
  vy: number
  g: number
  floor: number
  life: number
  max: number
  size: number
  color: string
  rot: number
  vr: number
  text?: string
  zid?: ZombieId
  armorKind?: ArmorKind
}

export interface Bowl {
  id: PlantId
  row: number
  x: number
  y: number
  vy: number
  toRow: number
  rot: number
  hits: number
  hitIds: number[]
  dead: boolean
}

export interface BeltItem {
  id: PlantId
  x: number
}

export interface Message {
  text: string
  sub?: string
  t: number
  dur: number
  style: 'ready' | 'huge' | 'warn' | 'final' | 'info'
}
