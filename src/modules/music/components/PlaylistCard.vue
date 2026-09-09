<template>
  <article class="playlist-card group-card" @click="$emit('open')">
    <CoverImage :src="playlist.artwork" :alt="`${playlist.title} 封面`" img-class="cover" />
    <h3>{{ playlist.title }}</h3>
    <p>{{ playlist.subtitle }}</p>
  </article>
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
