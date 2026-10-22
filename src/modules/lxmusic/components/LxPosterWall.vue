<template>
  <section
    class="lx-poster-wall"
    :class="{
      'has-poster-tint': appSetting['lattice.posterTintEnabled'],
      'uses-custom-poster-tint': appSetting['lattice.posterTintUseCustomColor'],
      'has-vignette': !appSetting['visualizer.disableVignette'],
      'is-daylight': isDaylight,
      'is-lights-out': lightsOut || !appSetting['lattice.lightsOn'],
      'is-leaving': leaving,
      'is-leaving-page': leavingForPage,
      'is-returning': returning,
    }"
    :data-folia-lattice-wall="returnItemId || collectionMorph.returnItemId ? '' : undefined"
    :style="wallStyle"
    aria-label="海报墙"
  >
    <div
      ref="fieldEl"
      class="lx-wall-field"
      tabindex="-1"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
      @click.capture="onWallClickCapture"
      @wheel="onWheel"
      @keydown.capture="onFieldKeyDownCapture"
      @keydown="onKeyDown"
    >
      <div ref="worldEl" class="lx-wall-world">
        <article
          v-for="heading in drawnHeadings"
          :key="heading.instanceId"
          :ref="(el) => setHeadingRef(heading.instanceId, el)"
          class="lx-heading"
          :class="{ 'is-untitled': !headingTitle(heading) }"
          :style="headingStyle(heading)"
          :aria-label="headingTitle(heading) || `${heading.section + 1} / ${exploreSections.length}`"
        >
          <span class="lx-poster-badge">
            {{ twoDigits(heading.section + 1) }} / {{ twoDigits(exploreSections.length) }}
          </span>
          <span v-if="heading.parts > 1" class="lx-poster-badge lx-heading-part">
            {{ heading.part + 1 }}/{{ heading.parts }}
          </span>
          <span class="lx-heading-copy">
            <WallTitle
              v-if="headingTitle(heading)"
              :title="headingTitle(heading)"
              :expanded="false"
              :target-width="heading.width"
              :max-lines="2"
            />
            <small>{{ headingSummary(heading.section) }}</small>
          </span>
        </article>
        <article
          v-for="instance in drawn"
          :key="instance.instanceId"
          :ref="(el) => setPosterRef(instance.instanceId, el)"
          :data-instance-id="instance.instanceId"
          :data-x="instance.x"
          :data-y="instance.y"
          :data-folia-lattice-tile="activeId === instance.instanceId && mode === 'collection' ? itemOf(instance).id : undefined"
          class="lx-poster"
          :role="activeId === instance.instanceId ? 'group' : 'button'"
          :class="{
            'is-expanded': activeId === instance.instanceId,
            'is-focused': focusedId === instance.instanceId,
            'is-hovered': hoveredId === instance.instanceId,
            'is-current': currentId === itemOf(instance).id,
            'is-collection': mode === 'collection',
            [`is-kind-${itemOf(instance).entryKind}`]: Boolean(itemOf(instance).entryKind),
            'is-generated': !coverOf(instance),
            'is-awaiting-flight': awaitingFlightId === itemOf(instance).id,
          }"
          :style="posterStyle(instance)"
          :tabindex="activeId === instance.instanceId ? -1 : 0"
          :aria-label="`${itemOf(instance).title} · ${itemOf(instance).artist}`"
          :aria-expanded="activeId === instance.instanceId || undefined"
          @focusin="onPosterFocusIn($event, instance)"
          @focusout="onPosterFocusOut($event, instance)"
          @pointerenter="onPosterPointerEnter($event, instance)"
          @pointerleave="onPosterPointerLeave"
          @pointerdown="onPosterPointerDown($event, instance)"
          @click.stop="onPosterClick($event, instance)"
          @keydown="onPosterKeydown($event, instance)"
        >
          <img
            v-if="activeId === instance.instanceId && mode === 'collection' && coverOf(instance)"
            class="lx-poster-cover"
            :src="coverOf(instance)"
            alt=""
            draggable="false"
            decoding="sync"
          >
          <span
            class="lx-poster-shade"
            :data-folia-morph-shade="activeId === instance.instanceId && mode === 'collection' ? '' : undefined"
            aria-hidden="true"
          />
          <span class="lx-poster-tint" aria-hidden="true" />
          <span class="lx-poster-lights-out" aria-hidden="true" />
          <span class="lx-poster-badge" :class="{ 'is-current': currentId === itemOf(instance).id }">
            <template v-if="currentId === itemOf(instance).id">正在播放 · </template>
            <template v-if="itemOf(instance).label">
              {{ itemOf(instance).label }}<template
                v-if="activeId === instance.instanceId && mode === 'collection' && sectionHeadingOf(instance)"
              > · {{ sectionHeadingOf(instance) }}</template>
            </template>
            <template v-else>{{ String(instance.queueIndex + 1).padStart(2, '0') }}</template>
          </span>
          <div v-if="!usesCanvasLyrics(instance)" class="lx-poster-copy">
            <WallTitle
              :title="itemOf(instance).title"
              :expanded="activeId === instance.instanceId"
              :target-width="rectFor(instance).width"
            />
            <small>{{ itemOf(instance).artist }}</small>
          </div>

          <div v-if="activeId === instance.instanceId" class="lx-poster-expanded">
            <LxPosterLyricCanvasPixi
              v-if="usesCanvasLyrics(instance)"
              :key="`${itemOf(instance).id}-${instance.instanceId}`"
              :song-key="itemOf(instance).id"
              :title="itemOf(instance).title"
              :artist="itemOf(instance).artist"
              :lines="player.state.lyricLines"
              :theme="posterTheme"
              :show-translation="showPosterTranslation"
              :subtitle-content-mode="subtitleContentMode"
              :reduced-motion="posterReducedMotion"
            />
            <div class="lx-poster-controls">
              <template v-if="mode === 'collection'">
                <div class="lattice-chrome">
                  <div class="lattice-chrome-transport">
                    <button
                      type="button"
                      class="lattice-open-collection"
                      @click.stop="requestOpenCollection(instance)"
                    >
                      <LxIcon name="arrowUpRight" />
                      <span>打开</span>
                    </button>
                  </div>
                </div>
              </template>
              <template v-else>
                <LxLatticeChrome
                  :current-id="currentId"
                  :item-id="itemOf(instance).id"
                  :duration="itemOf(instance).duration"
                  :revealed="isRevealed(instance)"
                  @primary="onPrimary(instance)"
                  @prev="player.playPrev()"
                  @loop="player.cyclePlayMode()"
                  @timeline="timelineOpen = true"
                  @next="player.playNext()"
                  @open-player="emit('open-player', itemOf(instance))"
                />
              </template>
            </div>
          </div>
        </article>
      </div>
    </div>

    <header
      class="lx-wall-chrome"
      :class="{ 'has-back': showBack, 'has-refresh': refreshable && showSectionFinder }"
    >
      <button v-if="showBack" type="button" class="lx-wall-back" aria-label="返回" @click="requestBack">
        <LxIcon name="back" />
      </button>
      <button
        v-if="refreshable && showSectionFinder"
        type="button"
        class="lx-wall-back lx-wall-refresh"
        :class="{ 'is-refreshing': refreshing }"
        :aria-disabled="refreshing"
        aria-label="刷新歌单"
        title="刷新歌单"
        @click="requestRefresh"
      >
        <LxIcon name="refresh" />
      </button>
      <div
        v-if="showSectionFinder"
        ref="sectionFinderEl"
        class="lx-sections"
        :class="{ 'has-back': showBack, 'has-refresh': refreshable && showSectionFinder }"
        @keydown="onSectionFinderKeydown"
      >
        <button
          ref="sectionPillEl"
          type="button"
          class="lx-sections-pill"
          aria-haspopup="menu"
          :aria-expanded="sectionMenuOpen"
          :aria-label="`分区: ${sectionPillName}`"
          title="分区"
          @mousedown.prevent
          @click.stop="sectionMenuOpen = !sectionMenuOpen"
        >
          <span class="lx-sections-name">{{ sectionPillName }}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <div v-if="sectionMenuOpen" class="lx-sections-list" role="menu" aria-label="分区">
          <button
            v-for="(section, index) in exploreSections"
            :key="`${index}:${section.key}`"
            type="button"
            role="menuitem"
            :class="{ 'is-current': index === activeSection }"
            @mousedown.prevent
            @click.stop="chooseSection(index)"
          >
            <span>{{ twoDigits(index + 1) }}</span>
            <span>{{ section.heading || headingSummary(index) }}</span>
          </button>
        </div>
      </div>
      <div v-if="heading && !showSectionFinder" class="lx-wall-heading">
        <strong>{{ heading }}</strong>
        <span v-if="subheading">{{ subheading }}</span>
      </div>
      <div class="lx-wall-tools">
        <slot name="tools" />
      </div>
    </header>

    <div v-if="!items.length" class="lx-wall-empty">
      <strong>海报墙还是空的</strong>
      <span>换一个歌单或稍后再试。</span>
    </div>

    <slot />

    <LxWallTools
      class="lx-wall-tools-dock"
      :is-daylight="isDaylight"
      :can-go-home="showBack"
      @home="requestBack"
    />

    <LxLyricsTimelineModal
      :open="timelineOpen"
      :accent-color="posterTheme.accentColor"
      :secondary-color="posterTheme.secondaryColor"
      :daylight="isDaylight"
      @close="timelineOpen = false"
    />
  </section>
