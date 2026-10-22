<template>
  <div class="lx-poster-lyrics" :class="{ 'is-ready': ready }">
    <span class="lx-poster-copy lx-lyric-metadata">
      <strong>{{ title }}</strong>
      <small>{{ artist }}</small>
    </span>
    <div ref="hostEl" class="lx-poster-lyrics-canvas">
      <canvas ref="canvasEl" aria-hidden="true" />
    </div>
    <span class="lx-lyric-sr" aria-live="polite">{{ liveText }}</span>
  </div>
</template>

<script setup lang="ts">
/**
 * Canvas2D port of Folia's expanded-poster lyric scene.
 *
 * Layout, token timing, sweep and glow values come from the source Monet lyric
 * model. The source renders through Pixi/WebGL; this keeps the same visible
 * motion with a dependency-free Canvas2D renderer.
 */

import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import player from '../core/player'
import type { LyricLine, SubtitleContentMode } from '../core/lyric'
import { colorWithAlpha, type LxTheme } from '../core/theme'
import {
  MONET_SCALE_SPRING,
  MONET_SCROLL_SPRING,
  resolveLatticeTone,
  stepSpring,
} from '../core/foliaMotion'
import {
  buildLatticeTracks,
  layoutLatticeLine,
  resolveLatticeFillWidth,
  resolveLatticeGlow,
  resolveLatticeLongLineOffset,
  resolveLatticeSweepEnd,
  resolveLatticeSweepSoftness,
  resolveLatticeTypography,
  type LatticeLineLayout,
  type LatticeLyricPiece,
  type LatticeTypography,
  type LatticeTrackInput,
} from '../core/latticeLyrics'

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

interface TextMetricsValue {
  width: number
  height: number
  ascent: number
  descent: number
}

interface CanvasTrack {
  key: string
  index: number
  line: LyricLine
  layout: LatticeLineLayout
  offset: number
  status: LatticeTrackInput['status']
  y: number
  vy: number
  scale: number
  vs: number
  alpha: number
  blur: number
  fromAlpha: number
  fromBlur: number
  elapsed: number
  leaving: boolean
}

const hostEl = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const ready = ref(false)
const liveText = ref('')

const layouts = new Map<string, LatticeLineLayout>()
const tracks = new Map<string, CanvasTrack>()
const metricsCache = new Map<string, TextMetricsValue>()

let context: CanvasRenderingContext2D | null = null
let measureContext: CanvasRenderingContext2D | null = null
let typography: LatticeTypography | null = null
let width = 1
let height = 1
let resolution = 1
let frame = 0
let lastFrameTime = 0
let lastWakeTime = 0
let lastDrawTime = 0
let lastLiveText = ''
let resizeObserver: ResizeObserver | null = null
let resizeTimer = 0
let disposed = false

const ease = cubicBezier(0.32, 0.72, 0, 1)

function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const sample = (a: number, b: number, c: number, u: number) =>
    3 * (1 - u) ** 2 * u * a + 3 * (1 - u) * u ** 2 * b + u ** 3 * c
  return (t: number) => {
    let low = 0
    let high = 1
    for (let index = 0; index < 18; index += 1) {
      const mid = (low + high) / 2
      if (sample(x1, x2, 1, mid) < t) low = mid
      else high = mid
    }
    return sample(y1, y2, 1, (low + high) / 2)
  }
}

function readMetrics(text: string, font: string): TextMetricsValue {
  const key = `${font}\u0000${text}`
  const cached = metricsCache.get(key)
  if (cached) return cached
  if (!measureContext) {
    const surface = document.createElement('canvas')
    measureContext = surface.getContext('2d')
  }
  if (!measureContext) return { width: 0, height: 0, ascent: 0, descent: 0 }
  measureContext.font = font
  const metrics = measureContext.measureText(text)
  const value = {
    width: metrics.width,
    height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
    ascent: metrics.actualBoundingBoxAscent,
    descent: metrics.actualBoundingBoxDescent,
  }
  if (metricsCache.size > 4096) metricsCache.clear()
  metricsCache.set(key, value)
  return value
}

function measure(text: string, font: string) {
  const value = readMetrics(text, font)
  return { width: value.width, height: value.height }
}

function resetScene() {
  tracks.clear()
  layouts.clear()
  metricsCache.clear()
  lastDrawTime = 0
  liveText.value = ''
  lastLiveText = ''
  wake()
}

