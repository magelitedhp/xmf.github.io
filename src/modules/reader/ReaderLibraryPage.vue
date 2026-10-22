<template>
  <main class="reader-main">
    <section class="reader-hero">
      <div>
        <p class="reader-kicker">YUMO READER / PRIVATE LIBRARY</p>
        <h1>搜书，也读书<span>.</span></h1>
        <p>翻开默认书籍，导入 MD、TXT、EPUB，或连接自己的书源。把散落的章节整理成一座安静书架。</p>
      </div>
      <div class="reader-hero-mark" aria-hidden="true"><i></i><b>阅</b></div>
    </section>

    <section class="reader-desk">
      <header class="reader-desk-head">
        <nav aria-label="阅读模块导航">
          <button :class="{ active: view === 'shelf' }" @click="view = 'shelf'">我的书架 <small>{{ books.length }}</small></button>
          <button :class="{ active: view === 'search' }" @click="view = 'search'">在线搜书</button>
          <button :class="{ active: view === 'sources' }" @click="view = 'sources'">书源管理 <small>{{ enabledSourceCount }}</small></button>
        </nav>
        <div class="reader-head-actions">
          <label class="reader-encoding">TXT 编码
            <select v-model="txtEncoding" aria-label="TXT 文件编码"><option value="auto">自动识别</option><option value="utf-8">UTF-8</option><option value="gb18030">GB18030</option><option value="big5">Big5</option></select>
          </label>
          <button class="reader-primary" :disabled="loadingShelf" @click="fileInput?.click()">＋ 导入书籍</button>
          <input ref="fileInput" class="sr-only" type="file" accept=".md,.markdown,.txt,.text,.epub,text/markdown,text/plain,application/epub+zip" multiple @change="importFiles">
        </div>
      </header>

      <div v-if="notice" class="reader-notice" :class="{ error: noticeError }" role="status">{{ notice }}</div>

      <section v-if="view === 'shelf'" class="reader-panel reader-shelf">
        <div class="reader-section-title"><div><span>01 / LIBRARY</span><h2>最近阅读</h2></div><p>默认书籍自动加入，阅读进度保存在当前浏览器。</p></div>
        <div v-if="loadingShelf" class="reader-loading" role="status">正在整理默认书籍…</div>
        <div v-if="books.length" class="reader-book-grid">
          <article v-for="(book, index) in books" :key="book.id" class="reader-book-card">
            <RouterLink class="reader-cover" :to="`/read/book/${book.id}`" :style="coverStyle(book, index)">
              <img v-if="book.cover" :src="book.cover" alt="">
              <span v-else>{{ coverText(book.title) }}</span>
              <small>{{ formatLabel(book.format) }}</small>
            </RouterLink>
            <div class="reader-book-copy">
              <RouterLink :to="`/read/book/${book.id}`"><h3>{{ book.title }}</h3></RouterLink>
              <p>{{ book.author }}</p>
              <div class="reader-progress"><i :style="{ width: `${bookProgress(book)}%` }"></i></div>
              <footer><span>{{ book.chapters.length }} 章</span><RouterLink :to="`/read/book/${book.id}/chapter/${book.currentChapter}`">继续阅读 ↗</RouterLink></footer>
            </div>
          </article>
        </div>
        <div v-else-if="!loadingShelf" class="reader-empty"><b>书架还是空的</b><p>导入一本 MD、TXT 或 EPUB，开始你的第一段阅读。</p><button class="reader-primary" @click="fileInput?.click()">选择本地书籍</button></div>
      </section>

      <section v-else-if="view === 'search'" class="reader-panel reader-search-panel">
        <div class="reader-section-title"><div><span>02 / DISCOVER</span><h2>在线搜书</h2></div><p>{{ enabledSourceCount ? `将从 ${enabledSourceCount} 个启用书源中搜索` : '请先添加并启用书源' }}</p></div>
        <form class="reader-search-box" @submit.prevent="searchBooks">
          <input v-model.trim="keyword" aria-label="书名或作者" placeholder="输入书名或作者，例如：三体">
          <button class="reader-primary" :disabled="searching || !keyword">{{ searching ? '正在搜索…' : '搜索全部书源' }}</button>
        </form>
        <div v-if="sourceReports.length" class="reader-source-report"><span v-for="report in sourceReports" :key="report">{{ report }}</span></div>
        <div v-if="results.length" class="reader-result-list">
          <article v-for="result in results" :key="result.id" class="reader-result-card">
            <div class="reader-result-index">{{ String(results.indexOf(result) + 1).padStart(2, '0') }}</div>
            <div><h3>{{ result.title }}</h3><p>{{ result.author || '未知作者' }} · {{ result.category || result.status || '网络小说' }}</p><small>{{ result.latestChapter || '等待读取目录' }} <template v-if="result.updatedAt">/ {{ result.updatedAt }}</template></small></div>
            <span class="reader-source-chip">{{ result.sourceName }}</span>
            <button class="reader-secondary" :disabled="addingId === result.id" @click="addOnlineBook(result)">{{ addingId === result.id ? '解析中…' : '加入书架' }}</button>
          </article>
        </div>
        <div v-else-if="!searching" class="reader-empty reader-search-empty"><b>{{ enabledSourceCount ? '搜索一本想读的书' : '还没有可用书源' }}</b><p>{{ enabledSourceCount ? '结果会按书源聚合展示，加入书架时再解析章节目录。' : '书源是搜索、目录与正文的解析规则。' }}</p><button v-if="!enabledSourceCount" class="reader-secondary" @click="view = 'sources'">前往书源管理</button></div>
      </section>

      <section v-else class="reader-panel reader-source-panel">
        <div class="reader-section-title"><div><span>03 / SOURCES</span><h2>书源管理</h2></div><p>兼容 so-novel 的主要 CSS 选择器字段；XPath 可用，JS 规则不执行。</p></div>
        <div class="reader-source-bundle">
          <div>
            <span>BUILT-IN / 内置书源集</span>
            <h3>so-novel 默认书源</h3>
            <p>已随项目内置 {{ bundledSourceCount }} 个规则，无需联网读取 GitHub。规则来自 <a href="https://github.com/freeok/so-novel/blob/main/bundle/rules/main.json" target="_blank" rel="noreferrer">freeok/so-novel</a>，站点改版或跨域限制可能导致个别规则失效。</p>
          </div>
          <button class="reader-primary" type="button" @click="importBundledSources">一键导入 {{ bundledSourceCount }} 个书源</button>
        </div>
        <div class="reader-source-layout">
          <div class="reader-source-list">
            <article v-for="source in sources" :key="source.id" class="reader-source-item">
              <button class="reader-switch" :class="{ on: source.enabled }" :aria-label="`${source.enabled ? '停用' : '启用'} ${source.name}`" @click="toggleSource(source.id)"><i></i></button>
              <div><h3>{{ source.name }}</h3><p>{{ source.url }}</p><small>{{ source.comment || (source.corsProxy ? '已配置 CORS 代理' : '浏览器直连') }}</small></div>
              <button class="reader-remove" @click="removeSource(source.id)">移除</button>
            </article>
            <div v-if="!sources.length" class="reader-empty"><b>尚未添加书源</b><p>可以粘贴单条规则或规则数组；支持参考仓库中的 main.json。</p></div>
          </div>
          <form class="reader-source-editor" @submit.prevent="importSources">
            <label><span>REMOTE SOURCE / 远程书源集</span></label>
            <div class="reader-source-url"><input v-model.trim="sourceUrl" aria-label="远程书源 JSON 地址" placeholder="https://.../sources.json"><button class="reader-secondary" type="button" :disabled="loadingSourceUrl || !sourceUrl" @click="importSourcesFromUrl">{{ loadingSourceUrl ? '读取中…' : '从链接导入' }}</button></div>
            <label><span>BOOK SOURCE / JSON</span><button type="button" @click="sourceJson = sourceTemplate">载入模板</button></label>
            <textarea v-model="sourceJson" spellcheck="false" placeholder="粘贴书源 JSON；可以是一个对象或对象数组。"></textarea>
            <div class="reader-source-help">
              <p><b>CORS 提示</b>：静态网站无法绕过源站跨域策略。书源可增加 <code>corsProxy</code>，支持前缀或含 <code v-pre>{{url}}</code> 的模板。</p>
              <p>请仅连接你有权访问的内容来源，并尊重来源站点的使用条款和请求频率。</p>
            </div>
            <button class="reader-primary" :disabled="!sourceJson.trim()">导入书源</button>
          </form>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { BookSource, LibraryBook, OnlineSearchResult } from './types'
