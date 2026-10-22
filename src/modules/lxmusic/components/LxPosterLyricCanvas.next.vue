<template>
  <div class="lx-poster-lyrics" :class="{ 'is-ready': ready }">
    <span class="lx-poster-copy lx-lyric-metadata">
      <strong>{{ title }}</strong>
      <small>{{ artist }}</small>
    </span>
    <div ref="hostEl" class="lx-poster-lyrics-canvas" aria-hidden="true" />
    <span class="lx-lyric-sr" aria-live="polite">{{ liveText }}</span>
  </div>
</template>

<script setup lang="ts">
/**
 * Vue lifecycle wrapper for the Pixi lyric runtime ported from
 * `app/lattice/lyrics/createLatticeLyricRuntime.ts`.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import player from '../core/player'
import type { LyricLine, SubtitleContentMode } from '../core/lyric'
import type { LxTheme } from '../core/theme'
import {
  createLatticeLyricRuntime,
  type LatticeLyricRuntime,
  type LatticeLyricRuntimeInput,
} from '../core/latticeLyricRuntime'
import { findLineIndex } from '../core/lyric'
import { useFontsEpoch } from '../core/useFontsEpoch'

const props = withDefaults(
  defineProps<{
    songKey: string
    title: string
    artist: string
    lines: LyricLine[]
    theme: LxTheme
    reducedMotion?: boolean
    showTranslation?: boolean
    subtitleContentMode?: SubtitleContentMode
  }>(),
  {
    reducedMotion: false,
    showTranslation: true,
    subtitleContentMode: 'translation',
  },
)

const RESIZE_SETTLE_MS = 120

const hostEl = ref<HTMLDivElement | null>(null)
const ready = ref(false)
const liveText = ref('')

let runtime: LatticeLyricRuntime | null = null
let session: AbortController | null = null
let active = true
let intersecting = false
let resizeObserver: ResizeObserver | null = null
let intersectionObserver: IntersectionObserver | null = null
let resizeTimer = 0
let disposed = false
let lastLiveText = ''
const box = { width: 0, height: 0 }
const fontsEpoch = useFontsEpoch()

const runtimeInput = computed<LatticeLyricRuntimeInput>(() => ({
  songKey: props.songKey,
  lines: props.lines,
  theme: props.theme,
  subtitleTheme: props.theme,
  showTranslation: props.showTranslation,
  subtitleContentMode: props.subtitleContentMode,
  keywordColoringEnabled: true,
  reducedMotion: props.reducedMotion,
  fontsEpoch: fontsEpoch.value,
}))

function visible() {
  return intersecting && !document.hidden
}

function updateLiveText() {
  const index = findLineIndex(props.lines, player.state.progress)
  const next = index >= 0 ? props.lines[index]?.fullText ?? '' : ''
  if (next !== lastLiveText) {
    lastLiveText = next
    liveText.value = next
  }
}

function fail(error: unknown) {
  if (!active) return
  console.warn('[Lattice lyrics] Falling back to the song title', error)
  runtime?.destroy()
  runtime = null
  ready.value = false
}

function syncLayout() {
  runtime?.update(runtimeInput.value)
  runtime?.setTime(player.state.progress)
  runtime?.resize(box.width, box.height, window.devicePixelRatio)
  updateLiveText()
}

function scheduleResize() {
  window.clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(() => {
    resizeTimer = 0
    syncLayout()
  }, RESIZE_SETTLE_MS)
}

function onVisibilityChange() {
  runtime?.setVisible(visible())
}

function onContextLost(event: Event) {
  event.preventDefault()
  fail(new Error('WebGL context lost'))
}

function startSession() {
  const host = hostEl.value
  if (!host || disposed || !props.lines.some((line) => line.fullText.trim())) return

  active = true
  box.width = host.clientWidth
  box.height = host.clientHeight
  session = new AbortController()
  let mountedRuntime: LatticeLyricRuntime | null = null
  void createLatticeLyricRuntime(
    host,
    runtimeInput.value,
    player.state.progress,
    session.signal,
    fail,
  )
    .then((created) => {
      if (!created || !active || disposed) {
        created?.destroy()
        return
      }
      mountedRuntime = created
      runtime = created
      created.attach(host)
      created.setErrorHandler(fail)
      created.update(runtimeInput.value)
      created.setTime(player.state.progress)
      created.setVisible(visible())
      created.resize(box.width, box.height, window.devicePixelRatio)
      ready.value = true
    })
    .catch(fail)

  resizeObserver = new ResizeObserver((entries) => {
    const rect = entries[0]?.contentRect
    if (!rect || (rect.width === box.width && rect.height === box.height)) return
    box.width = rect.width
    box.height = rect.height
    scheduleResize()
  })
  resizeObserver.observe(host)
  intersectionObserver = new IntersectionObserver((entries) => {
    intersecting = entries[0]?.isIntersecting ?? false
    onVisibilityChange()
  })
  intersectionObserver.observe(host)
  document.addEventListener('visibilitychange', onVisibilityChange)
  host.addEventListener('webglcontextlost', onContextLost, true)
  void mountedRuntime
}

function stopSession() {
  active = false
  window.clearTimeout(resizeTimer)
  resizeTimer = 0
  resizeObserver?.disconnect()
  resizeObserver = null
  intersectionObserver?.disconnect()
  intersectionObserver = null
  document.removeEventListener('visibilitychange', onVisibilityChange)
  hostEl.value?.removeEventListener('webglcontextlost', onContextLost, true)
  session?.abort()
  session = null
  runtime?.destroy()
  runtime = null
  ready.value = false
}

watch(
  () => [props.songKey, props.lines],
  () => {
    syncLayout()
  },
)

watch(
  () => [props.theme, props.showTranslation, props.subtitleContentMode, fontsEpoch.value],
  () => {
    runtime?.update(runtimeInput.value)
  },
)

watch(
  () => props.reducedMotion,
  () => {
    runtime?.update(runtimeInput.value)
  },
)

watch(
  () => player.state.progress,
  (time) => {
    runtime?.setTime(time)
    updateLiveText()
  },
)

onMounted(() => {
  intersecting = true
  if (document.fonts) {
    void document.fonts.ready
      .then(() => {
        if (!disposed) {
          runtime?.update(runtimeInput.value)
          scheduleResize()
        }
      })
      .catch(() => undefined)
  }
  startSession()
  updateLiveText()
})

onBeforeUnmount(() => {
  disposed = true
  stopSession()
})
</script>