</template>

<script setup lang="ts">
/**
 * Folia's draggable poster wall.
 *
 * The layout math is a direct port of `components/wall/layout.ts` and
 * `components/wall/blockTemplates.ts`: one 12x8 block template repeats across the
 * field, each card occupies a whole-cell span, and opening a card re-gears only its
 * own block into a 6x6 expansion plus eleven neighbouring slots.
 */

import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import LxIcon from './LxIcon.vue'
import LxLatticeChrome from './LxLatticeChrome.vue'
import LxLyricsTimelineModal from './LxLyricsTimelineModal.vue'
import LxPosterLyricCanvasPixi from './LxPosterLyricCanvasPixi.vue'
import LxWallTools from './LxWallTools.vue'
import WallTitle from './WallTitle.vue'
import player from '../core/player'
import { appSetting, getSubtitleContentMode } from '../core/settings'
import { DAYLIGHT_THEME, DEFAULT_THEME, resolveCoverTheme, type LxTheme } from '../core/theme'
import { isDaylight } from '../core/themeMode'
import {
  layoutExpandedBlock,
  layoutLattice,
  getLatticeGeometry,
  getPitch,
  locateNearestInstance,
  type Bounds,
  type QueueInstance,
  type WallMetrics,
} from '../core/lattice/layout'
import {
  createExploreLayout,
  type WallHeading,
  type WallSection,
} from '../core/lattice/exploreLayout'
import {
  findAdjacentInstance,
  findNearestInstance,
  pickAdjacentInstance,
  type WallDirection,
} from '../core/lattice/wallNavigation'
import {
  createWallWheelClassifier,
  stepWallWheel,
  wallWheelDelta,
  WALL_PAN_INERTIA,
  type WallWheelSource,
} from '../core/lattice/wallPanMotion'
import { formatWorldTransform } from '../core/lattice/wallView'
import {
  createWallSpring,
  WALL_SPRING_FRAME_MS,
  type WallSpring,
} from '../core/lattice/wallSpring'
import {
  collectionMorph,
  finishCollectionReturn,
  planCollectionFromWall,
} from '../core/lattice/collectionMorphStore'

export interface PosterWallItem {
  id: string
  title: string
  artist: string
  cover?: string
  tint?: string
  duration?: number
  /** Explore entries name what they are where a queue tile shows its number. */
  entryKind?: 'album' | 'playlist' | 'mix' | 'artist'
  label?: string
}

export interface PosterWallSection {
  key: string
  heading: string
  itemIds: string[]
}

const props = withDefaults(
  defineProps<{
    items: PosterWallItem[]
    mode: 'collection' | 'song'
    currentId?: string
    heading?: string
    subheading?: string
    showBack?: boolean
    refreshable?: boolean
    refreshing?: boolean
    /** The explore wall's sections; when given, the wall is laid out by lot. */
    sections?: PosterWallSection[]
    reducedMotion?: boolean
    lightsOut?: boolean
    returnItemId?: string
  }>(),
  {
    currentId: '',
    heading: '',
    subheading: '',
    showBack: true,
    refreshable: false,
    refreshing: false,
    sections: () => [],
    reducedMotion: false,
    lightsOut: false,
    returnItemId: '',
  },
)

const emit = defineEmits<{
  activate: [item: PosterWallItem]
  play: [item: PosterWallItem]
  'open-lyrics': [item: PosterWallItem]
  'open-player': [item: PosterWallItem]
  'open-lyrics-timeline': []
  back: []
  refresh: []
}>()

const CELL_SIZE = 128
const GAP = 8
const OVERSCAN = 500
const MAX_RESERVED_VIEWPORTS = 3
const ENTRANCE_STAGGER = 0.03
const ENTRANCE_MAX_DELAY = 0.34
const ENTRANCE_WINDOW = 1100
const ENTRANCE_SPRING = { stiffness: 360, damping: 24, mass: 1 }
/** Source: `WALL_REFLOW_SPRING` in `wallReflowMotion.ts`. */
const REFLOW_SPRING = { stiffness: 300, damping: 34, mass: 1 }
const METRICS: WallMetrics = { cellSize: CELL_SIZE, gap: GAP }
const CAMERA_HOME = { x: 34, y: 80 }
const PITCH = getPitch(METRICS)

const fieldEl = ref<HTMLDivElement | null>(null)
const worldEl = ref<HTMLDivElement | null>(null)
const viewport = ref({ width: 1280, height: 720 })
const camera = { x: CAMERA_HOME.x, y: CAMERA_HOME.y, scale: 0.76 }
const measured = ref(false)
const bounds = ref<Bounds>(worldBounds())
const activeId = ref('')
const focusedId = ref('')
const hoveredId = ref('')
const touchOpenId = ref('')
const keyboardFocusId = ref('')
const pointerType = ref<'mouse' | 'touch' | 'pen'>('mouse')
const timelineOpen = ref(false)
const sectionMenuOpen = ref(false)
const entranceActive = ref(true)
const leaving = ref(false)
const leavingForPage = ref(false)
const returning = ref(false)
const awaitingFlightId = ref('')
const didDrag = ref(false)
const activeStored = ref<QueueInstance | null>(null)
const currentSection = ref<number | null>(null)
const lyricsSettledId = ref('')
const posterTheme = ref<LxTheme>({ ...DEFAULT_THEME })
const sectionFinderEl = ref<HTMLElement | null>(null)
const sectionPillEl = ref<HTMLButtonElement | null>(null)
const posterRefs = new Map<string, HTMLElement>()
const headingRefs = new Map<string, HTMLElement>()
// A card is animated per mounted element, not per instance id. The reference remounts a
// culled card at `opacity: 0, scale: .94` outside the opening wave, so panning back onto
// it must fade it up again even though that id has already appeared.
const entranceSeen = new WeakSet<HTMLElement>()
let resizeObserver: ResizeObserver | null = null
let entranceTimer = 0
let boundsFrame = 0
let lyricsSettleTimer = 0
let themeRequest = 0
let currentAnimation: { stop: () => void } | null = null
let sectionFlight: number | null = null
let lastFocusedSongId = ''
let exitTimer = 0
let returnTimer = 0
let returnFlightTimer = 0
let returnFlightListener: (() => void) | null = null
let cleanupPointerPanListeners: (() => void) | null = null
const exitAnimations = new Set<Animation>()

