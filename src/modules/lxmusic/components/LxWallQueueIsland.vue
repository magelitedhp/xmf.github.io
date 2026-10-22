<template>
  <section
    class="lattice-tools-island"
    :style="{ height: `${islandHeight}px` }"
    role="region"
    aria-label="播放队列"
    @keydown="onIslandKeyDown"
  >
    <header class="lattice-tools-island-header">
      <input
        v-if="naming"
        ref="nameInputEl"
        v-model="draftName"
        class="lattice-tools-island-input"
        type="text"
        :disabled="saving"
        aria-label="输入歌单名称"
        placeholder="输入歌单名称"
        @keydown="onNameKeyDown"
      >
      <span v-else class="lattice-tools-island-heading">播放队列 · {{ queue.length }} 首</span>
      <span
        v-if="readOnly"
        class="lattice-tools-island-note"
        title="外部舞台播放时只能点歌"
      >
        <LxIcon name="lock" />
        <span class="sr-only">外部舞台播放时只能点歌</span>
      </span>
      <button
        v-if="canSave && !readOnly && !naming"
        ref="saveButtonEl"
        type="button"
        class="lattice-tools-island-header-action"
        aria-label="存为本地歌单"
        title="存为本地歌单"
        data-queue-island-action="save"
        @click="startNaming"
      >
        <LxIcon name="save" />
      </button>
      <button
        v-if="!readOnly && !naming && queue.length"
        type="button"
        class="lattice-tools-island-header-action"
        :class="{ 'is-confirming': clearPending }"
        :aria-label="clearPending ? '再点一次清空' : '清空播放队列'"
        :title="clearPending ? '再点一次清空' : '清空播放队列'"
        data-queue-island-action="clear"
        @click="handleClear"
      >
        <LxIcon name="trash" />
        <span v-if="clearPending" aria-hidden="true">再点一次清空</span>
      </button>
    </header>

    <div
      ref="frameEl"
      class="lattice-tools-island-list"
      :class="{ 'is-dragging': Boolean(drag) }"
      @pointermove="onDragPointerMove"
      @pointerup="onDragPointerUp"
      @pointercancel="finishDrag(false)"
      @lostpointercapture="finishDrag(false)"
    >
      <div
        v-if="queue.length"
        ref="scrollEl"
        class="lattice-tools-island-scroll"
        @scroll="onListScrollEvent"
      >
        <div class="lattice-tools-island-spacer" :style="{ height: `${queue.length * QUEUE_ISLAND_ROW_HEIGHT}px` }">
          <div
            v-for="row in visibleRows"
            :key="row.music.id"
            class="lattice-tools-island-row"
            :class="{
              'is-current': row.music.id === currentId,
              'is-unavailable': unavailableIds.has(row.music.id),
              'is-dragging': Boolean(drag),
              'is-drag-source': drag?.from === row.index,
            }"
            :style="rowStyle(row.index)"
            :data-queue-index="row.index"
            :data-queue-key="row.music.id"
          >
            <span
              v-if="!readOnly"
              class="lattice-tools-island-handle"
              role="presentation"
              title="拖动排序"
              @pointerdown="beginDrag(row.index, $event)"
            >
              <LxIcon name="grip" />
            </span>
            <button
              type="button"
              class="lattice-tools-island-song"
              :aria-current="row.music.id === currentId ? 'true' : undefined"
              @click="playRow(row.index)"
              @keydown="onRowKeyDown(row.index, $event)"
            >
              <span class="lattice-tools-island-marker" aria-hidden="true" />
              <span class="lattice-tools-island-text">
                <span class="lattice-tools-island-title">
                  <span class="lattice-tools-island-name">{{ row.music.name }}</span>
                  <span
                    v-if="unavailableIds.has(row.music.id)"
                    class="lattice-tools-island-tag"
                  >不可用</span>
                </span>
                <span class="lattice-tools-island-artist">{{ artistOf(row.music) }}</span>
              </span>
            </button>
            <span v-if="!readOnly" class="lattice-tools-island-row-actions">
              <button
                v-if="row.music.id !== currentId"
                type="button"
                class="lattice-tools-island-row-action"
                data-queue-row-action="play-next"
                title="下一首播放"
                aria-label="下一首播放"
                @click="runRowAction($event, 'play-next', row.index)"
              >
                <LxIcon name="listPlus" />
              </button>
              <button
                type="button"
                class="lattice-tools-island-row-action"
                data-queue-row-action="move-to-end"
                title="移到末尾"
                aria-label="移到末尾"
                @click="runRowAction($event, 'move-to-end', row.index)"
              >
                <LxIcon name="listEnd" />
              </button>
              <button
                v-if="row.music.id !== currentId"
                type="button"
                class="lattice-tools-island-row-action"
                data-queue-row-action="remove"
                title="移除"
                aria-label="移除"
                @click="runRowAction($event, 'remove', row.index)"
              >
                <LxIcon name="trash" />
              </button>
            </span>
          </div>
        </div>
      </div>
      <p v-else class="lattice-tools-island-empty">播放队列还是空的</p>

      <div
        v-if="drag && ghostMusic"
        ref="ghostEl"
        class="lattice-tools-island-ghost"
        :style="{ transform: `translate3d(0, ${ghostY}px, 0)` }"
        aria-hidden="true"
      >
        <LxIcon name="grip" />
        <span class="lattice-tools-island-text">
          <span class="lattice-tools-island-name">{{ ghostMusic.name }}</span>
          <span class="lattice-tools-island-artist">{{ artistOf(ghostMusic) }}</span>
        </span>
      </div>
    </div>

    <span class="sr-only" role="status" aria-live="polite">{{ announcement }}</span>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import LxIcon from './LxIcon.vue'
