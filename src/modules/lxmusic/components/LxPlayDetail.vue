<template>
  <div
    class="folia-stage"
    :class="[`is-bg-${backgroundMode}`, { 'is-lyric-mode': viewMode === 'lyric' }]"
    :style="stageStyle"
  >
    <VisualizerStage
      v-if="viewMode === 'stage'"
      :mode="visualizerMode"
      :background-mode="backgroundMode"
      :theme="theme"
      :cover="cover"
      :seed="music.id || 'lx-music'"
      :line="currentLine"
      :previous-line="previousLine"
      :next-line="nextLine"
      :recent-line="recentCompletedLine"
      :next-lines="subtitleNextLines"
      :time="progress"
      :is-play="isPlay"
      :animation-enabled="animationEnabled"
      :font-scale="fontScale"
      :background-opacity="appSetting['visualizer.backgroundOpacity']"
      :disable-geometric="disableGeometric"
      :disable-vignette="disableVignette"
      :show-guide-lines="appSetting['visualizer.showGuideLines']"
      :show-print-symbols="appSetting['visualizer.showPrintSymbols']"
      :show-subtitle-translation="showSubtitle"
      :subtitle-content-mode="subtitleContentMode"
      :show-upcoming="showUpcoming"
      :empty-text="lyricPlaceholder"
    />

    <div v-else-if="viewMode === 'lyric'" class="folia-lyric-view">
      <div class="folia-lyric-side">
        <div class="folia-disc" :class="{ 'is-spinning': isPlay }">
          <LxCover :src="music.pic" :alt="`${music.name} 封面`" fallback="Y" />
        </div>
        <strong class="lx-ellipsis">{{ music.name || 'Yumo Music' }}</strong>
        <span class="lx-ellipsis">{{ music.singer || '未知歌手' }}</span>
        <small class="lx-ellipsis">{{ music.album || '未知专辑' }}</small>
      </div>
      <div class="folia-lyric-list">
        <LxLyricList />
      </div>
    </div>

    <div class="folia-chrome" :class="{ 'is-pinned': pinned }">
      <button type="button" class="folia-back" aria-label="返回" @click="emit('close')">
        <LxIcon name="back" />
      </button>

      <div class="folia-top-tools">
        <button
          type="button"
          :class="{ 'is-active': loved }"
          :aria-label="loved ? '取消收藏' : '收藏'"
          :title="loved ? '取消收藏' : '收藏'"
          @click="onLove"
        >
          <LxIcon name="heart" />
        </button>
        <button type="button" aria-label="下载" title="下载" @click="onDownload">
          <LxIcon name="download" />
        </button>
        <button
          type="button"
          :class="{ 'is-active': viewMode === 'lyric' }"
          aria-label="切换歌词列表"
          title="切换歌词列表"
          @click="viewMode = viewMode === 'lyric' ? 'stage' : 'lyric'"
        >
          <LxIcon name="listLyric" />
        </button>
        <button
          type="button"
          :class="{ 'is-active': appSetting['lyric.enableDesktopLyric'] }"
          aria-label="桌面歌词"
          title="桌面歌词"
          @click="appSetting['lyric.enableDesktopLyric'] = !appSetting['lyric.enableDesktopLyric']"
        >
          <LxIcon name="desktopLyric" />
        </button>
      </div>

      <div class="folia-bottom-bar">
        <button type="button" aria-label="上一首" title="上一首" @click="player.playPrev()">
          <LxIcon name="prev" />
        </button>
        <button
          type="button"
          class="folia-play"
          :aria-label="isPlay ? '暂停' : '播放'"
          :title="isPlay ? '暂停' : '播放'"
          @click="player.togglePlay()"
        >
          <LxIcon :name="isPlay ? 'pause' : 'play'" />
        </button>
        <button type="button" aria-label="下一首" title="下一首" @click="player.playNext()">
          <LxIcon name="next" />
        </button>

        <span v-if="showProgress" class="folia-time">{{ progressText }}</span>
        <div v-if="showProgress" class="folia-progress-inline" @mousedown="startSeek">
          <i :style="{ width: `${progressPercent}%` }" />
        </div>
        <span v-if="showProgress" class="folia-time">{{ maxTimeText }}</span>

        <button type="button" :aria-label="playModeLabel" :title="playModeLabel" @click="player.cyclePlayMode()">
          <LxIcon :name="playModeIcon" />
        </button>
        <button type="button" :aria-label="isMute ? '取消静音' : '静音'" :title="isMute ? '取消静音' : '静音'" @click="player.toggleMute()">
          <LxIcon :name="isMute ? 'mute' : 'volume'" />
        </button>
        <button type="button" aria-label="关闭播放详情" title="关闭播放详情" @click="emit('close')">
          <LxIcon name="collapse" />
        </button>
      </div>

      <div class="folia-bottom-progress">
        <i :style="{ width: `${progressPercent}%` }" />
      </div>

      <div class="folia-theme-dots" aria-hidden="true">
        <i :style="{ background: theme.backgroundColor }" />
        <i :style="{ background: theme.primaryColor }" />
        <i :style="{ background: theme.secondaryColor }" />
        <i :style="{ background: theme.accentColor }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Immersive play-detail stage.
 *
 * Visualizer shell with a cover-derived palette, fluid backdrop, audio-reactive
 * geometric field, per-word kinetic lyric animation and the subtitle
 * rail. The palette is sampled from the current cover; the motion curves come from the
 * render hints produced by `core/lyric`.
 */

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import LxIcon from './LxIcon.vue'
import LxCover from './LxCover.vue'
import VisualizerStage from './visualizer/VisualizerStage.vue'
import LxLyricList from './LxLyricList.vue'
import player from '../core/player'
import { appSetting, getSubtitleContentMode } from '../core/settings'
import {
  DEFAULT_THEME,
  resolveCoverTheme,
  resolveThemeFontStack,
  type LxTheme,
} from '../core/theme'
import { getRecentCompletedLine, getUpcomingLines, type LyricLine } from '../core/lyric'
import { isLoved } from '../core/lists'
import { downloadMusic, toggleLoveWithToast } from '../core/actions'

