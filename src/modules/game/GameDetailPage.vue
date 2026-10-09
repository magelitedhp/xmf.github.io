<template>
  <main v-if="game" class="site-main game-main">
    <RouterLink class="post-back" to="/games">← 返回游戏列表</RouterLink>
    <section class="game-heading">
      <p class="effects-kicker">{{ game.enName }} · {{ game.genre }}</p>
      <h1>{{ game.name }}</h1>
      <p>{{ game.description }}</p>
    </section>

    <component :is="gameComponent" :key="game.slug" />

    <section class="game-notes glass-panel">
      <div>
        <div class="game-note-heading"><span>01</span><h2>上手，只需要一点好奇。</h2></div>
        <ul>
          <li v-for="c in game.controls" :key="c.label">
            <span><kbd v-for="k in c.keys" :key="k">{{ k }}</kbd></span>
            <span>{{ c.label }}</span>
          </li>
        </ul>
      </div>
      <div>
        <div class="game-note-heading"><span>02</span><h2>关于这场小小的冒险</h2></div>
        <div class="game-about-copy"><p v-if="game.credit">
          {{ game.credit.prefix }}
          <a :href="game.credit.href" target="_blank" rel="noopener noreferrer">{{ game.credit.label }}</a>
          {{ game.credit.suffix }}
        </p>
        <p v-for="note in game.notes" :key="note">{{ note }}</p>
        </div>
      </div>
    </section>
    <section class="game-more"><div class="game-more-title"><h2>快乐，还有下一站。</h2><p>ANOTHER LITTLE ADVENTURE</p></div><div class="game-more-grid"><RouterLink v-for="other in otherGames" :key="other.slug" :to="`/games/${other.slug}`" class="game-more-card"><img :src="coverUrl(other)" :alt="other.name" loading="lazy"><div><h3>{{ other.name }}</h3><p>{{ other.enName }}</p></div><span aria-hidden="true">↗</span></RouterLink></div></section>
  </main>

  <main v-else class="site-main post-page">
    <section class="post-missing glass-panel">
      <p class="effects-kicker">404 · Missing Game</p>
      <h1>这款游戏没有找到</h1>
      <p>它可能还在筹备，或者链接有误。</p>
      <RouterLink class="glass-button" to="/games">返回游戏列表</RouterLink>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, watchEffect } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { findGame, games, coverUrl } from './data/games'

const route = useRoute()
const game = computed(() => findGame(String(route.params.slug)))
const otherGames = computed(() => games.filter(entry => entry.slug !== game.value?.slug))
const gameComponent = computed(() => (game.value ? defineAsyncComponent(game.value.load) : null))

watchEffect(() => {
  document.title = game.value ? `${game.value.name} · Yumo 游戏` : '未找到游戏 · Yumo'
})
</script>
