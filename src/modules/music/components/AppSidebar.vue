<template>
  <aside class="sidebar">
    <RouterLink class="brand home-link-brand" to="/" aria-label="返回 Yumo 首页">
      <div class="brand-mark">✳</div>
      <div>
        <strong>Yumo fm.</strong>
        <span>← 返回Yumo</span>
      </div>
    </RouterLink>

    <p class="sidebar-caption">YOUR LISTENING ROOM</p>
    <nav class="nav-list" aria-label="音乐模块导航">
      <button
        v-for="item in navItems"
        :key="item.id"
        class="nav-item"
        :class="{ active: activeView === item.id }"
        :aria-pressed="activeView === item.id"
        type="button"
        @click="$emit('update:view', item.id)"
      >
        <MusicIcon class="nav-icon" :name="item.id" />
        <span>{{ item.label }}</span>
        <span class="nav-indicator" aria-hidden="true">↗</span>
      </button>
    </nav>

    <div class="sidebar-message"><span class="sidebar-flower" aria-hidden="true">✳</span><p>Less noise.<br>More <em>music.</em></p><small>给耳朵，一点自由。</small></div>
    <div class="account-card">
      <div class="avatar-fallback" aria-hidden="true">♡</div>
      <div>
        <strong>本地收藏</strong>
        <span>SAVED ON THIS DEVICE</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import MusicIcon from './MusicIcon.vue'
import { navItems, type ViewId } from '../data/music'

defineProps<{
  activeView: ViewId
}>()

defineEmits<{
  'update:view': [view: ViewId]
}>()
</script>
