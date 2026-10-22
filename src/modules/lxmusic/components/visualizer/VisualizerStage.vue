<template>
  <div class="folia-visualizer" :style="stageStyle">
    <VisualizerBackdrop
      :theme="theme"
      :cover="cover"
      :seed="seed"
      :mode="backgroundMode"
      :opacity="backgroundOpacity"
      :disable-geometric="disableGeometric"
      :disable-vignette="disableVignette"
      :paused="!isPlay"
    />

    <div class="folia-visualizer-content">
      <component
        :is="modeComponent"
        :line="line"
        :previous-line="previousLine"
        :next-line="nextLine"
        :time="time"
        :theme="theme"
        :intensity="theme.animationIntensity"
        :animation-enabled="animationEnabled"
        :font-size-scale="fontScale"
        :show-guide-lines="showGuideLines"
        :show-print-symbols="showPrintSymbols"
        :empty-text="emptyText"
        :variant="echoVariant"
      />
    </div>

    <FoliaSubtitle
      :active-line="line"
      :recent-line="recentLine"
      :next-lines="nextLines"
      :show-text="true"
      :show-translation="showSubtitleTranslation"
      :subtitle-content-mode="subtitleContentMode"
      :theme="theme"
      :opacity="subtitleOpacity"
      :bottom="subtitleBottom"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VisualizerBackdrop from './VisualizerBackdrop.vue'
import FoliaSubtitle from './FoliaSubtitle.vue'
import ClassicMode from './ClassicMode.vue'
import PartitaMode from './PartitaMode.vue'
import FumeMode from './FumeMode.vue'
import EchoMode from './EchoMode.vue'
import type { LxTheme } from '../../core/theme'
import type { LyricLine, SubtitleContentMode } from '../../core/lyric'
import type { VisualizerBackgroundMode, VisualizerMode } from '../../core/settings'
import { colorWithAlpha, resolveThemeFontStack } from '../../core/theme'

const props = withDefaults(
  defineProps<{
    mode: VisualizerMode
    backgroundMode: VisualizerBackgroundMode
    theme: LxTheme
    cover?: string
    seed?: string | number
    line: LyricLine | null
    previousLine?: LyricLine | null
    nextLine?: LyricLine | null
    recentLine?: LyricLine | null
    nextLines?: LyricLine[]
    time: number
    isPlay?: boolean
    animationEnabled?: boolean
    fontScale?: number
    backgroundOpacity?: number
    disableGeometric?: boolean
    disableVignette?: boolean
    showGuideLines?: boolean
    showPrintSymbols?: boolean
    showSubtitleTranslation?: boolean
    subtitleContentMode?: SubtitleContentMode
    showUpcoming?: boolean
    emptyText?: string
  }>(),
  {
    cover: '',
    seed: 'yumo',
    previousLine: null,
    nextLine: null,
    recentLine: null,
    nextLines: () => [],
    isPlay: false,
    animationEnabled: true,
    fontScale: 1,
    backgroundOpacity: 0.75,
    disableGeometric: false,
    disableVignette: false,
    showGuideLines: true,
    showPrintSymbols: true,
    showSubtitleTranslation: true,
    subtitleContentMode: undefined,
    showUpcoming: true,
    emptyText: '等待音乐开始',
  },
)

/**
 * Folia ships fourteen visual styles. Classic, Partita and Fume have dedicated
 * layouts; the remaining styles use EchoMode's per-variant composition.
 */
const modeComponent = computed(() => {
  if (props.mode === 'partita') return PartitaMode
  if (props.mode === 'fume') return FumeMode
  if (props.mode !== 'classic') return EchoMode
  return ClassicMode
})

const echoVariant = computed(() =>
  props.mode === 'classic' || props.mode === 'partita' || props.mode === 'fume' ? null : props.mode,
)

const subtitleOpacity = computed(() => 0.6)
const subtitleBottom = computed(() => {
  const line = props.line ?? props.recentLine
  const hasAlternate = Boolean(
    line?.translation?.trim()
    || line?.romanization?.trim(),
  )
  return hasAlternate ? '106px' : '92px'
})

const stageStyle = computed(() => ({
  '--folia-primary': props.theme.primaryColor,
  '--folia-secondary': props.theme.secondaryColor,
  '--folia-accent': props.theme.accentColor,
  '--folia-base': props.theme.backgroundColor,
  '--folia-glow': colorWithAlpha(props.theme.accentColor, 0.55),
  '--folia-font': resolveThemeFontStack(props.theme),
  '--folia-font-weight': String(props.theme.fontWeight ?? 700),
}))
</script>
