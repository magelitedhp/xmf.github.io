<template>
  <img
    v-if="src && !failed"
    :src="src"
    :alt="alt"
    referrerpolicy="no-referrer"
    decoding="async"
    @error="failed = true"
  >
  <span v-else class="lx-cover-fallback" aria-hidden="true">{{ fallback }}</span>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string
    alt?: string
    fallback?: string
  }>(),
  { src: '', alt: '', fallback: '♪' },
)

const failed = ref(false)
watch(() => props.src, () => {
  failed.value = false
})
</script>
