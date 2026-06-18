<template>
  <section class="page playing-page">
    <img class="immersive-bg" :src="track.artwork" alt="" aria-hidden="true" />

    <div class="vinyl-area">
      <div class="vinyl" :class="{ spinning: isPlaying }">
        <img class="vinyl-image" :src="track.artwork" :alt="`${track.title} 封面`" />
        <span class="vinyl-hole"></span>
      </div>

      <div class="song-summary">
        <div>
          <h1>{{ track.title }}</h1>
          <p>{{ track.artist }} · 专辑：{{ track.album }}</p>
        </div>
        <button class="heart-button focus-heart" :class="{ liked: track.liked }" type="button" @click="$emit('like')">♡</button>
      </div>

      <div class="focus-progress">
        <span>{{ progressText }}</span>
        <input :value="progress" type="range" min="0" :max="track.seconds" @input="$emit('seek', Number(($event.target as HTMLInputElement).value))" />
        <span>{{ track.duration }}</span>
      </div>
    </div>

    <div class="lyrics">
      <p v-for="(line, index) in track.lyrics" :key="line" :class="{ current: index === 2 }">{{ line }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Track } from '../../../data/music'

defineProps<{
  track: Track
  progress: number
  progressText: string
  isPlaying: boolean
}>()

defineEmits<{
  seek: [value: number]
  like: []
}>()
</script>
