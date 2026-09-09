<template>
  <footer class="player-bar glass-panel">
    <button class="now-playing" type="button" @click="$emit('open-playing')">
      <CoverImage :src="track.artwork" :alt="`${track.title} 封面`" img-class="thumb thumb-lg" />
      <span class="now-copy">
        <strong>{{ track.title }}</strong>
        <small>{{ track.artist }}</small>
      </span>
    </button>

    <button
      class="heart-button"
      :class="{ liked: track.liked }"
      type="button"
      :title="track.liked ? '取消收藏' : '收藏'"
      @click="$emit('like')"
    >
      ♡
    </button>

    <div class="transport">
      <div class="transport-buttons">
        <button class="icon-button" :class="{ active: isShuffle }" type="button" title="随机播放" @click="$emit('shuffle')">↯</button>
        <button class="icon-button" type="button" title="上一首" @click="$emit('previous')">|‹</button>
        <button class="play-button" type="button" :title="isPlaying ? '暂停' : '播放'" @click="$emit('toggle')">
          {{ isBuffering ? '…' : isPlaying ? 'Ⅱ' : '▶' }}
        </button>
        <button class="icon-button" type="button" title="下一首" @click="$emit('next')">›|</button>
        <button class="icon-button" :class="{ active: isLoopOne }" type="button" title="单曲循环" @click="$emit('loop')">↻</button>
      </div>

      <div class="timeline">
        <span>{{ progressText }}</span>
        <input
          :value="progress"
          type="range"
          min="0"
          :max="Math.max(track.seconds, 1)"
          :style="fillStyle"
          :aria-valuetext="progressText"
          @input="emitSeek"
        />
        <span>{{ track.duration }}</span>
      </div>
    </div>

    <div class="player-tools">
      <span class="volume-icon">⌁</span>
      <input class="volume-slider" :value="volume" type="range" min="0" max="100" :style="volumeStyle" aria-label="音量" @input="emitVolume" />
      <button class="icon-button" type="button" title="沉浸播放" @click="$emit('open-playing')">⛶</button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Track } from '../data/music'
import CoverImage from './CoverImage.vue'

const props = defineProps<{
  track: Track
  progress: number
  progressText: string
  volume: number
  isPlaying: boolean
  isBuffering?: boolean
  isShuffle?: boolean
  isLoopOne?: boolean
}>()

const emit = defineEmits<{
  previous: []
  next: []
  toggle: []
  seek: [value: number]
  volume: [value: number]
  like: []
  'open-playing': []
  shuffle: []
  loop: []
}>()

const fillStyle = computed(() => ({
  '--fill': `${props.track.seconds ? (props.progress / props.track.seconds) * 100 : 0}%`,
}))

const volumeStyle = computed(() => ({
  '--fill': `${props.volume}%`,
}))

function getRangeValue(inputEvent: Event) {
  return Number((inputEvent.target as HTMLInputElement).value)
}

function emitSeek(inputEvent: Event) {
  emit('seek', getRangeValue(inputEvent))
}

function emitVolume(inputEvent: Event) {
  emit('volume', getRangeValue(inputEvent))
}
</script>
