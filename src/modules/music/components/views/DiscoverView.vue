<template>
  <section class="page discover-page">
    <div class="fm-page-heading"><p class="volume-label">01 / THE LISTENING ROOM</p><span>随时来坐坐，音乐一直在。</span></div>
    <article class="hero-banner">
      <div class="hero-copy">
        <p class="volume-label"><i class="on-air-dot"></i> YUMO FM · 自由收听</p>
        <h1>生活的 B 面。<br><em>Sound on.</em></h1>
        <p>把世界的音量调小一点。<br>在这里，找到属于你的频率。</p>
        <div class="button-row">
          <button class="champagne-button" type="button" :disabled="!tracks.length" @click="$emit('play-all')"><MusicIcon name="play" /> 开始收听</button>
          <button class="glass-button" type="button" :disabled="loading" @click="$emit('retry')">换一批声音 ↗</button>
        </div>
      </div>
      <TurntableArt hero />
      <div class="fm-hero-footer"><span>GOOD MUSIC. GOOD COMPANY.</span><span>33⅓ RPM <i></i> STEREO SOUND</span></div>
    </article>

    <div v-if="error" class="music-notice" role="status"><span>暂时没有接通信号。{{ error }}</span><button class="text-button" type="button" @click="$emit('retry')">重新连接 ↗</button></div>

    <section class="section-block">
      <div class="section-heading">
        <div>
          <p class="volume-label">PICK A FREQUENCY</p>
          <h2>此刻，想听什么？</h2>
          <p>给不同的心情，留一个频道。</p>
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
      <section class="panel">
        <div class="section-heading compact">
          <div>
            <p class="volume-label">ON THE TURNTABLE</p>
            <h2>今日播放清单<span class="heading-dot">.</span></h2>
          </div>
          <button class="text-button" type="button" :disabled="!tracks.length" @click="$emit('play-all')">播放全部 ↗</button>
        </div>
        <div v-if="loading && !tracks.length" class="track-skeleton" role="status" aria-label="正在连接曲库"><i v-for="n in 5" :key="n"></i><span>正在寻找好声音…</span></div>
        <TrackList v-else :tracks="tracks" :current-id="currentId" @play="$emit('play', $event)" />
      </section>

      <section class="compact-panel">
        <p class="volume-label">A CLOSER LISTEN</p>
        <h2>专辑一角</h2>
        <div v-if="!albums.length" class="album-empty"><span aria-hidden="true">◎</span><p>好专辑，值得从头听。<br>连接曲库后，在这里相遇。</p></div>
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
        <div>
          <p class="volume-label">SOUNDTRACKS FOR LIFE</p>
          <h2>给生活配个乐</h2>
        </div>
      </div>
      <div class="collection-grid">
        <button
          v-for="collection in collections"
          :key="collection.id"
          class="collection-card group-card"
          type="button"
          @click="$emit('open-station', collection)"
        >
          <div class="collection-art"><CoverImage :src="collection.artwork" :alt="`${collection.title} 封面`" /><span aria-hidden="true">↗</span></div>
          <div>
            <h3>{{ collection.title }}</h3>
            <p>{{ collection.subtitle }}</p>
          </div>
        </button>
      </div>
    </section>
    <div class="fm-signoff"><span>Yumo fm.</span><p>生活没有标准节拍。听你喜欢的。</p><span aria-hidden="true">✳</span></div>
  </section>
</template>

<script setup lang="ts">
import TurntableArt from '../TurntableArt.vue'
import MusicIcon from '../MusicIcon.vue'
import PlaylistCard from '../PlaylistCard.vue'
import TrackList from '../TrackList.vue'
import CoverImage from '../CoverImage.vue'
import type { Album, Collection, Playlist, Track } from '../../data/music'

defineProps<{
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

</script>