const geometry = computed(() => getLatticeGeometry(props.items.length, METRICS))
const itemIndexById = computed(() => {
  const map = new Map<string, number>()
  props.items.forEach((item, index) => map.set(item.id, index))
  return map
})
const fallbackKind = computed<'song' | 'playlist'>(() =>
  props.mode === 'collection' ? 'playlist' : 'song',
)
const exploreSections = computed<WallSection[]>(() => {
  const kindOf = (index: number) =>
    props.items[index]?.entryKind ?? fallbackKind.value
  if (props.sections.length) {
    return props.sections
      .map((section) => ({
        key: section.key,
        heading: section.heading,
        entries: section.itemIds
          .map((id) => itemIndexById.value.get(id))
          .filter((index): index is number => index !== undefined)
          .map((index) => ({ index, kind: kindOf(index) })),
      }))
      .filter((section) => section.entries.length > 0)
  }
  return [{
    key: 'all',
    heading: props.heading,
    entries: props.items.map((_, index) => ({ index, kind: kindOf(index) })),
  }]
})
const explore = computed(() =>
  props.mode === 'collection' && props.items.length
    ? createExploreLayout(exploreSections.value, METRICS)
    : null,
)
const showSectionFinder = computed(() =>
  Boolean(explore.value && exploreSections.value.length > 0),
)
const activeSection = computed(() => {
  const total = exploreSections.value.length
  if (!total) return 0
  const current = currentSection.value
  return current !== null && current >= 0 && current < total ? current : 0
})
const sectionPillName = computed(() => {
  const section = exploreSections.value[activeSection.value]
  if (!section) return ''
  const position = `${activeSection.value + 1}/${exploreSections.value.length}`
  return section.heading ? `${position} · ${section.heading}` : position
})
const near = computed(() => {
  if (!measured.value) return { posters: [], headings: [] as WallHeading[] }
  if (explore.value) return explore.value.near(bounds.value, OVERSCAN)
  return {
    posters: layoutLattice(geometry.value, props.items.length, bounds.value, OVERSCAN, METRICS),
    headings: [] as WallHeading[],
  }
})
const baseDrawn = computed(() => near.value.posters)
const drawnHeadings = computed(() => near.value.headings)

const activeInstance = computed(() => {
  const active = activeStored.value
  if (!active || activeId.value !== active.instanceId) return null
  return baseDrawn.value.find((item) => item.instanceId === active.instanceId) ?? active
})

const currentItem = computed(() =>
  props.items.find((item) => item.id === props.currentId) ?? null,
)
const wallStyle = computed(() => ({
  '--lx-primary': posterTheme.value.accentColor,
  '--lx-wall-bg': posterTheme.value.backgroundColor,
  '--lx-wall-accent': posterTheme.value.accentColor,
  '--lx-wall-secondary': posterTheme.value.secondaryColor,
  '--lx-wall-ink': posterTheme.value.primaryColor,
  '--lattice-poster-tint-color': appSetting['lattice.posterTintColor'],
  '--lattice-poster-tint-intensity': String(appSetting['lattice.posterTintIntensity']),
}))
const hasPosterLyrics = computed(() =>
  player.state.lyricLines.some((line) => /[\p{L}\p{N}]/u.test(line.fullText)),
)
const subtitleContentMode = computed(() => getSubtitleContentMode())
const showPosterTranslation = computed(() => subtitleContentMode.value !== 'none')
const posterReducedMotion = computed(() =>
  props.reducedMotion || !appSetting['common.animation'],
)

const drawn = computed(() => {
  const items = baseDrawn.value
  const active = activeInstance.value
  return active && !items.some((item) => item.instanceId === active.instanceId)
    ? [...items, active]
    : items
})

const grownRects = computed(() => {
  const active = activeInstance.value
  if (!active) return new Map<string, { x: number; y: number; width: number; height: number }>()
  if (explore.value) return explore.value.grown(active)
  return layoutExpandedBlock(geometry.value, props.items.length, active, METRICS)
})

function itemOf(instance: QueueInstance): PosterWallItem {
  return props.items[instance.queueIndex] ?? props.items[0]
}

function usesCanvasLyrics(instance: QueueInstance) {
  return Boolean(
    props.mode === 'song'
    && activeId.value === instance.instanceId
    && props.currentId === itemOf(instance).id
    && hasPosterLyrics.value
    && lyricsSettledId.value === instance.instanceId,
  )
}

function isRevealed(instance: QueueInstance) {
  const id = instance.instanceId
  return Boolean(
    activeId.value === id
    && (hoveredId.value === id || touchOpenId.value === id || keyboardFocusId.value === id),
  )
}

function coverOf(instance: QueueInstance) {
  return itemOf(instance).cover ?? ''
}

function getScale(width: number) {
  return width < 640 ? 0.52 : width < 1100 ? 0.64 : 0.76
}

function worldBounds(): Bounds {
  const local = { ...camera }
  return {
    left: -local.x / local.scale,
    top: -local.y / local.scale,
    right: (viewport.value.width - local.x) / local.scale,
    bottom: (viewport.value.height - local.y) / local.scale,
  }
}

function applyCamera(next: { x: number; y: number; scale: number }, updateBounds = false) {
  camera.x = next.x
  camera.y = next.y
  camera.scale = next.scale
  if (worldEl.value) {
    worldEl.value.style.transform = formatWorldTransform(next.x, next.y, next.scale)
  }
  watchSection()
  if (!updateBounds || boundsFrame) return
  boundsFrame = requestAnimationFrame(() => {
    boundsFrame = 0
    bounds.value = worldBounds()
    void nextTick(() => playEntrance())
  })
}

/**
 * Names the section the window stands in. On a street between lots the name
 * stays, as in the source.
 */
function watchSection() {
  const layout = explore.value
  const lot = layout?.lotSize
  if (!layout || !lot || layout.sections.length === 0) return
  if (sectionFlight !== null) {
    if (currentAnimation) return
    sectionFlight = null
  }
  const found = layout.sectionAt({
    x: (Math.min(viewport.value.width / 2, CAMERA_HOME.x + lot.width * camera.scale / 2) - camera.x) / camera.scale,
    y: (Math.min(viewport.value.height / 2, CAMERA_HOME.y + lot.height * camera.scale / 2) - camera.y) / camera.scale,
  })
  if (found === null || found === currentSection.value) return
  currentSection.value = found
}

/** Takes the camera to the nearest copy of a section's first lot, its heading at the corner. */
function goToSection(target: number) {
  const layout = explore.value
  if (!layout) return
  const start = layout.sectionStart(target, {
    x: (CAMERA_HOME.x - camera.x) / camera.scale,
    y: (CAMERA_HOME.y - camera.y) / camera.scale,
  })
  if (!start) return
  sectionFlight = target
  currentSection.value = target
  // `panTo` centres a rectangle: the window's own, as it stands with the heading at the corner.
  animateCameraTo({
    x: start.x - CAMERA_HOME.x / camera.scale,
    y: start.y - CAMERA_HOME.y / camera.scale,
    width: viewport.value.width / camera.scale,
    height: viewport.value.height / camera.scale,
  })
}

