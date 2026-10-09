<template>
  <header class="site-nav" :class="{ 'is-solid': solid }">
    <RouterLink class="site-brand" to="/" aria-label="返回首页">
      <span class="site-brand-mark" aria-hidden="true">✳</span>
      <span class="site-brand-copy">
        <strong>Yumo<span>®</span></strong>
        <small>Yumo · 互联网自留地</small>
      </span>
    </RouterLink>

    <nav class="site-nav-links" aria-label="站点导航">
      <RouterLink
        v-for="(item, index) in siteNav"
        :key="item.to"
        class="site-nav-link"
        :class="{ 'router-link-active': isSection(item.to) }"
        :to="item.to"
      >
        <sup>0{{ index + 1 }}</sup>{{ item.name }}
      </RouterLink>
    </nav>
    <RouterLink class="nav-play" to="/games" aria-label="进入游戏厅">去玩一下 <span>↗</span></RouterLink>
  </header>
</template>

<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { siteNav } from '../../config/nav'

const route = useRoute()
const isSection = (to: string) => route.path.startsWith(`${to}/`)

withDefaults(
  defineProps<{
    solid?: boolean
  }>(),
  { solid: false },
)
</script>
