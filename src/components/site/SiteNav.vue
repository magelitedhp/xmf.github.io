<template>
  <header class="site-nav" :class="{ 'is-solid': solid }">
    <RouterLink class="site-brand" to="/" aria-label="返回首页">
      <span class="site-brand-mark" aria-hidden="true">N</span>
      <span class="site-brand-copy">
        <strong>Nocturne</strong>
        <small>夜航书斋</small>
      </span>
    </RouterLink>

    <nav class="site-nav-links" aria-label="站点导航">
      <RouterLink
        v-for="item in siteNav"
        :key="item.to"
        class="site-nav-link"
        :to="item.to"
      >
        {{ item.name }}
      </RouterLink>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { siteNav } from '../../config/nav'

withDefaults(
  defineProps<{
    solid?: boolean
  }>(),
  { solid: false },
)
</script>
