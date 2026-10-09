<template>
  <section class="page library-page">
    <div class="profile-head">
      <div>
        <p class="volume-label">YOUR PRIVATE PRESSING</p>
        <h1>偏爱，值得留一面。</h1>
        <p>收好让你心动的旋律，下次相遇不必再找。</p>
        <div class="stats">
          <span><strong>{{ likedTracks.length }}</strong>已收藏</span>
          <span><strong>{{ recentTracks.length }}</strong>最近播放</span>
        </div>
      </div>
      <span class="library-art" aria-hidden="true">♡</span>
    </div>

    <div class="tabs" role="group" aria-label="收藏分类">
      <button :class="{ active: tab === 'liked' }" :aria-pressed="tab === 'liked'" type="button" @click="tab = 'liked'">我喜欢的音乐</button>
      <button :class="{ active: tab === 'recent' }" :aria-pressed="tab === 'recent'" type="button" @click="tab = 'recent'">最近播放</button>
    </div>

    <section class="section-block">
      <div class="section-heading">
        <h2>{{ tab === 'liked' ? '我喜欢的音乐' : '最近播放' }}</h2>
      </div>
      <div v-if="spotlight.length" class="album-strip">
        <button
          v-for="track in spotlight"
          :key="track.uid"
          class="album-card"
          type="button"
          @click="emitPlay(track.uid)"
        >
          <CoverImage :src="track.artwork" :alt="`${track.title} 封面`" img-class="cover" />
          <h3>{{ track.title }}</h3>
          <p>{{ track.artist }}</p>
        </button>
      </div>
      <div v-else class="music-empty"><span aria-hidden="true">{{ tab === 'liked' ? '♡' : '◎' }}</span><h2>这里，等一首你的偏爱。</h2><p>{{ emptyCopy }}</p><button class="champagne-button" type="button" @click="$emit('discover')">去发现好音乐 ↗</button></div>
    </section>

    <div v-if="activeList.length" class="library-grid">
      <section class="panel">
        <h2>{{ tab === 'liked' ? '收藏列表' : '播放足迹' }}</h2>
        <TrackList :tracks="activeList" :current-id="currentId" @play="emitPlay" />
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import TrackList from '../TrackList.vue'
import CoverImage from '../CoverImage.vue'
import type { Track } from '../../data/music'

const props = defineProps<{
  recentTracks: Track[]
  likedTracks: Track[]
  currentId: string
}>()

const emit = defineEmits<{
  'play-recent': [id: string]
  'play-liked': [id: string]
  discover: []
}>()

const tab = ref<'liked' | 'recent'>(props.likedTracks.length ? 'liked' : 'recent')
const activeList = computed(() => (tab.value === 'liked' ? props.likedTracks : props.recentTracks))
const spotlight = computed(() => activeList.value.slice(0, 6))
const emptyCopy = computed(() =>
  tab.value === 'liked' ? '播放时点一下爱心，喜欢的歌就会留在这里。' : '从一首歌开始，你的收听足迹会慢慢长出来。',
)

function emitPlay(uid: string) {
  if (tab.value === 'liked') emit('play-liked', uid)
  else emit('play-recent', uid)
}
</script>
