<template>
  <main class="site-main game-index">
    <header class="arcade-hero"><div><p class="effects-kicker">04 / Yumo ARCADE</p><h1>认真生活。<br><em>尽兴玩耍。</em></h1><p>短暂离线于日常，长久在线于快乐。<br>三款原创浏览器游戏，打开就能进入另一个世界。</p></div><div class="arcade-hero-art" aria-hidden="true"><span>+ <b>••</b></span><i>JUST<br>ONE MORE.</i></div></header>
    <div class="arcade-filterbar"><div class="arcade-filters" role="group" aria-label="游戏类型"><button v-for="filter in filters" :key="filter" :class="{active:active===filter}" :aria-pressed="active===filter" @click="active=filter">{{ filter }}</button></div><span>{{ String(filtered.length).padStart(2,'0') }} GAMES / READY TO PLAY</span></div>
    <section class="game-list" aria-live="polite"><GameCard v-for="game in filtered" :key="game.slug" :game="game" /></section>
    <div class="arcade-note"><span>✳ 不必下载，即刻出发。</span><span>支持键盘与触屏 · 纪录保存在本地浏览器</span></div>
  </main>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import GameCard from './components/GameCard.vue'
import { games } from './data/games'
const filters=['全部','动作','策略','物理'],active=ref('全部')
const filtered=computed(()=>games.filter(game=>active.value==='全部'||(active.value==='策略'?game.tags.includes('塔防'):game.tags.includes(active.value))))
</script>