const emit = defineEmits<{ close: [] }>()

const theme = ref<LxTheme>({ ...DEFAULT_THEME })
const pinned = ref(false)
/** `stage` keeps the kinetic lyric; `lyric` shows the classic list view. */
const viewMode = ref<'stage' | 'lyric'>('stage')

const music = computed(() => player.currentMusic.value)
const cover = computed(() => music.value.pic)
const lines = computed<LyricLine[]>(() => player.state.lyricLines)
const lineIndex = computed(() => player.currentLineIndex.value)
const progress = computed(() => player.state.progress)
const progressPercent = computed(() => player.progressPercent.value)
const progressText = computed(() => player.progressText.value)
const maxTimeText = computed(() => player.maxTimeText.value)
const isPlay = computed(() => player.state.isPlay)
const isMute = computed(() => player.state.isMute)
const loved = computed(() => isLoved(music.value))

function onLove() {
  toggleLoveWithToast(music.value)
}

function onDownload() {
  downloadMusic(music.value)
}

const currentLine = computed<LyricLine | null>(() => lines.value[lineIndex.value] ?? null)
const previousLine = computed<LyricLine | null>(() => lines.value[lineIndex.value - 1] ?? null)
const nextLine = computed<LyricLine | null>(() => lines.value[lineIndex.value + 1] ?? null)
const recentCompletedLine = computed(() =>
  getRecentCompletedLine(lines.value, lineIndex.value, progress.value),
)
const subtitleNextLines = computed(() =>
  showUpcoming.value ? getUpcomingLines(lines.value, lineIndex.value, 2) : [],
)

const animationEnabled = computed(() => appSetting['common.animation'] && appSetting['lyric.animation'])
const subtitleContentMode = computed(() => getSubtitleContentMode())
const showSubtitle = computed(() => subtitleContentMode.value !== 'none')
const showProgress = computed(() => appSetting['lyric.showLyricProgress'])
const showUpcoming = computed(() => appSetting['visualizer.showUpcoming'] ?? true)
const disableVignette = computed(() => appSetting['visualizer.disableVignette'])
const disableGeometric = computed(() => appSetting['visualizer.disableGeometric'])
const visualizerMode = computed(() => appSetting['visualizer.mode'])
const backgroundMode = computed(() => appSetting['visualizer.background'])
const fontScale = computed(() => appSetting['visualizer.lyricsFontScale'])

const lyricPlaceholder = computed(() => (player.state.lyricLoading ? '正在加载歌词…' : '暂无歌词'))

const stageStyle = computed(() => ({
  '--folia-primary': theme.value.primaryColor,
  '--folia-secondary': theme.value.secondaryColor,
  '--folia-accent': theme.value.accentColor,
  '--folia-base-color': theme.value.secondaryColor,
  '--folia-active-color': theme.value.accentColor,
  '--folia-breathe-duration': '7.5s',
  '--folia-breathe-distance': '12px',
  '--folia-lyric-scale': String(appSetting['visualizer.lyricsFontScale']),
  fontFamily: resolveThemeFontStack(theme.value),
  '--folia-font-weight': String(theme.value.fontWeight ?? 700),
}))

