<template>
  <main v-if="book" class="reader-main reader-detail-main">
    <RouterLink class="reader-back" to="/read">← 返回书架</RouterLink>
    <section class="reader-detail-hero">
      <div class="reader-detail-cover" :class="{ image: book.cover }"><img v-if="book.cover" :src="book.cover" alt=""><span v-else>{{ coverText(book.title) }}</span><small>{{ book.format.toUpperCase() }}</small></div>
      <div class="reader-detail-copy">
        <p class="reader-kicker">{{ book.sourceName }} / {{ book.chapters.length }} CHAPTERS</p>
        <h1>{{ book.title }}</h1>
        <p class="reader-detail-author">{{ book.author }}</p>
        <p class="reader-detail-description">{{ book.description }}</p>
        <div class="reader-detail-actions">
          <RouterLink class="reader-primary" :to="`/read/book/${book.id}/chapter/${book.currentChapter}`">{{ book.currentChapter ? '继续阅读' : '开始阅读' }} ↗</RouterLink>
          <button class="reader-secondary" @click="exportTxt(book)">导出 TXT</button>
          <button class="reader-secondary" @click="exportBookEpub">导出 EPUB</button>
        </div>
      </div>
      <div class="reader-detail-stats"><span><b>{{ book.chapters.length }}</b>章节</span><span><b>{{ wordCount }}</b>字</span><span><b>{{ Math.round(((book.currentChapter + 1) / book.chapters.length) * 100) || 0 }}%</b>进度</span></div>
    </section>

    <section class="reader-directory">
      <header><div><p class="reader-kicker">DIRECTORY / 目录</p><h2>章节目录</h2></div><label>筛选章节<input v-model.trim="filter" placeholder="输入章节名"></label></header>
      <div v-for="group in chapterGroups" :key="group.title" class="reader-volume">
        <h3>{{ group.title }}<span>{{ group.chapters.length }} 章</span></h3>
        <div class="reader-chapter-grid">
          <RouterLink v-for="chapter in group.chapters" :key="chapter.item.id" :class="{ current: chapter.index === book.currentChapter }" :to="`/read/book/${book.id}/chapter/${chapter.index}`"><span>{{ String(chapter.index + 1).padStart(3, '0') }}</span>{{ chapter.item.title }}</RouterLink>
        </div>
      </div>
      <div v-if="!chapterGroups.length" class="reader-empty"><b>没有匹配的章节</b><p>换一个关键词试试。</p></div>
    </section>
  </main>
  <main v-else class="reader-main"><div class="reader-empty"><b>{{ error || '正在打开书籍…' }}</b><RouterLink to="/read">返回书架</RouterLink></div></main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import type { LibraryBook } from './types'
import { exportEpub, exportTxt } from './services/export'
import { getBook } from './services/storage'

const route = useRoute()
const book = ref<LibraryBook>()
const error = ref('')
const filter = ref('')
onMounted(async () => {
  book.value = await getBook(String(route.params.id))
  if (!book.value) error.value = '没有找到这本书。'
})
const wordCount = computed(() => new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(book.value?.chapters.reduce((sum, chapter) => sum + chapter.content.length, 0) ?? 0))
const chapterGroups = computed(() => {
  if (!book.value) return []
  const chapters = book.value.chapters.map((item, index) => ({ item, index })).filter((chapter) => !filter.value || chapter.item.title.toLocaleLowerCase().includes(filter.value.toLocaleLowerCase()))
  return Array.from({ length: Math.ceil(chapters.length / 50) }, (_, index) => ({
    title: chapters.length > 50 ? `第 ${index * 50 + 1}–${Math.min((index + 1) * 50, chapters.length)} 章` : '正文',
    chapters: chapters.slice(index * 50, (index + 1) * 50),
  }))
})
async function exportBookEpub() { if (book.value) await exportEpub(book.value) }
function coverText(title: string) {
  const chinese = title.match(/[\u3400-\u9fff]/g)
  if (chinese?.length) return chinese.slice(0, 2).join('')
  return title.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}
</script>

