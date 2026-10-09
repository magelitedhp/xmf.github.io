export interface SiteNavItem {
  name: string
  to: string
  description?: string
}

/** Top-level site navigation. Music is one module among others. */
export const siteNav: SiteNavItem[] = [
  { name: '随笔', to: '/blog', description: '建站与技术记录' },
  { name: '音乐', to: '/music', description: 'Yumo FM' },
  { name: '工具', to: '/tools', description: '灵感工作台' },
  { name: '实验', to: '/effects', description: '流动的画布' },
  { name: '游戏厅', to: '/games', description: '认真玩耍' },
]
