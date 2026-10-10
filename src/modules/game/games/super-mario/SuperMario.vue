<template>
  <GameFrame title="超级玛丽" number="04" tone="mario" format="PIXEL / PLATFORM ADVENTURE">
    <iframe ref="iframeEl" class="game-iframe mario-iframe" :src="src" :style="{ height: `${height}px` }" title="超级玛丽 · 蘑菇王国冒险" allow="autoplay; fullscreen" loading="lazy" @load="fullscreenState"></iframe>
    <template #toolbar><a class="glass-button" :href="src" target="_blank" rel="noopener">新窗口打开</a><a class="glass-button" :href="src" download="super-mario.html">下载单文件</a></template>
  </GameFrame>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import GameFrame from '../../components/GameFrame.vue'
const src = `${import.meta.env.BASE_URL || './'}games/super-mario/index.html`
const iframeEl=ref<HTMLIFrameElement|null>(null),height=ref(620)
function resize(event:MessageEvent){
  if(event.origin!==location.origin||event.source!==iframeEl.value?.contentWindow||event.data?.type!=='yumo:mario-height')return
  const next=event.data.height
  if(typeof next==='number'&&Number.isFinite(next))height.value=Math.min(1500,Math.max(180,next))
}
function fullscreenState(){iframeEl.value?.contentWindow?.postMessage({type:'yumo:mario-fullscreen',active:!!document.fullscreenElement?.contains(iframeEl.value)},location.origin)}
onMounted(()=>{window.addEventListener('message',resize);document.addEventListener('fullscreenchange',fullscreenState)})
onBeforeUnmount(()=>{window.removeEventListener('message',resize);document.removeEventListener('fullscreenchange',fullscreenState)})
</script>
<style scoped>
.mario-iframe{aspect-ratio:auto;background:#132f27}
</style>
