<template>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path :d="paths[name] ?? paths.star" />
  </svg>
</template>

<script setup lang="ts">
defineProps<{ name: string }>()
const paths: Record<string, string> = {
  flag: 'M6 21V4m0 0c5-4 8 4 13 0v9c-5 4-8-4-13 0',
  scan: 'M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2 2m8.8 8.8 2 2M5.6 18.4l2-2m8.8-8.8 2-2M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0',
  mine: 'M12 2v4m0 12v4M2 12h4m12 0h4M5 5l3 3m8 8 3 3M5 19l3-3m8-8 3-3M7 12a5 5 0 1 0 10 0 5 5 0 0 0-10 0',
  star: 'm12 2 2.7 6.5L22 9l-5.5 5 1.7 7L12 17l-6.2 4 1.7-7L2 9l7.3-.5Z',
  sparkle: 'm12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z',
  play: 'm9 5 11 7-11 7Z',
  pause: 'M8 5v14M16 5v14',
  restart: 'M20 10a8 8 0 1 0 0 5M20 3v7h-7',
  sound: 'm11 4-5 4H3v8h3l5 4ZM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  mute: 'm11 4-5 4H3v8h3l5 4Zm5 5 6 6m0-6-6 6',
  help: 'M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0m6-3a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3h.01',
  close: 'm6 6 12 12M18 6 6 18',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  orbit: 'M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0M4 16C-1 12 13-1 20 5s-7 19-14 15',
  shield: 'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Zm-4 9 3 3 5-6',
  clock: 'M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0m9-5v5l3 2',
  trophy: 'M8 3h8v8a4 4 0 0 1-8 0ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 3v6m-5 0h10',
}
</script>
