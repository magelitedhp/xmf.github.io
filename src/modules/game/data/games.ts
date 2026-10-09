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
    cover: 'games/ember-lantern/cover.svg',
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
  {
    slug: 'garden-guard',
    name: '花园保卫战',
    enName: 'Garden Guard',
    genre: '策略塔防',
    summary: '种下植物，守住草坪。12 关冒险、坚果保龄球与无尽生存。',
    description:
      '经典草坪塔防。收集阳光种下 15 种植物，抵御 10 种僵尸——路障、铁桶、撑杆、读报、铁栅门、橄榄球直至巨人与小鬼；12 关冒险之外还有坚果保龄球、传送带关卡与无尽生存。',
    cover: 'games/garden-guard/cover.svg',
    tags: ['塔防', '策略', '单文件'],
    released: '2026-10-09',
    controls: [
      { keys: ['鼠标'], label: '点击卡片再点击草地种植，也可直接拖拽；点击阳光收集' },
      { keys: ['1', '…', '8'], label: '快速选择种子卡片' },
      { keys: ['Q'], label: '铲子，移除植物' },
      { keys: ['F'], label: '切换 1× / 2× 速度' },
      { keys: ['空格', 'Esc'], label: '暂停 / 取消手中的植物' },
    ],
    notes: [
      '整款游戏编译为一个约 120 KB 的独立 HTML：画面全部由 Canvas 矢量实时绘制，音乐与音效由 WebAudio 合成，无任何外部素材。',
      '进度、植物收集与小游戏纪录保存在本地浏览器；设置中可一键解锁全部内容。',
    ],
    credit: {
      prefix: '玩法致敬',
      label: 'PopCap《植物大战僵尸》',
      href: 'https://www.ea.com/ea-studios/popcap/plants-vs-zombies',
      suffix: '；本作为非官方同人作品，美术、代码与音乐均为原创。',
    },
    load: () => import('../games/garden-guard/GardenGuard.vue'),
  },
  {
    slug: 'melon-fluid',
    name: '瓜体实验室',
    enName: 'Fluid Melon Lab',
    genre: '半流体物理解谜',
    summary: '让果实流动起来。改变材质、倾斜容器，在压力与黏性中完成融合。',
    description:
      '一款围绕“可变物性”设计的合成游戏。果实不再是坚硬圆球：它们会受压变形、黏滞流动并填入缝隙。切换果冻、半流体与果汁三种材质，利用倾斜和能量涡旋控制果池，合成最终的西瓜。',
    cover: 'games/melon-fluid/cover.svg',
    tags: ['物理', '合成', '半流体'],
    released: '2026-10-09',
    controls: [
      { keys: ['鼠标', '触屏'], label: '移动瞄准，点击投放果实' },
      { keys: ['A', 'D'], label: '向左 / 向右倾斜容器' },
      { keys: ['←', '→'], label: '键盘微调投放位置' },
      { keys: ['Enter'], label: '投放果实' },
      { keys: ['空格'], label: '消耗 30 能量搅动果池' },
    ],
    notes: [
      '三种材质拥有不同的重力、弹性、黏性与变形幅度；24 点弹性轮廓模拟局部受压，保持面积近似不变。融合会恢复能量。',
      '全部画面由 Canvas 实时绘制，声音由 WebAudio 合成，最佳分数保存在本地浏览器。',
    ],
    credit: {
      prefix: '概念与交互参考',
      label: '瓜体实验室 · 半流体西瓜游戏',
      href: 'https://melon-game.jack-514.chatgpt.site/',
      suffix: '；本站版本为独立原创实现，代码与视觉素材均未复制。',
    },
    load: () => import('../games/melon-fluid/MelonFluid.vue'),
  },
]

export const findGame = (slug: string) => games.find((g) => g.slug === slug)

export const coverUrl = (game: GameEntry) => `${import.meta.env.BASE_URL || './'}${game.cover}`
