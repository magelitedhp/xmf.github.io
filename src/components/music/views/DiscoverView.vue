<template>
  <section class="page discover-page">
    <article class="hero-banner">
      <CoverImage :src="heroTrack?.artwork" alt="本周主打封面" img-class="hero-art" />
      <div class="hero-copy">
        <h1>{{ heroTrack?.title || '夜航发现' }}</h1>
        <p>{{ heroCopy }}</p>
        <div class="button-row">
          <button class="champagne-button" type="button" :disabled="!tracks.length" @click="$emit('play-all')">立即播放</button>
          <button class="glass-button" type="button" @click="$emit('retry')">刷新曲库</button>
        </div>
      </div>
    </article>

    <p v-if="error" class="empty-copy">{{ error }}</p>
    <p v-else-if="loading" class="empty-copy">正在从 GD音乐台载入夜航歌单…</p>

    <section class="section-block">
      <div class="section-heading">
        <div>
          <h2>夜航电台</h2>
          <p>用一种心情打开整段夜色</p>
        </div>
      </div>
      <div class="playlist-grid">
        <PlaylistCard
          v-for="playlist in playlists"
          :key="playlist.id"
          :playlist="playlist"
          @open="$emit('open-station', playlist)"
        />
      </div>
    </section>

    <div class="dashboard-grid">
      <section class="panel glass-panel">
        <div class="section-heading compact">
          <h2>热门单曲</h2>
          <button class="text-button" type="button" @click="$emit('play-all')">播放全部</button>
        </div>
        <TrackList :tracks="tracks" :current-id="currentId" @play="$emit('play', $event)" />
      </section>

      <section class="compact-panel">
        <h2>最新专辑</h2>
        <button
          v-for="album in albums"
          :key="album.title"
          class="album-row"
          type="button"
          @click="$emit('open-album', album)"
        >
          <CoverImage :src="album.artwork" :alt="`${album.title} 封面`" img-class="thumb thumb-xl" />
          <div>
            <strong>{{ album.title }}</strong>
            <span>{{ album.meta }}</span>
          </div>
        </button>
      </section>
    </div>

    <section class="section-block">
      <div class="section-heading compact">
        <h2>夜色精选</h2>
      </div>
      <div class="collection-grid">
        <button
          v-for="collection in collections"
          :key="collection.id"
          class="collection-card group-card"
          type="button"
          @click="$emit('open-station', collection)"
        >
          <CoverImage :src="collection.artwork" :alt="`${collection.title} 封面`" />
          <div>
            <h3>{{ collection.title }}</h3>
            <p>{{ collection.subtitle }}</p>
          </div>
        </button>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PlaylistCard from '../PlaylistCard.vue'
import TrackList from '../TrackList.vue'
import CoverImage from '../CoverImage.vue'
import type { Album, Collection, Playlist, Track } from '../../../data/music'

const props = defineProps<{
  tracks: Track[]
  playlists: Playlist[]
  albums: Album[]
  collections: Collection[]
  currentId: string
  loading?: boolean
  error?: string
}>()

defineEmits<{
  play: [id: string]
  'play-all': []
  'open-station': [station: Playlist | Collection]
  'open-album': [album: Album]
  retry: []
}>()

const heroTrack = computed(() => props.tracks[0])
const heroCopy = computed(() => {
  if (!heroTrack.value) return '连接曲库后，这里会亮起今晚的第一首。'
  return `${heroTrack.value.artist} · ${heroTrack.value.album}`
})
</script>
