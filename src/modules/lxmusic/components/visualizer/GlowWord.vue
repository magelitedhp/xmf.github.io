<template>
  <span
    ref="wordEl"
    class="folia-glow-word"
    :class="[`is-${state}`, `is-${wordRevealMode}`, { 'is-chorus': chorus }]"
    :style="wordStyle"
  >
    <span class="folia-glow-layer" aria-hidden="true">
      <span
        v-for="(timing, index) in graphemes"
        :key="`${timing.char}-${index}`"
        class="folia-glow-grapheme"
        :class="[`is-${state}`, `is-${wordRevealMode}`]"
        :style="glowStyle(timing, index)"
      >{{ timing.char }}</span>
    </span>
    <span class="folia-word-body" :style="bodyStyle">{{ word.text }}</span>
    <i
      v-if="state === 'active' && chorus"
      :key="`${word.startTime}-${word.endTime}`"
      class="folia-chorus-ripple"
      :style="rippleStyle"
      aria-hidden="true"
    />
  </span>
</template>

<script setup lang="ts">
/**
 * Classic / Partita word renderer.
 *
 * Source:
 * - src/components/visualizer/GlowWord.tsx
 * - src/components/visualizer/glowWordVariants.ts
 * - src/components/visualizer/wordGlow.ts
 *
 * The visualizer receives
 * the same value as a prop and lets CSS own the transition curves.
 */

import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { LyricWord } from '../../core/lyric'
import { colorWithAlpha } from '../../core/theme'
import {
  buildWordGraphemeTimings,
  clamp,
  resolveGlowRamp,
  wordBodyTiming,
  type MotionIntensity,
} from '../../core/foliaMotion'
import type { WordLayoutConfig } from './types'

const props = withDefaults(
  defineProps<{
    word: LyricWord
    state: 'waiting' | 'active' | 'passed'
    config: WordLayoutConfig
    baseColor: string
    activeColor: string
    intensity?: MotionIntensity
    chorus?: boolean
    fontSize?: string
    lineEnd?: number
    hints?: { wordRevealMode: 'normal' | 'fast' | 'instant' }
    rotationEnabled?: boolean
    animationEnabled?: boolean
  }>(),
  {
    intensity: 'normal',
    chorus: false,
    fontSize: '',
    lineEnd: 0,
    hints: () => ({ wordRevealMode: 'normal' }),
    rotationEnabled: true,
    animationEnabled: true,
  },
)

const wordRevealMode = computed(() => props.hints.wordRevealMode)
const graphemes = computed(() => buildWordGraphemeTimings(props.word))
const wordEl = ref<HTMLElement | null>(null)

const wordStyle = computed(() => {
  const config = props.config

  // src/components/visualizer/glowWordVariants.ts
  if (props.state === 'waiting') {
    return {
      '--folia-word-x': `${config.x + Math.sin(config.y) * 100}px`,
      '--folia-word-y': `${config.y + Math.cos(config.x) * 50}px`,
      '--folia-word-scale': '0.5',
      '--folia-word-rotate': `${props.rotationEnabled ? config.rotate + 20 : 0}deg`,
      '--folia-word-opacity': '0',
      marginRight: config.marginRight,
      marginBottom: config.marginBottom ?? '0',
      alignSelf: config.alignSelf,
      fontSize: props.fontSize || undefined,
    }
  }

  if (props.state === 'active') {
    return {
      '--folia-word-x': `${config.x}px`,
      '--folia-word-y': `${config.y}px`,
      '--folia-word-scale': String(Number.isNaN(config.scale) ? 1.5 : config.scale * 1.4),
      '--folia-word-rotate': `${config.rotate}deg`,
      '--folia-word-opacity': '1',
      marginRight: config.marginRight,
      marginBottom: config.marginBottom ?? '0',
      alignSelf: config.alignSelf,
      fontSize: props.fontSize || undefined,
    }
  }

  return {
    '--folia-word-x': `${config.x}px`,
    '--folia-word-y': `${config.y}px`,
    '--folia-word-scale': String(config.scale || 1),
    '--folia-word-rotate': `${props.rotationEnabled ? config.rotate + config.passedRotate : 0}deg`,
    '--folia-word-opacity': String(props.intensity === 'chaotic' ? 0.9 : 0.82),
    marginRight: config.marginRight,
    marginBottom: config.marginBottom ?? '0',
    alignSelf: config.alignSelf,
    fontSize: props.fontSize || undefined,
  }
})

