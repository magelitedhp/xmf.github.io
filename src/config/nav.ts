export interface SiteNavVariant {
  name: string
  to: string
  description: string
  /** Short badge shown on the left of the menu row. */
  tag: string
}

export interface SiteNavItem {
  name: string
  to: string
  description?: string
  /** When present, hovering the item reveals one entry per variant. */
  variants?: SiteNavVariant[]
}

/** Top-level site navigation. Music is one module among others. */
export const siteNav: SiteNavItem[] = [
  { name: '随笔', to: '/blog', description: '建站与技术记录' },
  {
    name: '音乐',
    to: '/music',
    description: '两个版本，任选其一',
    variants: [
      { name: '轻听 · Yumo FM', to: '/music', description: '发现、收藏与循环播放', tag: 'CLASSIC' },
      { name: '沉浸 · Yumo Music', to: '/lxmusic', description: '多音源搜索与沉浸歌词', tag: 'NEW' },
    ],
  },
  { name: '阅读', to: '/read', description: '搜书与阅读' },
  { name: '工具', to: '/tools', description: '灵感工作台' },
  { name: '实验', to: '/effects', description: '流动的画布' },
  { name: '游戏厅', to: '/games', description: '认真玩耍' },
]
