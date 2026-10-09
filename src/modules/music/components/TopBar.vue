<template>
  <header class="topbar">
    <RouterLink class="music-mobile-home" to="/">✳ Yumo fm. / 返回Yumo ↗</RouterLink>
    <label class="search-box">
      <MusicIcon name="search" />
      <input
        :value="searchTerm"
        type="search"
        aria-label="搜索歌曲、专辑、艺人"
        placeholder="搜索歌曲、专辑、艺人"
        @input="$emit('update:searchTerm', ($event.target as HTMLInputElement).value)"
      />
    </label>

    <p class="status-line" :class="{ busy }" role="status"><i aria-hidden="true"></i>{{ status }}</p>
  </header>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import MusicIcon from './MusicIcon.vue'
defineProps<{
  searchTerm: string
  status: string
  busy?: boolean
}>()

defineEmits<{
  'update:searchTerm': [value: string]
}>()
</script>