function chooseSection(target: number) {
  sectionMenuOpen.value = false
  focusedId.value = ''
  keyboardFocusId.value = ''
  touchOpenId.value = ''
  goToSection(target)
  void nextTick(() => fieldEl.value?.focus({ preventScroll: true }))
}

function onSectionFinderKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !sectionMenuOpen.value) return
  event.preventDefault()
  event.stopPropagation()
  sectionMenuOpen.value = false
  void nextTick(() => sectionPillEl.value?.focus({ preventScroll: true }))
}

function reserveBounds(next: { x: number; y: number; scale: number }) {
  const target = boundsAt(next)
  const covered =
    target.left >= bounds.value.left &&
    target.right <= bounds.value.right &&
    target.top >= bounds.value.top &&
    target.bottom <= bounds.value.bottom
  if (covered) return
  bounds.value = {
    left: Math.min(bounds.value.left, target.left),
    top: Math.min(bounds.value.top, target.top),
    right: Math.max(bounds.value.right, target.right),
    bottom: Math.max(bounds.value.bottom, target.bottom),
  }
  const merged = bounds.value
  const mergedArea = (merged.right - merged.left) * (merged.bottom - merged.top)
  const destinationArea = (target.right - target.left) * (target.bottom - target.top)
  if (mergedArea > destinationArea * MAX_RESERVED_VIEWPORTS) bounds.value = target
}

function boundsAt(next: { x: number; y: number; scale: number }): Bounds {
  return {
    left: -next.x / next.scale,
    top: -next.y / next.scale,
    right: (viewport.value.width - next.x) / next.scale,
    bottom: (viewport.value.height - next.y) / next.scale,
  }
}

function rectFor(instance: QueueInstance) {
  return grownRects.value.get(instance.instanceId) ?? instance
}

function posterStyle(instance: QueueInstance) {
  const item = itemOf(instance)
  const rect = rectFor(instance)
  const tint = item.tint ?? '#44506a'
  const cover = coverOf(instance)
  return {
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    transform: `translate3d(${rect.x}px, ${rect.y}px, 0)`,
    zIndex: activeId.value === instance.instanceId ? 20 : undefined,
    backgroundImage: cover ? `url("${cover}")` : fallbackBackground(item.id),
    '--lx-poster-tint': tint,
    '--lx-pop-x': String((rect.width + GAP * 2) / Math.max(rect.width, 1)),
    '--lx-pop-y': String((rect.height + GAP * 2) / Math.max(rect.height, 1)),
  }
}

/** Source: `app/lattice/LatticePoster.tsx#fallbackBackground`. */
function fallbackBackground(id: string) {
  const hue = [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 360
  return `linear-gradient(145deg, hsl(${hue} 68% 58%), hsl(${(hue + 52) % 360} 62% 18%))`
}

function setPosterRef(id: string, value: Element | { $el?: Element } | null) {
  if (value instanceof HTMLElement) posterRefs.set(id, value)
  else posterRefs.delete(id)
}

function setHeadingRef(id: string, value: Element | { $el?: Element } | null) {
  if (value instanceof HTMLElement) headingRefs.set(id, value)
  else headingRefs.delete(id)
}

function twoDigits(value: number) {
  return String(value).padStart(2, '0')
}

function headingTitle(heading: WallHeading) {
  return exploreSections.value[heading.section]?.heading ?? ''
}

/** The section heading a tile stands under, as the grown badge names it. */
function sectionHeadingOf(instance: QueueInstance) {
  const section = exploreSections.value.find((entry) =>
    entry.entries.some((entry) => entry.index === instance.queueIndex),
  )
  return section?.heading ?? ''
}

function headingSummary(sectionIndex: number) {
  const section = exploreSections.value[sectionIndex]
  if (!section) return ''
  const kinds: Array<'album' | 'playlist' | 'mix' | 'artist' | 'song'> = [
    'album', 'playlist', 'mix', 'artist', 'song',
  ]
  const labels: Record<typeof kinds[number], string> = {
    album: '专辑',
    playlist: '歌单',
    mix: '混音',
    artist: '歌手',
    song: '歌曲',
  }
  return [
    String(section.entries.length),
    ...kinds
      .filter((kind) => section.entries.some((entry) => entry.kind === kind))
      .map((kind) => labels[kind]),
  ].join(' · ')
}

function headingStyle(heading: WallHeading) {
  return {
    width: `${heading.width}px`,
    height: `${heading.height}px`,
    transform: `translate3d(${heading.x}px, ${heading.y}px, 0)`,
  }
}

function springFrameTimes(curves: WallSpring[]) {
  const duration = Math.max(
    WALL_SPRING_FRAME_MS,
    ...curves.map((curve) => curve.durationMs),
  )
  const count = Math.max(2, Math.ceil(duration / WALL_SPRING_FRAME_MS) + 1)
  const last = count - 1
  return {
    duration,
    frames: Array.from({ length: count }, (_, index) => ({
      offset: index / last,
      timeMs: index === last
        ? duration
        : Math.min(index * WALL_SPRING_FRAME_MS, duration),
    })),
  }
}

let previousRects = new Map<string, { x: number; y: number; width: number; height: number }>()
const reflowAnimations = new Map<string, Animation>()

async function animateReflow() {
  const next = new Map<string, { x: number; y: number; width: number; height: number }>()
  drawn.value.forEach((instance) => next.set(instance.instanceId, { ...rectFor(instance) }))
  if (props.reducedMotion || !previousRects.size) {
    previousRects = next
    if (activeId.value) lyricsSettledId.value = activeId.value
    return
  }
  await nextTick()
  const animations: Promise<unknown>[] = []
  next.forEach((target, id) => {
    const before = previousRects.get(id)
    const el = posterRefs.get(id)
    if (!before || !el || (before.x === target.x && before.y === target.y && before.width === target.width && before.height === target.height)) return
    if (typeof el.animate !== 'function') return
    reflowAnimations.get(id)?.cancel()
    // Framer keeps one spring per motion value. The rect moves through x / y / width /
    // height independently, so each one settles on its own rest threshold.
    const x = createWallSpring(before.x, target.x, REFLOW_SPRING)
    const y = createWallSpring(before.y, target.y, REFLOW_SPRING)
    const width = createWallSpring(before.width, target.width, REFLOW_SPRING)
    const height = createWallSpring(before.height, target.height, REFLOW_SPRING)
    const timing = springFrameTimes([x, y, width, height])
    const frames = timing.frames.map(({ offset, timeMs }) => ({
      offset,
      transform: `translate3d(${x.at(timeMs)}px, ${y.at(timeMs)}px, 0)`,
      width: `${width.at(timeMs)}px`,
      height: `${height.at(timeMs)}px`,
    }))
    const animation = el.animate(frames, {
      duration: timing.duration,
      easing: 'linear',
      fill: 'both',
    })
    reflowAnimations.set(id, animation)
    animations.push(animation.finished)
    animation.finished
      .then(() => {
        if (reflowAnimations.get(id) !== animation) return
        reflowAnimations.delete(id)
        animation.cancel()
      })
      .catch(() => undefined)
  })
  previousRects = next
  if (activeId.value) {
    const active = activeId.value
    void Promise.allSettled(animations).then(() => {
      if (activeId.value === active) markLyricsSettled(active)
    })
  }
}

function markLyricsSettled(id: string) {
  window.clearTimeout(lyricsSettleTimer)
  lyricsSettleTimer = 0
  if (activeId.value === id) lyricsSettledId.value = id
}

function scheduleLyricsSettle(id: string) {
  window.clearTimeout(lyricsSettleTimer)
  lyricsSettledId.value = ''
  if (!id) return
  if (props.reducedMotion) {
    lyricsSettledId.value = id
    return
  }
  lyricsSettleTimer = window.setTimeout(() => markLyricsSettled(id), 1000)
}

function playEntrance() {
  if (!measured.value || props.reducedMotion || returning.value) return
  const landing = (
    el: HTMLElement | undefined,
    rect: { x: number; y: number },
  ) => {
    if (!el || entranceSeen.has(el)) return
    entranceSeen.add(el)
    const steps =
      Math.max(0, rect.x - bounds.value.left) +
      Math.max(0, rect.y - bounds.value.top)
    const delay = Math.min(ENTRANCE_MAX_DELAY, (steps / PITCH) * ENTRANCE_STAGGER)
    if (typeof el.animate !== 'function') return
    const wave = entranceActive.value
    if (!wave) {
      // Outside the opening wave a card still fades up in place from `scale: .94`:
      // the scale runs on the reflow spring while opacity is a 260ms ease-out.
      const scale = createWallSpring(0.94, 1, REFLOW_SPRING)
      const timing = springFrameTimes([scale])
      el.animate(
        timing.frames.map(({ offset, timeMs }) => ({
          offset,
          transform: `translate3d(${rect.x}px, ${rect.y}px, 0) scale(${scale.at(timeMs)})`,
        })),
        { duration: timing.duration, easing: 'linear', fill: 'backwards' },
      )
      el.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 260, easing: 'ease-out', fill: 'backwards' },
      )
      return
    }
    const y = createWallSpring(
      rect.y - 90,
      rect.y,
      ENTRANCE_SPRING,
    )
    const scale = createWallSpring(0.88, 1, ENTRANCE_SPRING)
    const timing = springFrameTimes([y, scale])
    const frames = timing.frames.map(({ offset, timeMs }) => {
      return {
        offset,
        transform: `translate3d(${rect.x}px, ${y.at(timeMs)}px, 0) scale(${scale.at(timeMs)})`,
      }
    })
    el.animate(frames, {
      duration: timing.duration,
      delay: delay * 1000,
      easing: 'linear',
      fill: 'backwards',
    })
    el.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      {
        duration: 240,
        delay: delay * 1000,
        easing: 'ease-out',
        fill: 'backwards',
      },
    )
  }
  drawnHeadings.value.forEach((heading) => {
    landing(headingRefs.get(heading.instanceId), heading)
  })
  drawn.value.forEach((instance) => {
    landing(posterRefs.get(instance.instanceId), rectFor(instance))
  })
}

