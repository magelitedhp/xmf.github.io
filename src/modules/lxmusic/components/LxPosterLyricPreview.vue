<template>
  <div v-if="line" class="lx-poster-lyric" aria-live="polite">
    <span
      v-for="(word, index) in words"
      :key="`${line.startTime}-${index}`"
      :class="`is-${states[index] ?? 'waiting'}`"
    >{{ word.text }}</span>
  </div>
</template>

<script setup lang="ts">
/**
 * The lyric line inside an expanded Lattice poster. Folia reads time from a
 * MotionValue, so this preview drives its own RAF instead of making the whole
 * wall re-render on every media-clock frame.
 */

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import player from '../core/player'
import { buildDisplayWords } from '../core/lyric'
import { resolveWordState, type WordMotionState } from '../core/foliaMotion'

const line = computed(() => {
  const index = player.currentLineIndex.value
  return index >= 0 ? player.state.lyricLines[index] ?? null : null
})
const words = computed(() => (line.value ? buildDisplayWords(line.value.words) : []))
const states = ref<WordMotionState[]>([])
let frame = 0

function syncStates() {
  const current = line.value
  if (!current) {
    if (states.value.length) states.value = []
    return
  }
  const next = words.value.map((word) =>
    resolveWordState(player.state.progress, word, current.renderHints, current.renderHints.renderEndTime),
  )
  if (
    next.length !== states.value.length ||
    next.some((state, index) => state !== states.value[index])
  ) {
    states.value = next
  }
}

function tick() {
  frame = requestAnimationFrame(tick)
  if (player.state.isPlay) syncStates()
}

watch(line, syncStates, { immediate: true })
watch(words, syncStates)

onMounted(() => {
  syncStates()
  frame = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame)
})
</script>