import { syncDefaultBooks } from './services/defaultBooks'
import { parseReaderFile } from './services/importBook'
import { createOnlineBook, normalizeSources, searchSource } from './services/sourceEngine'
import { listBooks, loadSources, saveBook, saveSources } from './services/storage'
import { guideBook } from './data/guide'
import { sourceTemplate } from './data/sourceTemplate'
import bundledSoNovelSources from './data/soNovelSources.json'

type View = 'shelf' | 'search' | 'sources'
const view = ref<View>('shelf')
const books = ref<LibraryBook[]>([])
const loadingShelf = ref(true)
const sources = ref<BookSource[]>(loadSources())
const fileInput = ref<HTMLInputElement>()
const txtEncoding = ref('auto')
const notice = ref('')
const noticeError = ref(false)
const keyword = ref('')
const searching = ref(false)
const results = ref<OnlineSearchResult[]>([])
const sourceReports = ref<string[]>([])
const addingId = ref('')
const sourceJson = ref('')
const sourceUrl = ref('https://raw.githubusercontent.com/freeok/so-novel/main/bundle/rules/main.json')
const loadingSourceUrl = ref(false)
const bundledSourceCount = bundledSoNovelSources.length
const enabledSourceCount = computed(() => sources.value.filter((source) => source.enabled && source.search).length)

