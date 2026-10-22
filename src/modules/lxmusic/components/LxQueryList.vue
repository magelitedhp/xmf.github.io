<template>
  <div v-if="wallMode" class="lx-query-wall">
    <LxCollectionFlight
      v-if="collectionPlan"
      direction="in"
      :item-id="collectionPlan.itemId"
      :cover="collectionPlan.coverUrl"
      :from-rect="collectionPlan.rect"
      :from-radius="collectionPlan.radius"
      :from-shade="collectionPlan.shade"
      :destination-end="entryDestination"
      :reduced-motion="!appSetting['common.animation']"
      @landed="onEntryFlightLanded"
    />
    <div
      v-if="collectionPlan"
      ref="entryTargetEl"
      class="lx-query-hero is-wall-landing"
      data-folia-collection-flight-target
    >
      <img :src="collectionPlan.coverUrl" alt="" draggable="false" decoding="sync">
      <div class="lx-query-hero-shade" />
      <div class="lx-query-hero-copy">
        <strong>{{ collectionPlan.title }}</strong>
        <span>{{ wallSubtitle }}</span>
      </div>
    </div>
    <LxPosterWall
      :items="wallItems"
      mode="song"
      :current-id="currentId"
      :heading="title"
      :subheading="wallSubtitle"
      @activate="playWallItem"
      @play="playWallItem"
      @open-lyrics="openLyrics"
      @open-player="openPlayer"
      @back="goBack"
    >
      <template #tools>
        <button type="button" :disabled="!list.length" @click="playAll(list, listId)">
          <LxIcon name="play" /> 播放全部
        </button>
        <button type="button" :disabled="!list.length" @click="addAll">添加到列表</button>
        <button type="button" :disabled="!list.length" @click="downloadAll">下载全部</button>
      </template>
    </LxPosterWall>
    <div v-if="loading" class="lx-wall-loading" :class="{ 'is-daylight': isDaylight }">
      正在把封面铺上海报墙…
    </div>
    <div v-else-if="error" class="lx-wall-loading is-error" :class="{ 'is-daylight': isDaylight }">
      {{ error }}
    </div>
  </div>

  <div v-else class="lx-page">
    <div class="lx-page-head">
      <button type="button" class="lx-icon-btn" aria-label="返回" @click="goBack">
        <LxIcon name="back" />
      </button>
      <div class="lx-query-title">
        <h1 class="lx-page-title">{{ title }}</h1>
        <span class="lx-page-sub">{{ subtitle }}</span>
      </div>
      <div class="lx-query-actions">
        <button type="button" class="lx-btn is-primary" :disabled="!list.length" @click="playAll(list)">
          <LxIcon name="play" /> 播放全部
        </button>
        <button type="button" class="lx-btn" :disabled="!list.length" @click="addAll">添加到列表</button>
        <button type="button" class="lx-btn" :disabled="!list.length" @click="downloadAll">下载全部</button>
      </div>
    </div>

    <p v-if="loading" class="lx-query-state">正在加载曲目…</p>
    <p v-else-if="error" class="lx-query-state is-error">{{ error }}</p>

    <LxMusicList
      :list="list"
      :current-id="currentId"
      :loved-ids="lovedIds"
      empty-title="这里还没有曲目"
      empty-text="稍后再试，或换一个榜单。"
      @play="play"
      @love="toggleLoveWithToast"
      @add="promptAddToList"
      @download="downloadMusic"
      @copy="copyMusicName"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LxIcon from './LxIcon.vue'
import LxCollectionFlight from './LxCollectionFlight.vue'
import LxMusicList from './LxMusicList.vue'
import LxPosterWall, { type PosterWallItem } from './LxPosterWall.vue'
import { hydrateCovers, searchMusic, type MusicItem } from '../core/api'
import { addMusicList, isLoved, LIST_IDS } from '../core/lists'
import player from '../core/player'
import { copyMusicName, downloadMusic, playAll, playFromList, promptAddToList, toggleLoveWithToast } from '../core/actions'
import { addTasks } from '../core/download'
import { toast } from '../core/ui'
import { isDaylight } from '../core/themeMode'
import { appSetting } from '../core/settings'
import {
  armCollectionReturn,
  collectionMorph,
  planCollectionFromWall,
  type CollectionMorphEnd,
  type CollectionMorphPlan,
} from '../core/lattice/collectionMorphStore'
import type { CollectionMorphRect } from '../core/lattice/collectionFlight'
import './PosterWallShell.css'

