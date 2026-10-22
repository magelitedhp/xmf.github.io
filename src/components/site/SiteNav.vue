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
      <div
        v-for="(item, index) in siteNav"
        :key="item.to"
        class="site-nav-item"
        :class="{ 'has-menu': item.variants }"
      >
        <RouterLink
          class="site-nav-link"
          :class="{ 'router-link-active': isSection(item.to) || isVariantActive(item) }"
          :to="item.to"
        >
          <sup>0{{ index + 1 }}</sup>{{ item.name }}<i v-if="item.variants" class="site-nav-caret" aria-hidden="true">▾</i>
        </RouterLink>

        <div v-if="item.variants" class="site-nav-menu" role="menu" :aria-label="`${item.name}版本`">
          <RouterLink
            v-for="variant in item.variants"
            :key="variant.to"
            class="site-nav-menu-item"
            role="menuitem"
            :to="variant.to"
          >
            <span class="site-nav-menu-tag">{{ variant.tag }}</span>
            <span class="site-nav-menu-copy">
              <strong>{{ variant.name }}</strong>
              <small>{{ variant.description }}</small>
            </span>
            <span class="site-nav-menu-arrow" aria-hidden="true">↗</span>
          </RouterLink>
        </div>
      </div>
    </nav>
    <RouterLink class="nav-play" to="/games" aria-label="进入游戏厅">去玩一下 <span>↗</span></RouterLink>
  </header>
</template>

<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { siteNav, type SiteNavItem } from '../../config/nav'

const route = useRoute()
const isSection = (to: string) => route.path.startsWith(`${to}/`)
const isVariantActive = (item: SiteNavItem) => Boolean(item.variants?.some((variant) => route.path.startsWith(variant.to)))

withDefaults(
  defineProps<{
    solid?: boolean
  }>(),
  { solid: false },
)
</script>
