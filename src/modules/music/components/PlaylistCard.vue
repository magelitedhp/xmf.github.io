<template>
  <button type="button" class="playlist-card group-card" @click="$emit('open')">
    <div class="playlist-art"><CoverImage :src="playlist.artwork" :alt="`${playlist.title} 封面`" img-class="cover" /><span class="playlist-open" aria-hidden="true">↗</span></div>
    <h3>{{ playlist.title }}</h3>
    <p>{{ playlist.subtitle }}</p>
  </button>
</template>

<script setup lang="ts">
import type { Playlist } from '../data/music'
import CoverImage from './CoverImage.vue'

defineProps<{
  playlist: Playlist
}>()

defineEmits<{
  open: []
}>()
</script>
