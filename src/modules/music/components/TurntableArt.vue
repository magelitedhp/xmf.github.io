<template>
  <div class="turntable" :class="{ 'is-playing': playing, 'is-hero': hero }" aria-hidden="true">
    <div class="turntable-shadow"></div>
    <div class="turntable-plinth">
      <div class="turntable-engraving"><span>YUMO SOUND SYSTEM</span><span>STEREO / 33⅓</span></div>
      <div class="turntable-platter">
        <div class="turntable-record">
          <div class="turntable-label">
            <CoverImage v-if="artwork" :src="artwork" alt="" img-class="turntable-cover" />
            <template v-else><span>Yumo</span><b>fm.</b><small>SIDE B / 001</small></template>
          </div>
          <i class="turntable-spindle"></i>
        </div>
      </div>
      <div class="turntable-arm"><i></i></div>
      <div class="turntable-switch"><i></i><span>{{ playing ? 'PLAYING' : 'SOUND ON' }}</span></div>
      <div class="turntable-speed">33 <span>45</span></div>
    </div>
    <span v-if="hero" class="turntable-sticker">给生活<br>换个频率 <b>↗</b></span>
  </div>
</template>
<script setup lang="ts">
import CoverImage from './CoverImage.vue'
defineProps<{ artwork?: string; playing?: boolean; hero?: boolean }>()
</script>
