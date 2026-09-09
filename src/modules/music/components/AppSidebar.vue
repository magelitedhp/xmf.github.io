<template>
  <aside class="sidebar glass-panel">
    <RouterLink class="brand home-link-brand" to="/" aria-label="返回书房首页">
      <div class="brand-mark">N</div>
      <div>
        <strong>Nocturne</strong>
        <span>返回首页</span>
      </div>
    </RouterLink>

    <nav class="nav-list" aria-label="音乐模块导航">
      <button
        v-for="item in navItems"
        :key="item.id"
        class="nav-item"
        :class="{ active: activeView === item.id }"
        type="button"
        @click="$emit('update:view', item.id)"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <div class="account-card">
      <div class="avatar-fallback" aria-hidden="true">卷</div>
      <div>
        <strong>本地收藏</strong>
        <span>GD 曲库</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { navItems, type ViewId } from '../data/music'

defineProps<{
  activeView: ViewId
}>()

defineEmits<{
  'update:view': [view: ViewId]
}>()
</script>
