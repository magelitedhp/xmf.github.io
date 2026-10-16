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
        path: 'read',
        name: 'reader-library',
        component: () => import('../../modules/reader/ReaderLibraryPage.vue'),
        meta: { title: '阅读 · Yumo', module: 'reader' },
      },
      {
        path: 'read/book/:id',
        name: 'reader-book',
        component: () => import('../../modules/reader/BookDetailPage.vue'),
        meta: { title: '书籍详情 · Yumo', module: 'reader' },
      },
      {
        path: 'read/book/:id/chapter/:chapter',
        name: 'reader-chapter',
        component: () => import('../../modules/reader/ReaderChapterPage.vue'),
        meta: { title: '正在阅读 · Yumo', module: 'reader' },
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
