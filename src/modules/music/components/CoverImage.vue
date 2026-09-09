<template>
  <img
    v-if="src"
    class="cover-image"
    :class="imgClass"
    :src="src"
    :alt="alt"
    referrerpolicy="no-referrer"
  />
  <div v-else class="cover-fallback" :class="imgClass" aria-hidden="true">♪</div>
</template>

<script setup lang="ts">
defineProps<{
  src?: string
  alt: string
  imgClass?: string
}>()
</script>