function animateCameraTo(rect: { x: number; y: number; width: number; height: number }, instant = false) {
  currentAnimation?.stop()
  const from = { ...camera }
  const target = {
    x: viewport.value.width / 2 - (rect.x + rect.width / 2) * from.scale,
    y: viewport.value.height / 2 - (rect.y + rect.height / 2) * from.scale,
    scale: from.scale,
  }
  reserveBounds(target)
  if (instant || props.reducedMotion) {
    applyCamera(target, true)
    return
  }
  let frame = 0
  const start = performance.now()
  const run = (now: number) => {
    const progress = Math.min(1, (now - start) / 420)
    const eased = cubicBezier(progress, 0.22, 1, 0.36, 1)
    applyCamera({
      x: from.x + (target.x - from.x) * eased,
      y: from.y + (target.y - from.y) * eased,
      scale: from.scale,
    })
    if (progress < 1) frame = requestAnimationFrame(run)
    else {
      applyCamera(target, true)
      currentAnimation = null
    }
  }
  frame = requestAnimationFrame(run)
  currentAnimation = {
    stop: () => {
      cancelAnimationFrame(frame)
      currentAnimation = null
    },
  }
}

/** Pans the camera itself, for a section flight that puts a heading at the corner. */
function panCameraTo(target: { x: number; y: number; scale: number }) {
  currentAnimation?.stop()
  const from = { ...camera }
  reserveBounds(target)
  if (props.reducedMotion) {
    sectionFlight = null
    applyCamera(target, true)
    return
  }
  let frame = 0
  const start = performance.now()
  const run = (now: number) => {
    const progress = Math.min(1, (now - start) / 420)
    const eased = cubicBezier(progress, 0.22, 1, 0.36, 1)
    applyCamera({
      x: from.x + (target.x - from.x) * eased,
      y: from.y + (target.y - from.y) * eased,
      scale: from.scale,
    })
    if (progress < 1) frame = requestAnimationFrame(run)
    else {
      sectionFlight = null
      applyCamera(target, true)
      currentAnimation = null
    }
  }
  frame = requestAnimationFrame(run)
  currentAnimation = {
    stop: () => {
      cancelAnimationFrame(frame)
      currentAnimation = null
    },
  }
}

function cubicBezier(t: number, x1: number, y1: number, x2: number, y2: number) {
  const sample = (a: number, b: number, c: number, u: number) =>
    3 * (1 - u) ** 2 * u * a + 3 * (1 - u) * u ** 2 * b + u ** 3 * c
  let low = 0
  let high = 1
  for (let index = 0; index < 18; index += 1) {
    const mid = (low + high) / 2
    if (sample(x1, x2, 1, mid) < t) low = mid
    else high = mid
  }
  return sample(y1, y2, 1, (low + high) / 2)
}

function expand(instance: QueueInstance) {
  stopCoast()
  focusedId.value = instance.instanceId
  if (activeId.value === instance.instanceId) {
    void animateReflow()
    return
  }
  activeStored.value = instance
  activeId.value = instance.instanceId
  void animateReflow()
  nextTick(() => {
    const rect = grownRects.value.get(instance.instanceId)
    if (rect) animateCameraTo(rect)
  })
}

function activate(instance: QueueInstance) {
  const item = itemOf(instance)
  focusedId.value = instance.instanceId
  if (props.mode === 'collection') {
    requestOpenCollection(instance)
    return
  }
  activeStored.value = instance
  activeId.value = instance.instanceId
  if (props.currentId === item.id && player.state.isPlay) {
    void player.togglePlay()
  } else {
    emit('play', item)
  }
}

function focusCurrentSong(instant = false) {
  const item = currentItem.value
  if (!item || !measured.value) return
  const queueIndex = props.items.findIndex((entry) => entry.id === item.id)
  if (queueIndex < 0) return
  const point = viewportCenter()
  const instance = explore.value
    ? explore.value.nearest(queueIndex, point)
    : locateNearestInstance(geometry.value, props.items.length, queueIndex, point, METRICS)
  if (!instance) return
  const alreadyActive = activeId.value === instance.instanceId
  activeStored.value = instance
  activeId.value = instance.instanceId
  focusedId.value = instance.instanceId
  if (alreadyActive) return
  void animateReflow()
  void nextTick(() => {
    const rect = grownRects.value.get(instance.instanceId)
    if (rect) animateCameraTo(rect, instant)
  })
}

watch(
  [
    measured,
    () => props.mode,
    () => props.items.map((item) => item.id).join('|'),
    currentItem,
  ],
  ([isMeasured, mode, , item]) => {
    if (!item) {
      lastFocusedSongId = ''
      return
    }
    if (!isMeasured || mode !== 'song' || lastFocusedSongId === item.id) return
    if (!props.items.some((entry) => entry.id === item.id)) return
    // The wall opens centred on what is playing; later song changes fly there.
    const isEntry = lastFocusedSongId === ''
    lastFocusedSongId = item.id
    void nextTick(() => focusCurrentSong(isEntry))
  },
  { immediate: true },
)

function onPosterClick(event: MouseEvent, instance: QueueInstance) {
  if (event.target instanceof Element && event.target.closest('button, input')) return
  if (didDrag.value) return
  const expanded = activeId.value === instance.instanceId
  if (!expanded) {
    expand(instance)
    return
  }
  focusedId.value = instance.instanceId
  if (pointerType.value === 'touch') touchOpenId.value = touchOpenId.value === instance.instanceId ? '' : instance.instanceId
}

