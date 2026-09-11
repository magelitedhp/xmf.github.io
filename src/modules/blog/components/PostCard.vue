<template>
  <article class="post-card glass-panel">
    <div class="post-card-meta">
      <time :datetime="post.date">{{ formatPostDate(post.date) }}</time>
      <span>{{ post.readingMinutes }} 分钟阅读</span>
    </div>
    <h3>{{ post.title }}</h3>
    <p>{{ post.excerpt }}</p>
    <div class="post-card-footer">
      <div class="post-tags" aria-label="文章标签">
        <span v-for="tag in post.tags" :key="tag">{{ tag }}</span>
      </div>
      <RouterLink class="post-link" :to="`/blog/${post.slug}`">
        阅读全文
        <span aria-hidden="true">→</span>
      </RouterLink>
    </div>
  </article>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { formatPostDate, type BlogPost } from '../data/posts'

defineProps<{
  post: BlogPost
}>()
</script>