import player from '../core/player'
import type { MusicItem } from '../core/api'
import { addMusicList, createUserList } from '../core/lists'
import { toast } from '../core/ui'
import {
  QUEUE_DRAG_THRESHOLD_PX,
  QUEUE_ISLAND_ROW_HEIGHT,
  autoScrollEdgeAt,
  queueRowShift,
  resolveAutoScroll,
  resolveDropIndex,
  type QueueAutoScrollEdge,
} from '../core/lattice/queueDragGeometry'

interface QueueDrag {
  from: number
  to: number
}

interface DragSession {
  pointerId: number
  from: number
  to: number
  songId: string
  startX: number
  startY: number
  clientY: number
  grabOffset: number
  suppressedEdge: QueueAutoScrollEdge | null
  active: boolean
  frame: number
  target: HTMLElement
}

const ISLAND_HEADER_HEIGHT = 36
const ISLAND_MAX_VISIBLE_ROWS = 8
const ISLAND_MIN_HEIGHT = 112
const ISLAND_BORDER_HEIGHT = 2
const CLEAR_CONFIRM_MS = 3000
const CLEAR_CONFIRM_GUARD_MS = 400
const QUEUE_OVERSCAN_ROWS = 4

const frameEl = ref<HTMLElement | null>(null)
const scrollEl = ref<HTMLElement | null>(null)
const ghostEl = ref<HTMLElement | null>(null)
const nameInputEl = ref<HTMLInputElement | null>(null)
const saveButtonEl = ref<HTMLButtonElement | null>(null)
const drag = ref<QueueDrag | null>(null)
const ghostY = ref(0)
const scrollTop = ref(0)
const listHeight = ref(0)
const clearPending = ref(false)
const naming = ref(false)
const draftName = ref('')
const saving = ref(false)
const announcement = ref('')
const unavailableIds = ref(new Set<string>())
let dragSession: DragSession | null = null
let clearTimer = 0
let clearPendingSince = 0
let measureFrame = 0
let focusRequest = 0
let resizeObserver: ResizeObserver | null = null

