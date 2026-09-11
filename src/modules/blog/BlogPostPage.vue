<template>
  <main class="site-main post-page">
    <article v-if="post" class="post-article">
      <RouterLink class="post-back" to="/blog">← 返回随笔</RouterLink>
      <header class="post-header glass-panel">
        <p class="effects-kicker">Field Note</p>
        <h1>{{ post.title }}</h1>
        <p class="post-excerpt">{{ post.excerpt }}</p>
        <div class="post-byline">
          <time :datetime="post.date">{{ formatPostDate(post.date) }}</time>
          <span>{{ post.readingMinutes }} 分钟阅读</span>
          <span>{{ post.tags.join(' · ') }}</span>
        </div>
      </header>

      <div class="post-body glass-panel">
        <section v-for="(section, index) in post.sections" :key="section.heading ?? index">
          <h2 v-if="section.heading">{{ section.heading }}</h2>
          <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
          <blockquote v-if="section.quote">{{ section.quote }}</blockquote>
        </section>
      </div>
    </article>

    <section v-else class="post-missing glass-panel">
      <p class="effects-kicker">404 · Missing Note</p>
      <h1>这页札记没有找到</h1>
      <p>它可能被移动、改名，或者还没有写完。</p>
      <RouterLink class="glass-button" to="/blog">返回随笔</RouterLink>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { findBlogPost, formatPostDate } from './data/posts'

const route = useRoute()
const post = computed(() => findBlogPost(String(route.params.slug)))

watchEffect(() => {
  document.title = post.value ? `${post.value.title} · Nocturne` : '未找到文章 · Nocturne'
})
</script>
