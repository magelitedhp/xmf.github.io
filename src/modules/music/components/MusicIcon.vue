<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path v-if="name === 'play'" d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none" />
    <path v-else-if="name === 'pause'" d="M8 5v14M16 5v14" stroke-width="3" />
    <path v-else-if="name === 'previous'" d="M5 5v14m14-14L8 12l11 7Z" />
    <path v-else-if="name === 'next'" d="M19 5v14M5 5l11 7-11 7Z" />
    <path v-else-if="name === 'heart'" d="M20.8 5.6a5.4 5.4 0 0 0-8.8 1 5.4 5.4 0 0 0-8.8-1C.2 9 4 14 12 20c8-6 11.8-11 8.8-14.4Z" />
    <path v-else-if="name === 'search'" d="m16 16 5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0" />
    <g v-else-if="name === 'discover'"><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5Z" /></g>
    <path v-else-if="name === 'library'" d="M4 4v16M9 4v16m5-15 5-1 4 15-5 1Z" />
    <path v-else-if="name === 'playing'" d="M4 9v6M8 4v16m4-13v10m4-15v20m4-14v8" />
    <path v-else-if="name === 'shuffle'" d="M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 3-2 4-4m4-4c1-2 2-4 4-4h3m-4-4 4 4-4 4" />
    <path v-else-if="name === 'loop'" d="M19 8H5l4-4M5 16h14l-4 4M19 8l-4-4m4 4v4M5 16l4 4m-4-4v-4" />
    <path v-else-if="name === 'volume'" d="M11 4 6 8H3v8h3l5 4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
    <path v-else-if="name === 'expand'" d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6" />
    <path v-else d="M4 12h16m-6-6 6 6-6 6" />
  </svg>
</template>
<script setup lang="ts">
defineProps<{ name: string }>()
</script>