const queue = computed(() => player.state.playList)
const currentId = computed(() => player.currentMusic.value.id)
const readOnly = false
// This port has no local playback source yet. Keep the reference guard in place
// rather than offering a save action that could create a mixed-source playlist.
const canSave = computed(() => false)
const currentIndex = computed(() =>
  currentId.value ? queue.value.findIndex((music) => music.id === currentId.value) : -1,
)
const islandHeight = computed(() =>
  Math.max(
    ISLAND_MIN_HEIGHT,
    ISLAND_BORDER_HEIGHT
      + ISLAND_HEADER_HEIGHT
      + Math.min(queue.value.length, ISLAND_MAX_VISIBLE_ROWS) * QUEUE_ISLAND_ROW_HEIGHT,
  ),
)
const ghostMusic = computed<MusicItem | undefined>(() =>
  drag.value ? queue.value[drag.value.from] : undefined,
)
const visibleRows = computed(() => {
  const start = Math.max(0, Math.floor(scrollTop.value / QUEUE_ISLAND_ROW_HEIGHT) - QUEUE_OVERSCAN_ROWS)
  const count = Math.ceil(listHeight.value / QUEUE_ISLAND_ROW_HEIGHT) + QUEUE_OVERSCAN_ROWS * 2
  const end = Math.min(queue.value.length, start + Math.max(count, 1))
  const rows: Array<{ index: number; music: MusicItem }> = []
  for (let index = start; index < end; index += 1) {
    rows.push({ index, music: queue.value[index] })
  }
  return rows
})

function artistOf(music: MusicItem) {
  return music.album ? `${music.singer} · ${music.album}` : music.singer
}

function announce(text: string) {
  announcement.value = ''
  void nextTick(() => {
    announcement.value = text
  })
}

function focusRow(index: number) {
  const list = scrollEl.value
  if (!list || index < 0 || index >= queue.value.length) return

  const rowTop = index * QUEUE_ISLAND_ROW_HEIGHT
  const rowBottom = rowTop + QUEUE_ISLAND_ROW_HEIGHT
  const viewTop = list.scrollTop
  const viewBottom = viewTop + list.clientHeight
  const nextTop = rowTop < viewTop
    ? rowTop
    : rowBottom > viewBottom
      ? rowBottom - list.clientHeight
      : viewTop

  if (nextTop !== viewTop) {
    list.scrollTop = nextTop
    scrollTop.value = list.scrollTop
  }

  const request = ++focusRequest
  let attempts = 3
  const tryFocus = () => {
    if (request !== focusRequest) return
    const button = frameEl.value?.querySelector<HTMLButtonElement>(
      `[data-queue-index="${index}"] .lattice-tools-island-song`,
    )
    if (button) {
      button.focus({ preventScroll: true })
      return
    }
    if (--attempts > 0) requestAnimationFrame(tryFocus)
  }
  requestAnimationFrame(tryFocus)
}

function playRow(index: number) {
  const music = queue.value[index]
  if (!music) return
  void player.playQueueIndex(index)
}

function runRowAction(event: MouseEvent, action: 'play-next' | 'move-to-end' | 'remove', index: number) {
  if (event.detail > 0) (event.currentTarget as HTMLElement).blur()
  if (action === 'play-next') {
    if (player.moveQueueIndexToNext(index)) announce(`已移到第 ${player.state.playIndex + 2} 位`)
    return
  }
  if (action === 'move-to-end') {
    if (player.moveQueueIndexToEnd(index)) announce('已移到队列末尾')
    return
  }
  if (player.removeQueueIndex(index)) {
    announce('已从队列移除')
    focusRow(Math.min(index, queue.value.length - 1))
  }
}

function onRowKeyDown(index: number, event: KeyboardEvent) {
  if (event.isComposing || event.ctrlKey || event.metaKey) return
  if (event.key === 'Enter' && !event.altKey && !event.shiftKey) {
    event.preventDefault()
    playRow(index)
    return
  }
  if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && !event.shiftKey) {
    event.preventDefault()
    const target = index + (event.key === 'ArrowUp' ? -1 : 1)
    if (target < 0 || target >= queue.value.length) return
    if (event.altKey && player.moveQueueIndex(index, target)) {
      announce(`已移到第 ${target + 1} 位`)
    }
    focusRow(target)
    return
  }
  if (event.key === 'Delete') {
    event.preventDefault()
    if (event.altKey || event.shiftKey || queue.value[index]?.id === currentId.value) return
    if (player.removeQueueIndex(index)) {
      announce('已从队列移除')
      focusRow(Math.min(index, queue.value.length - 1))
    }
  }
}

function onIslandKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Delete') return
  if (event.target instanceof Element && event.target.closest('input, textarea, [contenteditable="true"]')) return
  event.preventDefault()
}

function stopNaming() {
  naming.value = false
  draftName.value = ''
  void nextTick(() => saveButtonEl.value?.focus({ preventScroll: true }))
}

