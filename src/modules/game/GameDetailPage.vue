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
        <h2>操作</h2>
        <ul>
          <li v-for="c in game.controls" :key="c.label">
            <kbd v-for="k in c.keys" :key="k">{{ k }}</kbd>
            {{ c.label }}
          </li>
        </ul>
      </div>
      <div>
        <h2>说明</h2>
        <p v-if="game.credit">
          {{ game.credit.prefix }}
          <a :href="game.credit.href" target="_blank" rel="noopener noreferrer">{{ game.credit.label }}</a>
          {{ game.credit.suffix }}
        </p>
        <p v-for="note in game.notes" :key="note">{{ note }}</p>
      </div>
    </section>
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
import { findGame } from './data/games'

const route = useRoute()
const game = computed(() => findGame(String(route.params.slug)))
const gameComponent = computed(() => (game.value ? defineAsyncComponent(game.value.load) : null))

watchEffect(() => {
  document.title = game.value ? `${game.value.name} · Nocturne 游戏` : '未找到游戏 · Nocturne'
})
</script>