const props = withDefaults(
  defineProps<{
    source: string
    query: string
    title: string
    subtitle?: string
    backTo?: string
    /** Identity used as the playback context, so next/prev stay inside this list. */
    listId?: string
    /** Render the songs as Folia's draggable poster wall rather than the table list. */
    wallMode?: boolean
  }>(),
  { subtitle: '', backTo: '/lxmusic/songList', listId: LIST_IDS.DEFAULT, wallMode: false },
)

const router = useRouter()
const route = useRoute()
const list = ref<MusicItem[]>([])
// Keep the shared-element plan alive until the flight itself has read it. The
// route fallback covers a hard refresh, where module state cannot survive.
const entryPlan = props.wallMode
  ? collectionMorph.plan ?? readPlanFromQuery()
  : null
if (entryPlan) collectionMorph.plan = null
const loading = ref(false)
const error = ref('')
const collectionPlan = ref<CollectionMorphPlan | null>(entryPlan)
const entryTargetEl = ref<HTMLElement | null>(null)
const entryDestination = ref<CollectionMorphEnd>({
  rect: { x: 0, y: 0, width: 0, height: 0 },
  radius: 12,
})
const currentId = computed(() => player.currentMusic.value.id)
const lovedIds = computed(() => list.value.filter((item) => isLoved(item)).map((item) => item.id))
const wallItems = computed<PosterWallItem[]>(() =>
  list.value.map((music) => ({
    id: music.id,
    title: music.name,
    artist: music.singer,
    cover: music.pic,
    tint: tintFor(music),
    duration: music.duration,
  })),
)
const wallSubtitle = computed(() => {
  if (loading.value) return '正在加载曲目…'
  return `${list.value.length} 首 · 拖动浏览，单击展开`
})

function goBack() {
  const itemId = collectionMorph.returnItemId
  const coverUrl = collectionMorph.exitCoverUrl
  if (props.wallMode && itemId && coverUrl) {
    const hero = entryTargetEl.value
    const heroRect = hero?.getBoundingClientRect()
    const fromRect = heroRect && heroRect.width > 0 && heroRect.height > 0
      ? {
        x: heroRect.x,
        y: heroRect.y,
        width: heroRect.width,
        height: heroRect.height,
      }
      : collectionPlan.value?.rect
    if (!fromRect) {
      void router.push(props.backTo)
      return
    }
    const fromRadius = Number.parseFloat(
      hero ? getComputedStyle(hero).borderTopLeftRadius : '',
    ) || collectionPlan.value?.radius || 0
    const shade = hero
      ? getComputedStyle(hero.querySelector<HTMLElement>('.lx-query-hero-shade') ?? hero).background
      : collectionPlan.value?.shade ?? ''
    const source = {
      rect: fromRect,
      radius: fromRadius,
      shade,
    }
    armCollectionReturn(itemId, coverUrl, source)
    void router.push({
      path: props.backTo,
      query: {
        returnTile: itemId,
        returnCover: coverUrl,
        returnTitle: collectionPlan.value?.title ?? props.title,
        returnX: String(fromRect.x),
        returnY: String(fromRect.y),
        returnWidth: String(fromRect.width),
        returnHeight: String(fromRect.height),
        returnRadius: String(fromRadius),
        returnShade: shade,
      },
    })
    return
  }
  void router.push(props.backTo)
}

function readPlanFromQuery(): CollectionMorphPlan | null {
  const coverUrl = typeof route.query.returnCover === 'string' ? route.query.returnCover : ''
  const itemId = typeof route.query.returnTile === 'string' ? route.query.returnTile : ''
  if (!coverUrl || !itemId) return null
  const plan: CollectionMorphPlan = {
    itemId,
    coverUrl,
    title: typeof route.query.returnTitle === 'string' ? route.query.returnTitle : props.title,
    rect: {
      x: Number(route.query.returnX) || 0,
      y: Number(route.query.returnY) || 0,
      width: Number(route.query.returnWidth) || 0,
      height: Number(route.query.returnHeight) || 0,
    },
    radius: Number(route.query.returnRadius) || 0,
    shade: typeof route.query.returnShade === 'string' ? route.query.returnShade : '',
  }
  planCollectionFromWall(plan)
  return plan
}

function onEntryFlightLanded() {
  collectionPlan.value = null
  entryTargetEl.value = null
  if (collectionMorph.plan?.itemId === entryPlan?.itemId) {
    collectionMorph.plan = null
  }
}

