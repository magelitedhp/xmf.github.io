<template>
  <strong
    ref="titleEl"
    :aria-label="title"
    :title="title"
    :data-title-settled="settled || undefined"
  >{{ value }}</strong>
</template>

<script setup lang="ts">
/**
 * Source: `components/wall/WallTitle.tsx` + `hooks/useSettledTitle.ts`.
 *
 * The preview is fitted against the width the poster is heading for, then the
 * CSS clamp is dropped so no hidden line can bleed through the copy padding.
 */

import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  fitTitle,
  readTitleColumn,
  readTitleMetrics,
  readTitleTypography,
  sharedTitleFitCache,
  titleColumnWidth,
  titleFitCacheKey,
  type TitleColumn,
  type TitleMetrics,
  type TitleTypography,
} from '../core/fitSettledTitle'
import { useFontsEpoch } from '../core/useFontsEpoch'
import { useViewportSettle } from '../core/useViewportSettle'

const props = withDefaults(
  defineProps<{
    title: string
    expanded: boolean
    targetWidth: number
    maxLines?: number
  }>(),
  { maxLines: 3 },
)

const titleEl = ref<HTMLElement | null>(null)
const value = ref(props.title)
const settled = ref(false)
const fontsEpoch = useFontsEpoch()
const viewport = useViewportSettle()
let frame = 0
const typographyByShape = new Map<string, TitleTypography>()
const TYPOGRAPHY_ENTRIES = 16

function readTypography(node: HTMLElement, shapeKey: string) {
  const cached = typographyByShape.get(shapeKey)
  if (cached) return cached
  const typography = readTitleTypography(node)
  if (!typography) return null
  if (typographyByShape.size >= TYPOGRAPHY_ENTRIES) typographyByShape.clear()
  typographyByShape.set(shapeKey, typography)
  return typography
}

function metricsFor(node: HTMLElement): { column: TitleColumn; metrics: TitleMetrics } | null {
  const shapeKey = `${fontsEpoch.value}|${viewport.epoch.value}|${props.expanded ? 'expanded' : 'compact'}|${props.maxLines}`
  const typography = readTypography(node, shapeKey)
  if (typography) {
    const width = titleColumnWidth(typography.column, props.targetWidth)
    if (width === null) return null
    return {
      column: typography.column,
      metrics: {
        font: typography.font,
        letterSpacing: typography.letterSpacing,
        lineHeight: typography.lineHeight,
        fontSize: typography.fontSize,
        width,
        maxLines: props.maxLines,
      },
    }
  }
  const column = readTitleColumn(node)
  if (!column) return null
  const width = titleColumnWidth(column, props.targetWidth)
  if (width === null) return null
  const metrics = readTitleMetrics(node, width)
  if (!metrics) return null
  return {
    column,
    metrics: {
      ...metrics,
      maxLines: props.maxLines,
    },
  }
}

function measure() {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => {
    const node = titleEl.value
    if (!node) return
    const read = metricsFor(node)
    if (!read) {
      value.value = props.title
      settled.value = false
      return
    }
    const key = titleFitCacheKey(
      props.title,
      read.metrics,
      `${fontsEpoch.value}|${viewport.epoch.value}|${props.expanded ? 'expanded' : 'compact'}`,
    )
    const cached = sharedTitleFitCache.get(key)
    value.value = cached ?? fitTitle(node, props.title, {
      width: read.metrics.width,
      maxLines: props.maxLines,
    })
    if (cached === undefined) sharedTitleFitCache.set(key, value.value)
    settled.value = true
  })
}

function refit() {
  settled.value = false
  value.value = props.title
  if (viewport.resizing.value) return
  void nextTick(measure)
}

watch(
  () => [props.title, props.expanded, props.targetWidth, props.maxLines],
  refit,
)

watch(fontsEpoch, refit)
watch(
  () => viewport.epoch.value,
  () => {
    if (!viewport.resizing.value) refit()
  },
)

onMounted(() => {
  void nextTick(measure)
  void document.fonts?.ready.then(() => {
    if (titleEl.value) measure()
  })
})

onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>