function startNaming() {
  cancelClear()
  naming.value = true
  draftName.value = ''
  void nextTick(() => nameInputEl.value?.focus({ preventScroll: true }))
}

async function submitName() {
  const name = draftName.value.trim()
  if (!name || saving.value) return
  saving.value = true
  try {
    const list = createUserList(name)
    addMusicList(list.id, queue.value, 'bottom')
    toast(`已存为本地歌单「${name}」`)
    stopNaming()
  } catch {
    toast('歌单没能保存')
    void nextTick(() => nameInputEl.value?.focus({ preventScroll: true }))
  } finally {
    saving.value = false
  }
}

function onNameKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.isComposing) return
  event.preventDefault()
  void submitName()
}

function handleClear(event: MouseEvent) {
  if (!clearPending.value) {
    clearPendingSince = performance.now()
    clearPending.value = true
    announce('再点一次清空播放队列')
    window.clearTimeout(clearTimer)
    clearTimer = window.setTimeout(() => {
      clearTimer = 0
      clearPending.value = false
    }, CLEAR_CONFIRM_MS)
    return
  }
  if (event.detail > 1 || performance.now() - clearPendingSince < CLEAR_CONFIRM_GUARD_MS) return
  window.clearTimeout(clearTimer)
  clearTimer = 0
  clearPending.value = false
  player.clearQueue()
  announce('播放队列已清空')
}

function rowStyle(index: number) {
  const activeDrag = drag.value
  const top = index * QUEUE_ISLAND_ROW_HEIGHT
  if (!activeDrag) return { transform: `translateY(${top}px)` }
  return {
    transform: `translateY(${top + queueRowShift(index, activeDrag.from, activeDrag.to)}px)`,
  }
}

function beginDrag(index: number, event: PointerEvent) {
  if (event.button !== 0 || !event.isPrimary || dragSession) return
  const target = frameEl.value
  const music = queue.value[index]
  const row = (event.currentTarget as HTMLElement).closest<HTMLElement>('[data-queue-index]')
  if (!target || !music || !row) return
  event.preventDefault()
  try {
    target.setPointerCapture(event.pointerId)
  } catch {
    return
  }
  const rect = scrollEl.value?.getBoundingClientRect()
  dragSession = {
    pointerId: event.pointerId,
    from: index,
    to: index,
    songId: music.id,
    startX: event.clientX,
    startY: event.clientY,
    clientY: event.clientY,
    grabOffset: event.clientY - row.getBoundingClientRect().top,
    suppressedEdge: rect
      ? autoScrollEdgeAt({ pointerY: event.clientY, top: rect.top, bottom: rect.bottom })
      : null,
    active: false,
    frame: 0,
    target,
  }
}

function onDragPointerMove(event: PointerEvent) {
  const session = dragSession
  if (!session || event.pointerId !== session.pointerId) return
  if ((event.buttons & 1) === 0) {
    finishDrag(false)
    return
  }
  session.clientY = event.clientY
  if (!session.active) {
    const distance = Math.hypot(event.clientX - session.startX, event.clientY - session.startY)
    if (distance <= QUEUE_DRAG_THRESHOLD_PX) return
    session.active = true
    drag.value = { from: session.from, to: session.from }
  }
  scheduleDragFrame()
}

function scheduleDragFrame() {
  const session = dragSession
  if (!session?.active || session.frame) return
  session.frame = requestAnimationFrame(stepDragFrame)
}

function stepDragFrame() {
  const session = dragSession
  if (!session) return
  session.frame = 0
  const list = scrollEl.value
  if (!list) return
  const rect = list.getBoundingClientRect()
  const { velocity, suppressedEdge } = resolveAutoScroll({
    pointerY: session.clientY,
    top: rect.top,
    bottom: rect.bottom,
    suppressedEdge: session.suppressedEdge,
  })
  session.suppressedEdge = suppressedEdge
  let scrolled = false
  if (velocity !== 0) {
    const before = list.scrollTop
    list.scrollTop = before + velocity
    scrolled = list.scrollTop !== before
  }
  const to = resolveDropIndex({
    centerY:
      session.clientY
      - rect.top
      + list.scrollTop
      - session.grabOffset
      + QUEUE_ISLAND_ROW_HEIGHT / 2,
    rowCount: queue.value.length,
  })
  if (to !== session.to) {
    session.to = to
    drag.value = { from: session.from, to }
  }
  ghostY.value = Math.min(
    rect.height - QUEUE_ISLAND_ROW_HEIGHT / 2,
    Math.max(-QUEUE_ISLAND_ROW_HEIGHT / 2, session.clientY - rect.top - session.grabOffset),
  )
  if (scrolled) scheduleDragFrame()
}

