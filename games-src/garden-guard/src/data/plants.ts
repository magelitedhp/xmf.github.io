export type PlantId =
  | 'peashooter'
  | 'sunflower'
  | 'cherry'
  | 'wallnut'
  | 'potato'
  | 'snowpea'
  | 'chomper'
  | 'repeater'
  | 'squash'
  | 'spikeweed'
  | 'cabbage'
  | 'jalapeno'
  | 'torchwood'
  | 'tallnut'
  | 'threepeater'
  | 'bowlnut'
  | 'bombnut'
  | 'giantnut'

export interface PlantDef {
  id: PlantId
  name: string
  cost: number
  cooldown: number
  hp: number
  desc: string
  stats: string[]
  /** Zombies walk over it instead of eating it. */
  walkable?: boolean
  /** Only appears on the bowling conveyor. */
  bowling?: boolean
  /** Scale used when drawn inside a seed packet. */
  icon: number
  iconY: number
}

const P = (d: PlantDef) => d

export const PLANTS: Record<PlantId, PlantDef> = {
  peashooter: P({
    id: 'peashooter',
    name: '豌豆射手',
    cost: 100,
    cooldown: 7.5,
    hp: 300,
    desc: '向前方持续发射豌豆。\n它从不抱怨，只是一颗接一颗地射。',
    stats: ['伤害：中等', '射速：每 1.4 秒一发'],
    icon: 0.5,
    iconY: 6,
  }),
  sunflower: P({
    id: 'sunflower',
    name: '向日葵',
    cost: 50,
    cooldown: 7.5,
    hp: 300,
    desc: '定期产出额外的阳光。\n花园经济的根基，开局请多种几株。',
    stats: ['产出：每 24 秒 25 阳光'],
    icon: 0.5,
    iconY: 6,
  }),
  cherry: P({
    id: 'cherry',
    name: '樱桃炸弹',
    cost: 150,
    cooldown: 50,
    hp: 300,
    desc: '种下后片刻便会爆炸，\n炸毁周围 3×3 格内的所有僵尸。',
    stats: ['伤害：巨大', '范围：3×3', '使用：一次性'],
    icon: 0.55,
    iconY: 2,
  }),
  wallnut: P({
    id: 'wallnut',
    name: '坚果墙',
    cost: 50,
    cooldown: 30,
    hp: 4000,
    desc: '坚硬的外壳能长时间拖住僵尸。\n受损后会露出越来越担忧的表情。',
    stats: ['耐久：高'],
    icon: 0.55,
    iconY: 4,
  }),
  potato: P({
    id: 'potato',
    name: '土豆地雷',
    cost: 25,
    cooldown: 30,
    hp: 300,
    desc: '需要约 15 秒钻出地面完成武装，\n之后第一个踩上来的僵尸会被炸飞。',
    stats: ['伤害：巨大', '准备：15 秒', '使用：一次性'],
    icon: 0.6,
    iconY: -4,
  }),
  snowpea: P({
    id: 'snowpea',
    name: '寒冰射手',
    cost: 175,
    cooldown: 7.5,
    hp: 300,
    desc: '发射冰冻豌豆，\n命中的僵尸移动与啃咬速度减半。',
    stats: ['伤害：中等', '效果：减速 10 秒'],
    icon: 0.5,
    iconY: 6,
  }),
  chomper: P({
    id: 'chomper',
    name: '大嘴花',
    cost: 150,
    cooldown: 7.5,
    hp: 300,
    desc: '一口吞下面前的僵尸，\n但咀嚼需要很久，这期间毫无防备。',
    stats: ['伤害：吞噬', '咀嚼：42 秒', '无法吞下巨人'],
    icon: 0.44,
    iconY: 10,
  }),
  repeater: P({
    id: 'repeater',
    name: '双发射手',
    cost: 200,
    cooldown: 7.5,
    hp: 300,
    desc: '每次连续发射两颗豌豆。\n眉头紧锁，火力翻倍。',
    stats: ['伤害：中等 ×2', '射速：每 1.4 秒两发'],
    icon: 0.5,
    iconY: 6,
  }),
  squash: P({
    id: 'squash',
    name: '窝瓜',
    cost: 50,
    cooldown: 30,
    hp: 300,
    desc: '僵尸靠近时跳起来狠狠压扁它。\n性格暴躁，一次性。',
    stats: ['伤害：巨大', '范围：附近一格', '使用：一次性'],
    icon: 0.5,
    iconY: 4,
  }),
  spikeweed: P({
    id: 'spikeweed',
    name: '地刺',
    cost: 100,
    cooldown: 7.5,
    hp: 300,
    desc: '刺伤从上面走过的僵尸。\n僵尸不会啃它，但巨人能把它踩扁。',
    stats: ['伤害：普通', '每秒一次', '无法被啃食'],
    walkable: true,
    icon: 0.62,
    iconY: -8,
  }),
  cabbage: P({
    id: 'cabbage',
    name: '卷心菜投手',
    cost: 100,
    cooldown: 7.5,
    hp: 300,
    desc: '把卷心菜抛向僵尸。\n抛物线能越过铁栅门直接命中。',
    stats: ['伤害：中等 ×2', '投掷：每 3 秒', '无视铁栅门'],
    icon: 0.5,
    iconY: 4,
  }),
  jalapeno: P({
    id: 'jalapeno',
    name: '火爆辣椒',
    cost: 125,
    cooldown: 50,
    hp: 300,
    desc: '点燃整整一行，\n把这一行的僵尸统统烧成灰。',
    stats: ['伤害：巨大', '范围：整行', '使用：一次性'],
    icon: 0.5,
    iconY: 6,
  }),
  torchwood: P({
    id: 'torchwood',
    name: '火炬树桩',
    cost: 175,
    cooldown: 7.5,
    hp: 300,
    desc: '穿过它的豌豆会燃烧，伤害翻倍并溅射。\n冰豌豆穿过会被融化成普通豌豆。',
    stats: ['效果：豌豆伤害 ×2', '附带溅射'],
    icon: 0.5,
    iconY: 6,
  }),
  tallnut: P({
    id: 'tallnut',
    name: '高坚果',
    cost: 125,
    cooldown: 30,
    hp: 8000,
    desc: '比坚果墙更高更硬，\n撑杆僵尸也跳不过去。',
    stats: ['耐久：极高', '阻挡撑杆跳'],
    icon: 0.4,
    iconY: 12,
  }),
  threepeater: P({
    id: 'threepeater',
    name: '三线射手',
    cost: 325,
    cooldown: 7.5,
    hp: 300,
    desc: '同时向三行发射豌豆。\n三个脑袋，一个目标。',
    stats: ['伤害：中等', '射击：三行'],
    icon: 0.44,
    iconY: 12,
  }),
  bowlnut: P({
    id: 'bowlnut',
    name: '保龄坚果',
    cost: 0,
    cooldown: 0,
    hp: 4000,
    desc: '滚出去撞击僵尸，然后斜着弹向相邻一行。\n连续撞击越多越爽快。',
    stats: ['撞击伤害：900', '可连续弹射'],
    bowling: true,
    icon: 0.55,
    iconY: 4,
  }),
  bombnut: P({
    id: 'bombnut',
    name: '爆炸坚果',
    cost: 0,
    cooldown: 0,
    hp: 4000,
    desc: '撞到第一个僵尸时爆炸，\n威力等同樱桃炸弹。',
    stats: ['伤害：巨大', '范围：3×3'],
    bowling: true,
    icon: 0.55,
    iconY: 4,
  }),
  giantnut: P({
    id: 'giantnut',
    name: '巨型坚果',
    cost: 0,
    cooldown: 0,
    hp: 4000,
    desc: '体型巨大，一路碾压整行的僵尸，\n不会弹开。',
    stats: ['碾压伤害：3000', '贯穿整行'],
    bowling: true,
    icon: 0.3,
    iconY: 14,
  }),
}

/** Almanac / seed chooser order. */
export const PLANT_ORDER: PlantId[] = [
  'peashooter',
  'sunflower',
  'cherry',
  'wallnut',
  'potato',
  'snowpea',
  'chomper',
  'repeater',
  'squash',
  'spikeweed',
  'cabbage',
  'jalapeno',
  'torchwood',
  'tallnut',
  'threepeater',
]

export const ALL_PLANTS: PlantId[] = [...PLANT_ORDER]
