import type { RouteRecordRaw } from 'vue-router'

/** Full-screen routes for the immersive music experience. */
export const lxMusicRoutes: RouteRecordRaw[] = [
  {
    path: '/lxmusic',
    component: () => import('../../modules/lxmusic/LxMusicApp.vue'),
    meta: { title: 'Yumo Music · 音乐', module: 'lxmusic' },
    children: [
      { path: '', redirect: '/lxmusic/search' },
      {
        path: 'search',
        name: 'lxmusic-search',
        component: () => import('../../modules/lxmusic/views/SearchView.vue'),
        meta: { title: '搜索 · Yumo Music', module: 'lxmusic' },
      },
      {
        path: 'songList',
        name: 'lxmusic-songlist',
        component: () => import('../../modules/lxmusic/views/SongListView.vue'),
        meta: { title: '歌单 · Yumo Music', module: 'lxmusic' },
      },
      {
        path: 'songList/:id',
        name: 'lxmusic-songlist-detail',
        component: () => import('../../modules/lxmusic/views/SongListDetailView.vue'),
        meta: { title: '歌单详情 · Yumo Music', module: 'lxmusic' },
      },
      {
        path: 'leaderboard',
        name: 'lxmusic-leaderboard',
        component: () => import('../../modules/lxmusic/views/LeaderboardView.vue'),
        meta: { title: '排行榜 · Yumo Music', module: 'lxmusic' },
      },
      {
        path: 'leaderboard/:id',
        name: 'lxmusic-leaderboard-detail',
        component: () => import('../../modules/lxmusic/views/LeaderboardDetailView.vue'),
        meta: { title: '榜单详情 · Yumo Music', module: 'lxmusic' },
      },
      {
        path: 'list',
        name: 'lxmusic-list',
        component: () => import('../../modules/lxmusic/views/ListView.vue'),
        meta: { title: '我的列表 · Yumo Music', module: 'lxmusic' },
      },
      {
        path: 'download',
        name: 'lxmusic-download',
        component: () => import('../../modules/lxmusic/views/DownloadView.vue'),
        meta: { title: '下载 · Yumo Music', module: 'lxmusic' },
      },
      {
        path: 'setting',
        name: 'lxmusic-setting',
        component: () => import('../../modules/lxmusic/views/SettingView.vue'),
        meta: { title: '设置 · Yumo Music', module: 'lxmusic' },
      },
    ],
  },
]
