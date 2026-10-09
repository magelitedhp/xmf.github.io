<template>
  <div class="game-frame">
    <div ref="stageEl" class="game-stage" :class="{ 'is-fullscreen': fullscreen }">
      <slot />
    </div>
    <div class="game-toolbar">
      <button type="button" class="glass-button" @click="toggleFullscreen">{{ fullscreen ? '退出全屏' : '全屏' }}</button>
      <slot name="toolbar" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const stageEl = ref<HTMLDivElement | null>(null)
const fullscreen = ref(false)

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen()
  else void stageEl.value?.requestFullscreen?.()
}

function onFullscreenChange() {
  fullscreen.value = !!stageEl.value && document.fullscreenElement === stageEl.value
}

onMounted(() => document.addEventListener('fullscreenchange', onFullscreenChange))
onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  if (fullscreen.value) void document.exitFullscreen()
})
</script>
