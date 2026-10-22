<template>
  <Transition name="lx-dl">
    <div
      v-if="enabled"
      class="lx-dl"
      :class="{ 'is-locked': locked, 'is-single': singleLine, 'is-hover': hovering, 'is-pinned': isMobile }"
      :style="rootStyle"
      @mouseenter="hovering = true"
      @mouseleave="hovering = false"
    >
      <div class="lx-dl-body" :class="{ 'is-draggable': !locked && !isMobile }" @mousedown="startDrag">
        <p class="lx-dl-line is-current">
          <template v-if="currentWords.length">
            <span
              v-for="(word, index) in currentWords"
              :key="index"
              class="lx-dl-word"
              :data-state="wordStates[index]"
            >{{ word.text }}</span>
          </template>
          <span v-else class="lx-dl-idle">{{ idleText }}</span>
        </p>
        <template v-if="!singleLine && secondaryTracks.length">
          <p
            v-for="(track, index) in secondaryTracks"
            :key="track.role"
            class="lx-dl-line is-secondary"
            :class="{ 'is-tertiary': index > 0 }"
          >{{ track.text }}</p>
        </template>
        <p v-else-if="!singleLine && secondaryText" class="lx-dl-line is-secondary">{{ secondaryText }}</p>
      </div>

      <div v-show="(hovering || isMobile) && !locked" class="lx-dl-tools">
        <button type="button" :aria-label="isPlay ? '暂停' : '播放'" :title="isPlay ? '暂停' : '播放'" @click="player.togglePlay()">
          <LxIcon :name="isPlay ? 'pause' : 'play'" />
        </button>
        <button type="button" aria-label="上一首" title="上一首" @click="player.playPrev()">
          <LxIcon name="prev" />
        </button>
        <button type="button" aria-label="下一首" title="下一首" @click="player.playNext()">
          <LxIcon name="next" />
        </button>
        <span class="lx-dl-sep" aria-hidden="true" />
        <button type="button" aria-label="减小字号" title="减小字号" @click="bumpFont(-2)">A-</button>
        <button type="button" aria-label="增大字号" title="增大字号" @click="bumpFont(2)">A+</button>
        <button
          type="button"
          :class="{ 'is-active': showTranslation }"
          :aria-label="showTranslation ? '隐藏翻译' : '显示翻译'"
          :title="showTranslation ? '隐藏翻译' : '显示翻译'"
          @click="toggleTranslation"
        >
          <LxIcon name="translate" />
        </button>
        <button type="button" aria-label="锁定桌面歌词" title="锁定桌面歌词" @click="locked = true">
          <LxIcon name="lock" />
        </button>
        <button type="button" aria-label="关闭桌面歌词" title="关闭桌面歌词" @click="close">
          <LxIcon name="close" />
        </button>
      </div>

      <button v-show="hovering && locked" type="button" class="lx-dl-unlock" aria-label="解锁桌面歌词" title="解锁桌面歌词" @click="locked = false">
        <LxIcon name="unlock" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * Desktop lyric overlay for the current track.
 *
 * The desktop app renders this in a frameless always-on-top BrowserWindow; the web
 * port renders the same widget as a draggable fixed overlay. It reads the same
 * `lyric.*` settings (font size/weight/colour, translation, single-line, lock) and
 * the same karaoke timing model as the immersive stage, so the two stay in sync.
 */

import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import LxIcon from './LxIcon.vue'
import player from '../core/player'
import { appSetting } from '../core/settings'
import {
  getWordActiveEndTime,
  getWordLookahead,
  resolveSubtitleTracks,
  resolveLegacySubtitleContentMode,
  type LyricWord,
} from '../core/lyric'