function onPrimary(instance: QueueInstance) {
  const item = itemOf(instance)
  if (props.currentId === item.id) {
    void player.togglePlay()
    return
  }
  emit('play', item)
}

function onPosterPointerDown(event: PointerEvent, instance: QueueInstance) {
  pointerType.value = event.pointerType as typeof pointerType.value
  keyboardFocusId.value = ''
  if (!event.target || !(event.target as Element).closest('button, input')) {
    focusedId.value = instance.instanceId
  }
}

function onPosterPointerEnter(event: PointerEvent, instance: QueueInstance) {
  if (event.pointerType === 'touch') return
  hoveredId.value = instance.instanceId
}

function onPosterPointerLeave() {
  hoveredId.value = ''
}

function onPosterFocusIn(event: FocusEvent, instance: QueueInstance) {
  focusedId.value = instance.instanceId
  if (
    event.target instanceof Element
    && event.target.matches(':focus-visible')
  ) {
    keyboardFocusId.value = instance.instanceId
  }
}

function onPosterFocusOut(event: FocusEvent, instance: QueueInstance) {
  const next = event.relatedTarget
  if (next instanceof Node && (event.currentTarget as Node).contains(next)) return
  if (keyboardFocusId.value === instance.instanceId) keyboardFocusId.value = ''
}

function onPosterKeydown(event: KeyboardEvent, instance: QueueInstance) {
  if (event.target !== event.currentTarget) return
  if (event.key === 'Enter') {
    event.preventDefault()
    if (event.repeat) return
    if (activeId.value !== instance.instanceId) expand(instance)
    else activate(instance)
    return
  }
  if (event.key === ' ') {
    event.preventDefault()
    if (activeId.value !== instance.instanceId) expand(instance)
    else {
      touchOpenId.value = touchOpenId.value === instance.instanceId ? '' : instance.instanceId
    }
  }
}

function viewportCenter() {
  return {
    x: (viewport.value.width / 2 - camera.x) / camera.scale,
    y: (viewport.value.height / 2 - camera.y) / camera.scale,
  }
}

function focusNeighbour(direction: WallDirection) {
  const focused = drawn.value.find((item) => item.instanceId === focusedId.value)
    ?? activeInstance.value
  const seed = focused ?? findNearestInstance(drawn.value, viewportCenter())
  if (!seed) return
  // The first arrow only adopts the card nearest the viewport centre; later
  // presses travel through the lattice.
  const chosen = !focused
    ? seed
    : explore.value
      ? pickAdjacentInstance(seed, direction, explore.value.stepCandidates(seed), METRICS, grownRects.value)
      : findAdjacentInstance(seed, direction, props.items.length, METRICS, grownRects.value)
  if (!chosen) return
  focusedId.value = chosen.instanceId
  const rect = chosen
  void nextTick(() => {
    requestAnimationFrame(() => {
      posterRefs.get(chosen.instanceId)?.focus({ preventScroll: true })
    })
  })
  animateCameraTo(rect)
}

function collapse() {
  activeId.value = ''
  activeStored.value = null
  touchOpenId.value = ''
  keyboardFocusId.value = ''
  void animateReflow()
}

/**
 * The wall's exit wave (`LEAVING` in LatticePoster): the cards lift back toward
 * the corner they entered from, in reverse order. A collection's page leaves at
 * once, as in the reference, where the whole wall fades under a flying cover.
 */
function requestBack() {
  if (leaving.value) return
  if (props.mode !== 'song' || posterReducedMotion.value) {
    emit('back')
    return
  }
  leaving.value = true
  window.clearTimeout(exitTimer)
  exitAnimations.forEach((animation) => animation.cancel())
  exitAnimations.clear()
  const entries: Array<{
    el: HTMLElement | undefined
    rect: { x: number; y: number; width: number; height: number }
  }> = [
    ...drawnHeadings.value.map((heading) => ({
      el: headingRefs.get(heading.instanceId),
      rect: heading,
    })),
    ...drawn.value.map((instance) => ({
      el: posterRefs.get(instance.instanceId),
      rect: rectFor(instance),
    })),
  ]
  let finish = 0
  entries.forEach(({ el, rect }) => {
    if (!el || typeof el.animate !== 'function') return
    const steps =
      Math.max(0, rect.x - bounds.value.left) +
      Math.max(0, rect.y - bounds.value.top)
    const entranceDelay = Math.min(
      ENTRANCE_MAX_DELAY,
      (steps / PITCH) * ENTRANCE_STAGGER,
    )
    const delay = ENTRANCE_MAX_DELAY - entranceDelay
    const computed = getComputedStyle(el)
    const width = `${el.offsetWidth}px`
    const height = `${el.offsetHeight}px`
    const animation = el.animate(
      [
        {
          transform: computed.transform,
          width,
          height,
          opacity: computed.opacity,
        },
        {
          transform: `translate3d(${rect.x}px, ${rect.y - 90}px, 0) scale(0.88)`,
          width,
          height,
          opacity: 0,
        },
      ],
      {
        duration: 280,
        delay: delay * 1000,
        easing: 'cubic-bezier(0.4, 0, 1, 1)',
        fill: 'forwards',
      },
    )
    exitAnimations.add(animation)
    animation.finished
      .then(() => exitAnimations.delete(animation))
      .catch(() => exitAnimations.delete(animation))
    finish = Math.max(finish, delay * 1000 + 280)
  })
  exitTimer = window.setTimeout(() => {
    exitTimer = 0
    emit('back')
  }, finish)
}

function requestRefresh() {
  if (props.refreshing) return
  emit('refresh')
}

/**
 * The explore wall's grown tile opening its collection's page. The reference marks the wall as
 * left for a page before navigating (Lattice.tsx): no card wave, and the wall layer itself fades
 * out in 180ms ease-out under the page (wallLayer.ts, WALL_FADE_FOR_PAGE_SECONDS).
 */
function requestOpenCollection(instance: QueueInstance) {
  if (leaving.value) return
  const item = itemOf(instance)
  if (posterReducedMotion.value) {
    emit('activate', item)
    return
  }
  planCollectionFromWall({
    itemId: item.id,
    coverUrl: coverOf(instance),
    title: item.title,
    rect: posterRefs.get(instance.instanceId)?.getBoundingClientRect().toJSON() ?? {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    },
    radius: Number.parseFloat(
      getComputedStyle(posterRefs.get(instance.instanceId) ?? document.body).borderTopLeftRadius,
    ) || 0,
    shade: getComputedStyle(
      posterRefs.get(instance.instanceId)?.querySelector('[data-folia-morph-shade]') ?? document.body,
    ).background,
  })
  leavingForPage.value = true
  leaving.value = true
  window.clearTimeout(exitTimer)
  exitAnimations.forEach((animation) => animation.cancel())
  exitAnimations.clear()
  exitTimer = window.setTimeout(() => {
    exitTimer = 0
    emit('activate', item)
  }, 180)
}

// ------------------------------------------------------------------ camera --

const wheelClassifier = createWallWheelClassifier()
let wheelSource: WallWheelSource = 'wheel'
let wheelPending = { x: 0, y: 0 }
let wheelFrame = 0
let wheelLast = 0
let wheelHandle: { stop: () => void } | null = null
let pointer: {
  id: number
  startX: number
  startY: number
  cameraX: number
  cameraY: number
  lastX: number
  lastY: number
  lastTime: number
  vx: number
  vy: number
  dragging: boolean
} | null = null
let coastFrame = 0

