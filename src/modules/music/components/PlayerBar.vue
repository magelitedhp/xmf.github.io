<template>
  <footer class="player-bar" aria-label="音乐播放器">
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
      :aria-label="track.liked ? '取消收藏' : '收藏'"
      :aria-pressed="track.liked"
      :disabled="!track.uid"
      @click="$emit('like')"
    >
      <MusicIcon name="heart" />
    </button>

    <div class="transport">
      <div class="transport-buttons">
        <button class="icon-button shuffle-control" :class="{ active: isShuffle }" type="button" aria-label="随机播放" :aria-pressed="isShuffle" title="随机播放" @click="$emit('shuffle')"><MusicIcon name="shuffle" /></button>
        <button class="icon-button previous-control" type="button" aria-label="上一首" title="上一首" @click="$emit('previous')"><MusicIcon name="previous" /></button>
        <button class="play-button" :class="{ 'is-buffering': isBuffering }" type="button" :aria-label="isBuffering ? '正在缓冲' : isPlaying ? '暂停' : '播放'" :title="isPlaying ? '暂停' : '播放'" @click="$emit('toggle')">
          <MusicIcon :name="isBuffering ? 'playing' : isPlaying ? 'pause' : 'play'" />
        </button>
        <button class="icon-button next-control" type="button" aria-label="下一首" title="下一首" @click="$emit('next')"><MusicIcon name="next" /></button>
        <button class="icon-button loop-control" :class="{ active: isLoopOne }" type="button" aria-label="单曲循环" :aria-pressed="isLoopOne" title="单曲循环" @click="$emit('loop')"><MusicIcon name="loop" /></button>
      </div>

      <div class="timeline">
        <span>{{ progressText }}</span>
        <input
          :value="progress"
          type="range"
          aria-label="播放进度"
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
      <MusicIcon class="volume-icon" name="volume" />
      <input class="volume-slider" :value="volume" type="range" min="0" max="100" :style="volumeStyle" aria-label="音量" @input="emitVolume" />
      <button class="icon-button" type="button" title="沉浸播放" aria-label="沉浸播放" @click="$emit('open-playing')"><MusicIcon name="expand" /></button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Track } from '../data/music'
import CoverImage from './CoverImage.vue'
import MusicIcon from './MusicIcon.vue'

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
