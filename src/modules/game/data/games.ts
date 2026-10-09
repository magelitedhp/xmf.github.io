import type { AsyncComponentLoader } from 'vue'

export interface GameControl {
  keys: string[]
  label: string
}

export interface GameCredit {
  prefix: string
  label: string
  href: string
  suffix: string
}

export interface GameEntry {
  slug: string
  name: string
  enName: string
  genre: string
  /** One line for the list card. */
  summary: string
  /** Paragraph for the detail page header. */
  description: string
  /** Path under `public/`, resolved against the Vite base. */
  cover: string
  tags: string[]
  released: string
  controls: GameControl[]
  notes: string[]
  credit?: GameCredit
  /** Lazily loaded game component; each game ships as its own chunk. */
  load: AsyncComponentLoader
}

export const games: GameEntry[] = [
  {
    slug: 'ember-lantern',
    name: '烬灯行',
    enName: 'Ember Lantern',
    genre: '像素横版动作肉鸽',
    summary: '十层长夜，一盏孤灯。三段连击、冲刺闪避，每层择一强化。',
    description:
      '像素横版动作肉鸽。十层长夜，三段连击、冲刺闪避，每层肃清后从三盏灯火中择一强化，第五层与第十层各有首领镇守。',
    cover: 'games/ember-lantern/cover.png',
    tags: ['动作', '肉鸽', '像素'],
    released: '2026-10-09',
    controls: [
      { keys: ['A', 'D'], label: '/ 方向键 移动' },
      { keys: ['K', '空格'], label: '跳跃，空中可再跳一次' },
      { keys: ['J'], label: '攻击，连按打出三段连击' },
      { keys: ['L', 'Shift'], label: '冲刺，冲刺期间无敌' },
      { keys: ['↓'], label: '+ 跳跃 落下平台' },
      { keys: ['Esc'], label: '暂停' },
    ],
    notes: ['全部画面由 Canvas 实时绘制，音效由 WebAudio 合成，无外部素材。', '最佳纪录保存在本地浏览器。手机端会显示触屏按键。'],
    credit: {
      prefix: '玩法风格致敬',
      label: '熵刃 · ENTROPY BLADE',
      href: 'https://game.inc.re/entropy-blade/',
      suffix: '的像素横版肉鸽手感；本作代码、美术与关卡均为原创实现。',
    },
    load: () => import('../games/ember-lantern/EmberLantern.vue'),
  },
]

export const findGame = (slug: string) => games.find((g) => g.slug === slug)

export const coverUrl = (game: GameEntry) => `${import.meta.env.BASE_URL || './'}${game.cover}`
