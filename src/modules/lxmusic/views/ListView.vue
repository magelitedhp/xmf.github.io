<template>
  <div class="lx-page">
    <div class="lx-list-layout">
      <aside class="lx-list-sidebar">
        <div class="lx-list-sidebar-head">
          <strong>我的列表</strong>
          <button type="button" class="lx-icon-btn" aria-label="新建列表" title="新建列表" @click="openNewList">
            <LxIcon name="add" />
          </button>
        </div>
        <nav class="lx-list-nav">
          <button
            v-for="list in allLists"
            :key="list.id"
            type="button"
            class="lx-list-nav-item"
            :class="{ 'is-active': list.id === activeListId }"
            @click="activeListId = list.id"
          >
            <LxIcon :name="iconFor(list.id)" />
            <span class="lx-ellipsis">{{ list.name }}</span>
            <span class="lx-list-nav-count">{{ getList(list.id).length }}</span>
          </button>
        </nav>
      </aside>

      <section class="lx-list-main">
        <div class="lx-list-main-head">
          <h2>{{ activeInfo?.name ?? '列表' }}</h2>
          <button type="button" class="lx-btn is-primary" :disabled="!currentList.length" @click="playCurrent">
            <LxIcon name="play" /> 播放全部
          </button>
          <button type="button" class="lx-btn" :disabled="!currentList.length" @click="sortCurrent">排序</button>
          <button type="button" class="lx-btn" :disabled="!selected.length" @click="removeSelected">移除所选（{{ selected.length }}）</button>
          <button type="button" class="lx-btn" :disabled="!currentList.length" @click="clearCurrent">清空</button>
          <button type="button" class="lx-btn" @click="exportCurrent">导出</button>
          <button type="button" class="lx-btn" @click="triggerImport">导入</button>
          <button v-if="activeInfo && !activeInfo.builtin" type="button" class="lx-btn" @click="renameCurrent">重命名</button>
          <button v-if="activeInfo && !activeInfo.builtin" type="button" class="lx-btn" @click="removeCurrent">删除列表</button>
        </div>

        <div class="lx-list-main-body">
          <LxMusicList
            :list="currentList"
            :current-id="currentId"
            :loved-ids="lovedIds"
            :selected="selected"
            selectable
            empty-title="这个列表还是空的"
            empty-text="去搜索或榜单里，把喜欢的歌加进来。"
            @play="play"
            @select="toggleSelect"
            @love="toggleLoveWithToast"
            @add="promptAddToList"
            @download="downloadMusic"
            @copy="copyMusicName"
            @remove="removeOne"
          />
        </div>
      </section>
    </div>

    <LxModal :open="newListOpen" title="新建列表" @close="newListOpen = false">
      <input v-model="newListName" class="lx-select" placeholder="列表名称" @keydown.enter.prevent="createList">
      <template #footer>
        <button type="button" class="lx-btn" @click="newListOpen = false">取消</button>
        <button type="button" class="lx-btn is-primary" :disabled="!newListName.trim()" @click="createList">创建</button>
      </template>
    </LxModal>

    <input ref="fileEl" type="file" accept="application/json,.json" hidden @change="onImportFile">
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import LxIcon from '../components/LxIcon.vue'
import LxModal from '../components/LxModal.vue'
import LxMusicList from '../components/LxMusicList.vue'
import type { MusicItem } from '../core/api'
import {
  allLists,
  clearList,
  createUserList,
  exportList,
  getList,
  importList,
  isLoved,
  LIST_IDS,
  removeMusicFromList,
  removeUserList,
  renameUserList,
  sortList,
  type SortField,
} from '../core/lists'
import player from '../core/player'
import { copyMusicName, downloadMusic, playAll, playFromList, promptAddToList, toggleLoveWithToast } from '../core/actions'
import { toast } from '../core/ui'

const activeListId = ref<string>(LIST_IDS.DEFAULT)
const selected = ref<string[]>([])
const newListOpen = ref(false)
const newListName = ref('')
const fileEl = ref<HTMLInputElement | null>(null)
const sortField = ref<SortField>('name')

const currentList = computed(() => getList(activeListId.value))
const activeInfo = computed(() => allLists.value.find((list) => list.id === activeListId.value))
const currentId = computed(() => player.currentMusic.value.id)
const lovedIds = computed(() => currentList.value.filter((item) => isLoved(item)).map((item) => item.id))

function iconFor(id: string): string {
  if (id === LIST_IDS.LOVE) return 'heart'
  if (id === LIST_IDS.DOWNLOAD) return 'download'
  if (id === LIST_IDS.PLAY_LATER) return 'playlist'
  return 'playlist'
}

function play(music: MusicItem) {
  playFromList(currentList.value, music, activeListId.value)
}

function playCurrent() {
  playAll(currentList.value, activeListId.value)
}

function toggleSelect(id: string) {
  const index = selected.value.indexOf(id)
  if (index >= 0) selected.value.splice(index, 1)
  else selected.value.push(id)
}

function removeSelected() {
  removeMusicFromList(activeListId.value, selected.value)
  toast(`已移除 ${selected.value.length} 首`)
  selected.value = []
}

function removeOne(music: MusicItem) {
  removeMusicFromList(activeListId.value, [music.id])
  toast('已从列表移除')
}

function clearCurrent() {
  clearList(activeListId.value)
  selected.value = []
  toast('列表已清空')
}

function sortCurrent() {
  const order: SortField[] = ['name', 'singer', 'album', 'source']
  sortField.value = order[(order.indexOf(sortField.value) + 1) % order.length]
  sortList(activeListId.value, sortField.value)
  toast(`已按「${sortFieldLabel(sortField.value)}」排序`)
}

function sortFieldLabel(field: SortField): string {
  return { name: '标题', singer: '歌手', album: '专辑', source: '音源' }[field]
}

function exportCurrent() {
  const payload = exportList(activeListId.value)
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${activeInfo.value?.name ?? 'list'}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
  toast('已导出列表')
}

function triggerImport() {
  fileEl.value?.click()
}

async function onImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const text = await file.text()
  const result = importList(text)
  toast(result.message)
  if (result.ok && result.listId) activeListId.value = result.listId
}

function openNewList() {
  newListName.value = ''
  newListOpen.value = true
}

function createList() {
  const name = newListName.value.trim()
  if (!name) return
  const list = createUserList(name)
  activeListId.value = list.id
  newListOpen.value = false
  toast('已创建列表')
}

function renameCurrent() {
  const next = window.prompt('新的列表名称', activeInfo.value?.name ?? '')
  if (next === null) return
  renameUserList(activeListId.value, next)
  toast('已重命名')
}

function removeCurrent() {
  if (!window.confirm('确定删除这个列表吗？列表中的歌曲不会影响其他列表。')) return
  removeUserList(activeListId.value)
  activeListId.value = LIST_IDS.DEFAULT
  toast('已删除列表')
}
</script>
