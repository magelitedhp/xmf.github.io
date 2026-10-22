<template>
  <div class="folia-mode folia-fume" :class="{ 'is-breathing': animationEnabled }">
    <div v-if="!line" class="folia-stage-empty">
      <span>{{ emptyText }}</span>
    </div>

    <div v-else class="folia-fume-camera" :style="articleStyle">
      <Transition name="folia-line">
        <div
          :key="line.startTime"
          class="folia-fume-article"
          :class="lineTransitionClass"
        >
          <p class="folia-fume-ghost is-before">{{ previousLine?.fullText }}</p>
          <p class="folia-fume-active">
            <span
              v-for="(word, index) in line.words"
              :key="index"
              :class="{ 'is-active': wordStates[index] === 'active', 'is-passed': wordStates[index] === 'passed' }"
              :style="{ color: wordStates[index] === 'active' ? resolveWordColor(word.text) : undefined }"
            >{{ word.text }}</span>
          </p>
          <p class="folia-fume-ghost is-after">{{ nextLine?.fullText }}</p>
          <i class="folia-fume-stamp" :style="{ borderColor: stampColor, color: stampColor }">和</i>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LxTheme } from '../../core/theme'
import type { LyricLine } from '../../core/lyric'
import { colorWithAlpha } from '../../core/theme'
import {
  lineTransitionClass as resolveLineTransitionClass,
  resolveWordState,
} from '../../core/foliaMotion'

const props = withDefaults(
  defineProps<{
    line: LyricLine | null
    previousLine?: LyricLine | null
    nextLine?: LyricLine | null
    time: number
    theme: LxTheme
    animationEnabled?: boolean
    fontSizeScale?: number
    showPrintSymbols?: boolean
    emptyText?: string
  }>(),
  {
    previousLine: null,
    nextLine: null,
    animationEnabled: true,
    fontSizeScale: 1,
    showPrintSymbols: true,
    emptyText: '等待音乐开始',
  },
)

const fontSize = computed(() => {
  const scale = props.fontSizeScale
  return `clamp(${2.5 * scale}rem, ${5.5 * scale}vw, ${4.5 * scale}rem)`
})

const articleStyle = computed(() => ({
  '--fume-font-size': fontSize.value,
  '--fume-camera-x': `${Math.sin(props.time * 0.74 + 0.8) * 18 * 0.34}px`,
  '--fume-camera-y': `${Math.sin(props.time / 7 * Math.PI * 2) * 18 + Math.sin(props.time / 7 * Math.PI + 1.1) * 18 * 0.22}px`,
  '--fume-camera-scale': String(1.18 * (1 + Math.sin(props.time / 7 * Math.PI * 2 + 0.9) * 0.011)),
  '--fume-camera-duration': props.animationEnabled ? '7s' : '0s',
}))

const stampColor = computed(() => colorWithAlpha(props.theme.accentColor, 0.34))
const lineTransitionClass = computed(() => resolveLineTransitionClass(props.line))

const wordStates = computed(() => {
  const line = props.line
  if (!line) return []
  return line.words.map((word) =>
    resolveWordState(props.time, word, line.renderHints, line.renderHints.renderEndTime),
  )
})

function resolveWordColor(text: string) {
  return props.theme.wordColors.find((entry) => text.includes(entry.word))?.color ?? props.theme.accentColor
}
</script>
