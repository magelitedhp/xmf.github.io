<template>
  <GameFrame title="植物大战僵尸幼儿园版" number="06" tone="pvz" format="ORIGINAL RULES / WASM">
    <iframe
      ref="iframeEl"
      class="game-iframe pvz-kindergarten-iframe"
      :class="{ 'has-content-height': height !== null }"
      :src="src"
      :style="{ height: height === null ? undefined : `${height}px` }"
      title="植物大战僵尸幼儿园版 · 原始规则网页版"
      allow="autoplay; fullscreen"
      loading="lazy"
      @load="syncFullscreen"
    ></iframe>

    <template #toolbar>
      <a class="glass-button" :href="src" target="_blank" rel="noopener">新窗口打开</a>
    </template>
  </GameFrame>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import GameFrame from '../../components/GameFrame.vue'

const src = `${import.meta.env.BASE_URL || './'}games/pvz-kindergarten/index.html`
const iframeEl = ref<HTMLIFrameElement | null>(null)
const height = ref<number | null>(null)

function resizeFrame(event: MessageEvent) {
  if (event.origin !== location.origin || event.source !== iframeEl.value?.contentWindow || event.data?.type !== 'yumo:pvz-height') return
  const nextHeight = event.data.height
  if (typeof nextHeight === 'number' && Number.isFinite(nextHeight)) {
    height.value = Math.min(1800, Math.max(180, nextHeight))
  }
}

function syncFullscreen() {
  const frame = iframeEl.value
  frame?.contentWindow?.postMessage({
    type: 'yumo:pvz-fullscreen',
    active: !!frame && !!document.fullscreenElement?.contains(frame),
  }, location.origin)
}

onMounted(() => {
  window.addEventListener('message', resizeFrame)
  document.addEventListener('fullscreenchange', syncFullscreen)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', resizeFrame)
  document.removeEventListener('fullscreenchange', syncFullscreen)
})
</script>
