<template>
  <RouterLink class="game-card glass-panel" :to="`/games/${game.slug}`">
    <div class="game-card-cover">
      <img :src="coverUrl(game)" :alt="`${game.name} 封面`" loading="lazy" />
      <span class="game-card-play" aria-hidden="true">▶</span>
    </div>
    <div class="game-card-body">
      <p class="game-card-genre">{{ game.genre }}</p>
      <h3>{{ game.name }} <small>{{ game.enName }}</small></h3>
      <p class="game-card-summary">{{ game.summary }}</p>
      <div class="game-card-footer"><div class="post-tags">
        <span v-for="tag in game.tags" :key="tag">{{ tag }}</span>
      </div><span>开始游玩 ↗</span></div>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { coverUrl, type GameEntry } from '../data/games'

defineProps<{
  game: GameEntry
}>()
</script>