function lineKey(index: number, line: LyricLine) {
  return `${index}-${line.startTime}-${line.fullText}`
}

function layoutFor(entry: LatticeTrackInput) {
  const key = lineKey(entry.index, entry.line)
  const cached = layouts.get(key)
  if (cached) return cached
  const type = typography
  if (!type) return null
  const layout = layoutLatticeLine(
    entry.line,
    type,
    Math.max(1, width - type.padding * 2),
    measure,
  )
  layouts.set(key, layout)
  return layout
}

function resizeSurface() {
  const host = hostEl.value
  const canvas = canvasEl.value
  if (!host || !canvas || disposed) return
  const nextWidth = Math.max(1, host.clientWidth)
  const nextHeight = Math.max(1, host.clientHeight)
  const nextResolution = Math.min(
    2,
    Math.max(1, Number.isFinite(window.devicePixelRatio) && window.devicePixelRatio > 0
      ? Math.ceil(window.devicePixelRatio)
      : 1),
  )
  if (
    nextWidth === width
    && nextHeight === height
    && nextResolution === resolution
    && typography
  ) {
    wake()
    return
  }

  width = nextWidth
  height = nextHeight
  resolution = nextResolution
  canvas.width = Math.max(1, Math.ceil(width * resolution))
  canvas.height = Math.max(1, Math.ceil(height * resolution))
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  context = ctx
  ctx.setTransform(resolution, 0, 0, resolution, 0, 0)
  typography = resolveLatticeTypography(
    props.theme,
    width,
    height,
    measure,
    props.showTranslation,
    props.subtitleContentMode,
  )
  metricsCache.clear()
  layouts.clear()
  tracks.clear()
  liveText.value = ''
  lastLiveText = ''
  ready.value = true
  wake()
}

function scheduleResize() {
  window.clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(() => {
    resizeTimer = 0
    resizeSurface()
  }, 120)
}

function refreshTracks(entries: LatticeTrackInput[]) {
  const drawnKeys = new Set(entries.map((entry) => lineKey(entry.index, entry.line)))
  for (const track of tracks.values()) {
    if (drawnKeys.has(track.key) || track.leaving) continue
    track.leaving = true
    track.fromAlpha = track.alpha
    track.fromBlur = track.blur
    track.elapsed = 0
  }

  for (const entry of entries) {
    const key = lineKey(entry.index, entry.line)
    let track = tracks.get(key)
    if (!track) {
      const layout = layoutFor(entry)
      if (!layout) continue
      track = {
        key,
        index: entry.index,
        line: entry.line,
        layout,
        offset: entry.offset,
        status: entry.status,
        y: height * 0.46 + (entry.offset >= 0 ? 34 : -34),
        vy: 0,
        scale: 0.7,
        vs: 0,
        alpha: 0,
        blur: 5,
        fromAlpha: 0,
        fromBlur: 5,
        elapsed: 0,
        leaving: false,
      }
      tracks.set(key, track)
    }
    track.status = entry.status
    track.offset = entry.offset
    track.leaving = false
  }

  if (tracks.size > 5) {
    for (const [key, track] of tracks) {
      if (track.leaving && tracks.size > 5) tracks.delete(key)
    }
  }
}

function parseColor(color: string): [number, number, number] | null {
  const value = color.trim()
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value)
  if (short) {
    return [
      Number.parseInt(short[1] + short[1], 16),
      Number.parseInt(short[2] + short[2], 16),
      Number.parseInt(short[3] + short[3], 16),
    ]
  }
  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value)
  if (long) {
    return [
      Number.parseInt(long[1], 16),
      Number.parseInt(long[2], 16),
      Number.parseInt(long[3], 16),
    ]
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(value)
  if (rgb) {
    const channels = rgb[1].split(',').slice(0, 3).map((part) => Number.parseFloat(part.trim()))
    if (channels.every((channel) => Number.isFinite(channel))) {
      return [channels[0], channels[1], channels[2]]
    }
  }
  return null
}

