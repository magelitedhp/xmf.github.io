<template>
  <section class="page search-page">
    <div class="playlist-detail">
      <CoverImage :src="tracks[0]?.artwork" :alt="`${headline} 封面`" img-class="large-cover" />
      <div class="playlist-copy">
        <p class="volume-label">Volume · Search</p>
        <h1>{{ headline }}</h1>
        <p class="meta">{{ metaCopy }}</p>
        <p>{{ description }}</p>
        <div class="button-row">
          <button class="champagne-button" type="button" :disabled="!tracks.length" @click="$emit('play-all')">播放全部</button>
        </div>
      </div>
    </div>

    <p v-if="error" class="empty-copy">{{ error }}</p>
    <p v-else-if="loading" class="empty-copy">{{ loadingCopy }}</p>
    <TrackTable
      v-if="tracks.length || !loading"
      :tracks="tracks"
      :current-id="currentId"
      :start-index="startIndex"
      @play="$emit('play', $event)"
    />
    <nav v-if="showPager" class="pager" aria-label="搜索结果分页">
      <button class="glass-button" type="button" :disabled="!canPrev" @click="$emit('page-change', page - 1)">上一页</button>
      <p class="pager-status">第 {{ page }} 页</p>
      <button class="glass-button" type="button" :disabled="!canNext" @click="$emit('page-change', page + 1)">下一页</button>
    </nav>
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
  page?: number
  pageSize?: number
  hasMore?: boolean
}>()

defineEmits<{
  play: [id: string]
  'play-all': []
  'page-change': [page: number]
}>()

const page = computed(() => Math.max(1, props.page ?? 1))
const pageSize = computed(() => props.pageSize ?? 20)
const startIndex = computed(() => (page.value - 1) * pageSize.value)
const canPrev = computed(() => page.value > 1 && !props.loading)
const canNext = computed(() => Boolean(props.hasMore) && !props.loading)
const showPager = computed(() => Boolean(props.query?.trim()) && (page.value > 1 || props.hasMore || props.tracks.length > 0))
const headline = computed(() => props.query?.trim() || '检索书房曲库')
const metaCopy = computed(() => {
  if (!props.tracks.length) return page.value > 1 ? `第 ${page.value} 页暂无结果` : '支持曲目、歌手与专辑名'
  return `第 ${page.value} 页 · ${props.tracks.length} 首来自 GD音乐台`
})
const description = computed(() =>
  props.tracks.length
    ? '点选任意一首即可请求播放地址、封面与歌词。可用底部分页继续翻阅。'
    : '在顶部检索歌曲、艺人或专辑，结果会誊写在这里。',
)
const loadingCopy = computed(() => (page.value > 1 ? `正在载入第 ${page.value} 页…` : '正在检索曲库…'))
</script>