const enabled = computed(() => appSetting['lyric.enableDesktopLyric'])
const singleLine = computed(() => appSetting['lyric.singleLine'])
const showRomanization = computed(() => appSetting['lyric.isShowLyricRoma'])
const subtitleMode = computed(() =>
  resolveLegacySubtitleContentMode(
    appSetting['lyric.isShowLyricTranslation'],
    showRomanization.value,
  ),
)
const showTranslation = computed(() => appSetting['lyric.isShowLyricTranslation'])
const locked = computed({
  get: () => appSetting['lyric.isLockDesktopLyric'],
  set: (value: boolean) => {
    appSetting['lyric.isLockDesktopLyric'] = value
  },
})

const hovering = ref(false)
const isMobile = ref(false)

const lines = computed(() => player.state.lyricLines)
const lineIndex = computed(() => player.currentLineIndex.value)
const currentLine = computed(() => lines.value[lineIndex.value] ?? null)
const currentWords = computed<LyricWord[]>(() => currentLine.value?.words ?? [])
const isPlay = computed(() => player.state.isPlay)

const idleText = computed(() => {
  if (player.state.lyricLoading) return '正在加载歌词…'
  const music = player.currentMusic.value
  if (!music.name) return 'Yumo Music · 桌面歌词'
  return lines.value.length ? '♪ ♪ ♪' : `${music.name} - ${music.singer}`
})

/** Alternate rows follow the same translation/romanization switches as the desktop app. */
const secondaryTracks = computed(() => {
  const line = currentLine.value
  const tracks = resolveSubtitleTracks(line, subtitleMode.value)
  return tracks.length ? tracks : []
})

const secondaryText = computed(() => {
  if (secondaryTracks.value.length) return secondaryTracks.value[0]?.text ?? ''
  return lines.value[lineIndex.value + 1]?.fullText ?? ''
})

const wordStates = computed(() => {
  const line = currentLine.value
  if (!line) return []
  const time = player.state.progress
  return line.words.map((word) => {
    const activeEnd = getWordActiveEndTime(word, line.renderHints, line.endTime)
    if (time >= activeEnd) return 'passed'
    if (time >= word.startTime - getWordLookahead(line.renderHints)) return 'active'
    return 'waiting'
  })
})

const rootStyle = computed(() => ({
  left: `${appSetting['lyric.desktopLyricPosition'].x}px`,
  top: `${appSetting['lyric.desktopLyricPosition'].y}px`,
  '--lx-dl-font': `${appSetting['lyric.fontSize']}px`,
  '--lx-dl-color': appSetting['lyric.color'],
  '--lx-dl-shadow': appSetting['lyric.shadowColor'],
  '--lx-dl-weight': String(appSetting['lyric.fontWeight']),
  fontFamily: appSetting['lyric.fontFamily'] || undefined,
}))

function clampPosition() {
  const position = appSetting['lyric.desktopLyricPosition']
  const maxX = Math.max(0, window.innerWidth - 120)
  const maxY = Math.max(0, window.innerHeight - 60)
  position.x = Math.min(Math.max(position.x, 0), maxX)
  position.y = Math.min(Math.max(position.y, 0), maxY)
}

/** Seeds a centred, near-bottom position the first time the widget is shown. */
function ensurePosition() {
  const position = appSetting['lyric.desktopLyricPosition']
  if (position.x || position.y) {
    clampPosition()
    return
  }
  position.x = Math.round(window.innerWidth * 0.5 - 260)
  position.y = Math.round(window.innerHeight * 0.78)
}

let dragOffset = { x: 0, y: 0 }

function startDrag(event: MouseEvent) {
  if (locked.value || isMobile.value) return
  if ((event.target as HTMLElement).closest('.lx-dl-tools')) return
  const position = appSetting['lyric.desktopLyricPosition']
  dragOffset = { x: event.clientX - position.x, y: event.clientY - position.y }
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', endDrag)
  event.preventDefault()
}

function onDrag(event: MouseEvent) {
  const position = appSetting['lyric.desktopLyricPosition']
  position.x = event.clientX - dragOffset.x
  position.y = event.clientY - dragOffset.y
  clampPosition()
}

