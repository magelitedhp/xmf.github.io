<template>
  <section class="page discover-page">
    <article class="hero-banner">
      <img :src="heroArtwork" alt="午夜幻境专辑视觉" />
      <div class="hero-copy">
        <span class="eyebrow">本周主打</span>
        <h1>午夜幻境 · 周末限定</h1>
        <p>沉浸在迷幻爵士与现代电子的完美融合中，探索本季度最受瞩目的年度专辑。</p>
        <div class="button-row">
          <button class="primary-button" type="button" @click="$emit('play-all')">▶ 立即播放</button>
          <button class="secondary-button" type="button">收藏专辑</button>
        </div>
      </div>
    </article>

    <section class="section-block">
      <div class="section-heading">
        <div>
          <h2>推荐歌单</h2>
          <p>根据你的听歌偏好定制</p>
        </div>
        <button class="text-button" type="button">查看全部</button>
      </div>
      <div class="playlist-grid">
        <PlaylistCard v-for="playlist in playlists" :key="playlist.title" :playlist="playlist" />
      </div>
    </section>

    <div class="dashboard-grid">
      <section class="panel">
        <div class="section-heading compact">
          <h2>热门单曲</h2>
          <button class="text-button" type="button" @click="$emit('play-all')">播放全部</button>
        </div>
        <TrackList :tracks="tracks" :current-id="currentId" @play="$emit('play', $event)" />
      </section>

      <section class="panel compact-panel">
        <h2>最新专辑</h2>
        <article v-for="album in albums" :key="album.title" class="album-row">
          <img class="thumb thumb-xl" :src="album.artwork" :alt="`${album.title} 封面`" />
          <div>
            <strong>{{ album.title }}</strong>
            <span>{{ album.meta }}</span>
          </div>
        </article>
      </section>
    </div>

    <section class="section-block">
      <div class="section-heading compact">
        <h2>精选辑</h2>
        <div class="mini-actions">
          <button class="round-button" type="button">‹</button>
          <button class="round-button" type="button">›</button>
        </div>
      </div>
      <div class="collection-grid">
        <article v-for="collection in collections" :key="collection.title" class="collection-card">
          <img :src="collection.artwork" :alt="`${collection.title} 封面`" />
          <div>
            <h3>{{ collection.title }}</h3>
            <p>{{ collection.subtitle }}</p>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import PlaylistCard from '../PlaylistCard.vue'
import TrackList from '../TrackList.vue'
import { heroArtwork, type Album, type Collection, type Playlist, type Track } from '../../../data/music'

defineProps<{
  tracks: Track[]
  playlists: Playlist[]
  albums: Album[]
  collections: Collection[]
  currentId: number
}>()

defineEmits<{
  play: [id: number]
  'play-all': []
}>()
</script>