function startSeek(event: MouseEvent) {
  const el = event.currentTarget as HTMLElement
  const seekFrom = (clientX: number) => {
    const rect = el.getBoundingClientRect()
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    player.seek(ratio * (player.state.maxTime || 0))
  }
  seekFrom(event.clientX)
  const move = (moveEvent: MouseEvent) => seekFrom(moveEvent.clientX)
  const up = () => {
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', up)
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
}

const playModeIcon = computed(() => {
  const mode = player.state.playMode
  return mode === 'single' ? 'modeSingle' : mode === 'random' ? 'modeRandom' : 'modeList'
})

const playModeLabel = computed(() => {
  const mode = player.state.playMode
  return mode === 'single' ? '单曲循环' : mode === 'random' ? '随机播放' : '列表循环'
})

async function refreshTheme() {
  const base = {
    ...DEFAULT_THEME,
    animationIntensity: appSetting['visualizer.animationIntensity'],
  }
  theme.value = appSetting['visualizer.useCoverColor']
    ? await resolveCoverTheme(cover.value, base)
    : base
  theme.value.fontWeight = appSetting['lyric.fontWeight']
}

watch(cover, () => void refreshTheme())
watch(() => appSetting['visualizer.animationIntensity'], () => void refreshTheme())
watch(() => appSetting['visualizer.useCoverColor'], () => void refreshTheme())

function onKey(event: KeyboardEvent) {
  if (event.code === 'Escape') emit('close')
}

onMounted(() => {
  void refreshTheme()
  window.addEventListener('keydown', onKey)
  if (window.matchMedia('(hover: none)').matches) pinned.value = true
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style>
.folia-time {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  opacity: 0.78;
}

.folia-progress-inline {
  position: relative;
  width: min(280px, 26vw);
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  cursor: pointer;
}

.folia-progress-inline i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #fff;
}

.folia-top-tools {
  position: absolute;
  top: 22px;
  right: 22px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.folia-top-tools button {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.28);
  color: rgba(255, 255, 255, 0.76);
  backdrop-filter: blur(10px);
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.folia-top-tools button:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  transform: scale(1.06);
}

.folia-top-tools button.is-active {
  color: var(--folia-accent);
}

.folia-top-tools svg {
  width: 18px;
  height: 18px;
}

/* ------------------------------------------------------- lyric list mode ---- */

.folia-stage.is-lyric-mode {
  display: block;
  isolation: isolate;
  contain: layout paint;
}

.folia-stage.is-lyric-mode > .folia-bg {
  position: absolute;
  inset: 0;
}

.folia-lyric-view {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 10;
  display: grid;
  grid-template-columns: minmax(220px, 34%) minmax(0, 1fr);
  gap: 28px;
  width: min(1180px, calc(100vw - 28px));
  max-width: 1180px;
  height: min(74vh, 720px);
  box-sizing: border-box;
  margin: 0;
  padding: 0 8px;
  transform: translate(calc(-50% + 28px), -50%);
}

.folia-lyric-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  text-align: center;
  color: var(--folia-primary);
}

.folia-lyric-side strong {
  max-width: 100%;
  font-size: 18px;
  font-weight: 600;
}

.folia-lyric-side span {
  max-width: 100%;
  font-size: 13px;
  opacity: 0.78;
}

.folia-lyric-side small {
  max-width: 100%;
  font-size: 12px;
  opacity: 0.52;
}

.folia-disc {
  position: relative;
  width: min(260px, 60%);
  aspect-ratio: 1 / 1;
  margin-bottom: 16px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45), 0 0 0 8px rgba(255, 255, 255, 0.06);
}

.folia-disc::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 22%;
  aspect-ratio: 1 / 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: rgba(10, 12, 16, 0.72);
  box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.16);
}

.folia-disc img,
.folia-disc .lx-cover-fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.folia-disc.is-spinning {
  animation: folia-disc-spin 22s linear infinite;
}

@keyframes folia-disc-spin {
  to { transform: rotate(360deg); }
}

.folia-lyric-list {
  min-width: 0;
  height: 100%;
  padding: 6px 10px;
  border-radius: 18px;
  background: rgba(0, 0, 0, 0.24);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
}

@media (max-width: 860px) {
  .folia-lyric-view {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 14px;
    width: min(1180px, calc(100vw - 28px));
    height: min(78vh, 720px);
    padding: 0 14px;
  }

  .folia-disc {
    width: min(150px, 40vw);
    margin-bottom: 8px;
  }
}

.folia-line-enter-from {
  opacity: 0;
  transform: scale(0.9);
  filter: blur(10px);
}

.folia-line-leave-to {
  opacity: 0;
  transform: scale(1.1);
  filter: blur(20px);
}

.folia-line-enter-active,
.folia-line-leave-active {
  transition:
    opacity var(--folia-line-duration, 0.32s) ease,
    transform var(--folia-line-duration, 0.32s) ease,
    filter var(--folia-line-duration, 0.32s) ease;
}

.folia-line-enter-from.is-fast {
  opacity: 0.35;
  transform: scale(0.96);
  filter: blur(4px);
}

.folia-line-leave-to.is-fast {
  transform: scale(1.04);
  filter: blur(10px);
}

.folia-line-enter-from.is-none {
  opacity: 1;
  transform: scale(1);
  filter: blur(0);
}

.folia-line-leave-to.is-none {
  transform: scale(1.02);
  filter: blur(6px);
}

@media (max-width: 760px) {
  .folia-progress-inline {
    width: 32vw;
  }

  .folia-bottom-bar {
    gap: 10px;
    padding: 8px 14px;
  }

  .folia-time {
    display: none;
  }
}
</style>
