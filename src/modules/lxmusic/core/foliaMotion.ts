/**
 * Motion vocabulary for the immersive lyric stage.
 *
 * This module contains no playback or lyric business logic. It only turns the
 * timing tables into values that the Vue renderer can consume.
 */

import type { LyricLine, LyricRenderHints, LyricWord } from './lyric'
import { getWordActiveEndTime, getWordDisplayDuration } from './lyric'

export type MotionIntensity = 'calm' | 'normal' | 'chaotic'
export type WordMotionState = 'waiting' | 'active' | 'passed'

export interface GraphemeTiming {
  char: string
  startTime: number
  endTime: number
}

export interface GlowRamp {
  innerRadius: number
  outerRadius: number
  duration: number
  delay: number
  ease: string
  animationName: 'folia-glow-sustain' | 'folia-glow-sweep'
}

export interface LatticeTone {
  alpha: number
  scale: number
  blur: number
  baseAlpha: number
}

export interface SpringSpec {
  stiffness: number
  damping: number
  mass: number
}

export interface SpringStep {
  value: number
  velocity: number
  settled: boolean
}

export interface FlyInMotion {
  x: number
  y: number
  delay: number
}

export interface ScatterMotion {
  x: number
  y: number
  rotate: number
  delay: number
}

// src/components/visualizer/monet/monetLyricMotion.ts
export const MONET_SCROLL_SPRING: SpringSpec = { stiffness: 142, damping: 28, mass: 0.82 }
export const MONET_SCALE_SPRING: SpringSpec = { stiffness: 150, damping: 30, mass: 0.78 }

// src/components/visualizer/classic/Visualizer.tsx
// src/components/visualizer/partita/VisualizerPartita.tsx
export const LINE_FLOAT = {
  calm: { distance: 10, duration: 8.5 },
  normal: { distance: 14, duration: 7 },
  chaotic: { distance: 18, duration: 5.8 },
} as const

// src/components/modal/settings/kit/motion.ts
export const KIT_MOTION = {
  fast: 0.12,
  move: 0.22,
  unfold: 0.3,
  show: 0.48,
  flash: 2.2,
  tooltipDelay: 0.4,
  confirm: 1.6,
} as const

export const KIT_EASE = {
  out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
} as const

export const LATTICE_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'
export const FLY_IN_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'
export const SCATTER_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
export const OVERLAY_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
export const SEARCH_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

/** Deterministic 0..1 value used by Folia's seeded layouts. */
export function seededUnit(seed: number, offset = 0): number {
  const value = Math.sin(seed + offset) * 10000
  return value - Math.floor(value)
}

/** Stable string seed used by the grid fly-in and scatter transitions. */
export function hashSeed(key: string | number): number {
  const text = String(key)
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0
  }
  return (hash % 1000) / 1000
}

type SegmenterConstructor = new (
  locales?: string | string[],
  options?: { granularity: 'grapheme' },
) => { segment(input: string): Iterable<{ segment: string }> }

const segmenterConstructor = (Intl as typeof Intl & { Segmenter?: SegmenterConstructor }).Segmenter
const graphemeSegmenter = segmenterConstructor
  ? new segmenterConstructor(undefined, { granularity: 'grapheme' })
  : null

// src/utils/lyrics/graphemeTiming.ts
export function splitGraphemes(text: string): string[] {
  if (!text) return []
  if (graphemeSegmenter) {
    return Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment)
  }
  return Array.from(text)
}

export function buildWordGraphemeTimings(word: LyricWord): GraphemeTiming[] {
  const graphemes = splitGraphemes(word.text)
  if (!graphemes.length) return []
  const duration = Math.max(word.endTime - word.startTime, 0)
  const unit = duration / graphemes.length
  return graphemes.map((char, index) => ({
    char,
    startTime: word.startTime + unit * index,
    endTime: index === graphemes.length - 1 ? word.endTime : word.startTime + unit * (index + 1),
  }))
}

