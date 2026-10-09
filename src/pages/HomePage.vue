<template>
  <main class="site-main home-main" id="content">
    <section class="home-hero">
      <div class="home-hero-copy">
        <p class="effects-kicker"><span class="status-dot"></span> A PERSONAL SPACE FOR WANDERING</p>
        <h1 class="home-title">在日常之外，<br>保持<span class="curiosity-word">好奇<svg viewBox="0 0 220 25" aria-hidden="true"><path d="M4 15Q90-1 211 9M34 23Q128 9 205 16"/></svg></span>。</h1>
        <p class="home-english">Make room<br>for <em>wonder.</em></p>
        <p class="home-lead">一些文字，一段旋律，一场无用却有趣的实验。<br>欢迎来到我的互联网自留地。</p>
        <div class="button-row home-actions"><RouterLink class="champagne-button" to="/blog">从一篇随笔开始 <span>↗</span></RouterLink><a class="text-link" href="#explore" @click.prevent="explore">随意逛逛 <span>↓</span></a></div>
      </div>
      <BrandCanvas />
      <div class="hero-baseline"><span>Yumo / CREATIVE SPACE</span><span>记录 · 聆听 · 实验 · 玩耍</span><span class="baseline-scroll">SCROLL TO EXPLORE ↓</span></div>
    </section>
    <section id="explore" class="home-portals">
      <div class="home-section-heading"><div><p class="effects-kicker">01 / SPACE INDEX</p><h2>走进不同的频率<span class="heading-dot">.</span></h2></div><p class="section-aside">不必急着到达。<br>每个入口，都值得停留。</p></div>
      <div class="portal-grid">
        <RouterLink v-for="portal in portals" :key="portal.to" class="portal-card" :class="'portal-' + portal.art" :to="portal.to">
          <div class="portal-topline"><span>{{ portal.number }} / {{ portal.english }}</span><span class="round-arrow">↗</span></div>
          <div class="portal-visual" aria-hidden="true"><div v-if="portal.art === 'music'" class="record-art"><i></i><b>n.</b></div><div v-else-if="portal.art === 'tools'" class="tool-art"><span>✳</span><i>⌘</i></div><div v-else-if="portal.art === 'effects'" class="ink-art"><i></i><i></i><i></i></div><div v-else class="arcade-art"><span>PLAY</span><b>▶</b></div></div>
          <div class="portal-copy"><h3>{{ portal.title }}</h3><p>{{ portal.copy }}</p></div>
        </RouterLink>
      </div>
    </section>
    <section class="home-journal">
      <div class="home-section-heading"><div><p class="effects-kicker">02 / FIELD NOTES</p><h2>想法留下的痕迹<span class="heading-dot">.</span></h2></div><RouterLink class="section-link" to="/blog">全部随笔 ↗</RouterLink></div>
      <div class="home-post-grid"><PostCard v-for="post in latestPosts" :key="post.slug" :post="post" /></div>
    </section>
    <section class="home-about"><div class="about-symbol" aria-hidden="true">✳</div><div><p class="effects-kicker">03 / A NOTE FROM HERE</p><h2>让想法发生，<br>也让生活留白。</h2></div><div class="home-about-copy"><p>这里记录前端实现、音乐体验与视觉实验。把想法放进浏览器，看看它们会长成什么样。</p><p>没有完美的终点。这片小小的空间，会和好奇心一起继续生长。</p><span class="about-signature">Stay curious. — Yumo</span></div></section>
  </main>
</template>
<script setup lang="ts">
import { RouterLink } from 'vue-router'
import BrandCanvas from '../components/site/BrandCanvas.vue'
import PostCard from '../modules/blog/components/PostCard.vue'
import { blogPosts } from '../modules/blog/data/posts'
const latestPosts = blogPosts.slice(0, 3)
const portals = [
  { number: '01', english: 'LISTEN', title: '把世界，调成喜欢的声音。', copy: '音乐电台 / 发现、收藏与循环播放', to: '/music', art: 'music' },
  { number: '02', english: 'MAKE', title: '给灵感一张工作台。', copy: '工具实验室 / 整理文字，拆解想法', to: '/tools', art: 'tools' },
  { number: '03', english: 'FEEL', title: '让指尖，留下一场流动。', copy: '视觉现场 / 一块可以触碰的画布', to: '/effects', art: 'effects' },
  { number: '04', english: 'PLAY', title: '今天也要，认真玩耍。', copy: 'Yumo 游戏厅 / 把快乐交给下一关', to: '/games', art: 'games' },
]
function explore() { document.querySelector('#explore')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }) }
</script>
