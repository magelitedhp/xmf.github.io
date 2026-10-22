<template>
  <div class="lx-songlist-wall-page">
    <LxPosterWall
      :items="wallItems"
      :sections="wallSections"
      mode="collection"
      :key="routeReturnKey"
      :return-item-id="routeReturnPlan?.itemId ?? ''"
      :show-back="false"
      refreshable
      :refreshing="refreshing"
      :heading="activeTag === 'all' ? '歌单' : tagName"
      :subheading="`${visibleLists.length} 个歌单 · 拖动浏览，单击展开`"
      @activate="open"
      @refresh="refreshWall"
    >
      <template #tools>
        <div ref="filterMenuEl" class="lx-tag-filter" @keydown="onFilterKeydown">
          <button
            ref="filterPillEl"
            type="button"
            class="lx-tag-filter-pill"
            aria-haspopup="menu"
            :aria-expanded="filterMenuOpen"
            @click.stop="filterMenuOpen = !filterMenuOpen"
          >
            <span>{{ tagName }}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <div v-if="filterMenuOpen" class="lx-tag-filter-list" role="menu" aria-label="歌单分类">
            <button
              v-for="tag in songListTags"
              :key="tag.id"
              type="button"
              role="menuitem"
              :class="{ 'is-current': activeTag === tag.id }"
              @click.stop="selectTag(tag.id)"
            >
              {{ tag.name }}
            </button>
          </div>
        </div>
      </template>
    </LxPosterWall>
    <LxCollectionFlight
      v-if="routeReturnPlan"
      direction="out"
      :item-id="routeReturnPlan.itemId"
      :cover="routeReturnPlan.coverUrl"
      :from-rect="routeReturnPlan.rect"
      :from-radius="routeReturnPlan.radius"
      :from-shade="routeReturnPlan.shade"
      :to-rect="routeReturnTargetRect"
      :reduced-motion="!appSetting['common.animation']"
      @landed="clearRouteReturn"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LxCollectionFlight from '../components/LxCollectionFlight.vue'
import LxPosterWall, {
  type PosterWallItem,
  type PosterWallSection,
} from '../components/LxPosterWall.vue'
import { filterSongLists, songListTags, type SongListItem } from '../core/discover'
import { appSetting } from '../core/settings'
import { toast } from '../core/ui'
import {
  finishCollectionReturn,
  type CollectionMorphPlan,
} from '../core/lattice/collectionMorphStore'
import type { CollectionMorphRect } from '../core/lattice/collectionFlight'
import '../components/PosterWallShell.css'

const router = useRouter()
const route = useRoute()
const initialReturnPlan = readRouteReturn()
const routeReturnPlan = ref<CollectionMorphPlan | null>(initialReturnPlan)
const routeReturnTargetRect = ref<CollectionMorphRect | undefined>(undefined)
const routeReturnKey = computed(() =>
  initialReturnPlan
    ? `return:${initialReturnPlan.itemId}`
    : `wall:${route.query.returnTile ?? ''}`,
)
const activeTag = ref('all')
const refreshing = ref(false)
const filterMenuOpen = ref(false)
const filterMenuEl = ref<HTMLElement | null>(null)
const filterPillEl = ref<HTMLButtonElement | null>(null)
const listOrder = shallowRef<Record<string, number>>({})

const visibleLists = computed(() => {
  const items = [...filterSongLists(activeTag.value)]
  const order = listOrder.value
  return items.sort((left, right) => {
    const leftIndex = order[left.id] ?? Number.MAX_SAFE_INTEGER
    const rightIndex = order[right.id] ?? Number.MAX_SAFE_INTEGER
    return leftIndex - rightIndex
  })
})
const tagName = computed(() => songListTags.find((tag) => tag.id === activeTag.value)?.name ?? '歌单')
const wallItems = computed<PosterWallItem[]>(() =>
  visibleLists.value.map((item) => ({
    id: item.id,
    title: item.name,
    artist: `${item.author} · ${item.playCount}`,
    cover: item.cover,
    tint: item.tint,
    entryKind: 'playlist',
    label: '歌单',
  })),
)

const wallSections = computed<PosterWallSection[]>(() => {
  if (activeTag.value !== 'all') {
    return [{
      key: activeTag.value,
      heading: tagName.value,
      itemIds: visibleLists.value.map((item) => item.id),
    }]
  }
  const groupIds: Record<string, string[]> = {
    'night-focus': ['electronic', 'light', 'jazz', 'classical'],
    'chinese-roots': ['pop', 'folk', 'ancient', 'rap', 'acg'],
    'rock-west': ['rock', 'western'],
  }
  const names: Record<string, string> = {
    'night-focus': '夜行与专注',
    'chinese-roots': '华语与民谣',
    'rock-west': '摇滚与欧美',
  }
  return Object.entries(groupIds).map(([key, tags]) => ({
    key,
    heading: names[key],
    itemIds: visibleLists.value
      .filter((item) => tags.includes(item.tag))
      .map((item) => item.id),
  })).filter((section) => section.itemIds.length > 0)
})

function open(item: PosterWallItem) {
  void router.push(`/lxmusic/songList/${item.id}`)
}

function rotateSectionItems(items: SongListItem[], offset: number) {
  if (items.length < 2 || !offset) return items
  const shift = ((offset % items.length) + items.length) % items.length
  return [...items.slice(shift), ...items.slice(0, shift)]
}

