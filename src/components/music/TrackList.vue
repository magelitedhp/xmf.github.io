<template>
  <div class="track-list">
    <p v-if="!tracks.length" class="empty-copy">还没有可播放的曲子。</p>
    <button
      v-for="(track, index) in tracks"
      :key="track.uid"
      class="track-row"
      :class="{ active: track.uid === currentId }"
      type="button"
      @click="$emit('play', track.uid)"
    >
      <span class="track-index">{{ String(index + 1).padStart(2, '0') }}</span>
      <CoverImage :src="track.artwork" :alt="`${track.title} 封面`" img-class="thumb" />
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
import CoverImage from './CoverImage.vue'

defineProps<{
  tracks: Track[]
  currentId: string
}>()

defineEmits<{
  play: [id: string]
}>()
</script>