// src/components/visualizer/GlowWord.tsx
// src/components/visualizer/glowWordTiming.ts
export function resolveWordState(
  time: number,
  word: LyricWord,
  hints: LyricRenderHints,
  lineEnd: number,
): WordMotionState {
  const activeEnd = getWordActiveEndTime(word, hints, lineEnd)
  const lookahead = hints.wordRevealMode === 'instant' ? 0.03 : hints.wordRevealMode === 'fast' ? 0.08 : 0.15
  // src/components/visualizer/GlowWord.tsx: active includes the boundary;
  // passed starts strictly after it.
  if (time > activeEnd) return 'passed'
  if (time >= word.startTime - lookahead) return 'active'
  return 'waiting'
}

export function resolveGlowRamp(
  word: LyricWord,
  timing: GraphemeTiming,
  index: number,
  total: number,
  hints: LyricRenderHints,
  lineEnd: number,
): GlowRamp {
  const duration = getWordDisplayDuration(word, hints, lineEnd)

  // src/components/visualizer/wordGlow.ts
  if (hints.wordRevealMode === 'instant') {
    return {
      innerRadius: 14,
      outerRadius: 24,
      duration: Math.min(duration || 0.08, 0.12),
      delay: 0,
      ease: 'ease-out',
      animationName: 'folia-glow-sweep',
    }
  }

  if (hints.wordRevealMode === 'fast') {
    return {
      innerRadius: 18,
      outerRadius: 32,
      duration: clamp(duration || 0.12, 0.12, 0.2),
      delay: 0,
      ease: 'ease-in-out',
      animationName: 'folia-glow-sweep',
    }
  }

  if (total > 1) {
    const charDuration = Math.max(timing.endTime - timing.startTime, 0.001)
    return {
      innerRadius: 20,
      outerRadius: 40,
      duration: charDuration * 6,
      delay: Math.max(0, timing.startTime - word.startTime),
      ease: 'ease-in-out',
      animationName: 'folia-glow-sweep',
    }
  }

  return {
    innerRadius: 20,
    outerRadius: 40,
    duration: duration || 0.1,
    delay: index * 0,
    ease: 'ease-in-out',
    animationName: 'folia-glow-sustain',
  }
}

export function wordBodyTiming(state: WordMotionState, hints: LyricRenderHints, duration: number) {
  if (state === 'waiting') {
    return { colorDuration: 0.4, filterDuration: 0.4, colorEase: 'ease', filterEase: 'ease' }
  }
  if (state === 'active') {
    return {
      colorDuration: duration || 0.2,
      filterDuration: hints.wordRevealMode === 'instant' ? 0.08 : hints.wordRevealMode === 'fast' ? 0.12 : 0.2,
      colorEase: 'linear',
      filterEase: 'ease',
    }
  }
  return {
    colorDuration: hints.wordRevealMode === 'instant' ? 0.12 : hints.wordRevealMode === 'fast' ? 0.24 : 0.8,
    filterDuration: hints.wordRevealMode === 'instant' ? 0.12 : hints.wordRevealMode === 'fast' ? 0.2 : 0.5,
    colorEase: 'ease-in-out',
    filterEase: 'ease',
  }
}

// src/components/visualizer/glowWordTiming.ts
export function lineTransitionClass(line: LyricLine | null): string {
  return `folia-line is-${line?.renderHints.lineTransitionMode ?? 'normal'}`
}

export function lineFloatStyle(intensity: MotionIntensity) {
  const config = LINE_FLOAT[intensity]
  return {
    '--folia-breathe-distance': `${config.distance}px`,
    '--folia-breathe-duration': `${config.duration}s`,
  }
}

// src/components/visualizer/partita/partitaLayout.ts
export function partitaChunkMotion(
  chunkState: WordMotionState,
  config: { x: number; y: number; rotate: number },
  guidePosition: 'left' | 'right',
) {
  if (chunkState === 'waiting') {
    return {
      opacity: 0,
      scale: 0.85,
      x: config.x + (guidePosition === 'left' ? -40 : 40),
      y: config.y,
      rotate: config.rotate,
    }
  }
  return {
    opacity: 1,
    scale: 1,
    x: config.x,
    y: config.y,
    rotate: config.rotate,
  }
}

