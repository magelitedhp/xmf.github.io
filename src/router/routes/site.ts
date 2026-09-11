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
        meta: { title: 'Nocturne · 夜航书斋', module: 'site' },
      },
      {
        path: 'blog',
        name: 'blog',
        component: () => import('../../modules/blog/BlogIndexPage.vue'),
        meta: { title: '夜航随笔 · Nocturne', module: 'blog' },
      },
      {
        path: 'blog/:slug',
        name: 'blog-post',
        component: () => import('../../modules/blog/BlogPostPage.vue'),
        meta: { title: '随笔 · Nocturne', module: 'blog' },
      },
      {
        path: 'tools',
        name: 'tools',
        component: () => import('../../pages/ToolsPage.vue'),
        meta: { title: 'Nocturne · AI 工具', module: 'tools' },
      },
      {
        path: 'effects',
        name: 'effects',
        component: () => import('../../pages/EffectsPage.vue'),
        meta: { title: 'Nocturne · 动画效果', module: 'effects' },
      },
    ],
  },
]
