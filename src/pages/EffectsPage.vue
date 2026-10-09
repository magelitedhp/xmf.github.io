<template>
  <main ref="stage" class="effects-page">
    <iframe ref="frame" class="effects-frame" title="AquaInkGL 交互流体画布" :src="frameSrc" allow="fullscreen" @load="ready"></iframe>
    <div v-if="showIntro" class="effects-overlay"><p class="effects-kicker">03 / AN EXPERIMENT IN MOTION</p><h1>把此刻，<br>交给<em>流动。</em></h1><p>按住并拖动，让颜色追随你的指尖。<br>没有笔法，也没有下一步。</p></div>
    <div class="effects-dock" role="group" aria-label="画布控制"><button @click="splash">注入色彩 ↗</button><button :aria-pressed="paused" :class="{active:paused}" @click="togglePause">{{ paused ? '继续' : '暂停' }}</button><button :aria-pressed="!showIntro" @click="showIntro = !showIntro">{{ showIntro ? '只看画布' : '显示介绍' }}</button><button @click="fullscreen">全屏 ⛶</button></div>
    <p class="effects-caption">AQUA INK / LIVE CANVAS</p>
    <span class="effects-notice" role="status">{{ notice }}</span>
  </main>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const frame=ref<HTMLIFrameElement|null>(null), stage=ref<HTMLElement|null>(null),paused=ref(false),showIntro=ref(true),notice=ref('')
const frameSrc=(import.meta.env.BASE_URL||'./')+'effects/aquaInk/index.html'
type InkWindow = Window & { config?: { PAUSED: boolean; BACK_COLOR: {r:number;g:number;b:number} }; multipleSplats?: (amount:number)=>void }
const ink=()=>frame.value?.contentWindow as InkWindow|null
function ready() {const win=ink();if(win?.config){win.config.BACK_COLOR={r:8,g:18,b:22};win.config.PAUSED=false;paused.value=false}}
function togglePause() {const win=ink();if(win?.config){paused.value=!paused.value;win.config.PAUSED=paused.value}}
function splash() {ink()?.multipleSplats?.(8)}
async function fullscreen() {try {if(document.fullscreenElement)await document.exitFullscreen();else await stage.value?.requestFullscreen()}catch{notice.value='当前浏览器暂不支持全屏。'}}
</script>