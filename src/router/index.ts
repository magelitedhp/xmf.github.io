import { createRouter, createWebHashHistory } from 'vue-router'
import { lxMusicRoutes } from './routes/lxmusic'
import { musicRoutes } from './routes/music'
import { siteRoutes } from './routes/site'
import { recoverRouteChunk } from './chunkRecovery'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [...siteRoutes, ...musicRoutes, ...lxMusicRoutes],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.onError((error, to) => {
  if (!recoverRouteChunk(error, to.fullPath)) console.error(error)
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : 'Yumo'
  document.title = title
})

export default router
