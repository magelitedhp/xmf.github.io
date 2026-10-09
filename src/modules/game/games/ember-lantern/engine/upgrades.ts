import type { Player } from './types'

export type Rarity = 'common' | 'rare' | 'epic'

export interface Upgrade {
  id: string
  name: string
  rarity: Rarity
  max: number
  desc: string
  apply: (p: Player) => void
}

export const RARITY_LABEL: Record<Rarity, string> = { common: '寻常', rare: '稀有', epic: '传说' }
export const RARITY_COLOR: Record<Rarity, string> = { common: '#c9d2e3', rare: '#7fc8ff', epic: '#f2c66d' }
const RARITY_WEIGHT: Record<Rarity, number> = { common: 10, rare: 5, epic: 2 }

export const UPGRADES: Upgrade[] = [
  { id: 'edge', name: '锋刃', rarity: 'common', max: 5, desc: '攻击伤害 +20%', apply: (p) => { p.stats.damage += 0.2 } },
  { id: 'heart', name: '裂心', rarity: 'common', max: 4, desc: '暴击率 +10%', apply: (p) => { p.stats.critChance += 0.1 } },
  { id: 'swift', name: '迅击', rarity: 'common', max: 4, desc: '攻击速度 +18%', apply: (p) => { p.stats.attackSpeed += 0.18 } },
  {
    id: 'wind',
    name: '疾风步',
    rarity: 'common',
    max: 3,
    desc: '移动速度 +12%，冲刺冷却 -20%',
    apply: (p) => {
      p.stats.moveSpeed += 0.12
      p.stats.dashCdMult *= 0.8
    },
  },
  {
    id: 'iron',
    name: '铁骨',
    rarity: 'common',
    max: 5,
    desc: '最大生命 +25，并回复 25 生命',
    apply: (p) => {
      p.maxHp += 25
      p.hp = Math.min(p.maxHp, p.hp + 25)
    },
  },
  {
    id: 'wick',
    name: '续芯',
    rarity: 'common',
    max: 99,
    desc: '立刻回复 45% 最大生命',
    apply: (p) => { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.45) },
  },
  { id: 'execute', name: '断念', rarity: 'rare', max: 3, desc: '暴击伤害 +50%', apply: (p) => { p.stats.critMult += 0.5 } },
  { id: 'crane', name: '鹤影', rarity: 'rare', max: 1, desc: '获得第三段跳跃', apply: (p) => { p.stats.maxJumps += 1 } },
  { id: 'phantom', name: '影袭', rarity: 'rare', max: 3, desc: '冲刺穿过敌人时造成 18 点伤害', apply: (p) => { p.stats.dashDamage += 18 } },
  { id: 'drink', name: '饮烬', rarity: 'rare', max: 3, desc: '每击杀一名敌人回复 3 生命', apply: (p) => { p.stats.killHeal += 3 } },
  { id: 'thorn', name: '荆棘甲', rarity: 'rare', max: 3, desc: '受击时对周围敌人造成 30 点伤害', apply: (p) => { p.stats.thorns += 30 } },
  {
    id: 'ward',
    name: '护符',
    rarity: 'rare',
    max: 3,
    desc: '受到的伤害 -12%',
    apply: (p) => { p.stats.armor = Math.min(0.6, p.stats.armor + 0.12) },
  },
  {
    id: 'wave',
    name: '剑气',
    rarity: 'epic',
    max: 3,
    desc: '三段连击的最后一击斩出穿透剑气，叠加提升伤害',
    apply: (p) => { p.stats.slashWave += 1 },
  },
  {
    id: 'burst',
    name: '余烬爆',
    rarity: 'epic',
    max: 3,
    desc: '敌人死亡时爆裂，波及周围敌人',
    apply: (p) => { p.stats.emberBurst += 1 },
  },
]

export function rollUpgrades(taken: Record<string, number>, count = 3, favorEpic = false): Upgrade[] {
  const pool = UPGRADES.filter((u) => (taken[u.id] ?? 0) < u.max)
  const result: Upgrade[] = []
  while (result.length < count && pool.length) {
    const weights = pool.map((u) => RARITY_WEIGHT[u.rarity] * (favorEpic && u.rarity !== 'common' ? 3 : 1))
    const total = weights.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    let idx = 0
    for (; idx < pool.length; idx++) {
      r -= weights[idx]
      if (r <= 0) break
    }
    idx = Math.min(idx, pool.length - 1)
    result.push(pool[idx])
    pool.splice(idx, 1)
  }
  return result
}
