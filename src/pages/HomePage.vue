<template>
  <main class="site-main">
    <section class="home-hero glass-panel">
      <p class="effects-kicker">Nocturne Atelier</p>
      <h1 class="home-title">夜航书斋<br />三扇通往别处的门</h1>
      <p class="home-lead">
        我在这里记录前端实现、音乐体验与界面实验。随笔保存过程，音乐与工具则让想法真正运行起来。
      </p>
      <div class="button-row home-actions">
        <RouterLink class="champagne-button" :to="`/blog/${featuredPost.slug}`">阅读最新随笔</RouterLink>
        <RouterLink class="glass-button" to="/music">进入音乐</RouterLink>
      </div>
    </section>

    <section class="home-journal">
      <div class="home-section-heading">
        <div>
          <p class="effects-kicker">Latest Notes</p>
          <h2>最近随笔</h2>
        </div>
        <RouterLink class="section-link" to="/blog">查看全部 →</RouterLink>
      </div>
      <div class="home-post-grid">
        <PostCard v-for="post in latestPosts" :key="post.slug" :post="post" />
      </div>
    </section>

    <section class="home-portals">
      <div class="home-section-heading">
        <div>
          <p class="effects-kicker">Projects</p>
          <h2>正在生长的项目</h2>
        </div>
      </div>
      <div class="portal-grid portal-grid-3">
        <RouterLink class="portal-card glass-panel" to="/music">
          <div class="portal-arch">
            <strong>音乐</strong>
          </div>
          <div class="portal-copy">
            <h3>藏书电台</h3>
            <p>发现、搜索、收藏与正在播放。</p>
            <span class="portal-cta">打开 →</span>
          </div>
        </RouterLink>

        <RouterLink class="portal-card glass-panel" to="/tools">
          <div class="portal-arch portal-arch-tools">
            <strong>AI</strong>
          </div>
          <div class="portal-copy">
            <h3>AI 工具</h3>
            <p>工具柜占位页，后续继续誊写。</p>
            <span class="portal-cta">打开 →</span>
          </div>
        </RouterLink>

        <RouterLink class="portal-card glass-panel" to="/effects">
          <div class="portal-arch portal-arch-effects">
            <strong>墨</strong>
          </div>
          <div class="portal-copy">
            <h3>动画效果</h3>
            <p>AquaInkGL 水墨流体 WebGL 演示。</p>
            <span class="portal-cta">打开 →</span>
          </div>
        </RouterLink>
      </div>
    </section>

    <section class="home-about glass-panel">
      <div>
        <p class="effects-kicker">About This Place</p>
        <h2>关于夜航书斋</h2>
      </div>
      <div class="home-about-copy">
        <p>
          这是一个持续生长的个人实验场，关注浏览器交互、视觉设计与实用工具。内容来自真实实现，不虚构履历，也不把每次尝试包装成最终答案。
        </p>
        <p>
          当前重点是完善博客内容层和 AI 工具箱，同时继续维护音乐播放器与 WebGL 动画实验。
        </p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import PostCard from '../modules/blog/components/PostCard.vue'
import { blogPosts, featuredPost } from '../modules/blog/data/posts'

const latestPosts = blogPosts.slice(0, 3)
</script>
