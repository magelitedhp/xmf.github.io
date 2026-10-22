<template>
  <div class="lx-page">
    <div class="lx-page-head">
      <h1 class="lx-page-title">排行榜</h1>
      <span class="lx-page-sub">各平台的热门榜单</span>
    </div>

    <section v-for="group in leaderboardGroups" :key="group.source" class="lx-board-group">
      <h3>{{ group.name }}</h3>
      <div class="lx-board-grid">
        <button
          v-for="board in group.boards"
          :key="board.id"
          type="button"
          class="lx-board"
          @click="open(board.id)"
        >
          <span class="lx-board-mark" :style="{ background: board.tint }">{{ board.name.slice(0, 1) }}</span>
          <span class="lx-board-text">
            <strong>{{ board.name }}</strong>
            <span>{{ board.description }}</span>
          </span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { leaderboardGroups } from '../core/discover'

const router = useRouter()

function open(id: string) {
  void router.push(`/lxmusic/leaderboard/${id}`)
}
</script>
