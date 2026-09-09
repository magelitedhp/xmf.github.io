import type { RouteRecordRaw } from 'vue-router'

/** Music module route — lazy-loaded, isolated from site shell. */
export const musicRoutes: RouteRecordRaw[] = [
  {
    path: '/music',
    name: 'music',
    component: () => import('../../modules/music/MusicApp.vue'),
    meta: {
      title: 'Nocturne · 藏书电台',
      module: 'music',
    },
  },
]
