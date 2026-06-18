<template>
  <div class="track-table">
    <div class="table-head">
      <span>#</span>
      <span>标题</span>
      <span>艺人</span>
      <span>专辑</span>
      <span>时长</span>
    </div>

    <button
      v-for="(track, index) in tracks"
      :key="track.id"
      class="table-row"
      :class="{ active: track.id === currentId }"
      type="button"
      @click="$emit('play', track.id)"
    >
      <span>{{ index + 1 }}</span>
      <span class="table-title">
        <img class="thumb" :src="track.artwork" :alt="`${track.title} 封面`" />
        <strong>{{ track.title }}</strong>
      </span>
      <span>{{ track.artist }}</span>
      <span>{{ track.album }}</span>
      <span>{{ track.duration }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Track } from '../../data/music'

defineProps<{
  tracks: Track[]
  currentId: number
}>()

defineEmits<{
  play: [id: number]
}>()
</script>
