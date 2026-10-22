<template>
  <div
    ref="chunkEl"
    class="folia-partita-chunk"
    :class="`is-${status}`"
    :style="chunkStyle"
  >
    <template v-if="showGuideLines">
      <i
        class="folia-partita-guide is-vertical"
        :class="[`is-${guidePosition}`, `is-${status}`]"
        :style="guideStyle"
      />
      <i
        class="folia-partita-guide is-horizontal"
        :class="[`is-${guidePosition}`, `is-${status}`]"
        :style="guideStyle"
      />
    </template>

    <GlowWord
      v-for="(entry, index) in wordEntries"
      :key="`${entry.word.text}-${index}`"
      :word="entry.word"
      :state="wordState(entry.word)"
      :config="entry.config"
      :base-color="theme.primaryColor"
      :active-color="resolveWordColor(entry.word.text)"
      :intensity="intensity"
      :chorus="isChorus"
      :font-size="fontSize"
      :line-end="renderProfile.renderEndTime"
      :hints="renderProfile"
      :animation-enabled="animationEnabled"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Source: `components/visualizer/partita/PartitaChunk.tsx`.
 *
 * A chunk owns its own waiting/active/passed state so its spring runs once per
 * state change. The setup starts from the waiting pose, as the Framer variants
 * do, rather than from the state the line happened to mount in.
 */

import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import GlowWord from './GlowWord.vue'
import type { WordLayoutConfig } from './types'
import type { LxTheme } from '../../core/theme'
import {
  getWordActiveEndTime,
  getWordLookahead,
  type LyricRenderHints,
  type LyricWord,
} from '../../core/lyric'
import { colorWithAlpha } from '../../core/theme'
import {
  partitaChunkMotion,
  resolveWordState,
  type MotionIntensity,
} from '../../core/foliaMotion'

export interface PartitaChunkConfig {
  id: string
  x: number
  y: number
  rotate: number
  scale: number
  marginBottom: string
  passedRotate: number
}

const props = withDefaults(
  defineProps<{
    chunkWords: LyricWord[]
    displayWords: LyricWord[]
    config: PartitaChunkConfig
    guidePosition: 'left' | 'right'
    time: number
    theme: LxTheme
    intensity?: MotionIntensity
    isChorus?: boolean
    showGuideLines?: boolean
    fontSize?: string
    renderProfile: LyricRenderHints
    animationEnabled?: boolean
  }>(),
  {
    intensity: 'normal',
    isChorus: false,
    showGuideLines: true,
    fontSize: '',
    animationEnabled: true,
  },
)

const chunkEl = ref<HTMLElement | null>(null)
let animation: Animation | null = null
/** The chunk subscribes to the clock itself, as the source's motion-value event does. */
const status = ref<'waiting' | 'active' | 'passed'>('waiting')

const chunkStyle = computed(() => ({
  marginBottom: props.config.marginBottom,
  alignSelf: 'center' as const,
  lineHeight: 1,
  minWidth: 'auto',
  minHeight: 'auto',
  padding: '0.2rem 0.5rem',
}))

const guideColor = computed(() =>
  status.value === 'active'
    ? resolveWordColor(props.displayWords.map((word) => word.text).join(' '))
    : status.value === 'passed'
      ? 'rgba(255,255,255,0.22)'
      : 'rgba(255,255,255,0.14)',
)

const guideStyle = computed(() => ({
  backgroundColor: guideColor.value,
  boxShadow: status.value === 'active' ? `0 0 10px ${colorWithAlpha(guideColor.value, 0.27)}` : 'none',
}))

function seededRandom(seed: number, offset: number) {
  const value = Math.sin(seed + offset) * 10000
  return value - Math.floor(value)
}

const wordEntries = computed(() =>
  props.displayWords.map((word, index) => {
    const seed = props.displayWords[0]?.startTime ?? 0
    const wordSeed = seed + index * 7.13
    const random = (offset: number) => seededRandom(wordSeed, offset)
    const chaotic = props.intensity === 'chaotic'
    const calm = props.intensity === 'calm'
    const spread = chaotic ? 15 : calm ? 0 : 6
    const rotation = chaotic ? 8 : calm ? 0 : 3
    const config: WordLayoutConfig = {
      id: `${props.config.id}-w${index}`,
      x: (random(1) - 0.5) * spread * 2,
      y: (random(2) - 0.5) * spread * 2,
      rotate: (random(3) - 0.5) * rotation * 2,
      scale: props.config.scale,
      marginRight: '0.8rem',
      marginBottom: '0',
      alignSelf: 'auto',
      passedRotate: (random(8) - 0.5) * 20,
    }
    return { word, config }
  }),
)

function resolveWordColor(text: string) {
  return props.theme.wordColors.find((entry) => text.includes(entry.word))?.color ?? props.theme.accentColor
}

function wordState(word: LyricWord) {
  return resolveWordState(
    props.time,
    word,
    props.renderProfile,
    props.renderProfile.renderEndTime,
  )
}