const displayDuration = computed(() => {
  const lineEnd = props.lineEnd || props.word.endTime
  const activeEnd = wordRevealMode.value === 'instant'
    ? lineEnd
    : wordRevealMode.value === 'fast'
      ? Math.min(lineEnd, Math.max(props.word.endTime, props.word.startTime + 0.12))
      : props.word.endTime
  const minimum = wordRevealMode.value === 'instant' ? 0.08 : wordRevealMode.value === 'fast' ? 0.12 : 0.1
  return Math.max(activeEnd - props.word.startTime, minimum)
})

const bodyTiming = computed(() =>
  wordBodyTiming(
    props.state,
    { rawDuration: 0, timingClass: 'normal', renderEndTime: props.lineEnd || props.word.endTime, wordRevealMode: wordRevealMode.value, lineTransitionMode: 'normal' },
    displayDuration.value,
  ),
)

const bodyStyle = computed(() => ({
  '--folia-body-color': props.state === 'active' ? props.activeColor : props.baseColor,
  '--folia-body-blur': props.state === 'waiting' ? '10px' : '0px',
  '--folia-body-color-duration': `${bodyTiming.value.colorDuration}s`,
  '--folia-body-filter-duration': `${bodyTiming.value.filterDuration}s`,
  '--folia-body-color-ease': bodyTiming.value.colorEase,
  '--folia-body-filter-ease': bodyTiming.value.filterEase,
}))

function glowStyle(timing: { char: string; startTime: number; endTime: number }, index: number) {
  const ramp = resolveGlowRamp(
    props.word,
    timing,
    index,
    graphemes.value.length,
    { rawDuration: 0, timingClass: 'normal', renderEndTime: props.lineEnd || props.word.endTime, wordRevealMode: wordRevealMode.value, lineTransitionMode: 'normal' },
    props.lineEnd || props.word.endTime,
  )
  return {
    '--folia-glow-color': colorWithAlpha(props.activeColor, 0.92),
    '--folia-glow-inner': `${Math.round(ramp.innerRadius)}px`,
    '--folia-glow-outer': `${Math.round(ramp.outerRadius)}px`,
    '--folia-glow-duration': `${ramp.duration}s`,
    '--folia-glow-delay': `${ramp.delay}s`,
    '--folia-glow-ease': ramp.ease,
    '--folia-glow-animation': ramp.animationName,
  }
}

const rippleScale = 1.5 + Math.random() * 2
const rippleStyle = computed(() => ({
  borderColor: colorWithAlpha(props.activeColor, 0.8),
  '--folia-ripple-scale': String(clamp(rippleScale, 1.5, 3.5)),
}))

function poseFor(state: 'waiting' | 'active' | 'passed') {
  const config = props.config
  if (state === 'waiting') {
    return {
      x: config.x + Math.sin(config.y) * 100,
      y: config.y + Math.cos(config.x) * 50,
      rotate: props.rotationEnabled ? config.rotate + 20 : 0,
      scale: 0.5,
      opacity: 0,
    }
  }
  if (state === 'active') {
    return {
      x: config.x,
      y: config.y,
      rotate: props.rotationEnabled ? config.rotate : 0,
      scale: Number.isNaN(config.scale) ? 1.5 : config.scale * 1.4,
      opacity: 1,
    }
  }
  return {
    x: config.x,
    y: config.y,
    rotate: props.rotationEnabled ? config.rotate + config.passedRotate : 0,
    scale: config.scale || 1,
    opacity: props.intensity === 'chaotic' ? 0.9 : 0.82,
  }
}

const transformOf = (pose: ReturnType<typeof poseFor>) =>
  `translate3d(${pose.x}px, ${pose.y}px, 0) rotate(${pose.rotate}deg) scale(${pose.scale})`

function readLivePose(): ReturnType<typeof poseFor> | null {
  const el = wordEl.value
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
    opacity: Number.isFinite(opacity) ? opacity : currentPose.opacity,
  }
}

