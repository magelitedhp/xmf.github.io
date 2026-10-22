<template>
  <LxModal :open="uiState.addToList.open" :title="`添加到列表 · ${music?.name ?? ''}`" @close="closeAddToList">
    <div class="lx-add-list">
      <div class="lx-add-list-new">
        <input v-model="newName" class="lx-select" placeholder="新建列表名称" @keydown.enter.prevent="createAndAdd">
        <button type="button" class="lx-btn is-primary" :disabled="!newName.trim()" @click="createAndAdd">新建并添加</button>
      </div>

      <ul class="lx-add-list-items">
        <li v-for="list in allLists" :key="list.id">
          <button type="button" class="lx-add-list-item" :class="{ 'is-added': addedIds.includes(list.id) }" @click="addTo(list.id)">
            <LxIcon :name="addedIds.includes(list.id) ? 'check' : 'playlist'" />
            <span class="lx-ellipsis">{{ list.name }}</span>
            <small>{{ getList(list.id).length }}</small>
          </button>
        </li>
      </ul>
    </div>
  </LxModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import LxModal from './LxModal.vue'
import LxIcon from './LxIcon.vue'
import { addMusicToList, allLists, createUserList, getList } from '../core/lists'
import { closeAddToList, toast, uiState } from '../core/ui'

const newName = ref('')

const music = computed(() => uiState.addToList.music)

const addedIds = computed(() => {
  const target = music.value
  if (!target) return []
  return allLists.value.filter((list) => getList(list.id).some((item) => item.id === target.id)).map((list) => list.id)
})

function addTo(listId: string) {
  const target = music.value
  if (!target) return
  const added = addMusicToList(listId, target)
  toast(added ? '已添加到列表' : '该歌曲已在列表中')
  closeAddToList()
}

function createAndAdd() {
  const name = newName.value.trim()
  if (!name) return
  const list = createUserList(name)
  newName.value = ''
  addTo(list.id)
}
</script>

<style>
.lx-add-list-new {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.lx-add-list-new input {
  flex: auto;
  min-width: 0;
}

.lx-add-list-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 320px;
  overflow-y: auto;
}

.lx-add-list-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border-radius: var(--lx-radius);
  color: var(--lx-font-label);
  text-align: left;
  transition: background-color var(--lx-transition-fast);
}

.lx-add-list-item:hover {
  background: var(--lx-hover);
  color: var(--lx-font);
}

.lx-add-list-item.is-added {
  color: var(--lx-primary);
}

.lx-add-list-item svg {
  width: 17px;
  height: 17px;
  flex: none;
}

.lx-add-list-item span {
  flex: auto;
}

.lx-add-list-item small {
  color: var(--lx-font-muted);
  font-size: 12px;
}
</style>
