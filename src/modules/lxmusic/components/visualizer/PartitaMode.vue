<template>
  <div class="folia-mode folia-partita" :class="{ 'is-breathing': animationEnabled }">
    <div v-if="!line" class="folia-stage-empty">
      <span>{{ emptyText }}</span>
    </div>

    <div v-else class="folia-motion-float" :style="floatStyle">
      <Transition name="folia-line">
        <div
          :key="line.startTime"
          class="folia-partita-score"
          :class="lineTransitionClass"
          :style="scoreStyle"
        >
          <div v-for="column in columns" :key="column.id" class="folia-partita-column">
            <div class="folia-partita-stack">
              <PartitaChunk
                v-for="chunk in column.chunks"
                :key="chunk.id"
                :chunk-words="chunk.chunkWords"
                :display-words="chunk.displayWords"
                :config="chunk.config"
                :guide-position="chunk.guidePosition"
                :time="time"
                :theme="theme"
                :intensity="intensity"
                :is-chorus="line.isChorus"
                :show-guide-lines="showGuideLines"
                :font-size="fontSize"
                :render-profile="line.renderHints"
                :animation-enabled="animationEnabled"
              />
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import PartitaChunk, { type PartitaChunkConfig } from './PartitaChunk.vue'
import type { LxTheme } from '../../core/theme'
import type { LyricLine, LyricWord } from '../../core/lyric'
import {
  buildLayoutUnitsForLine,
  displayWordsFromLayoutUnits,
  type LyricLayoutUnit,
} from '../../core/lyricSemanticLayout'
import {
  lineFloatStyle,
  lineTransitionClass as resolveLineTransitionClass,
  splitGraphemes,
} from '../../core/foliaMotion'

interface PartitaChunk {
  id: string
  chunkWords: LyricWord[]
  displayWords: LyricWord[]
  config: PartitaChunkConfig
  guidePosition: 'left' | 'right'
}

const props = withDefaults(
  defineProps<{
    line: LyricLine | null
    time: number
    theme: LxTheme
    intensity?: 'calm' | 'normal' | 'chaotic'
    animationEnabled?: boolean
    fontSizeScale?: number
    showGuideLines?: boolean
    emptyText?: string
  }>(),
  {
    intensity: 'normal',
    animationEnabled: true,
    fontSizeScale: 1,
    showGuideLines: true,
    emptyText: '等待音乐开始',
  },
)

const windowHeight = ref(800)

function syncWindowHeight() {
  // The source buckets this value through its layout cache; a resize must still
  // reach the row count, or a window resize reflows only the surrounding stage.
  windowHeight.value = window.innerHeight
}

const fontSize = computed(() => {
  const scale = props.fontSizeScale
  const line = props.line
  const graphemeCount = line ? splitGraphemes(line.fullText.replace(/\s+/g, '')).length : 0
  const densityScale = graphemeCount > 40 ? 0.8 : 1
  return `clamp(${2.5 * densityScale * scale}rem, ${5.5 * densityScale * scale}vw, ${4.5 * densityScale * scale}rem)`
})

const columns = computed(() => {
  const line = props.line
  if (!line || !line.words.length) return []
  const units = buildLayoutUnitsForLine(line)
  const availableHeight = windowHeight.value * 0.65
  const targetRowCount = Math.max(1, Math.floor(availableHeight / 100))
  const actualRowCount = Math.min(units.length, targetRowCount)
  const chunks: PartitaChunk[] = []
  let seed = line.startTime
  const random = () => {
    const value = Math.sin(seed++) * 10000
    return value - Math.floor(value)
  }

  const groupedUnits: LyricLayoutUnit[][] = []
  let remainingUnits = units.length
  let remainingChunks = actualRowCount
  let unitIndex = 0

  for (let row = 0; row < actualRowCount; row += 1) {
    const isLastChunk = row === actualRowCount - 1
    const average = remainingUnits / remainingChunks
    let chunkLength = 1
    if (isLastChunk) {
      chunkLength = remainingUnits
    } else {
      const max = Math.ceil(average * 1.5)
      const value = random()
      chunkLength = Math.max(1, Math.min(max, Math.round(average + (value - 0.5) * average)))
    }
    chunkLength = Math.max(1, Math.min(chunkLength, remainingUnits - (remainingChunks - 1)))
    groupedUnits.push(units.slice(unitIndex, unitIndex + chunkLength))
    unitIndex += chunkLength
    remainingUnits -= chunkLength
    remainingChunks -= 1
  }

  const chaotic = props.intensity === 'chaotic'
  const calm = props.intensity === 'calm'

  groupedUnits.forEach((chunkUnits, row) => {
    const chunkWords = chunkUnits.flatMap((unit) => unit.words)
    const displayWords = displayWordsFromLayoutUnits(chunkUnits)
    if (!chunkWords.length) return

    const left = row % 2 === 0
    // Source: `partitaLayout.ts` — the stagger is viewport-width independent.
    const staggerMagnitude = 20 + random() * 80
    const offset = left ? -staggerMagnitude : staggerMagnitude
    const rowBias = row - (actualRowCount - 1) / 2
    const mergedText = chunkWords.map((word) => word.text.trim()).join('')
    const graphemeCount = splitGraphemes(mergedText.replace(/\s+/g, '')).length
    const staggerScale = calm ? 1 : 0.8 + random() * 0.9
    const scale =
      (chaotic ? 1 + Math.min(graphemeCount * 0.01, 0.05) : 1) * staggerScale
    const config: PartitaChunkConfig = {
      // src/components/visualizer/partita/partitaLayout.ts
      id: `${row}-${chunkWords[0].startTime}`,
      x: offset,
      y: calm ? 0 : rowBias * 2.5,
      rotate: chaotic ? (left ? -3 : 3) : 0,
      scale,
      marginBottom: chaotic ? '0.4rem' : '0.6rem',
      passedRotate: (left ? 1 : -1) * (chaotic ? 6 : 3),
    }
    chunks.push({
      id: config.id,
      chunkWords,
      displayWords,
      config,
      guidePosition: row % 2 === 0 ? 'left' : 'right',
    })
  })

  return [{ id: 'column-' + line.startTime, chunks }]
})

const scoreStyle = computed(() => ({
  perspective: (props.intensity === 'chaotic' ? 720 : 1000) + 'px',
  gap: '2rem',
}))

const floatStyle = computed(() => lineFloatStyle(props.intensity))
const lineTransitionClass = computed(() => resolveLineTransitionClass(props.line))

onMounted(() => {
  syncWindowHeight()
  window.addEventListener('resize', syncWindowHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncWindowHeight)
})
</script>
