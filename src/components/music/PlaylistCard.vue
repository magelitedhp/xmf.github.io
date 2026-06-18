<template>
  <article class="playlist-card">
    <img class="cover" :src="playlist.artwork" :alt="`${playlist.title} 封面`" />
    <h3>{{ playlist.title }}</h3>
    <p>{{ playlist.subtitle }}</p>
  </article>
</template>

<script setup lang="ts">
import type { Playlist } from '../../data/music'

defineProps<{
  playlist: Playlist
}>()
</script>
