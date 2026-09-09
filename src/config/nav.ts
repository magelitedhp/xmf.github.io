export interface SiteNavItem {
  name: string
  to: string
  description?: string
}

/** Top-level site navigation. Music is one module among others. */
export const siteNav: SiteNavItem[] = [
  { name: '音乐', to: '/music', description: '藏书电台' },
  { name: 'AI工具', to: '/tools', description: '工具柜' },
  { name: '动画效果', to: '/effects', description: '水墨流体' },
]
