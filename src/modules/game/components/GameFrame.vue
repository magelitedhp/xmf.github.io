<template>
  <div ref="frameEl" class="game-frame" :class="[{ 'is-fullscreen': fullscreen }, `game-tone-${tone}`]">
    <div class="game-cabinet-header"><span class="cabinet-label"><i></i> YUMO ARCADE <b>/ {{ number }}</b></span><span class="cabinet-title">{{ title }}</span><span class="cabinet-format">{{ format }}</span></div>
    <div class="game-stage">
      <slot />
    </div>
    <slot name="controls" />
    <div class="game-toolbar">
      <span class="game-toolbar-note"><i aria-hidden="true">✳</i> 给快乐留一局。</span>
      <div class="game-toolbar-actions"><slot name="toolbar" /><button type="button" class="glass-button fullscreen-button" @click="toggleFullscreen"><span aria-hidden="true">⛶</span>{{ fullscreen ? '退出全屏' : '全屏游玩' }}</button></div>
    </div>
    <p v-if="fullscreenError" class="game-frame-notice" role="status">{{ fullscreenError }}</p>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

withDefaults(defineProps<{ title?: string; number?: string; tone?: string; format?: string }>(), { title: '', number: '01', tone: 'ember', format: 'ORIGINAL / BROWSER GAME' })
const frameEl = ref<HTMLDivElement | null>(null)
const fullscreen = ref(false)
const fullscreenError = ref('')

async function toggleFullscreen() {
  fullscreenError.value = ''
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else if (frameEl.value?.requestFullscreen) await frameEl.value.requestFullscreen()
    else fullscreenError.value = '当前浏览器不支持全屏，可以横屏游玩或在新窗口中打开。'
  } catch {
    fullscreenError.value = '暂时无法进入全屏，请重试或横屏游玩。'
  }
}

function onFullscreenChange() {
  fullscreen.value = !!frameEl.value && document.fullscreenElement === frameEl.value
}

onMounted(() => document.addEventListener('fullscreenchange', onFullscreenChange))
onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  if (fullscreen.value) void document.exitFullscreen().catch(() => {})
})
</script>
