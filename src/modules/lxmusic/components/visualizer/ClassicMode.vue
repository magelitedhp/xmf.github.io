<template>
  <div
    class="folia-mode folia-classic"
    :class="{ 'is-breathing': animationEnabled, 'is-chaotic': intensity === 'chaotic', 'is-calm': intensity === 'calm' }"
  >
    <div v-if="!line" class="folia-stage-empty">
      <span>{{ emptyText }}</span>
    </div>

    <div v-else class="folia-motion-float" :style="floatStyle">
      <Transition :name="transitionName">
        <div
          :key="line.startTime"
          class="folia-classic-line"
          :class="lineTransitionClass"
          :style="lineStyle"
        >
          <GlowWord
            v-for="(word, index) in displayWords"
            :key="`${line.startTime}-${index}`"
            :word="word"
            :state="wordStates[index]"
            :config="wordConfigs[index]"
            :base-color="theme.primaryColor"
            :active-color="resolveWordColor(word.text)"
            :intensity="intensity"
            :chorus="line.isChorus"
            :font-size="fontSize"
            :line-end="line.renderHints.renderEndTime"
            :hints="line.renderHints"
            :rotation-enabled="true"
            :animation-enabled="animationEnabled"
          />
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import GlowWord from './GlowWord.vue'
import type { WordLayoutConfig } from './types'
import type { LxTheme } from '../../core/theme'
import type { LyricLine } from '../../core/lyric'
import { resolveThemeFontStack, resolveThemeFontWeight } from '../../core/theme'
import { buildDisplayWordsForLine } from '../../core/lyricSemanticLayout'
import {
  lineFloatStyle,
  lineTransitionClass as resolveLineTransitionClass,
  resolveWordState,
} from '../../core/foliaMotion'

const props = withDefaults(
  defineProps<{
    line: LyricLine | null
    time: number
    theme: LxTheme
    intensity?: 'calm' | 'normal' | 'chaotic'
    animationEnabled?: boolean
    fontSizeScale?: number
    emptyText?: string
  }>(),
  {
    intensity: 'normal',
    animationEnabled: true,
    fontSizeScale: 1,
    emptyText: '等待音乐开始',
  },
)

const fontSize = computed(() => {
  const scale = props.fontSizeScale
  return `clamp(${2.25 * scale}rem, ${6 * scale}vw, ${4.5 * scale}rem)`
})

const viewportWidth = ref(typeof window === 'undefined' ? 1200 : window.innerWidth)
const displayWords = computed(() => {
  const line = props.line
  if (!line) return []
  return buildDisplayWordsForLine(line)
})

const wordStates = computed(() => {
  const line = props.line
  if (!line) return []
  return displayWords.value.map((word) =>
    resolveWordState(props.time, word, line.renderHints, line.renderHints.renderEndTime),
  )
})

let measureCanvas: HTMLCanvasElement | null = null

/** Canvas measurement is what keeps scaled words from overlapping, as in Folia. */
function measureWordWidth(text: string, pxSize: number): number {
  if (typeof document === 'undefined') return text.length * pxSize * 0.65
  measureCanvas ??= document.createElement('canvas')
  const context = measureCanvas.getContext('2d')
  if (!context) return text.length * pxSize * 0.65
  context.font = `${resolveThemeFontWeight(props.theme, 700)} ${pxSize}px ${resolveThemeFontStack(props.theme)}`
  return context.measureText(text).width
}

