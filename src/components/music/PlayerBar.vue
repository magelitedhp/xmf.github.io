<template>
  <footer class="player-bar">
    <button class="now-playing" type="button" @click="$emit('open-playing')">
      <img class="thumb thumb-lg" :src="track.artwork" :alt="`${track.title} 封面`" />
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
        <button class="icon-button" type="button" title="随机播放">↯</button>
        <button class="icon-button" type="button" title="上一首" @click="$emit('previous')">|‹</button>
        <button class="play-button" type="button" :title="isPlaying ? '暂停' : '播放'" @click="$emit('toggle')">
          {{ isPlaying ? 'Ⅱ' : '▶' }}
        </button>
        <button class="icon-button" type="button" title="下一首" @click="$emit('next')">›|</button>
        <button class="icon-button" type="button" title="循环播放">↻</button>
      </div>

      <div class="timeline">
        <span>{{ progressText }}</span>
        <input :value="progress" type="range" min="0" :max="track.seconds" @input="emitSeek" />
        <span>{{ track.duration }}</span>
      </div>
    </div>

    <div class="player-tools">
      <button class="icon-button" type="button" title="播放队列">▤</button>
      <button class="icon-button" type="button" title="歌词">♬</button>
      <span class="volume-icon">⌁</span>
      <input class="volume-slider" :value="volume" type="range" min="0" max="100" aria-label="音量" @input="emitVolume" />
      <button class="icon-button" type="button" title="沉浸播放" @click="$emit('open-playing')">⛶</button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import type { Track } from '../../data/music'

defineProps<{
  track: Track
  progress: number
  progressText: string
  volume: number
  isPlaying: boolean
}>()

const emit = defineEmits<{
  previous: []
  next: []
  toggle: []
  seek: [value: number]
  volume: [value: number]
  like: []
  'open-playing': []
}>()

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