onMounted(async () => {
  try {
    books.value = await listBooks()
    if (!books.value.some((book) => book.id === guideBook.id)) await saveBook(structuredClone(guideBook))
    const failures = await syncDefaultBooks(books.value)
    books.value = await listBooks()
    if (failures.length) setNotice(`以下默认书籍暂时无法加载：${failures.join('、')}。刷新页面可以重试。`, true)
  } catch (cause) {
    setNotice(cause instanceof Error ? cause.message : '书架读取失败，请刷新页面重试。', true)
  } finally {
    loadingShelf.value = false
  }
})

function setNotice(message: string, error = false) {
  notice.value = message
  noticeError.value = error
}

async function importFiles(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (!files.length) return
  let imported = 0
  for (const file of files) {
    try {
      const book = await parseReaderFile(file, txtEncoding.value)
      await saveBook(book)
      imported += 1
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : `${file.name} 导入失败。`, true)
    }
  }
  input.value = ''
  books.value = await listBooks()
  if (imported) setNotice(`已导入 ${imported} 本书，共解析 ${books.value.reduce((sum, book) => sum + book.chapters.length, 0)} 个章节。`)
}

async function searchBooks() {
  const activeSources = sources.value.filter((source) => source.enabled && source.search)
  if (!activeSources.length) { view.value = 'sources'; setNotice('请先添加并启用至少一个支持搜索的书源。', true); return }
  searching.value = true
  results.value = []
  sourceReports.value = []
  const settled = await Promise.allSettled(activeSources.map(async (source) => ({ source, books: await searchSource(source, keyword.value) })))
  settled.forEach((entry, index) => {
    const source = activeSources[index]
    if (entry.status === 'fulfilled') {
      results.value.push(...entry.value.books)
      sourceReports.value.push(`${source.name} · ${entry.value.books.length} 条`)
    } else sourceReports.value.push(`${source.name} · 访问失败`)
  })
  searching.value = false
  setNotice(results.value.length ? `找到 ${results.value.length} 条结果。` : '没有解析到结果，请检查书源、网络或 CORS 代理。', !results.value.length)
}

