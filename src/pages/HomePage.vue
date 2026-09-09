<template>
  <main class="site-main">
    <section class="home-hero glass-panel">
      <p class="effects-kicker">Nocturne Atelier</p>
      <h1 class="home-title">夜航书斋<br />三扇通往别处的门</h1>
      <p class="home-lead">
        首页采用夜航玻璃拟态：深墨底色、月光光斑与无色玻璃面板。从这里进入音乐、工具，或沉进一页水墨动画。
      </p>
      <div class="button-row home-actions">
        <RouterLink class="champagne-button" to="/music">进入音乐</RouterLink>
        <RouterLink class="glass-button" to="/effects">观看动画</RouterLink>
      </div>
    </section>

    <section class="home-portals">
      <p class="effects-kicker">Catalog</p>
      <h2>模块入口</h2>
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
  </main>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>