function onDragPointerUp(event: PointerEvent) {
  if (dragSession?.pointerId === event.pointerId) finishDrag(true)
}

function onListScroll() {
  if (dragSession?.active) scheduleDragFrame()
}

function finishDrag(commit: boolean) {
  const session = dragSession
  if (!session) return
  dragSession = null
  if (session.frame) cancelAnimationFrame(session.frame)
  try {
    if (session.target.hasPointerCapture(session.pointerId)) {
      session.target.releasePointerCapture(session.pointerId)
    }
  } catch {
    // The island may already be leaving the document.
  }
  drag.value = null
  if (!session.active || !commit || session.from === session.to) return
  if (queue.value[session.from]?.id !== session.songId) return
  if (player.moveQueueIndex(session.from, session.to)) {
    announce(`已移到第 ${session.to + 1} 位`)
    focusRow(session.to)
  }
}

function cancelClear() {
  if (!clearPending.value) return false
  window.clearTimeout(clearTimer)
  clearTimer = 0
  clearPending.value = false
  return true
}

function onDocumentKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || event.isComposing || event.defaultPrevented) return
  if (dragSession) {
    finishDrag(false)
    event.preventDefault()
    return
  }
  if (naming.value) {
    stopNaming()
    event.preventDefault()
    return
  }
  if (cancelClear()) event.preventDefault()
}

function centerCurrent(behavior: ScrollBehavior = 'auto') {
  const list = scrollEl.value
  const index = currentIndex.value
  if (!list || index < 0) return
  list.scrollTo({
    top: index * QUEUE_ISLAND_ROW_HEIGHT - (list.clientHeight - QUEUE_ISLAND_ROW_HEIGHT) / 2,
    behavior,
  })
}

function measureList() {
  const list = scrollEl.value
  if (!list) return
  listHeight.value = list.clientHeight
  scrollTop.value = list.scrollTop
}

function scheduleMeasure() {
  if (measureFrame) return
  measureFrame = requestAnimationFrame(() => {
    measureFrame = 0
    measureList()
  })
}

function onListScrollEvent() {
  measureList()
  if (dragSession?.active) scheduleDragFrame()
}

watch(
  currentIndex,
  (index, previous) => {
    if (index >= 0 && previous >= 0 && !dragSession) centerCurrent('smooth')
  },
)

watch(
  () => queue.value.length,
  (length) => {
    if (!length) cancelClear()
    if (dragSession && length <= dragSession.from) finishDrag(false)
    scheduleMeasure()
  },
)

