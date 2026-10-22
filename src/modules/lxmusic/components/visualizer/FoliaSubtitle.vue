<template>
  <Transition name="folia-subtitle">
    <div
      v-if="shouldRender"
      class="folia-subtitle"
      :style="{ '--folia-subtitle-opacity': opacity, bottom }"
    >
      <div
        class="folia-subtitle-content"
        :class="{ 'is-upcoming': !subtitleTracks.length }"
      >
        <div class="folia-subtitle-glow" :style="glowStyle" aria-hidden="true" />

        <Transition name="folia-subtitle-track">
          <div
            v-if="subtitleTracks.length"
            :key="`t-${subtitleSource?.startTime ?? 'none'}`"
            class="folia-subtitle-tracks"
          >
            <p
              v-for="(track, index) in subtitleTracks"
              :key="track.role"
              :class="index > 0 ? 'folia-subtitle-translation is-secondary' : 'folia-subtitle-translation'"
              :data-subtitle-track="track.role"
            >
              {{ track.text }}
            </p>
          </div>
          <div v-else :key="`u-${upcomingLines[0]?.startTime ?? 'none'}`" class="folia-upcoming-list">
            <p
              v-for="line in upcomingLines"
              :key="line.startTime"
              class="folia-subtitle-upcoming"
            >
              {{ line.fullText.trim() }}
            </p>
          </div>
        </Transition>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * Shared bottom subtitle rail.
 *
 * Source: src/components/visualizer/VisualizerSubtitleOverlay.tsx
 * Tracks come from the active line first, then the most recently rendered line during
 * an instrumental gap. Upcoming previews are only used when neither has readable text.
 */

import { computed } from 'vue'
import type { LxTheme } from '../../core/theme'
import {
  resolveSubtitleContentMode,
  resolveSubtitleTracks,
  type LyricLine,
  type SubtitleContentMode,
} from '../../core/lyric'
import { colorWithAlpha } from '../../core/theme'

const props = withDefaults(
  defineProps<{
    activeLine?: LyricLine | null
    recentLine?: LyricLine | null
    nextLines?: LyricLine[]
    showText?: boolean
    showTranslation?: boolean
    subtitleContentMode?: SubtitleContentMode
    theme: LxTheme
    opacity?: number
    bottom?: string
  }>(),
  {
    activeLine: null,
    recentLine: null,
    nextLines: () => [],
    showText: true,
    showTranslation: true,
    subtitleContentMode: undefined,
    opacity: 0.6,
    bottom: '112px',
  },
)

const hasReadableText = (text?: string | null) => Boolean(text && /[\p{L}\p{N}]/u.test(text))

const resolvedMode = computed(() =>
  resolveSubtitleContentMode(props.subtitleContentMode, props.showTranslation),
)

const subtitleTracks = computed(() => {
  if (!props.showText) return []
  const candidates = [props.activeLine, props.recentLine]
  for (const line of candidates) {
    const tracks = resolveSubtitleTracks(line, resolvedMode.value, hasReadableText)
    if (tracks.length) return tracks
  }
  return []
})

const subtitleSource = computed(() => {
  const candidates = [props.activeLine, props.recentLine]
  return candidates.find((line) =>
    resolveSubtitleTracks(line, resolvedMode.value, hasReadableText).length > 0,
  ) ?? null
})

const upcomingLines = computed(() => {
  if (!props.showText || subtitleTracks.value.length || !props.activeLine) return []
  return props.nextLines.filter((line) => hasReadableText(line.fullText))
})

const shouldRender = computed(() => Boolean(subtitleTracks.value.length || upcomingLines.value.length))

const glowStyle = computed(() => ({
  background: `radial-gradient(ellipse 115% 130% at center, ${colorWithAlpha(props.theme.backgroundColor, 0.96)} 0%, ${colorWithAlpha(props.theme.backgroundColor, 0.78)} 62%, transparent 100%)`,
}))
</script>
