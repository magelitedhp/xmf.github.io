<template>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path v-for="(d, index) in paths" :key="index" :d="d" :fill="filled ? 'currentColor' : 'none'" :stroke="filled ? 'none' : 'currentColor'" />
    <circle v-for="(c, index) in circles" :key="`c${index}`" :cx="c[0]" :cy="c[1]" :r="c[2]" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/** Icon set covering every glyph the music shell needs. */
const ICONS: Record<string, { paths: string[]; circles?: Array<[number, number, number]>; filled?: boolean }> = {
  search: { paths: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14', 'm16.2 16.2 4.3 4.3'] },
  album: { paths: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18', 'M12 10.4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2'] },
  leaderboard: { paths: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20H2'] },
  heart: { paths: ['M20.8 5.6a5.4 5.4 0 0 0-8.8 1 5.4 5.4 0 0 0-8.8-1C.2 9 4 14 12 20c8-6 11.8-11 8.8-14.4Z'] },
  download: { paths: ['M12 3v12', 'm7 11 5 5 5-5', 'M4 20h16'] },
  setting: { paths: ['M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7', 'M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3.04V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9v.01a1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z'] },
  play: { paths: ['M8 5.2 19 12 8 18.8Z'], filled: true },
  pause: { paths: ['M8 5h3v14H8z', 'M13 5h3v14h-3z'], filled: true },
  prev: { paths: ['M19 5v14L8 12Z', 'M5 5v14'], filled: false },
  next: { paths: ['M5 5v14l11-7Z', 'M19 5v14'], filled: false },
  volume: { paths: ['M11 4 6 8H3v8h3l5 4Z', 'M15.5 8.5a5 5 0 0 1 0 7', 'M18.5 5.5a9 9 0 0 1 0 13'] },
  mute: { paths: ['M11 4 6 8H3v8h3l5 4Z', 'm16 9 5 6', 'm21 9-5 6'] },
  modeList: { paths: ['M4 7h11l-3-3', 'M20 17H9l3 3'] },
  modeSingle: { paths: ['M4 7h11l-3-3', 'M20 17H9l3 3', 'M12 11v6', 'm10 12 2-1'] },
  modeRandom: { paths: ['M4 7h3c5 0 7 10 12 10h1', 'm17 14 3 3-3 3', 'M4 17h3c2 0 3-2 4-4', 'm17 4 3 3-3 3', 'M14 7h3'] },
  rate: { paths: ['M12 3v18', 'M5 8h14', 'M7 21h10'] },
  lyric: { paths: ['M4 6h16', 'M4 11h11', 'M4 16h7'] },
  desktopLyric: { paths: ['M3 5h18v11H3z', 'M8 20h8', 'M12 16v4', 'M6 10h8'] },
  comment: { paths: ['M21 12a8 8 0 0 1-8 8H8l-5 3 1.4-4.6A8 8 0 1 1 21 12Z'] },
  add: { paths: ['M12 5v14', 'M5 12h14'] },
  remove: { paths: ['M5 12h14'] },
  trash: { paths: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13'] },
  more: { paths: ['M12 6.5h.01', 'M12 12h.01', 'M12 17.5h.01'] },
  close: { paths: ['m6 6 12 12', 'm18 6-12 12'] },
  minimize: { paths: ['M6 12h12'] },
  expand: { paths: ['M4 9V4h5', 'M20 15v5h-5', 'M15 4h5v5', 'M9 20H4v-5'] },
  collapse: { paths: ['M9 4v5H4', 'M15 20v-5h5', 'M20 9h-5V4', 'M4 15h5v5'] },
  back: { paths: ['m14 6-6 6 6 6'] },
  copy: { paths: ['M9 9h9v9H9z', 'M6 15H5V5h10v1'] },
  sort: { paths: ['M7 4v16', 'm4 17 3 3 3-3', 'M17 20V4', 'm14 7 3-3 3 3'] },
  edit: { paths: ['M4 20h4l11-11-4-4L4 16Z', 'm14 5 4 4'] },
  clear: { paths: ['M4 7h16', 'M9 7V4h6v3', 'm6 7 1 13h10l1-13', 'M10 11v6', 'M14 11v6'] },
  selectAll: { paths: ['M4 5h6v6H4z', 'm13 8 2 2 4-4', 'M4 15h6v6H4z', 'm13 18 2 2 4-4'] },
  check: { paths: ['m5 13 4 4 10-10'] },
  playlist: { paths: ['M4 6h11', 'M4 11h11', 'M4 16h7', 'M17 13v7', 'M20 15v3'] },
  refresh: { paths: ['M20 12a8 8 0 1 1-2.4-5.7', 'M20 4v4h-4'] },
  shuffle: { paths: ['M16 3h5v5', 'M4 20 21 3', 'M21 16v5h-5', 'M15 15l6 6', 'M4 4l5 5'] },
  queue: { paths: ['M4 6h11', 'M4 11h11', 'M4 16h7', 'M17 13v7', 'M20 15v3'] },
  listPlus: { paths: ['M4 6h10', 'M4 11h10', 'M4 16h7', 'M18 8v10', 'M13 13h10'] },
  listEnd: { paths: ['M4 6h10', 'M4 11h10', 'M4 16h10', 'M19 7v10', 'M15 17h8'] },
  save: { paths: ['M5 4h11l3 3v13H5z', 'M8 4v6h8V4', 'M8 20v-6h8v6'] },
  sparkles: { paths: ['m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z', 'm19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z'] },
  layers: { paths: ['m12 3 9 5-9 5-9-5Z', 'm3 12 9 5 9-5', 'm3 16 9 5 9-5'] },
  help: { paths: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18', 'M9.8 9a2.4 2.4 0 1 1 3.4 2.2c-.8.4-1.2 1-1.2 1.8', 'M12 17h.01'] },
  grip: { paths: ['M9 5h.01', 'M15 5h.01', 'M9 12h.01', 'M15 12h.01', 'M9 19h.01', 'M15 19h.01'] },
  chevronRight: { paths: ['m9 6 6 6-6 6'] },
  upload: { paths: ['M12 20V8', 'm7 12 5-5 5 5', 'M4 4h16'] },
  info: { paths: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18', 'M12 11v6', 'M12 8h.01'] },
  home: { paths: ['M4 11 12 4l8 7', 'M6 10v10h12V10'] },
  pauseCircle: { paths: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18', 'M10 9v6', 'M14 9v6'] },
  lock: { paths: ['M6 11h12v9H6z', 'M9 11V8a3 3 0 0 1 6 0v3'] },
  unlock: { paths: ['M6 11h12v9H6z', 'M9 11V8a3 3 0 0 1 5.7-1.3'] },
  translate: { paths: ['M4 6h9', 'M8.5 4v2', 'm5 6 3.2 7', 'M11.5 6 8.3 13', 'M14 19l3-8 3 8', 'M15.2 16h3.6'] },
  listLyric: { paths: ['M4 6h16', 'M4 11h16', 'M4 16h10'] },
  timeline: { paths: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20H2'] },
  arrowUpRight: { paths: ['M7 17 17 7', 'M8 7h9v9'] },
  repeat: { paths: ['M17 2l3 3-3 3', 'M3 11V9a4 4 0 0 1 4-4h13', 'M7 22l-3-3 3-3', 'M21 13v2a4 4 0 0 1-4 4H4'] },
  repeatOne: { paths: ['M17 2l3 3-3 3', 'M3 11V9a4 4 0 0 1 4-4h13', 'M7 22l-3-3 3-3', 'M21 13v2a4 4 0 0 1-4 4H4', 'M11 10h1v5'] },
  repeatOff: { paths: ['M17 2l3 3-3 3', 'M3 11V9a4 4 0 0 1 4-4h6', 'M7 22l-3-3 3-3', 'M21 13v2a4 4 0 0 1-4 4h-6', 'm3 3 18 18'] },
  disc: { paths: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18', 'M12 9.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8'] },
  offset: { paths: ['M12 4v16', 'm8 8 4-4 4 4', 'm8 16 4 4 4-4'] },
}

const props = defineProps<{ name: string }>()
const icon = computed(() => ICONS[props.name] ?? ICONS.info)
const paths = computed(() => icon.value.paths)
const circles = computed(() => icon.value.circles ?? [])
const filled = computed(() => Boolean(icon.value.filled))
</script>