onMounted(() => {
  document.addEventListener('keydown', onDocumentKeyDown, true)
  void nextTick(() => {
    measureList()
    centerCurrent()
    if (typeof ResizeObserver !== 'undefined' && scrollEl.value) {
      resizeObserver = new ResizeObserver(scheduleMeasure)
      resizeObserver.observe(scrollEl.value)
    }
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onDocumentKeyDown, true)
  focusRequest += 1
  window.clearTimeout(clearTimer)
  if (measureFrame) cancelAnimationFrame(measureFrame)
  resizeObserver?.disconnect()
  finishDrag(false)
})
</script>

<style>
.lattice-tools-island {
  display: flex;
  width: var(--wall-tools-panel-width);
  min-height: 112px;
  flex: 0 1 auto;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: 20px;
  background: rgb(0 0 0 / 40%);
  box-shadow: 0 24px 64px rgb(0 0 0 / 42%);
  backdrop-filter: blur(24px);
}

.lattice-tools.is-daylight .lattice-tools-island {
  border-color: rgb(0 0 0 / 7%);
  background: rgb(255 255 255 / 62%);
  box-shadow: 0 24px 64px rgb(42 35 27 / 18%);
}

.lattice-tools-island-header {
  display: flex;
  height: 36px;
  flex: none;
  align-items: center;
  gap: 4px;
  padding: 0 6px 0 14px;
  border-bottom: 1px solid rgb(255 255 255 / 8%);
}

.lattice-tools.is-daylight .lattice-tools-island-header {
  border-bottom-color: rgb(0 0 0 / 7%);
}

.lattice-tools-island-heading {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  font-size: 12px;
  font-weight: 650;
  opacity: 0.72;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lattice-tools-island-input {
  min-width: 0;
  height: 26px;
  flex: 1 1 auto;
  margin-left: -6px;
  padding: 0 8px;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 8px;
  background: rgb(255 255 255 / 6%);
  color: inherit;
  font: inherit;
  font-size: 12px;
}

.lattice-tools.is-daylight .lattice-tools-island-input {
  border-color: rgb(0 0 0 / 16%);
  background: rgb(0 0 0 / 4%);
}

.lattice-tools-island-input::placeholder {
  color: inherit;
  opacity: 0.45;
}

.lattice-tools-island-input:focus-visible {
  outline: 2px solid var(--lx-primary, currentColor);
  outline-offset: 1px;
}

.lattice-tools-island-note {
  display: grid;
  width: 28px;
  height: 28px;
  flex: none;
  place-items: center;
  opacity: 0.55;
}

.lattice-tools-island-note svg {
  width: 14px;
  height: 14px;
}

.lattice-tools-island-header-action {
  display: inline-flex;
  min-width: 28px;
  height: 28px;
  flex: none;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 7px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: inherit;
  font-size: 11px;
  font-weight: 650;
  cursor: pointer;
  opacity: 0.72;
  transition: background-color 160ms ease, opacity 160ms ease, color 160ms ease;
}

.lattice-tools-island-header-action:hover,
.lattice-tools-island-header-action:focus-visible {
  background: rgb(255 255 255 / 10%);
  opacity: 1;
}

.lattice-tools.is-daylight .lattice-tools-island-header-action:hover,
.lattice-tools.is-daylight .lattice-tools-island-header-action:focus-visible {
  background: rgb(0 0 0 / 7%);
}

.lattice-tools-island-header-action svg {
  width: 15px;
  height: 15px;
  flex: none;
}

.lattice-tools-island-header-action.is-confirming,
.lattice-tools.is-daylight .lattice-tools-island-header-action.is-confirming {
  max-width: 70%;
  background: var(--lx-primary, currentColor);
  color: var(--lx-wall-bg, #09090b);
  opacity: 1;
}

.lattice-tools-island-header-action.is-confirming span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lattice-tools-island-list {
  position: relative;
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  overflow: hidden;
  padding: 0 4px;
}

.lattice-tools-island-list.is-dragging {
  cursor: grabbing;
}

.lattice-tools-island-scroll {
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.lattice-tools-island-spacer {
  position: relative;
  width: 100%;
}

.lattice-tools-island-empty {
  display: grid;
  flex: 1 1 auto;
  place-items: center;
  margin: 0;
  font-size: 12px;
  opacity: 0.45;
}

.lattice-tools-island-row {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  display: flex;
  height: 40px;
  align-items: center;
  gap: 0;
  padding: 2px 4px 2px 0;
  border-radius: 10px;
}

.lattice-tools-island-row[data-queue-index] {
  will-change: transform;
}

.lattice-tools-island-row:hover,
.lattice-tools-island-row:focus-within {
  background: rgb(255 255 255 / 7%);
}

.lattice-tools.is-daylight .lattice-tools-island-row:hover,
.lattice-tools.is-daylight .lattice-tools-island-row:focus-within {
  background: rgb(0 0 0 / 5%);
}

.lattice-tools-island-row.is-current {
  background: rgb(255 255 255 / 10%);
}

.lattice-tools.is-daylight .lattice-tools-island-row.is-current {
  background: rgb(0 0 0 / 7%);
}

.lattice-tools-island-row.is-dragging {
  transition: transform 140ms ease;
}

.lattice-tools-island-row.is-dragging:hover,
.lattice-tools-island-row.is-dragging:focus-within {
  background: transparent;
}

.lattice-tools-island-row.is-dragging.is-current {
  background: rgb(255 255 255 / 10%);
}

.lattice-tools.is-daylight .lattice-tools-island-row.is-dragging.is-current {
  background: rgb(0 0 0 / 7%);
}

.lattice-tools-island-row.is-drag-source {
  visibility: hidden;
}

.lattice-tools-island-handle {
  display: grid;
  width: 18px;
  height: 32px;
  flex: none;
  place-items: center;
  color: inherit;
  cursor: grab;
  opacity: 0;
  touch-action: none;
  transition: opacity 120ms ease;
}

.lattice-tools-island-handle svg {
  width: 13px;
  height: 13px;
}

.lattice-tools-island-row:hover .lattice-tools-island-handle,
.lattice-tools-island-row:focus-within .lattice-tools-island-handle {
  opacity: 0.5;
}

.lattice-tools-island-row .lattice-tools-island-handle:hover {
  opacity: 0.9;
}

@media (hover: none) {
  .lattice-tools-island-handle {
    opacity: 0.4;
  }
}

.lattice-tools-island-song {
  display: flex;
  min-width: 0;
  height: 36px;
  flex: 1 1 auto;
  align-items: center;
  gap: 8px;
  padding: 0 6px 0 2px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.lattice-tools-island-song:focus-visible {
  outline: 2px solid var(--lx-primary, currentColor);
  outline-offset: -2px;
}

.lattice-tools-island-marker {
  width: 3px;
  height: 18px;
  flex: none;
  border-radius: 2px;
  background: transparent;
}

.lattice-tools-island-row.is-current .lattice-tools-island-marker {
  background: var(--lx-primary, currentColor);
}

.lattice-tools-island-text {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  line-height: 1.25;
}

.lattice-tools-island-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.lattice-tools-island-name,
.lattice-tools-island-artist {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lattice-tools-island-name {
  font-size: 12.5px;
  font-weight: 550;
}

.lattice-tools-island-row.is-current .lattice-tools-island-name {
  font-weight: 700;
}

.lattice-tools-island-artist {
  font-size: 10.5px;
  opacity: 0.52;
}

.lattice-tools-island-tag {
  flex: none;
  padding: 0 6px;
  border: 1px solid currentColor;
  border-radius: 999px;
  opacity: 0.6;
  font-size: 9.5px;
  font-weight: 600;
  line-height: 15px;
}

.lattice-tools-island-row.is-unavailable .lattice-tools-island-text {
  opacity: 0.55;
}

.lattice-tools-island-row-actions {
  display: none;
  flex: none;
  align-items: center;
}

.lattice-tools-island-row:hover .lattice-tools-island-row-actions,
.lattice-tools-island-row:focus-within .lattice-tools-island-row-actions {
  display: flex;
}

.lattice-tools-island-row.is-dragging .lattice-tools-island-row-actions {
  display: none;
}

.lattice-tools-island-row-action {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: 0.7;
  transition: background-color 140ms ease, opacity 140ms ease;
}

.lattice-tools-island-row-action:hover,
.lattice-tools-island-row-action:focus-visible {
  background: rgb(255 255 255 / 12%);
  opacity: 1;
}

.lattice-tools.is-daylight .lattice-tools-island-row-action:hover,
.lattice-tools.is-daylight .lattice-tools-island-row-action:focus-visible {
  background: rgb(0 0 0 / 8%);
}

.lattice-tools-island-row-action svg {
  width: 14px;
  height: 14px;
}

.lattice-tools-island-ghost {
  position: absolute;
  top: 0;
  right: 4px;
  left: 4px;
  z-index: 2;
  display: flex;
  height: 40px;
  align-items: center;
  gap: 8px;
  padding: 0 12px 0 3px;
  border-radius: 10px;
  background: rgb(255 255 255 / 18%);
  box-shadow: 0 10px 28px rgb(0 0 0 / 38%), 0 0 0 1px rgb(255 255 255 / 12%);
  pointer-events: none;
  will-change: transform;
}

.lattice-tools.is-daylight .lattice-tools-island-ghost {
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 10px 28px rgb(42 35 27 / 20%), 0 0 0 1px rgb(0 0 0 / 8%);
}

.lattice-tools-island-ghost > svg {
  width: 13px;
  height: 13px;
  flex: none;
  opacity: 0.6;
}

@media (prefers-reduced-motion: reduce) {
  .lattice-tools-island-row.is-dragging {
    transition: none;
  }
}
</style>
