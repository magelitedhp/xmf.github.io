import type { PlantId } from './plants'
import type { ZombieId } from './zombies'

export type LevelMode = 'normal' | 'bowling' | 'conveyor' | 'endless'

export interface LevelDef {
  id: string
  name: string
  mode: LevelMode
  rows: number[]
  /** Total waves; Infinity for endless. */
  waves: number
  flags: number[]
  pool: ZombieId[]
  startSun: number
  skySun: boolean
  /** Wave budget multiplier. */
  diff: number
  firstWave: number
  reward: PlantId[]
  conveyor?: { id: PlantId; w: number }[]
  tip?: string
}

const ALL = [0, 1, 2, 3, 4]
const base = { mode: 'normal' as LevelMode, rows: ALL, startSun: 50, skySun: true, firstWave: 18 }

export const LEVELS: LevelDef[] = [
  {
    ...base,
    id: '1-1',
    name: '初次播种',
    rows: [2],
    waves: 4,
    flags: [4],
    pool: ['basic'],
    startSun: 150,
    diff: 0.8,
    firstWave: 22,
    reward: ['sunflower'],
    tip: '点击上方的豌豆射手卡片，再点击草地种下它。别忘了收集天上落下的阳光！',
  },
  {
    ...base,
    id: '1-2',
    name: '阳光经济',
    rows: [1, 2, 3],
    waves: 6,
    flags: [6],
    pool: ['basic'],
    diff: 0.9,
    reward: ['cherry'],
    tip: '向日葵会持续产出阳光。先种向日葵，再布置火力。',
  },
  {
    ...base,
    id: '1-3',
    name: '路障来袭',
    waves: 8,
    flags: [8],
    pool: ['basic', 'cone'],
    diff: 1,
    reward: ['wallnut'],
    tip: '樱桃炸弹能清理成群的僵尸，留到危急关头再用。',
  },
  {
    ...base,
    id: '1-4',
    name: '撑杆跳远',
    waves: 10,
    flags: [10],
    pool: ['basic', 'cone', 'pole'],
    diff: 1.05,
    reward: ['potato'],
    tip: '撑杆僵尸会跳过他遇到的第一株植物。用坚果墙当诱饵！',
  },
  {
    ...base,
    id: '1-5',
    name: '坚果保龄球',
    mode: 'bowling',
    waves: 8,
    flags: [4, 8],
    pool: ['basic', 'cone', 'pole', 'bucket'],
    skySun: false,
    startSun: 0,
    diff: 1.15,
    firstWave: 10,
    reward: ['snowpea'],
    conveyor: [
      { id: 'bowlnut', w: 8 },
      { id: 'bombnut', w: 1.6 },
      { id: 'giantnut', w: 0.7 },
    ],
    tip: '把坚果放在红线左侧，它们会滚向僵尸并斜向弹射。连续撞击更过瘾！',
  },
  {
    ...base,
    id: '1-6',
    name: '铁桶压境',
    waves: 12,
    flags: [6, 12],
    pool: ['basic', 'cone', 'pole', 'bucket'],
    diff: 1.05,
    reward: ['chomper'],
    tip: '寒冰射手能让整行僵尸慢下来，为火力争取时间。',
  },
  {
    ...base,
    id: '1-7',
    name: '晨报时间',
    waves: 12,
    flags: [6, 12],
    pool: ['basic', 'cone', 'pole', 'bucket', 'paper'],
    diff: 1.12,
    reward: ['repeater', 'squash'],
    tip: '大嘴花可以一口吞掉铁桶僵尸，但咀嚼时很脆弱。',
  },
  {
    ...base,
    id: '1-8',
    name: '铁门之后',
    waves: 14,
    flags: [7, 14],
    pool: ['basic', 'cone', 'pole', 'bucket', 'paper', 'door'],
    diff: 1.2,
    reward: ['spikeweed', 'cabbage'],
    tip: '铁栅门挡得住豌豆，挡不住爆炸和窝瓜。',
  },
  {
    ...base,
    id: '1-9',
    name: '冲锋陷阵',
    waves: 15,
    flags: [5, 10, 15],
    pool: ['basic', 'cone', 'pole', 'bucket', 'paper', 'door', 'football'],
    diff: 1.28,
    reward: ['jalapeno', 'torchwood'],
    tip: '卷心菜投手能越过铁栅门；地刺让僵尸边走边掉血。',
  },
  {
    ...base,
    id: '1-10',
    name: '传送带狂欢',
    mode: 'conveyor',
    waves: 15,
    flags: [5, 10, 15],
    pool: ['basic', 'cone', 'pole', 'bucket', 'paper', 'door', 'football'],
    skySun: false,
    startSun: 0,
    diff: 1.55,
    firstWave: 14,
    reward: ['tallnut', 'threepeater'],
    conveyor: [
      { id: 'repeater', w: 3 },
      { id: 'peashooter', w: 2 },
      { id: 'snowpea', w: 1.6 },
      { id: 'wallnut', w: 1.8 },
      { id: 'torchwood', w: 0.9 },
      { id: 'cherry', w: 0.9 },
      { id: 'jalapeno', w: 0.7 },
      { id: 'chomper', w: 0.9 },
      { id: 'squash', w: 0.9 },
      { id: 'spikeweed', w: 0.9 },
    ],
    tip: '植物由传送带免费送达，不需要阳光。别让传送带堆满！',
  },
  {
    ...base,
    id: '1-11',
    name: '巨人脚步',
    waves: 18,
    flags: [6, 12, 18],
    pool: ['basic', 'cone', 'pole', 'bucket', 'paper', 'door', 'football', 'garg'],
    diff: 1.42,
    reward: [],
    tip: '巨人僵尸能一击砸烂任何植物，用樱桃炸弹和火爆辣椒集中处理。',
  },
  {
    ...base,
    id: '1-12',
    name: '最终守卫',
    waves: 20,
    flags: [5, 10, 15, 20],
    pool: ['basic', 'cone', 'pole', 'bucket', 'paper', 'door', 'football', 'garg'],
    diff: 1.58,
    reward: [],
    tip: '最后一关。房子就在身后，守住它！',
  },
]

export const ENDLESS: LevelDef = {
  ...base,
  id: '无尽',
  name: '无尽生存',
  mode: 'endless',
  waves: Infinity,
  flags: [],
  pool: ['basic', 'cone', 'pole', 'paper', 'bucket', 'door', 'football', 'garg'],
  diff: 1.4,
  firstWave: 20,
  reward: [],
  tip: '僵尸会一波接一波永不停歇，你能坚持多少面旗帜？',
}

export const BOWLING: LevelDef = {
  ...LEVELS[4],
  id: '保龄',
  name: '坚果保龄球 · 挑战',
  waves: 20,
  flags: [5, 10, 15, 20],
  pool: ['basic', 'cone', 'pole', 'bucket', 'paper', 'door', 'football'],
  diff: 1.6,
  reward: [],
  tip: '更长、更硬的保龄球挑战。看看你能打出多少连击！',
}
