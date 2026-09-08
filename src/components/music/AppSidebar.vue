<template>
  <aside class="sidebar glass-panel">
    <div class="brand">
      <div class="brand-mark">♪</div>
      <div>
        <strong>Nocturne</strong>
        <span>夜航电台</span>
      </div>
    </div>

    <nav class="nav-list" aria-label="主导航">
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
      <div class="avatar-fallback" aria-hidden="true">夜</div>
      <div>
        <strong>本地收藏</strong>
        <span>曲库来源 GD音乐台</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { navItems, type ViewId } from '../../data/music'

defineProps<{
  activeView: ViewId
}>()

defineEmits<{
  'update:view': [view: ViewId]
}>()
</script>
