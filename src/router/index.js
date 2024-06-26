import { createRouter,createWebHashHistory } from 'vue-router'

//前端页面路由地址
const routes = [
  // {path: '/404', component: () => import('@/views/404')},
  //必须要把组件放在Layout的children里面,才能在侧边栏的右侧显示页面内容,否则不加载通用架构直接在当前空白页面渲染内容,如:404页面
  {
    path: '/',
    component: () => import('@v/index.vue'),
  },
  {
    path: '/count',
    component: () => import('@c/count/index.vue'),
  },
  {
    path: '/tempIcon',
    component: () => import('@v/tempIcon.vue'),
  },
  // 测试瀑布流
  {
    path: '/waterfall',
    component: () => import('@c/waterfallFlow/index.vue'),
  },
]

// 3. 创建路由实例并传递 `routes` 配置
const router = createRouter({
  // 4. 内部提供了 history 模式的实现。为了简单起见，我们在这里使用 hash 模式。
  history: createWebHashHistory(),
  routes, // `routes: routes` 的缩写
})

//路由前置守卫
router.beforeEach((to, from, next) => {
  //路由发生变化修改页面title
  if (to.meta.title) {
    document.title = to.meta.title
  }
  next()
})

//导出路由
export default router