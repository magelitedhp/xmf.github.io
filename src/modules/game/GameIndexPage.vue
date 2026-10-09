<template>
  <main class="site-main game-index">
    <header class="blog-header glass-panel">
      <p class="effects-kicker">Arcade</p>
      <h1>夜航游戏厅</h1>
      <p>打开即玩的浏览器小游戏。键盘、鼠标与触屏均可游玩，纪录保存在本地。</p>
    </header>

    <section class="game-list">
      <GameCard v-for="game in games" :key="game.slug" :game="game" />
      <article class="game-card game-card-soon glass-panel" aria-label="筹备中">
        <div class="game-card-cover">
          <span>?</span>
        </div>
        <div class="game-card-body">
          <p class="game-card-genre">Coming Soon</p>
          <h3>下一款 · 筹备中</h3>
          <p class="game-card-summary">新的灯火还在点燃。</p>
        </div>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import GameCard from './components/GameCard.vue'
import { games } from './data/games'
</script>
