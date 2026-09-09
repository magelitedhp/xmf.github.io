<template>
  <main class="effects-page">
    <iframe
      class="effects-frame"
      title="AquaInkGL 水墨流体动画"
      :src="frameSrc"
      loading="lazy"
      allow="fullscreen"
    ></iframe>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const frameSrc = computed(() => {
  const base = import.meta.env.BASE_URL || './'
  return `${base}effects/aquaInk/index.html`
})
</script>
