<template>
  <section class="page playing-page">
    <div class="playing-backdrop" aria-hidden="true">
      <CoverImage :src="track.artwork" alt="" img-class="immersive-bg" />
    </div>

    <div class="vinyl-area">
      <div class="vinyl" :class="{ spinning: isPlaying }">
        <CoverImage :src="track.artwork" :alt="`${track.title} 封面`" img-class="vinyl-image" />
        <span class="vinyl-hole"></span>
      </div>

      <div class="song-summary">
        <div>
          <h1>{{ track.title }}</h1>
          <p>{{ track.artist }} · {{ track.album }}</p>
        </div>
        <button class="heart-button focus-heart" :class="{ liked: track.liked }" type="button" @click="$emit('like')">♡</button>
      </div>

      <div class="focus-progress">
        <span>{{ progressText }}</span>
        <input
          :value="progress"
          type="range"
          min="0"
          :max="Math.max(track.seconds, 1)"
          :style="fillStyle"
          @input="$emit('seek', Number(($event.target as HTMLInputElement).value))"
        />
        <span>{{ track.duration }}</span>
      </div>
    </div>

    <div ref="lyricsBox" class="lyrics">
      <p v-if="!track.lyrics.length" class="empty-copy">正在等待歌词，或这首歌尚未提供 LRC。</p>
      <p
        v-for="(line, index) in track.lyrics"
        :key="`${line.time}-${line.text}`"
        :class="{ current: index === currentLyric }"
      >
        {{ line.text }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { Track } from '../../../data/music'
import CoverImage from '../CoverImage.vue'

const props = defineProps<{
  track: Track
  progress: number
  progressText: string
  currentLyric: number
  isPlaying: boolean
}>()

defineEmits<{
  seek: [value: number]
  like: []
}>()

const lyricsBox = ref<HTMLElement | null>(null)

const fillStyle = computed(() => ({
  '--fill': `${props.track.seconds ? (props.progress / props.track.seconds) * 100 : 0}%`,
}))

watch(
  () => [props.currentLyric, props.track.uid] as const,
  async () => {
    await nextTick()
    const box = lyricsBox.value
    const current = box?.querySelector('.current') as HTMLElement | null
    if (!box || !current) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const top = current.offsetTop - box.clientHeight / 2 + current.offsetHeight / 2
    box.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' })
  },
  { immediate: true },
)
</script>
