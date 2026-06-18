<template>
  <div class="track-list">
    <button
      v-for="(track, index) in tracks"
      :key="track.id"
      class="track-row"
      :class="{ active: track.id === currentId }"
      type="button"
      @click="$emit('play', track.id)"
    >
      <span class="track-index">{{ String(index + 1).padStart(2, '0') }}</span>
      <img class="thumb" :src="track.artwork" :alt="`${track.title} 封面`" />
      <span class="track-copy">
        <strong>{{ track.title }}</strong>
        <small>{{ track.artist }}</small>
      </span>
      <span class="track-duration">{{ track.duration }}</span>
      <span class="like-dot" :class="{ liked: track.liked }">♡</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Track } from '../../data/music'

defineProps<{
  tracks: Track[]
  currentId: number
}>()

defineEmits<{
  play: [id: number]
}>()
</script>