function rgba(color: string, alpha: number) {
  const channels = parseColor(color)
  if (!channels) return colorWithAlpha(color, alpha)
  return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${Math.min(1, Math.max(0, alpha))})`
}

function mixColor(from: string, to: string, amount: number) {
  const a = parseColor(from)
  const b = parseColor(to)
  if (!a || !b) return amount >= 0.5 ? to : from
  const mix = (x: number, y: number) =>
    Math.round(x + (y - x) * Math.min(1, Math.max(0, amount)))
  return `rgb(${mix(a[0], b[0])}, ${mix(a[1], b[1])}, ${mix(a[2], b[2])})`
}

function wordColorOf(piece: LatticeLyricPiece, chorus: boolean) {
  const custom = props.theme.wordColors.find((entry) =>
    piece.text.includes(entry.word) || entry.word.includes(piece.text),
  )
  if (custom?.color) return custom.color
  return chorus
    ? mixColor(props.theme.primaryColor, props.theme.accentColor, 0.48)
    : props.theme.primaryColor
}

function fontFor(piece: LatticeLyricPiece) {
  if (!typography) return ''
  return piece.translation ? typography.translationFont : typography.font
}

function baselineFor(piece: LatticeLyricPiece, font: string, y: number) {
  if (!typography) return y
  const px = piece.translation ? typography.translationPx : typography.fontPx
  const metrics = readMetrics(piece.text, font)
  return y + Math.max(px, metrics.ascent)
}

function pieceY(
  piece: LatticeLyricPiece,
  layout: LatticeLineLayout,
  status: LatticeTrackInput['status'],
) {
  if (!typography) return piece.y
  const maxText = status === 'active' ? Infinity : typography.lineHeight * 2
  return piece.translation && status !== 'active'
    ? Math.min(layout.textHeight, maxText)
      + typography.fontPx * 0.3
      + piece.row * typography.translationLineHeight
    : piece.y
}

function drawGlow(
  ctx: CanvasRenderingContext2D,
  track: CanvasTrack,
  time: number,
  quiet: boolean,
) {
  if (quiet || !typography || track.status === 'waiting') return
  const chorus = Boolean(track.line.isChorus)
  const lineEnd = track.line.renderHints.renderEndTime
  for (const piece of track.layout.pieces) {
    if (piece.translation || !piece.token.timed) continue
    const start = piece.token.startTime ?? Infinity
    const end = piece.token.endTime ?? Infinity
    const glow = resolveLatticeGlow(time, start, end, lineEnd)
    if (glow <= 0) continue
    const wordColor = wordColorOf(piece, chorus)
    const color = mixColor(props.theme.primaryColor, wordColor, glow)
    const font = fontFor(piece)
    const y = pieceY(piece, track.layout, track.status)
    const baseline = baselineFor(piece, font, y)
    const alpha = glow * (chorus ? 1 : 0.88)
    const radii = [
      typography.fontPx * (chorus ? 0.45 : 0.28),
      typography.fontPx * (chorus ? 0.9 : 0.65),
    ]
    for (const radius of radii) {
      ctx.save()
      ctx.font = font
      ctx.textBaseline = 'alphabetic'
      ctx.fillStyle = rgba(color, alpha)
      ctx.filter = `blur(${radius}px)`
      ctx.fillText(piece.text, piece.x, baseline)
      ctx.restore()
    }
  }
}

function drawFill(
  ctx: CanvasRenderingContext2D,
  piece: LatticeLyricPiece,
  time: number,
  color: string,
  font: string,
  baseline: number,
) {
  if (!typography) return
  const start = piece.token.startTime ?? Infinity
  const end = piece.token.endTime ?? Infinity
  const filled = resolveLatticeFillWidth(
    time,
    start,
    end,
    piece.offsets,
    piece.token.graphemeTimings,
  )
  if (filled <= 0) return
  const fullWidth = piece.offsets[piece.offsets.length - 1] ?? piece.width
  const softness = resolveLatticeSweepSoftness(typography.fontPx)
  const front = resolveLatticeSweepEnd(filled, fullWidth, softness)
  const frontX = piece.x + front - piece.tokenOffset
  if (frontX <= piece.x) return
  const startX = frontX - softness
  const middleX = frontX - softness * 0.55
  const gradientStart = Math.max(piece.x, startX)
  const gradient = ctx.createLinearGradient(
    gradientStart,
    0,
    Math.max(gradientStart + 0.001, frontX),
    0,
  )
  gradient.addColorStop(0, rgba(color, 1))
  if (middleX > gradientStart) {
    gradient.addColorStop(
      Math.min(1, (middleX - gradientStart) / Math.max(0.001, frontX - gradientStart)),
      rgba(color, 0.92),
    )
  }
  gradient.addColorStop(1, rgba(color, 0))

  ctx.save()
  ctx.beginPath()
  ctx.rect(
    piece.x - 2,
    baseline - typography.fontPx * 1.25,
    Math.max(0, frontX - piece.x + 2),
    typography.fontPx * 1.8,
  )
  ctx.clip()
  ctx.font = font
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = gradient
  ctx.fillText(piece.text, piece.x, baseline)
  ctx.restore()
}

function drawTrack(
  ctx: CanvasRenderingContext2D,
  track: CanvasTrack,
  time: number,
  quiet: boolean,
) {
  const type = typography
  if (!type) return
  ctx.save()
  ctx.globalAlpha = track.alpha
  ctx.translate(type.padding, track.y)
  ctx.scale(track.scale, track.scale)
  ctx.filter = !quiet && track.blur > 0.05 ? `blur(${track.blur}px)` : 'none'

  drawGlow(ctx, track, time, quiet)

  const chorus = Boolean(track.line.isChorus)
  for (const piece of track.layout.pieces) {
    const top = pieceY(piece, track.layout, track.status)
    const visible = (piece.translation ? track.status === 'active' : top < type.lineHeight * 2)
      && track.y + top * track.scale > -type.lineHeight * 2
      && track.y + top * track.scale < height + type.lineHeight * 2
    if (!visible) continue
    const font = fontFor(piece)
    const baseline = baselineFor(piece, font, top)
    const start = piece.token.startTime ?? Infinity
    const end = piece.token.endTime ?? Infinity
    const passed = piece.token.timed
      && (track.status === 'passed' || (track.status === 'active' && time > end))
    const baseAlpha = piece.translation
      ? 0.68
      : resolveLatticeTone(track.status, track.offset).baseAlpha

    ctx.save()
    ctx.font = font
    ctx.textBaseline = 'alphabetic'
    ctx.globalAlpha = baseAlpha
    ctx.fillStyle = passed ? wordColorOf(piece, chorus) : props.theme.primaryColor
    ctx.fillText(piece.text, piece.x, baseline)
    ctx.restore()

    if (!passed && track.status === 'active' && piece.token.timed && time > start) {
      drawFill(ctx, piece, time, wordColorOf(piece, chorus), font, baseline)
    }
  }
  ctx.restore()
}

function applyEdgeFade(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.globalCompositeOperation = 'destination-in'
  const horizontal = ctx.createLinearGradient(0, 0, width, 0)
  horizontal.addColorStop(0, 'rgba(0, 0, 0, 0)')
  horizontal.addColorStop(0.04, 'rgba(0, 0, 0, 1)')
  horizontal.addColorStop(0.96, 'rgba(0, 0, 0, 1)')
  horizontal.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = horizontal
  ctx.fillRect(0, 0, width, height)
  const vertical = ctx.createLinearGradient(0, 0, 0, height)
  vertical.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vertical.addColorStop(0.09, 'rgba(0, 0, 0, 1)')
  vertical.addColorStop(0.91, 'rgba(0, 0, 0, 1)')
  vertical.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = vertical
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}

function draw(time: number, delta: number) {
  const ctx = context
  const type = typography
  if (!ctx || !type || width < 2 || height < 2) return false
  const quiet = props.reducedMotion
  ctx.clearRect(0, 0, width, height)

  if (time < lastDrawTime || Math.abs(time - lastDrawTime) > 0.75) tracks.clear()
  lastDrawTime = time

  const entries = buildLatticeTracks(props.lines, time)
  refreshTracks(entries)
  const activeEntry = entries.find((entry) => entry.offset === 0)
  const anchor = activeEntry
    ? tracks.get(lineKey(activeEntry.index, activeEntry.line))
    : undefined
  const room = Math.max(type.lineHeight, height - type.padding * 2)
  const activeHeight = anchor
    ? Math.min(
        room,
        anchor.status === 'active'
          ? anchor.layout.height
          : Math.min(anchor.layout.textHeight, type.lineHeight * 2)
            * resolveLatticeTone(anchor.status, 0).scale,
      )
    : 0
  const anchorY = Math.max(type.padding, height * 0.46 - activeHeight / 2)
  const gap = Math.max(18, type.fontPx * 0.49)
  let moving = false

  const ordered = [...tracks.values()].sort((a, b) => {
    const rank = (track: CanvasTrack) =>
      track.status === 'active' ? 4 : track.status === 'waiting' ? 2 : 1
    return rank(a) - rank(b)
  })

  for (const track of ordered) {
    const tone = resolveLatticeTone(track.status, track.offset)
    const contextHeight = Math.min(track.layout.textHeight, type.lineHeight * 2)
    let targetY = track.offset < 0
      ? anchorY - contextHeight * tone.scale - gap
      : track.offset > 0
        ? anchorY + activeHeight + gap
        : anchorY
    if (track.offset === 0 && track.status === 'active') {
      targetY -= resolveLatticeLongLineOffset(
        track.layout,
        time,
        room,
        type.lineHeight,
      )
    }
    if (track.leaving) targetY += track.offset < 0 || track.status === 'passed' ? -38 : 38

    const sy = stepSpring(track.y, track.vy, targetY, delta, MONET_SCROLL_SPRING)
    const ss = stepSpring(track.scale, track.vs, tone.scale, delta, MONET_SCALE_SPRING)
    track.y = quiet ? targetY : sy.value
    track.vy = quiet ? 0 : sy.velocity
    track.scale = quiet ? tone.scale : ss.value
    track.vs = quiet ? 0 : ss.velocity
    track.elapsed += delta
    const targetAlpha = track.leaving ? 0 : tone.alpha
    const fade = quiet ? 1 : ease(Math.min(1, track.elapsed / 0.28))
    const blurFade = quiet ? 1 : ease(Math.min(1, track.elapsed / 0.32))
    track.alpha = track.fromAlpha + (targetAlpha - track.fromAlpha) * fade
    track.blur = track.fromBlur + (tone.blur - track.fromBlur) * blurFade
    if (track.leaving && fade === 1) {
      tracks.delete(track.key)
      continue
    }
    moving ||= !quiet && (
      !sy.settled
      || !ss.settled
      || track.elapsed < 0.32
      || track.leaving
    )
    drawTrack(ctx, track, time, quiet)
  }

  applyEdgeFade(ctx)

  const nextLive = activeEntry?.status === 'active' ? activeEntry.line.fullText : ''
  if (nextLive !== lastLiveText) {
    lastLiveText = nextLive
    liveText.value = nextLive
  }
  return moving
}

function wake() {
  if (disposed || document.hidden || frame) return
  const now = performance.now()
  if (now - lastWakeTime > 100) lastFrameTime = 0
  lastWakeTime = now
  frame = requestAnimationFrame(tick)
}

function tick(now: number) {
  frame = 0
  if (disposed || document.hidden) return
  const delta = lastFrameTime ? Math.min(0.05, (now - lastFrameTime) / 1000) : 1 / 60
  lastFrameTime = now
  if (draw(player.state.progress, delta)) wake()
}

function onVisibilityChange() {
  if (!document.hidden) {
    lastFrameTime = 0
    wake()
  }
}

watch(() => props.songKey, resetScene)
watch(() => props.lines, resetScene)
watch(
  () => props.theme,
  () => {
    typography = null
    scheduleResize()
  },
)
watch(
  () => [props.showTranslation, props.subtitleContentMode],
  () => {
    typography = null
    scheduleResize()
  },
)
watch(() => player.state.progress, wake)

onMounted(() => {
  resizeSurface()
  const host = hostEl.value
  if (host) {
    resizeObserver = new ResizeObserver(scheduleResize)
    resizeObserver.observe(host)
  }
  document.addEventListener('visibilitychange', onVisibilityChange)
  if (document.fonts) {
    void document.fonts.ready
      .then(() => {
        if (disposed) return
        metricsCache.clear()
        layouts.clear()
        scheduleResize()
      })
      .catch(() => undefined)
  }
  wake()
})

onBeforeUnmount(() => {
  disposed = true
  if (frame) cancelAnimationFrame(frame)
  window.clearTimeout(resizeTimer)
  resizeObserver?.disconnect()
  document.removeEventListener('visibilitychange', onVisibilityChange)
  tracks.clear()
  layouts.clear()
  metricsCache.clear()
})
</script>