const wordConfigs = computed<WordLayoutConfig[]>(() => {
  const line = props.line
  if (!line) return []
  const seed = line.startTime
  const chaotic = props.intensity === 'chaotic'
  const calm = props.intensity === 'calm'
  const spread = chaotic ? 60 : calm ? 0 : 20
  const rotation = chaotic ? 30 : calm ? 0 : 5
  const rem = 16
  const scale = props.fontSizeScale
  const pxFontSize = Math.max(
    Math.min((6 * scale * viewportWidth.value) / 100, 4.5 * scale * rem),
    2.25 * scale * rem,
  )
  const widths = displayWords.value.map((word) => measureWordWidth(word.text, pxFontSize))
  const wordSeed = (index: number) => seed + index
  const random = (index: number, offset: number) => {
    const value = Math.sin(wordSeed(index) + offset) * 10000
    return value - Math.floor(value)
  }
  const configScale = (index: number) =>
    chaotic ? 0.8 + random(index, 4) * 0.6 : 1.1 + random(index, 4) * 0.2

  const isInterlude = line.fullText === '......'

  return displayWords.value.map((word, index) => {
    if (isInterlude) {
      return {
        id: `${word.text}-${index}-${seed}`,
        x: 0,
        y: (random(0, 2) - 0.5) * 15,
        rotate: 0,
        scale: 1.5,
        marginRight: '3rem',
        alignSelf: 'center',
        passedRotate: 0,
      }
    }

    const wordScale = configScale(index)
    const x = (random(index, 1) - 0.5) * spread * 2
    const y = (random(index, 2) - 0.5) * spread * 2
    const nextScale = index + 1 < displayWords.value.length ? configScale(index + 1) : 1
    const nextX = index + 1 < displayWords.value.length ? (random(index + 1, 1) - 0.5) * spread * 2 : 0
    const nextWidth = widths[index + 1] ?? 0
    const gap = 0.05 * pxFontSize
    const calculatedMargin =
      (widths[index] * (wordScale * 1.4 - 1) / 2
        + nextWidth * (nextScale * 1.4 - 1) / 2
        + x
        - nextX
        + gap) * 0.7
    const marginRight = `${Math.max((chaotic ? 0.08 : 0.12) * pxFontSize * 0.7, calculatedMargin).toFixed(1)}px`
    const align =
      chaotic && random(index, 6) > 0.7
        ? random(index, 7) > 0.5
          ? 'flex-start'
          : 'flex-end'
        : 'auto'
    return {
      id: `${word.text}-${index}-${seed}`,
      x,
      y,
      rotate: (random(index, 3) - 0.5) * rotation * 2,
      scale: wordScale,
      marginRight,
      alignSelf: align,
      passedRotate: (random(index, 8) - 0.5) * 45,
    }
  })
})

const lineConfig = computed(() => {
  const line = props.line
  if (!line) return { justifyContent: 'center', alignItems: 'center', perspective: 1000 }
  const seed = line.startTime
  const calm = props.intensity === 'calm'
  const justify = calm
    ? ['center']
    : ['flex-start', 'center', 'flex-end', 'space-around', 'space-between']
  const align = calm ? ['center'] : ['flex-start', 'center', 'flex-end']
  return {
    justifyContent: line.fullText === '......'
      ? 'center'
      : justify[Math.floor((seed % justify.length + justify.length) % justify.length)],
    alignItems: align[Math.floor(((seed * 2) % align.length + align.length) % align.length)],
    perspective: props.intensity === 'chaotic' ? 500 + (seed % 500) : 1000,
  }
})

const lineStyle = computed(() => ({
  perspective: `${lineConfig.value.perspective}px`,
  justifyContent: lineConfig.value.justifyContent,
  alignItems: lineConfig.value.alignItems,
  minHeight: '300px',
  fontFamily: resolveThemeFontStack(props.theme),
  fontWeight: resolveThemeFontWeight(props.theme, 700),
}))

const floatStyle = computed(() => lineFloatStyle(props.intensity))
const transitionName = 'folia-line'
const lineTransitionClass = computed(() => resolveLineTransitionClass(props.line))

function resolveWordColor(text: string) {
  return props.theme.wordColors.find((entry) => text.includes(entry.word))?.color ?? props.theme.accentColor
}

onMounted(() => window.addEventListener('resize', onResize))
onBeforeUnmount(() => window.removeEventListener('resize', onResize))
function onResize() {
  viewportWidth.value = window.innerWidth
}
</script>
