/**
 * Search store shared by the toolbar input and the search view.
 */

import { computed, reactive } from 'vue'
import { hydrateCovers, searchMusic, type MusicItem } from './api'
import { appSetting, pushSearchHistory } from './settings'

export const PAGE_SIZE = 30

const state = reactive({
  text: '',
  source: appSetting['search.temp_source'],
  list: [] as MusicItem[],
  page: 1,
  hasMore: false,
  isLoading: false,
  error: '',
  /** Set when the search came from an album lookup so paging keeps the same mode. */
  albumMode: false,
})

let requestId = 0

export const searchState = state
export const searchList = computed(() => state.list)
export const isLoading = computed(() => state.isLoading)
export const hasMore = computed(() => state.hasMore)

export interface RunSearchOptions {
  source?: string
  page?: number
  album?: boolean
  keyword?: string
  /** Append the next page instead of replacing the visible results. */
  append?: boolean
}

export async function runSearch(options: RunSearchOptions = {}) {
  const keyword = (options.keyword ?? state.text).trim()
  const source = options.source ?? state.source
  const page = options.page ?? 1
  const album = options.album ?? false
  const append = options.append ?? false

  if (!keyword) {
    state.list = []
    state.error = ''
    state.hasMore = false
    return
  }

  const id = ++requestId
  const queryChanged = keyword !== state.text || source !== state.source || album !== state.albumMode
  const previousList = state.list
  const previousPage = state.page
  state.isLoading = true
  state.error = ''
  state.text = keyword
  state.source = source
  state.page = page
  state.albumMode = album
  if (queryChanged || !append) state.list = []

  try {
    const list = await searchMusic(keyword, { source, page, limit: PAGE_SIZE, album })
    if (id !== requestId) return
    const existing = append && !queryChanged ? state.list : []
    const known = new Set(existing.map((item) => item.id))
    state.list = [...existing, ...list.filter((item) => !known.has(item.id))]
    state.hasMore = list.length >= PAGE_SIZE
    pushSearchHistory(keyword)
    if (list.length) void hydrateCovers(list, PAGE_SIZE)
  } catch (error) {
    if (id !== requestId) return
    if (append && !queryChanged) {
      state.list = previousList
      state.page = previousPage
      state.hasMore = true
    } else {
      state.list = []
      state.hasMore = false
    }
    state.error = error instanceof Error ? error.message : '搜索失败'
  } finally {
    if (id === requestId) state.isLoading = false
  }
}

export function setSearchText(text: string) {
  state.text = text
}

export function setSearchSource(source: string) {
  state.source = source
  appSetting['search.temp_source'] = source
}

export function clearSearch() {
  state.list = []
  state.error = ''
  state.hasMore = false
  state.page = 1
}

export const search = { state, runSearch, setSearchText, setSearchSource, clearSearch }
