<template>
  <div class="lx-music-list" :class="{ 'hide-actions': !actionButtonsVisible }">
    <div class="lx-music-head">
      <span class="lx-music-index">#</span>
      <span class="lx-col-title">标题</span>
      <span class="lx-col-album">专辑</span>
      <span class="lx-col-time">时长</span>
      <span v-if="actionButtonsVisible" class="lx-col-actions">操作</span>
    </div>

    <p v-if="!list.length" class="lx-empty">
      <strong>{{ emptyTitle }}</strong>
      <span>{{ emptyText }}</span>
    </p>

    <div v-else class="lx-music-body">
      <div
        v-for="(music, index) in list"
        :key="music.id"
        class="lx-music-row"
        :class="{
          'is-active': music.id === currentId,
          'is-selected': selected.includes(music.id) || menu.music?.id === music.id,
          'is-pressing': pressedId === music.id,
          'is-scattering': scattering,
        }"
        :style="rowMotionStyle(index)"
        :data-motion-index="index"
        @click="onRowClick(music)"
        @dblclick="emit('play', music)"
        @contextmenu.prevent="openMenu($event, music)"
        @pointerdown="onPointerDown(music.id)"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @pointerleave="onPointerUp"
      >
      <span class="lx-music-index">
        <button
          v-if="selectable"
          type="button"
          class="lx-icon-btn"
          :aria-label="selected.includes(music.id) ? '取消选择' : '选择'"
          @click.stop="emit('select', music.id)"
        >
          <LxIcon :name="selected.includes(music.id) ? 'check' : 'add'" />
        </button>
        <span v-else-if="music.id === currentId" class="lx-playing-bars" aria-label="正在播放">
          <i /><i /><i />
        </span>
        <template v-else>{{ startIndex + index + 1 }}</template>
      </span>

      <span class="lx-music-name">
        <button
          type="button"
          class="lx-row-cover"
          :aria-label="`播放 ${music.name}`"
          @click.stop="emit('play', music)"
        >
          <LxCover :src="music.pic" :alt="`${music.name} 封面`" />
          <span class="lx-row-cover-play" aria-hidden="true"><LxIcon name="play" /></span>
        </button>
        <span class="lx-row-copy">
          <span class="lx-row-title">
            <span class="lx-music-name-text lx-ellipsis">{{ music.name }}</span>
            <span class="lx-badge is-primary">{{ bitrateLabel }}</span>
            <span v-if="appSetting['list.isShowSource']" class="lx-badge is-tertiary">{{ sourceName(music.source) }}</span>
          </span>
          <span class="lx-row-singer lx-ellipsis">{{ music.singer }}</span>
        </span>
      </span>

      <span class="lx-col-album lx-ellipsis">{{ music.album || '—' }}</span>
      <span class="lx-music-time">{{ music.interval || '--/--' }}</span>

      <span v-if="actionButtonsVisible" class="lx-music-actions">
        <button type="button" class="lx-icon-btn" :class="{ 'is-active': lovedIds.includes(music.id) }" aria-label="收藏" title="收藏" @click.stop="emit('love', music)">
          <LxIcon name="heart" />
        </button>
        <button type="button" class="lx-icon-btn" aria-label="添加到列表" title="添加到列表" @click.stop="emit('add', music)">
          <LxIcon name="add" />
        </button>
        <button type="button" class="lx-icon-btn" aria-label="下载" title="下载" @click.stop="emit('download', music)">
          <LxIcon name="download" />
        </button>
        <button type="button" class="lx-icon-btn" aria-label="更多" title="更多" @click.stop="openMenu($event, music)">
          <LxIcon name="more" />
        </button>
      </span>
      </div>
    </div>

    <div v-if="menu.open" class="lx-tip-list" :style="menuStyle" @click.stop>
      <button v-for="action in menuActions" :key="action.key" type="button" class="lx-tip-item" @click="runMenu(action.key)">
        {{ action.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import LxIcon from './LxIcon.vue'
import LxCover from './LxCover.vue'
import { BITRATE_LABEL, MUSIC_SOURCES, type MusicItem } from '../core/api'
import {
  FLY_IN_EASE,
  SCATTER_EASE,
  flyInMotion,
  hashSeed,
  isMotionEnabled,
  scatterMotion,
} from '../core/foliaMotion'
import { appSetting } from '../core/settings'

const props = withDefaults(
  defineProps<{
    list: MusicItem[]
    currentId?: string
    selected?: string[]
    lovedIds?: string[]
    startIndex?: number
    selectable?: boolean
    emptyTitle?: string
    emptyText?: string
    /** Extra context-menu entries supplied by the host view. */
    extraActions?: Array<{ key: string; label: string }>
  }>(),
  {
    currentId: '',
    selected: () => [],
    lovedIds: () => [],
    startIndex: 0,
    selectable: false,
    emptyTitle: '这里还没有内容',
    emptyText: '换一个关键词，或从榜单里挑一首。',
    extraActions: () => [],
  },
)

const emit = defineEmits<{
  play: [music: MusicItem]
  select: [id: string]
  love: [music: MusicItem]
  add: [music: MusicItem]
  download: [music: MusicItem]
  remove: [music: MusicItem]
  copy: [music: MusicItem]
  action: [key: string, music: MusicItem]
}>()

const menu = reactive({ open: false, x: 0, y: 0, music: null as MusicItem | null })
const pressedId = ref('')
const scattering = ref(false)
const entered = new WeakSet<HTMLElement>()
let previousIds: string[] = []
let scatterTimer = 0

const menuStyle = computed(() => ({
  position: 'fixed' as const,
  left: `${menu.x}px`,
  top: `${menu.y}px`,
  width: '180px',
  zIndex: 80,
}))

const actionButtonsVisible = computed(() => appSetting['list.actionButtonsVisible'] ?? true)
const bitrateLabel = computed(() => BITRATE_LABEL[appSetting['player.bitrate']] ?? '320k')

const menuActions = computed(() => [
  { key: 'play', label: '播放' },
  { key: 'playLater', label: '稍后播放' },
  { key: 'love', label: '收藏 / 取消收藏' },
  { key: 'add', label: '添加到列表' },
  { key: 'download', label: '下载' },
  { key: 'copy', label: '复制歌名' },
  ...(props.extraActions ?? []),
  ...(props.list.length && props.selected?.length ? [{ key: 'remove', label: '从列表移除' }] : []),
])

function sourceName(id: string): string {
  return MUSIC_SOURCES.find((source) => source.id === id)?.name ?? id
}

function rowMotionStyle(index: number) {
  const music = props.list[index]
  if (!music) return {}
  const seed = hashSeed(music.id)
  const width = typeof window === 'undefined' ? 1200 : window.innerWidth
  const height = typeof window === 'undefined' ? 800 : window.innerHeight
  const fly = flyInMotion(index, props.list.length, seed, width, height)
  return {
    '--lx-fly-x': `${fly.x}px`,
    '--lx-fly-y': `${fly.y}px`,
    '--lx-fly-delay': `${fly.delay}s`,
    '--lx-fly-ease': FLY_IN_EASE,
  }
}

function playEntrance() {
  if (!isMotionEnabled(appSetting['common.animation'])) return
  const rows = document.querySelectorAll<HTMLElement>('.lx-music-row[data-motion-index]')
  rows.forEach((row) => {
    if (entered.has(row)) return
    entered.add(row)
    const index = Number(row.dataset.motionIndex)
    const music = props.list[index]
    if (!music) return
    const seed = hashSeed(music.id)
    const fly = flyInMotion(index, props.list.length, seed, window.innerWidth, window.innerHeight)
    row.animate(
      [
        { opacity: 0, translate: `${fly.x.toFixed(1)}px ${fly.y.toFixed(1)}px`, scale: '0.94' },
        { opacity: 1, translate: '0px 0px', scale: '1' },
      ],
      {
        duration: 500,
        delay: fly.delay * 1000,
        easing: FLY_IN_EASE,
        fill: 'backwards',
      },
    )
  })
}

function scatterOut() {
  if (!isMotionEnabled(appSetting['common.animation']) || !props.list.length) return
  scattering.value = true
  const rows = document.querySelectorAll<HTMLElement>('.lx-music-row[data-motion-index]')
  rows.forEach((row) => {
    const index = Number(row.dataset.motionIndex)
    const music = props.list[index]
    if (!music) return
    const push = scatterMotion(index, props.list.length, hashSeed(music.id), window.innerWidth, window.innerHeight)
    row.animate(
      [
        { translate: '0px 0px', rotate: '0deg', scale: '1' },
        {
          translate: `${push.x.toFixed(1)}px ${push.y.toFixed(1)}px`,
          rotate: `${push.rotate.toFixed(2)}deg`,
          scale: '0.92',
        },
      ],
      { duration: 420, delay: push.delay, easing: SCATTER_EASE, fill: 'both' },
    )
  })
  window.clearTimeout(scatterTimer)
  scatterTimer = window.setTimeout(() => {
    scattering.value = false
  }, 520)
}

function onPointerDown(id: string) {
  pressedId.value = id
}

function onPointerUp() {
  pressedId.value = ''
}

function onTitleClick(music: MusicItem) {
  if (appSetting['list.isClickPlay']) emit('play', music)
}

function onRowClick(music: MusicItem) {
  onTitleClick(music)
}

function openMenu(event: MouseEvent, music: MusicItem) {
  menu.open = true
  menu.music = music
  menu.x = Math.min(event.clientX, window.innerWidth - 190)
  menu.y = Math.min(event.clientY, window.innerHeight - menuActions.value.length * 34 - 20)
}

function closeMenu() {
  menu.open = false
}

function runMenu(key: string) {
  const music = menu.music
  closeMenu()
  if (!music) return
  switch (key) {
    case 'play':
      emit('play', music)
      return
    case 'playLater':
      emit('action', 'playLater', music)
      return
    case 'love':
      emit('love', music)
      return
    case 'add':
      emit('add', music)
      return
    case 'download':
      emit('download', music)
      return
    case 'copy':
      emit('copy', music)
      return
    case 'remove':
      emit('remove', music)
      return
    default:
      emit('action', key, music)
  }
}

window.addEventListener('click', closeMenu)
window.addEventListener('scroll', closeMenu, true)
watch(
  () => props.list.map((music) => music.id),
  async (ids) => {
    if (previousIds.length && ids.length === 0) scatterOut()
    previousIds = ids
    await nextTick()
    playEntrance()
  },
  { immediate: true },
)
onMounted(() => void nextTick().then(playEntrance))
onBeforeUnmount(() => {
  window.clearTimeout(scatterTimer)
  window.removeEventListener('click', closeMenu)
  window.removeEventListener('scroll', closeMenu, true)
})
</script>