// src/components/app/lattice/lyrics/createLatticeLyricRuntime.ts
// src/components/visualizer/monet/monetLyricMotion.ts
export function resolveLatticeTone(
  status: 'active' | 'waiting' | 'passed',
  offset: number,
): LatticeTone {
  if (status === 'active') {
    return { alpha: 1, scale: 1, blur: 0, baseAlpha: 0.34 }
  }

  const distance = Math.max(Math.abs(offset), 1)
  const waiting = status === 'waiting'
  return {
    alpha: waiting
      ? Math.max(0.36, 0.72 - (distance - 1) * 0.18)
      : Math.max(0.28, 0.52 - (distance - 1) * 0.12),
    scale: Math.max(0.68, 0.72 * Math.pow(0.9, distance - 1)),
    blur: waiting ? (distance === 1 ? 0.7 : 1.8 + (distance - 2) * 0.8) : 1.1 + (distance - 1) * 0.7,
    baseAlpha: waiting ? 0.46 : 0.36,
  }
}

/** Fixed substeps keep the lattice spring stable after a delayed frame. */
export function stepSpring(
  value: number,
  velocity: number,
  target: number,
  delta: number,
  spring: SpringSpec,
): SpringStep {
  const steps = Math.max(1, Math.ceil(delta * 120))
  const dt = delta / steps
  let nextValue = value
  let nextVelocity = velocity
  for (let index = 0; index < steps; index += 1) {
    nextVelocity +=
      (((target - nextValue) * spring.stiffness - nextVelocity * spring.damping) / spring.mass) * dt
    nextValue += nextVelocity * dt
  }
  const settled = Math.abs(nextValue - target) < 0.01 && Math.abs(nextVelocity) < 0.01
  return {
    value: settled ? target : nextValue,
    velocity: settled ? 0 : nextVelocity,
    settled,
  }
}

// src/library/suites/grid/transitions/morphGeometry.ts
// src/library/suites/grid/transitions/morphFlyIn.ts
export function collectionTravel(viewportWidth: number, viewportHeight: number): number {
  return Math.min(Math.min(viewportWidth, viewportHeight) * 0.32, 260)
}

export function flyInMotion(
  row: number,
  total: number,
  seed: number,
  viewportWidth: number,
  viewportHeight: number,
): FlyInMotion {
  const reach = collectionTravel(viewportWidth, viewportHeight)
  const yRatio = total > 1 ? row / (total - 1) - 0.5 : 0
  const xDirection = (seed - 0.5) * 0.55
  const distance = Math.hypot(xDirection, yRatio)
  const normalized = Math.min(distance / 0.72, 1)
  const eased = normalized * normalized * (3 - 2 * normalized)
  return {
    x: xDirection * reach,
    y: yRatio * reach,
    delay: Math.min(0.04 + eased * 0.34 + seed * 0.04, 0.32),
  }
}

// src/library/suites/grid/transitions/morphScatter.ts
export function scatterMotion(
  row: number,
  total: number,
  seed: number,
  viewportWidth: number,
  viewportHeight: number,
): ScatterMotion {
  const reach = collectionTravel(viewportWidth, viewportHeight)
  const yRatio = total > 1 ? row / (total - 1) - 0.5 : 0
  const xDirection = (seed - 0.5) * 0.55
  const distance = Math.hypot(xDirection, yRatio)
  const normalized = Math.min(distance / 0.72, 1)
  return {
    x: xDirection * reach,
    y: yRatio * reach,
    rotate: (seed < 0.5 ? -1 : 1) * (1.6 + ((seed * 7) % 1) * 1.6),
    delay: normalized * 70,
  }
}

export function isMotionEnabled(uiAnimation = true): boolean {
  if (!uiAnimation) return false
  if (typeof window === 'undefined' || !window.matchMedia) return true
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
