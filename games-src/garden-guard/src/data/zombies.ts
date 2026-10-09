export type ZombieId = 'basic' | 'flag' | 'cone' | 'pole' | 'bucket' | 'paper' | 'door' | 'football' | 'garg' | 'imp'
export type ArmorKind = 'cone' | 'bucket' | 'paper' | 'door' | 'helmet'

export interface ZombieDef {
  id: ZombieId
  name: string
  hp: number
  armor: number
  armorKind: ArmorKind | null
  /** Walking speed in px/s (one lawn cell is 98px). */
  speed: number
  /** Damage per second while eating. */
  eat: number
  /** Wave budget cost. */
  cost: number
  /** Spawn weight once available. */
  weight: number
  /** Fraction of a level's waves that must pass before it shows up. */
  from: number
  desc: string
  toughness: string
}

const Z = (d: ZombieDef) => d

export const ZOMBIES: Record<ZombieId, ZombieDef> = {
  basic: Z({
    id: 'basic',
    name: '普通僵尸',
    hp: 200,
    armor: 0,
    armorKind: null,
    speed: 17,
    eat: 100,
    cost: 1,
    weight: 5,
    from: 0,
    desc: '标准的僵尸。\n脚步拖沓，但从不停下。',
    toughness: '韧性：低',
  }),
  flag: Z({
    id: 'flag',
    name: '旗帜僵尸',
    hp: 200,
    armor: 0,
    armorKind: null,
    speed: 24,
    eat: 100,
    cost: 1,
    weight: 0,
    from: 0,
    desc: '高举旗帜，宣告一大波僵尸的到来。',
    toughness: '韧性：低 · 速度：较快',
  }),
  cone: Z({
    id: 'cone',
    name: '路障僵尸',
    hp: 200,
    armor: 370,
    armorKind: 'cone',
    speed: 17,
    eat: 100,
    cost: 2,
    weight: 4,
    from: 0.1,
    desc: '头顶交通路障，\n比普通僵尸耐打两倍多。',
    toughness: '韧性：中',
  }),
  pole: Z({
    id: 'pole',
    name: '撑杆僵尸',
    hp: 340,
    armor: 0,
    armorKind: null,
    speed: 38,
    eat: 100,
    cost: 2,
    weight: 2.4,
    from: 0.2,
    desc: '飞快地跑来，撑杆跳过遇到的第一株植物。\n高坚果能让他撞个正着。',
    toughness: '韧性：中 · 速度：快（跳跃前）',
  }),
  bucket: Z({
    id: 'bucket',
    name: '铁桶僵尸',
    hp: 200,
    armor: 1100,
    armorKind: 'bucket',
    speed: 17,
    eat: 100,
    cost: 4,
    weight: 2,
    from: 0.3,
    desc: '铁桶让他异常耐打。\n试试大嘴花，或者干脆炸掉。',
    toughness: '韧性：高',
  }),
  paper: Z({
    id: 'paper',
    name: '读报僵尸',
    hp: 200,
    armor: 150,
    armorKind: 'paper',
    speed: 17,
    eat: 100,
    cost: 2,
    weight: 2.4,
    from: 0.2,
    desc: '报纸被打烂后会勃然大怒，\n速度暴涨。',
    toughness: '韧性：中 · 失去报纸后速度：快',
  }),
  door: Z({
    id: 'door',
    name: '铁栅门僵尸',
    hp: 200,
    armor: 1100,
    armorKind: 'door',
    speed: 17,
    eat: 100,
    cost: 4,
    weight: 1.6,
    from: 0.35,
    desc: '铁栅门挡住正面的豌豆。\n抛物线攻击和地刺能绕过它。',
    toughness: '韧性：高（仅正面）',
  }),
  football: Z({
    id: 'football',
    name: '橄榄球僵尸',
    hp: 200,
    armor: 1400,
    armorKind: 'helmet',
    speed: 34,
    eat: 100,
    cost: 6,
    weight: 1.3,
    from: 0.45,
    desc: '全副护具，横冲直撞。\n又快又硬，务必优先处理。',
    toughness: '韧性：很高 · 速度：快',
  }),
  garg: Z({
    id: 'garg',
    name: '巨人僵尸',
    hp: 3000,
    armor: 0,
    armorKind: null,
    speed: 12,
    eat: 0,
    cost: 10,
    weight: 0.8,
    from: 0.6,
    desc: '用电线杆一击砸烂任何植物。\n血量减半时会把背上的小鬼扔进你的防线。',
    toughness: '韧性：极高 · 砸击：秒杀植物',
  }),
  imp: Z({
    id: 'imp',
    name: '小鬼僵尸',
    hp: 200,
    armor: 0,
    armorKind: null,
    speed: 28,
    eat: 100,
    cost: 1,
    weight: 0,
    from: 1,
    desc: '被巨人扔出来的小家伙，\n落地后飞快地冲向你的房子。',
    toughness: '韧性：低 · 速度：快',
  }),
}

export const ZOMBIE_ORDER: ZombieId[] = ['basic', 'flag', 'cone', 'pole', 'paper', 'bucket', 'door', 'football', 'garg', 'imp']
