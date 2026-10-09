import type { RouteRecordRaw } from 'vue-router'
import SiteLayout from '../../layouts/SiteLayout.vue'

/** Site pages share SiteLayout (nav + atmosphere + footer). */
export const siteRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: SiteLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('../../pages/HomePage.vue'),
        meta: { title: 'Yumo · 保持好奇', module: 'site' },
      },
      {
        path: 'blog',
        name: 'blog',
        component: () => import('../../modules/blog/BlogIndexPage.vue'),
        meta: { title: '随笔 · Yumo', module: 'blog' },
      },
      {
        path: 'blog/:slug',
        name: 'blog-post',
        component: () => import('../../modules/blog/BlogPostPage.vue'),
        meta: { title: '随笔 · Yumo', module: 'blog' },
      },
      {
        path: 'tools',
        name: 'tools',
        component: () => import('../../pages/ToolsPage.vue'),
        meta: { title: '灵感工作台 · Yumo', module: 'tools' },
      },
      {
        path: 'effects',
        name: 'effects',
        component: () => import('../../pages/EffectsPage.vue'),
        meta: { title: '流动现场 · Yumo', module: 'effects' },
      },
      {
        path: 'games',
        name: 'games',
        component: () => import('../../modules/game/GameIndexPage.vue'),
        meta: { title: '游戏厅 · Yumo', module: 'games' },
      },
      {
        path: 'games/:slug',
        name: 'game-play',
        component: () => import('../../modules/game/GameDetailPage.vue'),
        meta: { title: '游戏 · Yumo', module: 'games' },
      },
    ],
  },
]