function stopWheel() {
  if (wheelFrame) cancelAnimationFrame(wheelFrame)
  wheelFrame = 0
  wheelPending = { x: 0, y: 0 }
  wheelLast = 0
  if (wheelHandle && currentAnimation === wheelHandle) currentAnimation = null
  wheelHandle = null
}

function stopCoast() {
  if (coastFrame) cancelAnimationFrame(coastFrame)
  coastFrame = 0
}

function updateCameraNearCull(x: number, y: number) {
  const next = { x, y, scale: camera.scale }
  const visible = {
    left: -x / camera.scale,
    right: (viewport.value.width - x) / camera.scale,
    top: -y / camera.scale,
    bottom: (viewport.value.height - y) / camera.scale,
  }
  const margin = OVERSCAN - 180
  const nearEdge =
    visible.left < bounds.value.left - margin ||
    visible.right > bounds.value.right + margin ||
    visible.top < bounds.value.top - margin ||
    visible.bottom > bounds.value.bottom + margin
  applyCamera(next, nearEdge)
}

function startWheelTick() {
  if (wheelFrame) return
  wheelLast = 0
  const tick = (now: number) => {
    const dt = wheelLast ? now - wheelLast : 1000 / 60
    wheelLast = now
    const { step, pending } = stepWallWheel(wheelPending, dt)
    wheelPending = pending
    updateCameraNearCull(camera.x + step.x, camera.y + step.y)
    if (wheelPending.x === 0 && wheelPending.y === 0) {
      wheelFrame = 0
      wheelHandle = null
      return
    }
    wheelFrame = requestAnimationFrame(tick)
  }
  wheelFrame = requestAnimationFrame(tick)
}

function onWheel(event: WheelEvent) {
  if (event.ctrlKey || event.metaKey) return
  event.preventDefault()
  if (pointer) return
  const source = wheelClassifier(event)
  wheelSource = source
  const { dx, dy } = wallWheelDelta(event, viewport.value.height)
  if (source === 'trackpad' || props.reducedMotion) {
    const carry = wheelHandle ? { ...wheelPending } : { x: 0, y: 0 }
    currentAnimation?.stop()
    stopWheel()
    updateCameraNearCull(camera.x + carry.x - dx, camera.y + carry.y - dy)
    return
  }
  if (!wheelHandle) {
    currentAnimation?.stop()
    stopCoast()
    const handle = { stop: stopWheel }
    wheelHandle = handle
    currentAnimation = handle
  }
  wheelPending = { x: wheelPending.x - dx, y: wheelPending.y - dy }
  startWheelTick()
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0 || !event.isPrimary || pointer) return
  const target = event.target as Element | null
  if (target?.closest('button, input, select, textarea, a, [contenteditable="true"], [role="slider"]')) return
  currentAnimation?.stop()
  stopWheel()
  stopCoast()
  didDrag.value = false
  pointer = {
    id: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    cameraX: camera.x,
    cameraY: camera.y,
    lastX: event.clientX,
    lastY: event.clientY,
    lastTime: event.timeStamp,
    vx: 0,
    vy: 0,
    dragging: false,
  }
}

function onPointerMove(event: PointerEvent) {
  const current = pointer
  if (!current || current.id !== event.pointerId) return
  const dx = event.clientX - current.startX
  const dy = event.clientY - current.startY
  if (!current.dragging && Math.hypot(dx, dy) > 7) {
    current.dragging = true
    didDrag.value = true
    fieldEl.value?.setPointerCapture(event.pointerId)
  }
  const elapsed = event.timeStamp - current.lastTime
  if (elapsed > 0) {
    current.vx = ((event.clientX - current.lastX) / elapsed) * 1000
    current.vy = ((event.clientY - current.lastY) / elapsed) * 1000
  }
  current.lastX = event.clientX
  current.lastY = event.clientY
  current.lastTime = event.timeStamp
  if (current.dragging) updateCameraNearCull(current.cameraX + dx, current.cameraY + dy)
}

function onPointerUp(event: PointerEvent) {
  const current = pointer
  if (!current || current.id !== event.pointerId) return
  pointer = null
  if (fieldEl.value?.hasPointerCapture(event.pointerId)) {
    fieldEl.value.releasePointerCapture(event.pointerId)
  }
  if (
    !current.dragging ||
    props.reducedMotion ||
    event.timeStamp - current.lastTime > WALL_PAN_INERTIA.staleReleaseMs
  ) {
    return
  }
  const speed = Math.hypot(current.vx, current.vy)
  if (speed < WALL_PAN_INERTIA.minSpeed) return
  const power = Math.min(speed, WALL_PAN_INERTIA.maxSpeed) ** WALL_PAN_INERTIA.power
  let vx = (current.vx / speed) * power * 38
  let vy = (current.vy / speed) * power * 38
  let last = performance.now()
  const coast = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    const decay = Math.exp(-dt / (WALL_PAN_INERTIA.timeConstant / 1000))
    vx *= decay
    vy *= decay
    updateCameraNearCull(camera.x + vx * dt, camera.y + vy * dt)
    if (Math.hypot(vx, vy) > 20) coastFrame = requestAnimationFrame(coast)
    else coastFrame = 0
  }
  coastFrame = requestAnimationFrame(coast)
}

function onPointerCancel(event: PointerEvent) {
  if (pointer?.id === event.pointerId) pointer = null
}

function cancelPointerPan() {
  pointer = null
  currentAnimation?.stop()
  stopWheel()
  stopCoast()
}

/**
 * Source: `useWallPointerPan.ts`'s captured key handler. Any real key interrupts
 * a pan before the field's own arrow / Escape handling runs.
 */
function onFieldKeyDownCapture(event: KeyboardEvent) {
  if (event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt' || event.key === 'Meta') return
  cancelPointerPan()
}

/** Source: `useWallPointerPan.ts#onClickCapture`; a drag that ends on a card opens nothing. */
function onWallClickCapture(event: MouseEvent) {
  if (!didDrag.value || event.detail === 0) return
  didDrag.value = false
  event.preventDefault()
  event.stopPropagation()
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (sectionMenuOpen.value) {
      event.preventDefault()
      sectionMenuOpen.value = false
      return
    }
    event.preventDefault()
    if (activeId.value || focusedId.value) {
      collapse()
      focusedId.value = ''
      fieldEl.value?.focus({ preventScroll: true })
    } else {
      requestBack()
    }
    return
  }
  if (
    (event.key === 'PageDown' || event.key === 'PageUp')
    && explore.value
    && explore.value.sections.length
  ) {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    if (event.target instanceof Element && event.target.closest('.lx-poster-controls')) return
    event.preventDefault()
    event.stopPropagation()
    if (event.repeat) return
    focusedId.value = ''
    keyboardFocusId.value = ''
    touchOpenId.value = ''
    const total = explore.value.sections.length
    const from = activeSection.value
    goToSection((from + (event.key === 'PageDown' ? 1 : total - 1)) % total)
    void nextTick(() => fieldEl.value?.focus({ preventScroll: true }))
    return
  }
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
  event.preventDefault()
  const direction: WallDirection = event.key === 'ArrowLeft'
    ? 'left'
    : event.key === 'ArrowRight'
      ? 'right'
      : event.key === 'ArrowUp'
        ? 'up'
        : 'down'
  focusNeighbour(direction)
}

function onResize(width: number, height: number) {
  viewport.value = { width, height }
  const scale = getScale(width)
  camera.scale = scale
  applyCamera({ ...camera, scale }, true)
}

function onReducedMotionChange() {
  entranceActive.value = !props.reducedMotion
}