function poseFor(state: 'waiting' | 'active' | 'passed') {
  const motion = partitaChunkMotion(state, props.config, props.guidePosition)
  return {
    x: motion.x,
    y: motion.y,
    rotate: motion.rotate,
    scale: motion.scale,
    opacity: motion.opacity,
  }
}

const transformOf = (pose: ReturnType<typeof poseFor>) =>
  `translate3d(${pose.x}px, ${pose.y}px, 0) rotate(${pose.rotate}deg) scale(${pose.scale})`

function readLivePose(): ReturnType<typeof poseFor> | null {
  const el = chunkEl.value
  if (!el || typeof window === 'undefined') return null
  const style = window.getComputedStyle(el)
  const matrix = style.transform
  const opacity = Number.parseFloat(style.opacity)
  if (!matrix || matrix === 'none') return null
  const match = /^matrix\(([^)]+)\)$/.exec(matrix)
  if (!match) return null
  const values = match[1].split(',').map((part) => Number.parseFloat(part.trim()))
  if (values.length < 6 || values.some((value) => !Number.isFinite(value))) return null
  const [a, b, , , e, f] = values
  return {
    x: e,
    y: f,
    rotate: (Math.atan2(b, a) * 180) / Math.PI,
    scale: Math.hypot(a, b),
    opacity: Number.isFinite(opacity) ? opacity : 1,
  }
}

/** Framer spring 200 / damping 20 sampled into WAAPI keyframes. */
function springKeyframes(from: ReturnType<typeof poseFor>, to: ReturnType<typeof poseFor>) {
  const frames: Keyframe[] = []
  const state = { ...from }
  const velocity = { x: 0, y: 0, rotate: 0, scale: 0 }
  const dt = 1 / 60
  const duration = 1.2
  for (let time = 0; time <= duration; time += dt) {
    for (const key of ['x', 'y', 'rotate', 'scale'] as const) {
      velocity[key] += ((to[key] - state[key]) * 200 - velocity[key] * 20) * dt
      state[key] += velocity[key] * dt
    }
    frames.push({
      offset: Math.min(1, time / duration),
      transform: transformOf(state),
      opacity: String(from.opacity + (to.opacity - from.opacity) * Math.min(1, time / 0.1)),
    })
    const settled =
      Math.abs(state.x - to.x) < 0.05
      && Math.abs(state.y - to.y) < 0.05
      && Math.abs(state.rotate - to.rotate) < 0.05
      && Math.abs(state.scale - to.scale) < 0.001
    if (settled && time > 0.1) break
  }
  frames.push({ offset: 1, transform: transformOf(to), opacity: String(to.opacity) })
  return frames
}

let currentPose = poseFor('waiting')

function applyInstant(pose: ReturnType<typeof poseFor>) {
  const el = chunkEl.value
  if (!el) return
  el.style.transform = transformOf(pose)
  el.style.opacity = String(pose.opacity)
  currentPose = pose
}

function syncStatus() {
  const first = props.chunkWords[0]
  const last = props.chunkWords[props.chunkWords.length - 1]
  if (!first || !last) {
    status.value = 'waiting'
    return
  }
  const end = getWordActiveEndTime(last, props.renderProfile, props.renderProfile.renderEndTime)
  const lookahead = getWordLookahead(props.renderProfile)
  status.value = props.time > end
    ? 'passed'
    : props.time >= first.startTime - lookahead
      ? 'active'
      : 'waiting'
}

function animateChunk(state: 'waiting' | 'active' | 'passed') {
  const el = chunkEl.value
  if (!el || typeof el.animate !== 'function') return
  const to = poseFor(state)
  const livePose = animation ? readLivePose() : null
  if (livePose) currentPose = livePose
  animation?.cancel()
  animation = null

  if (!props.animationEnabled || state === 'waiting') {
    applyInstant(to)
    return
  }

  const frames = state === 'active'
    ? springKeyframes(currentPose, to)
    : [
        { transform: transformOf(currentPose), opacity: String(currentPose.opacity) },
        { transform: transformOf(to), opacity: String(to.opacity) },
      ]
  const next = el.animate(frames, state === 'active'
    ? { fill: 'both' }
    : { duration: 400, easing: 'ease-out', fill: 'both' })
  animation = next
  next.onfinish = () => {
    applyInstant(to)
    next.cancel()
    if (animation === next) animation = null
  }
}

watch(
  () => props.time,
  syncStatus,
)

watch(
  status,
  async (state) => {
    await nextTick()
    animateChunk(state)
  },
)

watch(
  () => [props.config, props.guidePosition, props.displayWords],
  () => {
    animation?.cancel()
    animation = null
    syncStatus()
    currentPose = poseFor('waiting')
    applyInstant(currentPose)
    if (status.value !== 'waiting') requestAnimationFrame(() => animateChunk(status.value))
  },
)

onMounted(() => {
  syncStatus()
  currentPose = poseFor('waiting')
  applyInstant(currentPose)
  if (status.value !== 'waiting') requestAnimationFrame(() => animateChunk(status.value))
})

onBeforeUnmount(() => animation?.cancel())
</script>
