<template>
  <main v-if="book && chapter" class="reading-shell" :class="`theme-${settings.theme}`">
    <header class="reading-toolbar">
      <RouterLink :to="`/read/book/${book.id}`">← 返回目录</RouterLink>
      <button @click="tocOpen = !tocOpen">目录 · {{ chapterIndex + 1 }}/{{ book.chapters.length }}</button>
      <div><button @click="settingsOpen = !settingsOpen">Aa 阅读设置</button><RouterLink to="/read">书架</RouterLink></div>
    </header>
    <aside v-if="tocOpen" class="reading-toc">
      <header><b>章节目录</b><button @click="tocOpen = false">×</button></header>
      <nav><RouterLink v-for="(item, index) in book.chapters" :key="item.id" :class="{ current: index === chapterIndex }" :to="`/read/book/${book.id}/chapter/${index}`" @click="tocOpen = false"><span>{{ String(index + 1).padStart(3, '0') }}</span>{{ item.title }}</RouterLink></nav>
    </aside>
    <section v-if="settingsOpen" class="reading-settings" aria-label="阅读设置">
      <label>字号 <input v-model.number="settings.fontSize" type="range" min="15" max="30">{{ settings.fontSize }}px</label>
      <label>行距 <input v-model.number="settings.lineHeight" type="range" min="1.5" max="2.5" step="0.05">{{ settings.lineHeight.toFixed(2) }}</label>
      <label>版心 <input v-model.number="settings.contentWidth" type="range" min="560" max="960" step="20">{{ settings.contentWidth }}px</label>
      <div class="reading-themes"><button :class="{ active: settings.theme === 'paper' }" @click="settings.theme = 'paper'">纸张</button><button :class="{ active: settings.theme === 'green' }" @click="settings.theme = 'green'">护眼</button><button :class="{ active: settings.theme === 'night' }" @click="settings.theme = 'night'">夜间</button></div>
    </section>
    <article class="reading-paper" :style="paperStyle">
      <div class="reading-book-meta">{{ book.title }} · {{ book.author }}</div>
      <h1>{{ chapter.title }}</h1>
      <div v-if="loading" class="reading-loading">正在从 {{ book.sourceName }} 读取正文…</div>
      <div v-else-if="error" class="reading-error"><b>本章暂时无法读取</b><p>{{ error }}</p><button @click="loadChapter">重新尝试</button></div>
      <div v-else class="reading-content"><p v-for="(paragraph, index) in paragraphs" :key="index">{{ paragraph }}</p></div>
      <footer class="reading-navigation">
        <RouterLink v-if="chapterIndex > 0" :to="`/read/book/${book.id}/chapter/${chapterIndex - 1}`">← 上一章</RouterLink><span v-else>已经是第一章</span>
        <RouterLink v-if="chapterIndex < book.chapters.length - 1" :to="`/read/book/${book.id}/chapter/${chapterIndex + 1}`">下一章 →</RouterLink><span v-else>全书完</span>
      </footer>
    </article>
  </main>
  <main v-else class="reading-shell theme-paper"><div class="reader-empty"><b>{{ error || '正在翻开书页…' }}</b><RouterLink to="/read">返回书架</RouterLink></div></main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import type { BookSource, LibraryBook } from './types'
import { fetchChapterContent } from './services/sourceEngine'
import { getBook, loadReaderSettings, loadSources, saveBook, saveReaderSettings } from './services/storage'

const route = useRoute(), router = useRouter()
const book = ref<LibraryBook>(), chapterIndex = ref(0), loading = ref(false), error = ref('')
const tocOpen = ref(false), settingsOpen = ref(false), settings = ref(loadReaderSettings())
let saveTimer = 0
const chapter = computed(() => book.value?.chapters[chapterIndex.value])
const paragraphs = computed(() => chapter.value?.content.split(/\n+/).map((item) => item.trim()).filter(Boolean) ?? [])
const paperStyle = computed(() => ({ maxWidth: `${settings.value.contentWidth}px`, fontSize: `${settings.value.fontSize}px`, lineHeight: settings.value.lineHeight }))

async function openRoute() {
  window.clearTimeout(saveTimer)
  error.value = ''
  book.value = await getBook(String(route.params.id))
  if (!book.value) { error.value = '没有找到这本书。'; return }
  const nextChapter = Math.min(Math.max(Number(route.params.chapter) || 0, 0), book.value.chapters.length - 1)
  if (book.value.currentChapter !== nextChapter) book.value.currentOffset = 0
  chapterIndex.value = nextChapter
  book.value.currentChapter = chapterIndex.value
  book.value.updatedAt = Date.now()
  await loadChapter()
  await saveBook(book.value)
  requestAnimationFrame(() => window.scrollTo({ top: book.value?.currentOffset || 0 }))
}

async function loadChapter() {
  const item = chapter.value
  if (!book.value || !item || item.content || !item.sourceUrl) return
  const source = loadSources().find((entry) => entry.id === book.value?.sourceId) as BookSource | undefined
  if (!source) { error.value = '原书源已被移除，无法继续加载在线章节。'; return }
  loading.value = true
  error.value = ''
  try {
    item.content = await fetchChapterContent(source, item.sourceUrl)
    book.value.updatedAt = Date.now()
    await saveBook(book.value)
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '正文读取失败。' }
  finally { loading.value = false }
}

function saveProgress() {
  if (!book.value) return
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    if (!book.value) return
    book.value.currentChapter = chapterIndex.value
    book.value.currentOffset = window.scrollY
    book.value.updatedAt = Date.now()
    void saveBook(book.value)
  }, 250)
}

function keyboard(event: KeyboardEvent) {
  if ((event.target as HTMLElement)?.matches('input,textarea,select')) return
  if (event.key === 'ArrowLeft' && chapterIndex.value > 0) router.push(`/read/book/${book.value?.id}/chapter/${chapterIndex.value - 1}`)
  if (event.key === 'ArrowRight' && book.value && chapterIndex.value < book.value.chapters.length - 1) router.push(`/read/book/${book.value.id}/chapter/${chapterIndex.value + 1}`)
}

watch(() => route.fullPath, openRoute)
watch(settings, (value) => saveReaderSettings(value), { deep: true })
onMounted(() => { void openRoute(); window.addEventListener('scroll', saveProgress, { passive: true }); window.addEventListener('keydown', keyboard) })
onBeforeUnmount(() => { saveProgress(); window.removeEventListener('scroll', saveProgress); window.removeEventListener('keydown', keyboard); window.clearTimeout(saveTimer) })
</script>

