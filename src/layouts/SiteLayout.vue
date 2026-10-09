<template>
  <div class="site-shell" :class="pageClass">
    <SiteAtmosphere /><SiteNav /><RouterView />
    <footer v-if="route.name !== 'effects'" class="site-footer">
      <div class="footer-top"><p>留一点时间，给无目的的探索。</p><RouterLink to="/">回到起点 ↗</RouterLink></div>
      <div class="footer-wordmark" aria-hidden="true">Yumo<span>✳</span></div>
      <div class="footer-bottom"><span>Yumo / A PERSONAL DIGITAL GARDEN</span><span>MADE FOR THE CURIOUS.</span><span>© {{ new Date().getFullYear() }}</span></div>
    </footer>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterView, RouterLink } from 'vue-router'
import SiteAtmosphere from '../components/site/SiteAtmosphere.vue'
import SiteNav from '../components/site/SiteNav.vue'
const route = useRoute()
const pageClass = computed(() => ({ 'home-page': route.name === 'home', 'tools-page': route.name === 'tools', 'effects-page-shell': route.name === 'effects', 'arcade-page': route.meta.module === 'games' }))
</script>