watch(
  () => [props.wallMode, list.value.length] as const,
  () => {
    const itemId = collectionMorph.returnItemId
    if (!props.wallMode || !itemId) return
    const item = list.value.find((entry) => entry.id === itemId)
    if (!item?.pic) return
    armCollectionReturn(item.id, item.pic)
  },
  { immediate: true },
)

watch(
  entryTargetEl,
  (element) => {
    if (!element) return
    const rect = element.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) return
    entryDestination.value = {
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
      radius: Number.parseFloat(getComputedStyle(element).borderTopLeftRadius) || 12,
    }
  },
  { flush: 'post' },
)

function play(music: MusicItem) {
  playFromList(list.value, music, props.listId)
}

function playWallItem(item: PosterWallItem) {
  const music = list.value.find((entry) => entry.id === item.id)
  if (music) play(music)
}

function addAll() {
  const added = addMusicList(LIST_IDS.DEFAULT, list.value, 'bottom')
  toast(added ? `已添加 ${added} 首到试听列表` : '曲目已全部在列表中')
}

function downloadAll() {
  addTasks(list.value)
  toast(`已加入 ${list.value.length} 首到下载队列`)
}

function openLyrics(item: PosterWallItem) {
  const music = list.value.find((entry) => entry.id === item.id)
  if (music) openPlayDetail(music)
}

function openPlayer(item: PosterWallItem) {
  const music = list.value.find((entry) => entry.id === item.id)
  if (music) openPlayDetail(music)
}

function openPlayDetail(music: MusicItem) {
  play(music)
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent('lxmusic:open-detail'))
  }, 40)
}

function tintFor(music: MusicItem) {
  let hash = 0
  for (let index = 0; index < music.id.length; index += 1) {
    hash = (hash * 31 + music.id.charCodeAt(index)) >>> 0
  }
  return `hsl(${hash % 360} 46% 34%)`
}

async function load() {
  if (!props.query) return
  loading.value = true
  error.value = ''
  try {
    const result = await searchMusic(props.query, { source: props.source, limit: 50 })
    list.value = result
    void hydrateCovers(result, 50, 6)
      .then(() => {
        // The hydrated cover URLs live on the same MusicItem objects. Replacing the
        // array is what makes the computed poster items notice the mutation.
        if (result === list.value) list.value = [...result]
      })
      .catch(() => undefined)
  } catch (err) {
    list.value = []
    error.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

watch(() => [props.source, props.query], () => void load(), { immediate: true })
</script>

<style>
.lx-query-wall {
  position: absolute;
  inset: 0;
}

.lx-query-hero {
  position: relative;
  width: min(38vw, 420px);
  aspect-ratio: 1;
  margin: 20px auto 18px;
  overflow: hidden;
  border-radius: 12px;
  background: var(--lx-content-background);
  box-shadow: 0 22px 64px rgb(0 0 0 / 22%);
}

.lx-query-hero.is-wall-landing {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 9;
  width: min(38vw, 420px);
  margin: 0;
  translate: -50% -50%;
}

.lx-query-hero > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lx-query-hero-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgb(0 0 0 / 76%), transparent 54%);
}

.lx-query-hero-copy {
  position: absolute;
  right: 22px;
  bottom: 20px;
  left: 22px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: #fff;
}

.lx-query-hero-copy strong {
  font-size: clamp(24px, 3vw, 38px);
  line-height: 1;
}

.lx-query-hero-copy span {
  overflow: hidden;
  font-size: 13px;
  opacity: 0.72;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .lx-query-hero {
    width: min(72vw, 320px);
  }

  .lx-query-hero.is-wall-landing {
    width: min(72vw, 320px);
  }
}

.lx-wall-loading {
  position: absolute;
  left: 50%;
  bottom: 28px;
  z-index: 8;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.58);
  color: rgba(255, 255, 255, 0.76);
  font-size: 12px;
  transform: translateX(-50%);
  backdrop-filter: blur(12px);
  pointer-events: none;
}

.lx-wall-loading.is-daylight {
  background: rgb(255 255 255 / 72%);
  color: rgb(28 25 23 / 68%);
  box-shadow: 0 10px 30px rgb(42 35 27 / 14%);
}

.lx-wall-loading.is-error {
  color: #ff9f95;
}

.lx-wall-loading.is-daylight.is-error {
  color: #b42318;
}

.lx-query-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-right: auto;
}

.lx-query-title .lx-page-title {
  margin-right: 0;
}

.lx-query-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.lx-query-state {
  padding: 24px 0;
  color: var(--lx-font-muted);
  font-size: 13px;
}

.lx-query-state.is-error {
  color: #e2564a;
}
</style>
