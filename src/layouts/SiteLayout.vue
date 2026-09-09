<template>
  <div class="site-shell" :class="pageClass">
    <SiteAtmosphere v-if="showAtmosphere" />
    <SiteNav :solid="solidNav" />
    <RouterView />
    <footer v-if="showFooter" class="site-footer">
      <p>{{ footerLeft }}</p>
      <p>{{ footerRight }}</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import SiteAtmosphere from '../components/site/SiteAtmosphere.vue'
import SiteNav from '../components/site/SiteNav.vue'

const route = useRoute()

const pageClass = computed(() => {
  if (route.name === 'tools') return 'tools-page'
  if (route.name === 'home') return 'home-page'
  if (route.name === 'effects') return 'effects-page-shell'
  return ''
})

const solidNav = computed(() => route.name === 'tools' || route.name === 'effects')
const showAtmosphere = computed(() => route.name !== 'effects')
const showFooter = computed(() => route.name !== 'effects')

const footerLeft = computed(() => {
  if (route.name === 'tools') return 'Nocturne · AI 工具柜'
  return 'Nocturne · 夜航书斋'
})

const footerRight = computed(() => {
  if (route.name === 'tools') return '空白页 · 待续'
  return '曲库注明 GD音乐台 (music.gdstudio.xyz)'
})
</script>
