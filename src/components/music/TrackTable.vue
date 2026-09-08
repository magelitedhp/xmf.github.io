<template>
  <div class="track-table">
    <div class="table-head">
      <span>#</span>
      <span>标题</span>
      <span>艺人</span>
      <span>专辑</span>
      <span>时长</span>
    </div>

    <p v-if="!tracks.length" class="empty-copy">输入关键词，从 GD音乐台检索曲目。</p>

    <button
      v-for="(track, index) in tracks"
      :key="track.uid"
      class="table-row"
      :class="{ active: track.uid === currentId }"
      type="button"
      @click="$emit('play', track.uid)"
    >
      <span>{{ index + 1 }}</span>
      <span class="table-title">
        <CoverImage :src="track.artwork" :alt="`${track.title} 封面`" img-class="thumb" />
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
import CoverImage from './CoverImage.vue'

defineProps<{
  tracks: Track[]
  currentId: string
}>()

defineEmits<{
  play: [id: string]
}>()
</script>
