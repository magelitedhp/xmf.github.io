<template>
  <footer class="lx-playbar" aria-label="播放控制">
    <div v-if="progressStyle === 'full'" class="lx-playbar-progress">
      <ProgressTrack />
    </div>

    <div class="lx-playbar-pic" title="打开播放详情" @click="emit('openDetail')">
      <LxCover :src="music.pic" :alt="`${music.name} 封面`" fallback="Y" />
    </div>

    <div class="lx-playbar-info">
      <div class="lx-playbar-title" :title="title" @click="copyTitle">{{ title || 'Yumo Music' }}</div>
      <div class="lx-playbar-status">{{ subtitle }}</div>
    </div>

    <div v-if="progressStyle !== 'mini'" class="lx-playbar-time">
      {{ player.progressText.value }} / {{ player.maxTimeText.value }}
    </div>

    <div class="lx-playbar-btns">
      <button type="button" aria-label="上一首" title="上一首" @click="player.playPrev()">
        <LxIcon name="prev" />
      </button>
      <button
        type="button"
        class="lx-play-main"
        :aria-label="player.state.isPlay ? '暂停' : '播放'"
        :title="player.state.isPlay ? '暂停' : '播放'"
        @click="player.togglePlay()"
      >
        <LxIcon :name="player.state.isPlay ? 'pause' : 'play'" />
      </button>
      <button type="button" aria-label="下一首" title="下一首" @click="player.playNext()">
        <LxIcon name="next" />
      </button>
    </div>

    <div class="lx-playbar-tools">
      <button
        type="button"
        class="lx-icon-btn"
        :class="{ 'is-active': player.state.playMode === 'random' || player.state.playMode === 'single' }"
        :title="playModeLabel"
        :aria-label="playModeLabel"
        @click="player.cyclePlayMode()"
      >
        <LxIcon :name="playModeIcon" />
      </button>

      <div style="position: relative">
        <button type="button" class="lx-icon-btn" title="播放倍速" aria-label="播放倍速" @click="showRate = !showRate">
          <LxIcon name="rate" />
        </button>
        <div v-if="showRate" class="lx-rate-pop">
          <button
            v-for="rate in rates"
            :key="rate"
            type="button"
            :class="{ 'is-active': player.state.playbackRate === rate }"
            @click="pickRate(rate)"
          >
            {{ rate }}x
          </button>
        </div>
      </div>

      <div class="lx-volume">
        <button type="button" class="lx-icon-btn" :aria-label="player.state.isMute ? '取消静音' : '静音'" @click="player.toggleMute()">
          <LxIcon :name="player.state.isMute ? 'mute' : 'volume'" />
        </button>
        <input
          class="lx-range"
          type="range"
          min="0"
          max="100"
          :value="Math.round(player.state.volume * 100)"
          aria-label="音量"
          @input="onVolume"
        >
      </div>

      <button
        type="button"
        class="lx-icon-btn"
        :class="{ 'is-active': appSetting['lyric.enableDesktopLyric'] }"
        title="桌面歌词"
        aria-label="桌面歌词"
        @click="appSetting['lyric.enableDesktopLyric'] = !appSetting['lyric.enableDesktopLyric']"
      >
        <LxIcon name="desktopLyric" />
      </button>

      <button
        type="button"
        class="lx-icon-btn lx-queue-toggle"
        :class="{ 'is-active': showQueue }"
        :aria-label="`当前播放列表，共 ${player.state.playList.length} 首`"
        title="当前播放列表"
        @click="showQueue = !showQueue"
      >
        <LxIcon name="playlist" />
      </button>
    </div>

    <div v-if="progressStyle === 'mini'" class="lx-playbar-progress">
      <ProgressTrack />
    </div>

    <LxQueueDrawer :open="showQueue" @close="showQueue = false" />
  </footer>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref } from 'vue'
import LxIcon from './LxIcon.vue'
import LxCover from './LxCover.vue'
import LxQueueDrawer from './LxQueueDrawer.vue'
import player from '../core/player'
import { appSetting } from '../core/settings'

const emit = defineEmits<{ openDetail: [] }>()

const showRate = ref(false)
const showQueue = ref(false)
const rates = [0.5, 0.75, 1, 1.25, 1.5, 2]

const progressStyle = computed(() => appSetting['common.playBarProgressStyle'])
const music = computed(() => player.currentMusic.value)
const title = computed(() => music.value.name || '')
const subtitle = computed(() => (music.value.id ? music.value.singer : player.state.statusText))

const playModeIcon = computed(() => {
  const mode = player.state.playMode
  return mode === 'single' ? 'modeSingle' : mode === 'random' ? 'modeRandom' : 'modeList'
})

const playModeLabel = computed(() => {
  const mode = player.state.playMode
  return mode === 'single' ? '单曲循环' : mode === 'random' ? '随机播放' : '列表循环'
})

/** Draggable progress bar shared by the full and mini layouts. */
const ProgressTrack = defineComponent({
  name: 'ProgressTrack',
  setup() {
    const trackEl = ref<HTMLElement | null>(null)

    function ratioFromEvent(event: MouseEvent | TouchEvent) {
      const el = trackEl.value
      if (!el) return 0
      const rect = el.getBoundingClientRect()
      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
      return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    }

    function start(event: MouseEvent) {
      const ratio = ratioFromEvent(event)
      player.seek(ratio * (player.state.maxTime || 0))
      const move = (moveEvent: MouseEvent) => player.seek(ratioFromEvent(moveEvent) * (player.state.maxTime || 0))
      const up = () => {
        window.removeEventListener('mousemove', move)
        window.removeEventListener('mouseup', up)
      }
      window.addEventListener('mousemove', move)
      window.addEventListener('mouseup', up)
    }

    return () =>
      h('div', { class: 'lx-progress-track', ref: trackEl, onMousedown: start }, [
        h('i', {
          class: 'lx-progress-buffer',
          style: { width: `${player.state.maxTime ? (player.state.buffered / player.state.maxTime) * 100 : 0}%` },
        }),
        h('i', { class: 'lx-progress-fill', style: { width: `${player.progressPercent.value}%` } }),
        h('i', { class: 'lx-progress-thumb', style: { left: `${player.progressPercent.value}%` } }),
      ])
  },
})

function onVolume(event: Event) {
  player.setVolume(Number((event.target as HTMLInputElement).value) / 100)
}

function openQueue() {
  showQueue.value = true
}

onMounted(() => window.addEventListener('lxmusic:open-queue', openQueue))
onBeforeUnmount(() => window.removeEventListener('lxmusic:open-queue', openQueue))

function pickRate(rate: number) {
  player.setPlaybackRate(rate)
  appSetting['player.playbackRate'] = rate
  showRate.value = false
}

function copyTitle() {
  if (!title.value) return
  void navigator.clipboard?.writeText(title.value).catch(() => undefined)
}
</script>
