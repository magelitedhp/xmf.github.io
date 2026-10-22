<template>
  <header class="lx-toolbar">
    <div class="lx-toolbar-search-wrap">
      <div class="lx-toolbar-search" :class="{ 'is-focused': showTips }">
        <LxIcon name="search" />
        <input
          ref="inputEl"
          v-model="text"
          type="search"
          placeholder="搜索歌曲、歌手、专辑"
          aria-label="搜索"
          @focus="showTips = true"
          @keydown.enter.prevent="submit"
          @keydown.esc="showTips = false"
        >
        <button v-if="text" type="button" class="lx-toolbar-clear" aria-label="清空" @click="text = ''">
          <LxIcon name="close" />
        </button>
      </div>
      <Transition name="lx-search-panel">
        <div v-if="showTips && tips.length" class="lx-toolbar-tips">
          <button v-for="tip in tips" :key="tip" type="button" @click="pick(tip)">{{ tip }}</button>
        </div>
      </Transition>
    </div>

    <div class="lx-window-btns">
      <button type="button" class="lx-window-btn" aria-label="返回站点" title="返回站点" @click="goHome">
        <LxIcon name="home" />
      </button>
      <button type="button" class="lx-window-btn" aria-label="全屏" title="全屏" @click="toggleFullscreen">
        <LxIcon name="expand" />
      </button>
      <button type="button" class="lx-window-btn is-close" aria-label="退出音乐" title="退出音乐" @click="goHome">
        <LxIcon name="close" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LxIcon from './LxIcon.vue'
import { appSetting, pushSearchHistory } from '../core/settings'
import { hotSearchKeywords } from '../core/discover'
import { searchState } from '../core/search'

const router = useRouter()
const route = useRoute()
const inputEl = ref<HTMLInputElement | null>(null)
const text = ref(searchState.text)
const showTips = ref(false)

const tips = computed(() => {
  const keyword = text.value.trim().toLowerCase()
  const pool = [...appSetting['search.history'], ...hotSearchKeywords]
  const unique = [...new Set(pool)]
  if (!keyword) return unique.slice(0, 8)
  return unique.filter((item) => item.toLowerCase().includes(keyword)).slice(0, 8)
})

watch(
  () => searchState.text,
  (value) => {
    if (value !== text.value) text.value = value
  },
)

watch(
  () => route.path,
  (path) => {
    if (path !== '/lxmusic/search' && appSetting['odc.isAutoClearSearchInput']) text.value = ''
  },
)

function submit() {
  const keyword = text.value.trim()
  showTips.value = false
  if (!keyword) return
  pushSearchHistory(keyword)
  void router.push({ path: '/lxmusic/search', query: { text: keyword } })
}

function pick(keyword: string) {
  text.value = keyword
  submit()
}

function goHome() {
  void router.push('/')
}

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen()
  else void document.documentElement.requestFullscreen().catch(() => undefined)
}

function onDocumentClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.lx-toolbar-search')) showTips.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  if (appSetting['search.isFocusSearchBox']) inputEl.value?.focus()
})

onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))

defineExpose({ focus: () => inputEl.value?.focus() })
</script>

<style>
/* src/components/shared/gridSearchPanelMotion.ts */
.lx-search-panel-enter-active,
.lx-search-panel-leave-active {
  transition:
    opacity 0.34s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.34s cubic-bezier(0.16, 1, 0.3, 1);
}

.lx-search-panel-enter-from {
  opacity: 0;
  transform: translateY(-64px);
}

.lx-search-panel-leave-to {
  opacity: 0;
  transform: translateY(-32px);
}

@media (prefers-reduced-motion: reduce) {
  .lx-search-panel-enter-active,
  .lx-search-panel-leave-active {
    transition-duration: 0.12s;
    transition-timing-function: linear;
  }

  .lx-search-panel-enter-from,
  .lx-search-panel-leave-to {
    transform: none;
  }
}
</style>
