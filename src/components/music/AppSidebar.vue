<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-mark">♪</div>
      <div>
        <strong>Music App</strong>
        <span>Premium Account</span>
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
      <img class="avatar" :src="profileArtwork" alt="用户头像" />
      <div>
        <strong>张伟</strong>
        <span>管理个人资料</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { navItems, profileArtwork, type ViewId } from '../../data/music'

defineProps<{
  activeView: ViewId
}>()

defineEmits<{
  'update:view': [view: ViewId]
}>()
</script>
