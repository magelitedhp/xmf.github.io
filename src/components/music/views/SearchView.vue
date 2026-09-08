<template>
  <section class="page search-page">
    <div class="playlist-detail">
      <CoverImage :src="tracks[0]?.artwork" :alt="`${headline} 封面`" img-class="large-cover" />
      <div class="playlist-copy">
        <h1>{{ headline }}</h1>
        <p class="meta">{{ metaCopy }}</p>
        <p>{{ description }}</p>
        <div class="button-row">
          <button class="champagne-button" type="button" :disabled="!tracks.length" @click="$emit('play-all')">播放全部</button>
        </div>
      </div>
    </div>

    <p v-if="error" class="empty-copy">{{ error }}</p>
    <p v-else-if="loading" class="empty-copy">正在检索曲库…</p>
    <TrackTable :tracks="tracks" :current-id="currentId" @play="$emit('play', $event)" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TrackTable from '../TrackTable.vue'
import CoverImage from '../CoverImage.vue'
import type { Track } from '../../../data/music'

const props = defineProps<{
  tracks: Track[]
  currentId: string
  query?: string
  loading?: boolean
  error?: string
}>()

defineEmits<{
  play: [id: string]
  'play-all': []
}>()

const headline = computed(() => props.query?.trim() || '检索夜航曲库')
const metaCopy = computed(() =>
  props.tracks.length ? `${props.tracks.length} 首来自 GD音乐台` : '支持曲目、歌手与专辑名',
)
const description = computed(() =>
  props.tracks.length
    ? '点选任意一首即可请求播放地址、封面与歌词。'
    : '在顶部搜索歌曲、艺人或专辑，结果会显示在这里。',
)
</script>