function endDrag() {
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', endDrag)
}

function bumpFont(delta: number) {
  appSetting['lyric.fontSize'] = Math.min(48, Math.max(14, appSetting['lyric.fontSize'] + delta))
}

function toggleTranslation() {
  appSetting['lyric.isShowLyricTranslation'] = !appSetting['lyric.isShowLyricTranslation']
}

function close() {
  appSetting['lyric.enableDesktopLyric'] = false
}

function syncViewport() {
  isMobile.value = window.matchMedia('(max-width: 760px)').matches
  if (!isMobile.value) clampPosition()
}

onMounted(() => {
  ensurePosition()
  syncViewport()
  window.addEventListener('resize', syncViewport)
})

onBeforeUnmount(() => {
  endDrag()
  window.removeEventListener('resize', syncViewport)
})
</script>

<style>
.lx-dl {
  position: fixed;
  z-index: 96;
  max-width: min(760px, 92vw);
  padding: 10px 18px;
  border-radius: 14px;
  background: rgba(12, 14, 18, 0.42);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.16);
  color: var(--lx-dl-color, #fff);
  user-select: none;
}

.lx-dl.is-locked {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.lx-dl-body.is-draggable {
  cursor: grab;
}

.lx-dl-body.is-draggable:active {
  cursor: grabbing;
}

.lx-dl-line {
  margin: 0;
  text-align: center;
  font-size: var(--lx-dl-font, 22px);
  font-weight: var(--lx-dl-weight, 700);
  line-height: 1.35;
  letter-spacing: 0.02em;
  text-shadow:
    0 0 2px var(--lx-dl-shadow, #000),
    0 1px 3px var(--lx-dl-shadow, #000),
    0 0 14px var(--lx-dl-shadow, #000);
}

.lx-dl-line.is-secondary {
  margin-top: 2px;
  font-size: calc(var(--lx-dl-font, 22px) * 0.62);
  font-weight: calc(var(--lx-dl-weight, 700) - 200);
  opacity: 0.72;
}

.lx-dl-line.is-secondary.is-tertiary {
  font-size: calc(var(--lx-dl-font, 22px) * 0.55);
  opacity: 0.6;
}

.lx-dl.is-single .lx-dl-line.is-secondary {
  display: none;
}

.lx-dl-word {
  display: inline-block;
  white-space: pre;
  transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.28s ease;
}

.lx-dl-word[data-state='waiting'] {
  opacity: 0.42;
}

.lx-dl-word[data-state='active'] {
  opacity: 1;
  transform: scale(1.12);
  text-shadow:
    0 0 2px var(--lx-dl-shadow, #000),
    0 0 12px currentColor,
    0 0 26px currentColor;
}

.lx-dl-word[data-state='passed'] {
  opacity: 0.9;
}

.lx-dl-idle {
  opacity: 0.72;
}

.lx-dl-tools {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.lx-dl-tools button {
  display: grid;
  place-items: center;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 12px;
  font-weight: 600;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.lx-dl-tools button:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
}

.lx-dl-tools button.is-active {
  color: var(--lx-primary-light, #71bf96);
}

.lx-dl-tools svg {
  width: 16px;
  height: 16px;
}

.lx-dl-sep {
  width: 1px;
  height: 16px;
  margin: 0 4px;
  background: rgba(255, 255, 255, 0.16);
}

.lx-dl-unlock {
  position: absolute;
  top: -12px;
  right: -12px;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
}

.lx-dl-unlock svg {
  width: 14px;
  height: 14px;
}

.lx-dl-enter-active,
.lx-dl-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.lx-dl-enter-from,
.lx-dl-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 760px) {
  .lx-dl.is-pinned {
    left: 50% !important;
    top: auto !important;
    bottom: 12px;
    transform: translateX(-50%);
    width: 94vw;
    max-width: 94vw;
  }
}
</style>
