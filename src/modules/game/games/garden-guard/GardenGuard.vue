<template>
  <GameFrame>
    <iframe
      class="game-iframe"
      :src="src"
      title="花园保卫战"
      allow="autoplay; fullscreen"
      loading="lazy"
    ></iframe>

    <template #toolbar>
      <a class="glass-button" :href="src" target="_blank" rel="noopener">新窗口打开</a>
    </template>
  </GameFrame>
</template>

<script setup lang="ts">
import GameFrame from '../../components/GameFrame.vue'

// The game is a standalone single-file HTML build (games-src/garden-guard → public/games/garden-guard).
const src = `${import.meta.env.BASE_URL || './'}games/garden-guard/index.html`
</script>