/** Spring samples reproduce Framer's stiffness 200 / damping 20 word transition. */
function springKeyframes(from: ReturnType<typeof poseFor>, to: ReturnType<typeof poseFor>) {
  const frames: Keyframe[] = []
  const state = { ...from }
  const velocity = { x: 0, y: 0, rotate: 0, scale: 0 }
  const dt = 1 / 60
  const duration = 0.72
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
    if (
      Math.abs(state.x - to.x) < 0.05
      && Math.abs(state.y - to.y) < 0.05
      && Math.abs(state.rotate - to.rotate) < 0.05
      && Math.abs(state.scale - to.scale) < 0.001
    ) break
  }
  frames.push({ offset: 1, transform: transformOf(to), opacity: String(to.opacity) })
  return frames
}

let currentPose = poseFor('waiting')
let animation: Animation | null = null

function animateWord(state: 'waiting' | 'active' | 'passed', previous: 'waiting' | 'active' | 'passed') {
  void previous
  const el = wordEl.value
  if (!el || typeof el.animate !== 'function') return
  const to = poseFor(state)
  const previousAnimation = animation
  // Framer resumes from the live animated value. Reading the computed transform
  // before cancelling keeps a word that turns `passed` mid-spring from snapping
  // back to the previous keyframe pose.
  const livePose = previousAnimation ? readLivePose() : null
  if (livePose) currentPose = livePose
  previousAnimation?.cancel()
  animation = null
  if (state === 'waiting') {
    currentPose = to
    el.style.transform = transformOf(to)
    el.style.opacity = String(to.opacity)
    return
  }
  if (state === 'active') {
    const activeAnimation = el.animate(springKeyframes(currentPose, to), { fill: 'both' })
    animation = activeAnimation
    activeAnimation.onfinish = () => {
      currentPose = to
      el.style.transform = transformOf(to)
      el.style.opacity = String(to.opacity)
      activeAnimation.cancel()
      animation = null
    }
    return
  }

  // Passed: Framer animates position/scale over 0.5s while rotate runs for 5s.
  // Sample that pair into one WAAPI track so the rotation starts with the
  // settle instead of waiting for it.
  const from = currentPose
  const settleDuration = wordRevealMode.value === 'instant' ? 0.12 : wordRevealMode.value === 'fast' ? 0.24 : 0.5
  const driftDuration = 5
  const rotateFrom = from.rotate
  const rotateTo = to.rotate
  const stepped = (value: number, fromValue: number, toValue: number) =>
    fromValue + (toValue - fromValue) * Math.min(1, value / settleDuration)
  const frames: Keyframe[] = []
  const steps = 30
  for (let index = 0; index <= steps; index += 1) {
    const time = (driftDuration * index) / steps
    const settleProgress = Math.min(1, time / settleDuration)
    const pose = {
      x: stepped(time, from.x, to.x),
      y: stepped(time, from.y, to.y),
      scale: stepped(time, from.scale, to.scale),
      rotate: rotateFrom + (rotateTo - rotateFrom) * (time / driftDuration),
      opacity: from.opacity + (to.opacity - from.opacity) * settleProgress,
    }
    frames.push({
      offset: time / driftDuration,
      transform: transformOf(pose),
      opacity: String(pose.opacity),
    })
  }
  const passedAnimation = el.animate(frames, {
    duration: props.animationEnabled === false ? 0 : driftDuration * 1000,
    fill: 'both',
  })
  animation = passedAnimation
  passedAnimation.onfinish = () => {
    currentPose = to
    el.style.transform = transformOf(to)
    el.style.opacity = String(to.opacity)
    passedAnimation.cancel()
    animation = null
  }
}

watch(
  () => props.state,
  async (state, previous) => {
    await nextTick()
    animateWord(state, previous)
  },
)
onMounted(() => {
  // Folia always mounts a word in its waiting pose, then lets the active/passed
  // variant run. Starting at the live pose skipped the spring for words that
  // were already being sung when the line appeared.
  currentPose = poseFor('waiting')
  if (wordEl.value) {
    wordEl.value.style.transform = transformOf(currentPose)
    wordEl.value.style.opacity = String(currentPose.opacity)
  }
  if (props.state !== 'waiting') {
    requestAnimationFrame(() => animateWord(props.state, 'waiting'))
  }
})
</script>
