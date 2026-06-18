<template>
  <section class="page search-page">
    <div class="playlist-detail">
      <img class="large-cover" :src="tracks[0]?.artwork" alt="午后惬意节拍封面" />
      <div class="playlist-copy">
        <span class="eyebrow">精选歌单</span>
        <h1>午后惬意节拍</h1>
        <p class="meta">由 Music 编辑创建 · 128 首歌曲 · 约 7 小时 15 分钟</p>
        <p>沉浸在低保真节拍和轻柔人声中，为繁忙工作午后带来一丝宁静与专注。</p>
        <div class="button-row">
          <button class="primary-button" type="button" @click="$emit('play-all')">▶ 播放全部</button>
          <button class="secondary-button" type="button">＋ 收藏歌单</button>
        </div>
      </div>
    </div>

    <TrackTable :tracks="tracks" :current-id="currentId" @play="$emit('play', $event)" />
  </section>
</template>

<script setup lang="ts">
import TrackTable from '../TrackTable.vue'
import type { Track } from '../../../data/music'

defineProps<{
  tracks: Track[]
  currentId: number
}>()

defineEmits<{
  play: [id: number]
  'play-all': []
}>()
</script>
