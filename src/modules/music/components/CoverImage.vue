<template>
  <img
    v-if="src && !failed"
    class="cover-image"
    :class="imgClass"
    :src="src"
    :alt="alt"
    referrerpolicy="no-referrer"
    @error="failed = true"
  />
  <div v-else class="cover-fallback" :class="imgClass" aria-hidden="true">♪</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
const props = defineProps<{
  src?: string
  alt: string
  imgClass?: string
}>()
const failed = ref(false)
watch(() => props.src, () => { failed.value = false })
</script>
