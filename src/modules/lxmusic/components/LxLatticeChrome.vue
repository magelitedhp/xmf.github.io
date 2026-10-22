<template>
  <div
    class="lattice-chrome"
    :class="{ 'is-revealed': revealed }"
    role="group"
    aria-label="海报播放控制"
  >
    <div class="lattice-chrome-transport">
      <button
        type="button"
        class="lattice-transport-button"
        :aria-label="isPlaying ? '暂停' : '播放'"
        :title="isPlaying ? '暂停' : '播放'"
        @click="emit('primary')"
      >
        <LxIcon :name="isPlaying ? 'pause' : 'play'" />
      </button>

      <div class="lattice-chrome-details" :inert="!revealed" :aria-hidden="!revealed">
        <div class="lattice-chrome-actions">
          <button
            type="button"
            :disabled="!controlsCurrent || !canStep"
            aria-label="上一首"
            title="上一首"
            @click="emit('prev')"
          >
            <LxIcon name="prev" />
          </button>
          <button
            type="button"
            :class="{ 'is-active': loopActive }"
            :disabled="!controlsCurrent"
            :aria-label="loopLabel"
            :title="loopLabel"
            :aria-pressed="loopActive"
            @click="emit('loop')"
          >
            <LxIcon :name="loopIcon" />
          </button>
          <button
            type="button"
            :disabled="!controlsCurrent || !hasLyrics"
            aria-label="歌词时间轴"
            title="歌词时间轴"
            @click="emit('timeline')"
          >
            <LxIcon name="timeline" />
          </button>
          <button
            type="button"
            :disabled="!controlsCurrent || !canStep"
            aria-label="下一首"
            title="下一首"
            @click="emit('next')"
          >
            <LxIcon name="next" />
          </button>
        </div>
      </div>

      <span class="lattice-chrome-time">
        <span>{{ elapsedText }}</span> / {{ durationText }}
      </span>

      <button
        type="button"
        class="lattice-secondary-action"
        aria-label="打开播放器"
        title="打开播放器"
        @click="emit('open-player')"
      >
        <LxIcon name="arrowUpRight" />
      </button>
    </div>

    <div class="lattice-progress">
      <div class="lattice-progress-root">
        <div class="lattice-progress-track">
          <div class="lattice-progress-fill" :style="{ clipPath: fillClip }" />
          <div class="lattice-progress-thumb-carrier" :style="{ transform: thumbTransform }">
            <div class="lattice-progress-thumb" />
          </div>
          <input
            ref="rangeEl"
            type="range"
            min="0"
            :max="duration || 100"
            step="0.1"
            :value="seekValue"
            :disabled="!controlsCurrent"
            aria-label="播放进度"
            @pointerdown="onSeekStart"
            @pointerup="onSeekEnd"
            @pointercancel="onSeekCancel"
            @input="onInput"
            @change="noop"
            @click.stop
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Expanded poster chrome.
 *
 * Source: `app/lattice/LatticePlaybackControls.tsx`, `LatticeExtraControls.tsx`,
 * `LatticeChromeTime.tsx` and `LatticeChrome.css`. The outer control row stays in
 * view; prev / loop / timeline / next wipe open beside play on hover, touch or
 * keyboard focus.
 */
import { computed, ref, watch } from 'vue'
import LxIcon from './LxIcon.vue'
import player from '../core/player'

const props = withDefaults(
  defineProps<{
    currentId: string
    itemId: string
    duration?: number
    revealed?: boolean
  }>(),
  {
    duration: 0,
    revealed: false,
  },
)

const emit = defineEmits<{
  primary: []
  prev: []
  loop: []
  timeline: []
  next: []
  'open-player': []
}>()

const rangeEl = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const seekValue = ref(0)

const controlsCurrent = computed(() => props.itemId === props.currentId)
const isPlaying = computed(() => controlsCurrent.value && player.state.isPlay)
const canStep = computed(() => player.state.playList.length > 1)
const duration = computed(() => {
  if (controlsCurrent.value) return player.state.maxTime || props.duration
  return props.duration
})
const progress = computed(() => {
  if (!controlsCurrent.value) return 0
  return dragging.value ? seekValue.value : player.state.progress
})
const elapsedText = computed(() => formatTime(progress.value))
const durationText = computed(() => formatTime(duration.value))
const ratio = computed(() => {
  if (duration.value <= 0) return 0
  return Math.min(1, Math.max(0, progress.value / duration.value))
})
const hiddenPercent = computed(() => ((1 - ratio.value) * 100).toFixed(4))
const fillClip = computed(() => `inset(0 ${hiddenPercent.value}% 0 0)`)
const thumbTransform = computed(() => `translateX(${(ratio.value * 100).toFixed(4)}%)`)
const loopActive = computed(() => player.state.playMode !== 'random')
const loopIcon = computed(() => {
  if (player.state.playMode === 'single') return 'repeatOne'
  if (player.state.playMode === 'random') return 'repeatOff'
  return 'repeat'
})
const loopLabel = computed(() => {
  if (player.state.playMode === 'single') return '单曲循环'
  if (player.state.playMode === 'random') return '随机播放'
  return '列表循环'
})
const hasLyrics = computed(() =>
  player.state.lyricLines.some((line) => /[\p{L}\p{N}]/u.test(line.fullText)),
)

function formatTime(value: number) {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0
  const minutes = Math.floor(safe / 60)
  const seconds = Math.floor(safe % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function noop() {
  // Native range inputs require a change handler for the same input/change pair as the source.
}

function onSeekStart(event: PointerEvent) {
  if (!controlsCurrent.value) return
  dragging.value = true
  seekValue.value = player.state.progress
  ;(event.currentTarget as HTMLInputElement).setPointerCapture(event.pointerId)
}

function onSeekEnd(event: PointerEvent) {
  if (!controlsCurrent.value) return
  const value = Number((event.currentTarget as HTMLInputElement).value)
  dragging.value = false
  seekValue.value = value
  player.seek(value)
}

function onSeekCancel() {
  if (!controlsCurrent.value) return
  dragging.value = false
  seekValue.value = player.state.progress
}

function onInput(event: Event) {
  if (!controlsCurrent.value) return
  const value = Number((event.currentTarget as HTMLInputElement).value)
  seekValue.value = value
  // iOS can deliver pointerup before input; seeking before a drag begins covers it.
  if (!dragging.value) player.seek(value)
}

watch(
  () => player.state.progress,
  (value) => {
    if (!dragging.value) seekValue.value = value
  },
  { immediate: true },
)

watch(controlsCurrent, () => {
  dragging.value = false
  seekValue.value = player.state.progress
})
</script>
