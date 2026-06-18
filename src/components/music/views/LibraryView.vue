<template>
  <section class="page library-page">
    <div class="profile-head">
      <img class="profile-card-art" :src="profileArtwork" alt="张伟头像" />
      <div>
        <span class="eyebrow pill">PREMIUM 会员</span>
        <h1>张伟 (David Zhang)</h1>
        <div class="stats">
          <span><strong>128</strong>正在关注</span>
          <span><strong>45.2k</strong>粉丝</span>
          <span><strong>1.2k</strong>已收藏歌曲</span>
        </div>
      </div>
      <button class="primary-button profile-action" type="button">编辑资料</button>
    </div>

    <div class="tabs">
      <button class="active" type="button">我喜欢的音乐</button>
      <button type="button">我的歌单</button>
      <button type="button">关注艺人</button>
      <button type="button">最近播放</button>
    </div>

    <section class="section-block">
      <div class="section-heading">
        <h2>最近播放</h2>
        <button class="text-button" type="button">查看全部 ›</button>
      </div>
      <div class="album-strip">
        <article v-for="track in recentTracks" :key="track.id" class="album-card" @click="$emit('play', track.id)">
          <img class="cover" :src="track.artwork" :alt="`${track.title} 封面`" />
          <h3>{{ track.title }}</h3>
          <p>{{ track.artist }}</p>
        </article>
      </div>
    </section>

    <div class="library-grid">
      <section class="panel">
        <h2>我喜欢的音乐</h2>
        <TrackList :tracks="likedTracks" :current-id="currentId" @play="$emit('play', $event)" />
      </section>
      <section class="create-playlist">
        <div>
          <h2>创建新歌单</h2>
          <p>记录你的音乐心情</p>
        </div>
        <span>＋</span>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import TrackList from '../TrackList.vue'
import { profileArtwork, type Track } from '../../../data/music'

defineProps<{
  recentTracks: Track[]
  likedTracks: Track[]
  currentId: number
}>()

defineEmits<{
  play: [id: number]
}>()
</script>