watch(
  () => [
    props.items.map((item) => item.id).join('|'),
    props.sections
      .map((section) => `${section.key}:${section.heading}:${section.itemIds.join(',')}`)
      .join('|'),
  ] as const,
  ([itemsKey, sectionsKey], previous) => {
    const itemsChanged = previous?.[0] !== itemsKey
    const sectionsChanged = previous?.[1] !== sectionsKey
    if (!itemsChanged && !sectionsChanged) return
    if (sectionsChanged && !props.sections.length) return
    timelineOpen.value = false
    sectionMenuOpen.value = false
    activeId.value = ''
    activeStored.value = null
    touchOpenId.value = ''
    keyboardFocusId.value = ''
    if (sectionsChanged) currentSection.value = null
    previousRects.clear()
    void nextTick(() => {
      bounds.value = worldBounds()
      playEntrance()
    })
  },
)

watch(sectionMenuOpen, (open) => {
  if (!open) return
  const closeFromOutside = (event: PointerEvent) => {
    const target = event.target
    if (target instanceof Node && sectionFinderEl.value?.contains(target)) return
    sectionMenuOpen.value = false
  }
  window.addEventListener('pointerdown', closeFromOutside, true)
  return () => window.removeEventListener('pointerdown', closeFromOutside, true)
})

watch(
  () => props.reducedMotion,
  onReducedMotionChange,
)

watch(
  activeId,
  (id) => scheduleLyricsSettle(id),
)

watch(
  touchOpenId,
  (id) => {
    if (!id) return
    const dismiss = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (!posterRefs.get(id)?.contains(target)) touchOpenId.value = ''
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  },
)

async function generatePosterTheme(forceCover = false) {
  const request = ++themeRequest
  const paletteBase = isDaylight.value ? DAYLIGHT_THEME : DEFAULT_THEME
  const base: LxTheme = {
    ...paletteBase,
    animationIntensity: appSetting['visualizer.animationIntensity'],
    fontWeight: appSetting['lyric.fontWeight'],
  }
  const current = player.currentMusic.value
  const music = currentItem.value
    ?? (current.id ? { cover: current.pic } : null)
  const useCover = forceCover || appSetting['visualizer.useCoverColor']
  const next = useCover && music?.cover
    ? await resolveCoverTheme(music.cover, base)
    : base
  // Reference keeps the app surface on --bg-color and only takes the cover
  // theme's ink/accents, so a bright sleeve cannot turn the wall dark.
  if (request === themeRequest) {
    posterTheme.value = { ...next, backgroundColor: paletteBase.backgroundColor }
  }
  return request === themeRequest
}

watch(
  () => [
    currentItem.value?.cover ?? '',
    player.currentMusic.value.pic,
    appSetting['visualizer.useCoverColor'],
    appSetting['visualizer.animationIntensity'],
    appSetting['lyric.fontWeight'],
    appSetting['theme.id'],
    appSetting['theme.light'],
    isDaylight.value,
  ],
  () => void generatePosterTheme(),
  { immediate: true },
)

function onGenerateTheme(event: Event) {
  const done = (event as CustomEvent<{ done?: () => void }>).detail?.done
  void generatePosterTheme(true).finally(() => done?.())
}

onMounted(() => {
  const field = fieldEl.value
  if (!field) return
  window.addEventListener('lxmusic:generate-theme', onGenerateTheme)
  const endOutside = (event: PointerEvent) => {
    if (pointer?.id === event.pointerId) cancelPointerPan()
  }
  const cancelOnBlur = () => cancelPointerPan()
  cleanupPointerPanListeners = () => {
    window.removeEventListener('pointerup', endOutside)
    window.removeEventListener('pointercancel', endOutside)
    window.removeEventListener('blur', cancelOnBlur)
  }
  window.addEventListener('pointerup', endOutside)
  window.addEventListener('pointercancel', endOutside)
  window.addEventListener('blur', cancelOnBlur)
  const returnItemId = props.returnItemId || collectionMorph.returnItemId
  if (props.mode === 'collection' && returnItemId) {
    const index = props.items.findIndex((item) => item.id === returnItemId)
    if (index >= 0) {
      const fliesBack = !posterReducedMotion.value
      if (fliesBack) {
        awaitingFlightId.value = returnItemId
        returning.value = true
      }
      const item = props.items[index]
      void nextTick(() => {
        const point = viewportCenter()
        const instance = explore.value
          ? explore.value.nearest(index, point)
          : locateNearestInstance(geometry.value, props.items.length, index, point, METRICS)
        if (!instance) return
        activeStored.value = instance
        activeId.value = instance.instanceId
        focusedId.value = instance.instanceId
        const tileCover = collectionMorph.returnItemId === returnItemId
          ? collectionMorph.exitCoverUrl
          : ''
        if (tileCover) {
          window.dispatchEvent(new CustomEvent('lxmusic:collection-return-target', {
            detail: { itemId: returnItemId, coverUrl: tileCover },
          }))
        }
        previousRects = new Map(
          drawn.value.map((entry) => [entry.instanceId, { ...rectFor(entry) }]),
        )
        void nextTick(() => {
          const rect = grownRects.value.get(instance.instanceId)
          if (rect) animateCameraTo(rect, true)
          if (!fliesBack) return
          window.clearTimeout(returnFlightTimer)
          const flightOver = () => {
            window.clearTimeout(returnFlightTimer)
            returnFlightTimer = 0
            if (returnFlightListener === flightOver) {
              window.removeEventListener('lxmusic:collection-flight-landed', flightOver)
              returnFlightListener = null
            }
            awaitingFlightId.value = ''
            finishCollectionReturn()
          }
          if (returnFlightListener) {
            window.removeEventListener('lxmusic:collection-flight-landed', returnFlightListener)
          }
          returnFlightListener = flightOver
          window.addEventListener('lxmusic:collection-flight-landed', flightOver, { once: true })
          returnFlightTimer = window.setTimeout(flightOver, 1200)
        })
      })
    }
  }
  resizeObserver = new ResizeObserver(([entry]) => {
    const rect = entry.contentRect
    onResize(rect.width, rect.height)
    if (!measured.value) {
      measured.value = true
      if (returning.value) {
        // The return flight owns the first frame: no entrance wave under its landing tile.
        entranceActive.value = false
        entranceSeen.add(field)
      }
      entranceTimer = window.setTimeout(() => {
        entranceActive.value = false
      }, ENTRANCE_WINDOW)
      void nextTick(() => {
        if (!returning.value) playEntrance()
        previousRects = new Map(
          drawn.value.map((instance) => [instance.instanceId, { ...rectFor(instance) }]),
        )
      })
    }
  })
  resizeObserver.observe(field)
  applyCamera({ ...camera }, true)
  field.focus({ preventScroll: true })
  returnTimer = window.setTimeout(() => {
    returnTimer = 0
    returning.value = false
  }, 200)
})

onBeforeUnmount(() => {
  window.removeEventListener('lxmusic:generate-theme', onGenerateTheme)
  cleanupPointerPanListeners?.()
  cleanupPointerPanListeners = null
  resizeObserver?.disconnect()
  window.clearTimeout(entranceTimer)
  window.clearTimeout(lyricsSettleTimer)
  window.clearTimeout(exitTimer)
  window.clearTimeout(returnTimer)
  window.clearTimeout(returnFlightTimer)
  if (returnFlightListener) {
    window.removeEventListener('lxmusic:collection-flight-landed', returnFlightListener)
    returnFlightListener = null
  }
  cancelAnimationFrame(boundsFrame)
  cancelAnimationFrame(coastFrame)
  cancelAnimationFrame(wheelFrame)
  currentAnimation?.stop()
  reflowAnimations.forEach((animation) => animation.cancel())
  exitAnimations.forEach((animation) => animation.cancel())
  exitAnimations.clear()
})
</script>
