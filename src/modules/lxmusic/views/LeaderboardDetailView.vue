<template>
  <LxQueryList
    v-if="board"
    :source="board.source"
    :query="board.query"
    :title="board.name"
    :subtitle="board.description"
    back-to="/lxmusic/leaderboard"
    :list-id="`board:${board.id}`"
  />
  <div v-else class="lx-page">
    <p class="lx-query-state">榜单不存在或已下线。</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import LxQueryList from '../components/LxQueryList.vue'
import { leaderboardGroups } from '../core/discover'

const route = useRoute()

const board = computed(() =>
  leaderboardGroups.flatMap((group) => group.boards).find((entry) => entry.id === route.params.id),
)
</script>
