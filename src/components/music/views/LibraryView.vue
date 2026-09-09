<template>
  <section class="page library-page">
    <div class="profile-head">
      <div>
        <p class="volume-label">Volume · Library</p>
        <h1>你的收藏</h1>
        <div class="stats">
          <span><strong>{{ likedTracks.length }}</strong>已收藏</span>
          <span><strong>{{ recentTracks.length }}</strong>最近播放</span>
        </div>
      </div>
    </div>

    <div class="tabs" role="tablist">
      <button :class="{ active: tab === 'liked' }" type="button" @click="tab = 'liked'">我喜欢的音乐</button>
      <button :class="{ active: tab === 'recent' }" type="button" @click="tab = 'recent'">最近播放</button>
    </div>

    <section class="section-block">
      <div class="section-heading">
        <h2>{{ tab === 'liked' ? '我喜欢的音乐' : '最近播放' }}</h2>
      </div>
      <div class="album-strip">
        <article
          v-for="track in spotlight"
          :key="track.uid"
          class="album-card"
          @click="emitPlay(track.uid)"
        >
          <CoverImage :src="track.artwork" :alt="`${track.title} 封面`" img-class="cover" />
          <h3>{{ track.title }}</h3>
          <p>{{ track.artist }}</p>
        </article>
        <p v-if="!spotlight.length" class="empty-copy">{{ emptyCopy }}</p>
      </div>
    </section>

    <div class="library-grid">
      <section class="panel glass-panel">
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
import type { Track } from '../../../data/music'

const props = defineProps<{
  recentTracks: Track[]
  likedTracks: Track[]
  currentId: string
}>()

const emit = defineEmits<{
  'play-recent': [id: string]
  'play-liked': [id: string]
}>()

const tab = ref<'liked' | 'recent'>(props.likedTracks.length ? 'liked' : 'recent')
const activeList = computed(() => (tab.value === 'liked' ? props.likedTracks : props.recentTracks))
const spotlight = computed(() => activeList.value.slice(0, 6))
const emptyCopy = computed(() =>
  tab.value === 'liked' ? '点亮心底的那首，它会留在书签里。' : '开始播放后，足迹会写进这本听书札记。',
)

function emitPlay(uid: string) {
  if (tab.value === 'liked') emit('play-liked', uid)
  else emit('play-recent', uid)
}
</script>
