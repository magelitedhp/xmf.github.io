<template>
  <div class="lx-lyric-panel">
    <div class="lx-lyric-panel-head">
      <span class="lx-lyric-panel-title">歌词</span>
      <div class="lx-lyric-panel-tools">
        <button type="button" aria-label="歌词提前" title="歌词提前 0.5s" @click="bumpOffset(-0.5)">
          <LxIcon name="offset" />
        </button>
        <span class="lx-lyric-offset">{{ offsetText }}</span>
        <button type="button" aria-label="歌词延后" title="歌词延后 0.5s" class="is-flip" @click="bumpOffset(0.5)">
          <LxIcon name="offset" />
        </button>
      </div>
    </div>

    <div ref="scrollEl" class="lx-lyric-scroll">
      <div class="lx-lyric-stage">
        <p v-if="!lines.length" class="lx-lyric-empty">{{ emptyText }}</p>
        <button
          v-for="(line, index) in lines"
          :key="line.startTime + '-' + index"
          type="button"
          class="lx-lyric-row"
          :data-lyric-index="index"
          :class="[
            `is-${lineStatus(index)}`,
            {
              'is-chorus': line.isChorus,
              'is-near': Math.abs(index - activeIndex) <= 3,
            },
          ]"
          :style="rowStyle(index)"
          @click="seekTo(line)"
        >
          <span v-if="line.isChorus" class="lx-lyric-chorus-glow" aria-hidden="true" />
          <span class="lx-lyric-text">{{ line.fullText }}</span>
          <span
            v-for="track in subtitleTracks(line)"
            :key="track.role"
            class="lx-lyric-trans"
            :class="{ 'is-secondary': track.role === 'translation' }"
          >
            {{ track.text }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Scrolling lyric list — the desktop app's 播放详情 right-hand column.
 *
 * The immersive stage keeps a kinetic single-line animation; this panel offers the
 * classic list view with auto-scroll, click to seek, and offset adjustment.
 */

import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import LxIcon from './LxIcon.vue'
import player from '../core/player'
import { appSetting } from '../core/settings'
import {
  resolveLegacySubtitleContentMode,
  resolveSubtitleTracks,
  type LyricLine,
} from '../core/lyric'
import {
  LATTICE_EASE,
  MONET_SCALE_SPRING,
  MONET_SCROLL_SPRING,
  clamp,
  resolveLatticeTone,
  stepSpring,
} from '../core/foliaMotion'

const scrollEl = ref<HTMLElement | null>(null)
const rowMetrics = new Map<number, { y: number; scale: number; alpha: number; blur: number; vy: number; vs: number }>()
let previousLines: LyricLine[] = []
let rafId = 0
let lastFrame = 0
let scrollY = 0
let scrollVelocity = 0

const lines = computed(() => player.state.lyricLines)
const activeIndex = computed(() => player.currentLineIndex.value)
const subtitleMode = computed(() =>
  resolveLegacySubtitleContentMode(
    appSetting['lyric.isShowLyricTranslation'],
    appSetting['lyric.isShowLyricRoma'],
  ),
)

function subtitleTracks(line: LyricLine) {
  return resolveSubtitleTracks(line, subtitleMode.value)
}
const emptyText = computed(() => (player.state.lyricLoading ? '正在加载歌词…' : '暂无歌词'))
const offsetText = computed(() => {
  const value = appSetting['lyric.offset']
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}s`
})

function seekTo(line: LyricLine) {
  player.seek(line.startTime)
}

function bumpOffset(delta: number) {
  const next = Math.round((appSetting['lyric.offset'] + delta) * 10) / 10
  appSetting['lyric.offset'] = Math.min(10, Math.max(-10, next))
  player.setLyricOffset(appSetting['lyric.offset'])
}

function lineStatus(index: number): 'active' | 'waiting' | 'passed' {
  if (index === activeIndex.value) return 'active'
  return activeIndex.value >= 0 && index < activeIndex.value ? 'passed' : 'waiting'
}

function rowStyle(index: number) {
  const metric = rowMetrics.get(index)
  const tone = resolveLatticeTone(lineStatus(index), index - activeIndex.value)
  return {
    '--lx-row-y': `${metric?.y ?? 0}px`,
    '--lx-row-scale': String(metric?.scale ?? tone.scale),
    '--lx-row-alpha': String(metric?.alpha ?? tone.alpha),
    '--lx-row-blur': `${metric?.blur ?? tone.blur}px`,
    '--lx-row-base-alpha': String(tone.baseAlpha),
    '--lx-row-duration': '0.28s',
    '--lx-row-ease': LATTICE_EASE,
  }
}

function getTargetY(container: HTMLElement, target: HTMLElement) {
  const align = appSetting['lyric.scrollAlign']
  const anchor =
    align === 'top' ? container.clientHeight * 0.18 : align === 'bottom' ? container.clientHeight * 0.78 : container.clientHeight / 2
  return Math.max(0, target.offsetTop - anchor + target.clientHeight / 2)
}

/** Keeps the active line at the user-selected alignment using Folia's fixed-step spring. */
async function scrollToActive(immediate = false) {
  const container = scrollEl.value
  if (!container || activeIndex.value < 0) return
  await nextTick()
  const target = container.querySelector<HTMLElement>('.lx-lyric-row.is-active')
  if (!target) return
  const destination = getTargetY(container, target)
  if (immediate) {
    scrollY = destination
    scrollVelocity = 0
    container.scrollTop = destination
    return
  }
  scrollVelocity += (destination - scrollY) * 0.12
  scrollVelocity *= 0.72
}

function startFrameLoop() {
  if (rafId) return
  lastFrame = performance.now()
  const frame = (now: number) => {
    const container = scrollEl.value
    if (!container) {
      rafId = 0
      return
    }
    const delta = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000))
    lastFrame = now
    const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight)
    // The target is resolved every frame so resize and offset changes stay smooth.
    const target = container.querySelector<HTMLElement>('.lx-lyric-row.is-active')
    let moving = false
    if (target) {
      const destination = getTargetY(container, target)
      const spring = stepSpring(scrollY, scrollVelocity, destination, delta, MONET_SCROLL_SPRING)
      scrollY = clamp(spring.value, 0, maxScroll)
      scrollVelocity = spring.settled ? 0 : spring.velocity
      container.scrollTop = scrollY
      moving = !spring.settled
    } else if (scrollVelocity !== 0) {
      const spring = stepSpring(scrollY, scrollVelocity, scrollY, delta, MONET_SCROLL_SPRING)
      scrollY = clamp(spring.value, 0, maxScroll)
      scrollVelocity = spring.settled ? 0 : spring.velocity
      container.scrollTop = scrollY
      moving = !spring.settled
    }

    rowMetrics.forEach((metric, index) => {
      const status = lineStatus(index)
      const tone = resolveLatticeTone(status, index - activeIndex.value)
      const scale = stepSpring(metric.scale, metric.vs, tone.scale, delta, MONET_SCALE_SPRING)
      const yTarget = 0
      const y = stepSpring(metric.y, metric.vy, yTarget, delta, MONET_SCROLL_SPRING)
      metric.scale = scale.value
      metric.vs = scale.velocity
      metric.y = y.value
      metric.vy = y.velocity
      metric.alpha += (tone.alpha - metric.alpha) * Math.min(1, delta / 0.28)
      metric.blur += (tone.blur - metric.blur) * Math.min(1, delta / 0.32)
      moving ||= !scale.settled || !y.settled || Math.abs(metric.alpha - tone.alpha) > 0.005
    })
    const rows = container.querySelectorAll<HTMLElement>('.lx-lyric-row')
    rows.forEach((row) => {
      const index = Number(row.dataset.lyricIndex)
      const metric = rowMetrics.get(index)
      if (!metric) return
      row.style.setProperty('--lx-row-y', `${metric.y}px`)
      row.style.setProperty('--lx-row-scale', String(metric.scale))
      row.style.setProperty('--lx-row-alpha', String(metric.alpha))
      row.style.setProperty('--lx-row-blur', `${metric.blur}px`)
    })

    rafId = moving ? requestAnimationFrame(frame) : 0
  }
  rafId = requestAnimationFrame(frame)
}

function syncRowMetrics() {
  const next = new Set(lines.value.map((_, index) => index))
  for (const index of next) {
    if (!rowMetrics.has(index)) {
      const direction = index - activeIndex.value >= 0 ? 34 : -34
      rowMetrics.set(index, {
        y: direction,
        scale: 0.7,
        alpha: 0,
        blur: 5,
        vy: 0,
        vs: 0,
      })
    }
  }
  for (const index of rowMetrics.keys()) {
    if (!next.has(index)) rowMetrics.delete(index)
  }
  startFrameLoop()
}

watch(activeIndex, () => void scrollToActive())
watch(
  lines,
  (value) => {
    if (value !== previousLines) {
      previousLines = value
      syncRowMetrics()
    }
    void scrollToActive()
  },
)
onMounted(() => {
  syncRowMetrics()
  void scrollToActive(true)
})
onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style>
.lx-lyric-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.lx-lyric-panel-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.lx-lyric-panel-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  opacity: 0.82;
}

.lx-lyric-panel-tools {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.lx-lyric-panel-tools button {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.78);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.lx-lyric-panel-tools button:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
}

.lx-lyric-panel-tools button.is-flip svg {
  transform: rotate(180deg);
}

.lx-lyric-panel-tools svg {
  width: 16px;
  height: 16px;
}

.lx-lyric-offset {
  min-width: 44px;
  text-align: center;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  opacity: 0.72;
}

.lx-lyric-scroll {
  flex: auto;
  min-height: 0;
  overflow-y: auto;
  padding: 0 8px;
  scrollbar-width: thin;
}

.lx-lyric-stage {
  position: relative;
  min-height: 100%;
  padding: 18% 0 24%;
}

.lx-lyric-row {
  position: relative;
  display: block;
  width: 100%;
  padding: 9px 12px;
  border-radius: 10px;
  text-align: left;
  color: color-mix(in srgb, var(--lx-lyric-color, #fff) 52%, transparent);
  opacity: var(--lx-row-alpha, 1);
  filter: blur(var(--lx-row-blur, 0));
  transform: translate3d(0, var(--lx-row-y, 0), 0) scale(var(--lx-row-scale, 1));
  transform-origin: left top;
  transition:
    color var(--lx-row-duration, 0.28s) var(--lx-row-ease, cubic-bezier(0.32, 0.72, 0, 1)),
    background-color var(--lx-row-duration, 0.28s) var(--lx-row-ease, cubic-bezier(0.32, 0.72, 0, 1)),
    opacity var(--lx-row-duration, 0.28s) var(--lx-row-ease, cubic-bezier(0.32, 0.72, 0, 1)),
    filter 0.32s var(--lx-row-ease, cubic-bezier(0.32, 0.72, 0, 1));
  will-change: transform, opacity, filter;
}

.lx-lyric-row:hover {
  background: rgba(255, 255, 255, 0.08);
  color: color-mix(in srgb, var(--lx-lyric-color, #fff) 82%, transparent);
}

.lx-lyric-row.is-past {
  color: color-mix(in srgb, var(--lx-lyric-color, #fff) 34%, transparent);
}

.lx-lyric-row.is-active {
  color: var(--lx-lyric-color, #fff);
  font-weight: 600;
}

.lx-lyric-row.is-chorus .lx-lyric-chorus-glow {
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: 12px;
  background: radial-gradient(circle at 50% 45%, var(--folia-glow, rgba(111, 140, 255, 0.18)) 0%, transparent 72%);
  filter: blur(10px);
  opacity: 0;
  transform: scale(0.96);
  transition: opacity 0.45s ease-out, transform 0.45s ease-out;
}

.lx-lyric-row.is-chorus.is-active .lx-lyric-chorus-glow {
  opacity: 1;
  transform: scale(1.02);
}

.lx-lyric-text {
  display: block;
  font-size: var(--lx-lyric-size, 15px);
  font-weight: var(--lx-lyric-weight, 600);
  line-height: 1.4;
}

.lx-lyric-row.is-active .lx-lyric-text {
  text-shadow: 0 0 18px var(--folia-accent, currentColor);
}

.lx-lyric-trans {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.68;
}

.lx-lyric-trans.is-secondary {
  margin-top: 1px;
  font-size: 11px;
  opacity: 0.56;
}

.lx-lyric-empty {
  margin: 0;
  padding: 40px 12px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}
</style>