async function refreshWall() {
  if (refreshing.value) return
  refreshing.value = true
  try {
    // The web port's song lists are curated locally. A refresh still performs the
    // reference's real work: each section gets a new order, so the wall commits new
    // item ids and replays its entrance rather than only showing a toast.
    const current = [...visibleLists.value]
    const next: Record<string, number> = {}
    if (activeTag.value !== 'all') {
      rotateSectionItems(current, Math.max(1, Math.ceil(current.length / 3)))
        .forEach((item, index) => { next[item.id] = index })
    } else {
      const groups: Record<string, string[]> = {
        'night-focus': ['electronic', 'light', 'jazz', 'classical'],
        'chinese-roots': ['pop', 'folk', 'ancient', 'rap', 'acg'],
        'rock-west': ['rock', 'western'],
      }
      // Keep the three groups in their fixed order while rotating within each.
      const sectionKeys = Object.keys(groups)
      let cursor = 0
      sectionKeys.forEach((key) => {
        const tags = groups[key]
        const sectionItems = rotateSectionItems(
          current.filter((item) => tags.includes(item.tag)),
          sectionKeys.indexOf(key) + 1,
        )
        sectionItems.forEach((item) => { next[item.id] = cursor++ })
      })
    }
    listOrder.value = next
    await nextTick()
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    toast('歌单已刷新')
  } finally {
    window.setTimeout(() => {
      refreshing.value = false
    }, 520)
  }
}

function readRouteReturn(): CollectionMorphPlan | null {
  const itemId = typeof route.query.returnTile === 'string' ? route.query.returnTile : ''
  const coverUrl = typeof route.query.returnCover === 'string' ? route.query.returnCover : ''
  if (!itemId || !coverUrl) return null
  return {
    itemId,
    coverUrl,
    title: typeof route.query.returnTitle === 'string' ? route.query.returnTitle : '',
    rect: {
      x: Number(route.query.returnX) || 0,
      y: Number(route.query.returnY) || 0,
      width: Number(route.query.returnWidth) || 0,
      height: Number(route.query.returnHeight) || 0,
    },
    radius: Number(route.query.returnRadius) || 0,
    shade: typeof route.query.returnShade === 'string' ? route.query.returnShade : '',
  }
}

function clearRouteReturn() {
  finishCollectionReturn()
  routeReturnPlan.value = null
  routeReturnTargetRect.value = undefined
  void router.replace({
    path: route.path,
    query: Object.fromEntries(
      Object.entries(route.query).filter(([key]) => !key.startsWith('return')),
    ),
  })
}

async function measureReturnTarget(itemId: string) {
  const startedAt = performance.now()
  const look = async () => {
    await nextTick()
    const target = document.querySelector<HTMLElement>(
      `[data-folia-lattice-tile="${CSS.escape(itemId)}"]`,
    )
    const rect = target?.getBoundingClientRect()
    if (rect && rect.width > 0 && rect.height > 0) {
      routeReturnTargetRect.value = {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      }
      return
    }
    if (performance.now() - startedAt < 1200) {
      window.setTimeout(() => void look(), 30)
    }
  }
  await look()
}

watch(
  routeReturnPlan,
  (plan) => {
    if (plan) void measureReturnTarget(plan.itemId)
  },
  { immediate: true },
)

function selectTag(id: string) {
  activeTag.value = id
  filterMenuOpen.value = false
}

function onFilterKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !filterMenuOpen.value) return
  event.preventDefault()
  event.stopPropagation()
  filterMenuOpen.value = false
  void nextTick(() => filterPillEl.value?.focus({ preventScroll: true }))
}

let removeOutsideListener: (() => void) | null = null

watch(filterMenuOpen, (open) => {
  removeOutsideListener?.()
  removeOutsideListener = null
  if (!open) return
  const closeFromOutside = (event: PointerEvent) => {
    const target = event.target
    if (target instanceof Node && filterMenuEl.value?.contains(target)) return
    filterMenuOpen.value = false
  }
  window.addEventListener('pointerdown', closeFromOutside, true)
  removeOutsideListener = () => window.removeEventListener('pointerdown', closeFromOutside, true)
})

onBeforeUnmount(() => removeOutsideListener?.())

</script>

<style>
.lx-songlist-wall-page {
  position: absolute;
  inset: 0;
}

@media (max-width: 640px) {
  /* Leave room for the tag pill beside the section finder. */
  .lx-songlist-wall-page .lx-sections-pill {
    max-width: calc(100% - 78px);
  }
}

.lx-tag-filter {
  position: relative;
}

.lx-tag-filter-pill {
  min-width: 74px;
}

.lx-tag-filter-pill span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lx-tag-filter-pill svg {
  width: 14px;
  height: 14px;
  opacity: 0.7;
  transition: rotate 200ms ease;
}

.lx-tag-filter-pill[aria-expanded='true'] svg {
  rotate: 180deg;
}

.lx-tag-filter-list {
  position: absolute;
  top: 46px;
  right: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(92px, 1fr));
  width: 244px;
  padding: 6px;
  color: var(--lx-wall-ink);
  background: color-mix(in srgb, var(--lx-poster-background) 92%, transparent);
  box-shadow: 0 18px 48px rgb(0 0 0 / 36%);
  backdrop-filter: blur(14px);
}

.lx-tag-filter-list button {
  height: 34px;
  padding: 0 10px;
  border: 0;
  background: none;
  color: inherit;
  font-size: 12px;
  text-align: left;
}

.lx-tag-filter-list button:hover,
.lx-tag-filter-list button:focus-visible {
  outline: none;
  background: color-mix(in srgb, var(--lx-wall-ink) 10%, transparent);
}

.lx-tag-filter-list button.is-current {
  color: var(--lx-primary, var(--lx-wall-ink));
  font-weight: 700;
}

@media (max-width: 640px) {
  .lx-tag-filter-list {
    top: 40px;
    width: min(244px, calc(100vw - 32px));
  }
}
</style>