async function addOnlineBook(result: OnlineSearchResult) {
  const source = sources.value.find((item) => item.id === result.sourceId)
  if (!source) return
  addingId.value = result.id
  try {
    const book = await createOnlineBook(result, source)
    await saveBook(book)
    books.value = await listBooks()
    setNotice(`《${book.title}》已加入书架，解析到 ${book.chapters.length} 章。`)
  } catch (cause) {
    setNotice(cause instanceof Error ? cause.message : '书籍解析失败。', true)
  } finally { addingId.value = '' }
}

function importSources() {
  try {
    const imported = normalizeSources(JSON.parse(sourceJson.value))
    storeImportedSources(imported)
    sourceJson.value = ''
    setNotice(`已导入 ${imported.length} 个书源。`)
  } catch (cause) { setNotice(cause instanceof Error ? cause.message : '书源 JSON 无法解析。', true) }
}

function importBundledSources() {
  try {
    const imported = normalizeSources(structuredClone(bundledSoNovelSources))
    storeImportedSources(imported)
    setNotice(`已导入 ${imported.length} 个内置书源，可前往“在线搜书”使用。`)
  } catch (cause) { setNotice(cause instanceof Error ? cause.message : '内置书源读取失败。', true) }
}

async function importSourcesFromUrl() {
  loadingSourceUrl.value = true
  try {
    const response = await fetch(sourceUrl.value)
    if (!response.ok) throw new Error(`远程书源返回 HTTP ${response.status}。`)
    const imported = normalizeSources(await response.json())
    storeImportedSources(imported)
    setNotice(`已从远程地址导入 ${imported.length} 个书源。`)
  } catch (cause) { setNotice(cause instanceof Error ? cause.message : '远程书源读取失败。', true) }
  finally { loadingSourceUrl.value = false }
}

function storeImportedSources(imported: BookSource[]) {
  const merged = new Map(sources.value.map((source) => [source.id, source]))
  imported.forEach((source) => merged.set(source.id, source))
  sources.value = Array.from(merged.values())
  saveSources(sources.value)
}

function toggleSource(id: string) {
  const source = sources.value.find((item) => item.id === id)
  if (source) source.enabled = !source.enabled
  saveSources(sources.value)
}

function removeSource(id: string) {
  sources.value = sources.value.filter((source) => source.id !== id)
  saveSources(sources.value)
}

function formatLabel(format: LibraryBook['format']) { return ({ txt: 'TXT', md: 'MD', epub: 'EPUB', online: 'ONLINE', guide: 'GUIDE' })[format] }
function bookProgress(book: LibraryBook) { return book.chapters.length ? Math.max(3, Math.round(((book.currentChapter + 1) / book.chapters.length) * 100)) : 0 }
function coverStyle(book: LibraryBook, index: number) {
  if (book.cover) return {}
  const covers = ['linear-gradient(145deg,#253f37,#7b9a79)', 'linear-gradient(145deg,#263d70,#879fe8)', 'linear-gradient(145deg,#754f48,#dda98b)', 'linear-gradient(145deg,#4a3b61,#aa8fbd)']
  return { background: covers[index % covers.length] }
}
function coverText(title: string) {
  const chinese = title.match(/[\u3400-\u9fff]/g)
  if (chinese?.length) return chinese.slice(0, 2).join('')
  return title.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}
</script>

<style scoped>
.reader-loading {
  margin-bottom: 22px;
  color: #627789;
  font-size: 13px;
}
</style>

