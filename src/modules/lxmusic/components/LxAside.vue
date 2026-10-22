<template>
  <aside class="lx-aside">
    <div class="lx-aside-logo" aria-hidden="true">
      <span class="lx-aside-logo-mark">Y</span>
      <span class="lx-aside-logo-copy"><b>Yumo Music</b><small>在线音乐</small></span>
    </div>
    <nav class="lx-aside-nav" aria-label="Yumo Music 导航">
      <RouterLink
        v-for="item in menus"
        :key="item.to"
        class="lx-nav-item"
        :class="{ 'is-active': isActive(item) }"
        :to="item.to"
        :aria-label="item.label"
        :title="item.label"
      >
        <LxIcon :name="item.icon" />
        <span class="lx-nav-label">{{ item.label }}</span>
        <i v-if="item.badge" class="lx-nav-badge">{{ item.badge }}</i>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import LxIcon from './LxIcon.vue'
import { appSetting } from '../core/settings'
import { runningCount, waitingCount } from '../core/download'

const route = useRoute()

const menus = computed(() => {
  const pending = runningCount.value + waitingCount.value
  return [
    { to: '/lxmusic/search', label: '搜索', icon: 'search', match: '/lxmusic/search' },
    { to: '/lxmusic/songList', label: '歌单', icon: 'album', match: '/lxmusic/songList' },
    { to: '/lxmusic/leaderboard', label: '排行榜', icon: 'leaderboard', match: '/lxmusic/leaderboard' },
    { to: '/lxmusic/list', label: '我的列表', icon: 'heart', match: '/lxmusic/list' },
    {
      to: '/lxmusic/download',
      label: '下载',
      icon: 'download',
      match: '/lxmusic/download',
      badge: pending ? String(pending) : '',
      enabled: appSetting['download.enable'],
    },
    { to: '/lxmusic/setting', label: '设置', icon: 'setting', match: '/lxmusic/setting' },
  ].filter((item) => item.enabled !== false)
})

function isActive(item: { match: string }) {
  return route.path.startsWith(item.match)
}
</script>
