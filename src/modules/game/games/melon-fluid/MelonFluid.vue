<template>
  <GameFrame title="瓜体实验室" number="03" tone="melon" format="PHYSICS / FRUIT EXPERIMENT">
    <iframe
      ref="iframeEl"
      class="game-iframe game-iframe-fluid"
      :src="src"
      :style="{ height: `${height}px` }"
      title="瓜体实验室"
      allow="autoplay; fullscreen"
      loading="lazy"
    ></iframe>

    <template #toolbar>
      <a class="glass-button" :href="src" target="_blank" rel="noopener">新窗口打开</a>
    </template>
  </GameFrame>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import GameFrame from '../../components/GameFrame.vue'

const src = `${import.meta.env.BASE_URL || './'}games/melon-fluid/index.html`
const iframeEl = ref<HTMLIFrameElement | null>(null)
const height = ref(900)
function resizeFrame(event: MessageEvent) {
  if (event.origin !== location.origin || event.source !== iframeEl.value?.contentWindow || event.data?.type !== 'yumo:melon-height') return
  const nextHeight = event.data.height
  if (typeof nextHeight === 'number' && Number.isFinite(nextHeight)) height.value = Math.min(1800, Math.max(400, nextHeight))
}
onMounted(() => window.addEventListener('message', resizeFrame))
onBeforeUnmount(() => window.removeEventListener('message', resizeFrame))
</script>

<style scoped>
.game-iframe-fluid {
  aspect-ratio: auto;
  background: #f7f8f2;
}
</style>
