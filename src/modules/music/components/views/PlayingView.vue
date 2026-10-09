<template>
  <section class="page playing-page">
    <div class="vinyl-area">
      <div class="listening-caption"><span>NOW ON THE TURNTABLE</span><span>{{ isPlaying ? '● PLAYING' : '○ STANDBY' }}</span></div>
      <TurntableArt :artwork="track.artwork" :playing="isPlaying" />

      <div class="song-summary">
        <div>
          <h1>{{ track.title }}</h1>
          <p>{{ track.artist }} · {{ track.album }}</p>
        </div>
        <button class="heart-button focus-heart" :class="{ liked: track.liked }" type="button" :disabled="!track.uid" :aria-label="track.liked ? '取消收藏' : '收藏这首歌'" :aria-pressed="track.liked" @click="$emit('like')"><MusicIcon name="heart" /></button>
      </div>

      <div class="focus-progress">
        <span>{{ progressText }}</span>
        <input
          :value="progress"
          type="range"
          aria-label="播放进度"
          min="0"
          :max="Math.max(track.seconds, 1)"
          :style="fillStyle"
          @input="$emit('seek', Number(($event.target as HTMLInputElement).value))"
        />
        <span>{{ track.duration }}</span>
      </div>
    </div>

    <div class="lyrics-panel">
      <p class="volume-label">WORDS TO STAY WITH / 歌词</p>
      <div v-if="!track.lyrics.length" class="lyrics-empty"><span aria-hidden="true">“</span><h2>{{ track.uid ? '有时候，旋律就够了。' : '把此刻，交给一首歌。' }}</h2><p>{{ track.uid ? '歌词尚未就绪，先让音乐陪你一会儿。' : '从发现或搜索选择一首歌，唱片就会在这里转起来。' }}</p></div>
      <div v-else ref="lyricsBox" class="lyrics" aria-label="歌词，点击可跳转播放位置">
      <button
        v-for="(line, index) in track.lyrics"
        :key="`${line.time}-${line.text}`"
        :class="{ current: index === currentLyric }"
        type="button"
        :aria-current="index === currentLyric ? 'true' : undefined"
        @click="$emit('seek', line.time)"
      >
        {{ line.text }}
      </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { Track } from '../../data/music'
import TurntableArt from '../TurntableArt.vue'
import MusicIcon from '../MusicIcon.vue'

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
