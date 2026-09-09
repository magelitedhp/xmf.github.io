<template>
  <main class="site-main tools-main">
    <section class="tools-blank glass-panel">
      <p class="effects-kicker">Instruments</p>
      <h1>AI 工具</h1>
      <p class="tools-blank-copy">
        这页暂为空白。工具清单与入口会陆续放在这里。
      </p>
      <div class="button-row">
        <RouterLink class="glass-button" to="/">返回首页</RouterLink>
        <RouterLink class="champagne-button" to="/music">先去听音乐</RouterLink>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>
