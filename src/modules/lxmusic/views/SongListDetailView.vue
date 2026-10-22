<template>
  <LxQueryList
    v-if="item"
    :source="item.source"
    :query="item.query"
    :title="item.name"
    :subtitle="`${item.author} · ${item.playCount} · ${item.description}`"
    back-to="/lxmusic/songList"
    :list-id="`songlist:${item.id}`"
    wall-mode
  />
  <div v-else class="lx-page">
    <p class="lx-query-state">歌单不存在或已下线。</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import LxQueryList from '../components/LxQueryList.vue'
import { songLists } from '../core/discover'

const route = useRoute()
const item = computed(() => songLists.find((entry) => entry.id === route.params.id))
</script>
