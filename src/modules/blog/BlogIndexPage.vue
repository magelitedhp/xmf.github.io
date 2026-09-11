<template>
  <main class="site-main blog-index">
    <header class="blog-header glass-panel">
      <p class="effects-kicker">Field Notes</p>
      <h1>夜航随笔</h1>
      <p>记录建站、音乐、界面与浏览器实验。文章不追逐结论，只保存一次次实现中的判断。</p>
    </header>

    <section class="blog-toolbar" aria-label="文章筛选">
      <button
        v-for="tag in tags"
        :key="tag"
        class="blog-filter"
        :class="{ active: activeTag === tag }"
        type="button"
        @click="activeTag = tag"
      >
        {{ tag }}
      </button>
    </section>

    <section class="blog-list" aria-live="polite">
      <PostCard v-for="post in filteredPosts" :key="post.slug" :post="post" />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import PostCard from './components/PostCard.vue'
import { blogPosts } from './data/posts'

const allTags = Array.from(new Set(blogPosts.flatMap((post) => post.tags)))
const tags = ['全部', ...allTags]
const activeTag = ref('全部')
const filteredPosts = computed(() =>
  activeTag.value === '全部'
    ? blogPosts
    : blogPosts.filter((post) => post.tags.includes(activeTag.value)),
)
</script>
