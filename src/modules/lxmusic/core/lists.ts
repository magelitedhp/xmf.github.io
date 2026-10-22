/**
 * "我的列表" store for user song lists.
 *
 * Built-in lists (试听列表 / 我的收藏 / 稍后播放 / 下载列表) always exist; user lists
 * are created by the user and persisted to localStorage alongside their contents.
 */

import { computed, reactive, watch } from 'vue'
import type { MusicItem } from './api'
import { getSetting } from './settings'

export const LIST_IDS = {
  DEFAULT: 'default',
  LOVE: 'love',
  PLAY_LATER: 'playLater',
  DOWNLOAD: 'download',
} as const

export interface UserList {
  id: string
  name: string
  /** `null` means "all sources"; otherwise the list is pinned to one source. */
  source: string | null
  location: 'top' | 'bottom'
  createdAt: number
}

export interface LxListInfo {
  id: string
  name: string
  source?: string | null
  builtin: boolean
  location: 'top' | 'bottom'
}

const STORAGE_KEY = 'lxmusic.lists'

const BUILTIN_LISTS: LxListInfo[] = [
  { id: LIST_IDS.DEFAULT, name: '试听列表', builtin: true, location: 'top' },
  { id: LIST_IDS.LOVE, name: '我的收藏', builtin: true, location: 'top' },
  { id: LIST_IDS.PLAY_LATER, name: '稍后播放', builtin: true, location: 'top' },
  { id: LIST_IDS.DOWNLOAD, name: '下载列表', builtin: true, location: 'top' },
]

interface PersistedShape {
  userLists: UserList[]
  listData: Record<string, MusicItem[]>
}

const state = reactive({
  userLists: [] as UserList[],
  listData: {
    [LIST_IDS.DEFAULT]: [],
    [LIST_IDS.LOVE]: [],
    [LIST_IDS.PLAY_LATER]: [],
    [LIST_IDS.DOWNLOAD]: [],
  } as Record<string, MusicItem[]>,
})

function readStored(): PersistedShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { userLists: [], listData: {} }
    const parsed = JSON.parse(raw) as PersistedShape
    return {
      userLists: Array.isArray(parsed.userLists) ? parsed.userLists : [],
      listData: parsed.listData && typeof parsed.listData === 'object' ? parsed.listData : {},
    }
  } catch {
    return { userLists: [], listData: {} }
  }
}

const stored = readStored()
state.userLists = stored.userLists
Object.entries(stored.listData).forEach(([id, list]) => {
  if (Array.isArray(list)) state.listData[id] = list
})

watch(
  state,
  () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ userLists: state.userLists, listData: state.listData }))
    } catch {
      // ignore quota errors
    }
  },
  { deep: true },
)

export const userLists = computed<UserList[]>(() => state.userLists)

export const allLists = computed<LxListInfo[]>(() => [
  ...BUILTIN_LISTS,
  ...state.userLists.map((list) => ({
    id: list.id,
    name: list.name,
    source: list.source,
    builtin: false,
    location: list.location,
  })),
])

export function getList(id: string): MusicItem[] {
  return state.listData[id] ?? []
}

export function getListInfo(id: string): LxListInfo | undefined {
  return allLists.value.find((list) => list.id === id)
}

export function getListName(id: string): string {
  return getListInfo(id)?.name ?? '未知列表'
}

export function createUserList(name: string, source: string | null = null): UserList {
  const list: UserList = {
    id: `userlist_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim() || '新建列表',
    source,
    location: getSetting('list.addMusicLocationType'),
    createdAt: Date.now(),
  }
  state.userLists.push(list)
  state.listData[list.id] = []
  return list
}

export function removeUserList(id: string) {
  const index = state.userLists.findIndex((list) => list.id === id)
  if (index < 0) return
  state.userLists.splice(index, 1)
  delete state.listData[id]
}

export function renameUserList(id: string, name: string) {
  const list = state.userLists.find((item) => item.id === id)
  if (list) list.name = name.trim() || list.name
}

export function updateUserListSource(id: string, source: string | null) {
  const list = state.userLists.find((item) => item.id === id)
  if (list) list.source = source
}

export function moveUserList(id: string, direction: -1 | 1) {
  const index = state.userLists.findIndex((list) => list.id === id)
  const target = index + direction
  if (index < 0 || target < 0 || target >= state.userLists.length) return
  const [item] = state.userLists.splice(index, 1)
  state.userLists.splice(target, 0, item)
}

export function isMusicInList(listId: string, music: MusicItem): boolean {
  return getList(listId).some((item) => item.id === music.id)
}

export function addMusicToList(listId: string, music: MusicItem, location?: 'top' | 'bottom') {
  const list = (state.listData[listId] ??= [])
  if (list.some((item) => item.id === music.id)) return false
  const where = location ?? getSetting('list.addMusicLocationType')
  if (where === 'bottom') list.push({ ...music })
  else list.unshift({ ...music })
  return true
}

export function addMusicList(listId: string, musics: MusicItem[], location?: 'top' | 'bottom') {
  let added = 0
  for (const music of musics) {
    if (addMusicToList(listId, music, location)) added += 1
  }
  return added
}

export function removeMusicFromList(listId: string, ids: string[]) {
  const list = state.listData[listId]
  if (!list) return
  const remove = new Set(ids)
  state.listData[listId] = list.filter((item) => !remove.has(item.id))
}

export function clearList(listId: string) {
  if (state.listData[listId]) state.listData[listId] = []
}

export function moveMusic(listId: string, from: number, to: number) {
  const list = state.listData[listId]
  if (!list) return
  if (from < 0 || from >= list.length) return
  const target = Math.min(Math.max(to, 0), list.length - 1)
  const [item] = list.splice(from, 1)
  list.splice(target, 0, item)
}

export type SortField = 'name' | 'singer' | 'album' | 'source'

export function sortList(listId: string, field: SortField, desc = false) {
  const list = state.listData[listId]
  if (!list) return
  const sorted = [...list].sort((a, b) => {
    const left = String(a[field] ?? '')
    const right = String(b[field] ?? '')
    return desc ? right.localeCompare(left, 'zh') : left.localeCompare(right, 'zh')
  })
  state.listData[listId] = sorted
}

export function exportList(listId: string): string {
  const info = getListInfo(listId)
  return JSON.stringify(
    {
      name: info?.name ?? listId,
      source: info?.source ?? null,
      musics: getList(listId),
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  )
}

export function importList(payload: string): { ok: boolean; message: string; listId?: string } {
  try {
    const parsed = JSON.parse(payload) as { name?: string; source?: string | null; musics?: MusicItem[] }
    if (!Array.isArray(parsed.musics)) return { ok: false, message: '文件格式不正确：缺少 musics 字段' }
    const list = createUserList(parsed.name ?? '导入列表', parsed.source ?? null)
    addMusicList(list.id, parsed.musics, 'bottom')
    return { ok: true, message: `已导入 ${parsed.musics.length} 首歌曲`, listId: list.id }
  } catch {
    return { ok: false, message: '文件不是合法的 JSON' }
  }
}

export function toggleLove(music: MusicItem): boolean {
  if (isMusicInList(LIST_IDS.LOVE, music)) {
    removeMusicFromList(LIST_IDS.LOVE, [music.id])
    return false
  }
  addMusicToList(LIST_IDS.LOVE, music, 'top')
  return true
}

export function isLoved(music: MusicItem | null | undefined): boolean {
  return Boolean(music && isMusicInList(LIST_IDS.LOVE, music))
}

export const listsState = state
