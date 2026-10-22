<template>
  <Teleport to="body">
    <div
      v-if="flight"
      ref="rootEl"
      class="lx-collection-flight"
      :class="`is-${flight.direction}`"
      aria-hidden="true"
      :style="{ transformOrigin: `${centre.x}px ${centre.y}px` }"
    >
      <div
        ref="coverEl"
        class="lx-collection-flight-cover"
        :style="coverStyle"
      >
        <img
          v-if="flight.from.url"
          ref="leavingImageEl"
          :src="flight.from.url"
          alt=""
          draggable="false"
          decoding="sync"
          :style="leavingPictureStyle"
        >
        <div
          v-if="flight.to.shade || flight.from.shade"
          ref="shadeEl"
          class="lx-collection-flight-shade"
          :style="{ background: flight.to.shade || flight.from.shade || undefined }"
        />
      </div>
      <div
        ref="edgeEl"
        class="lx-collection-flight-edge"
        :style="edgeStyle"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import {
  FLIGHT_MS,
  HANDOVER_MS,
  flightBoxKeyframes,
  flightEdge,
  flightFade,
  flightPictureKeyframes,
  type CollectionMorphRect,
} from '../core/lattice/collectionFlight'
import {
  collectionMorph,
  finishCollectionReturn,
  type CollectionMorphEnd,
} from '../core/lattice/collectionMorphStore'

interface FlightEnd {
  rect: CollectionMorphRect
  radius: number
  shade: string | null
}

interface Flight {
  id: number
  direction: 'in' | 'out'
  itemId: string
  cover: string
  from: FlightEnd & { url: string }
  to: FlightEnd
  targetEl: HTMLElement | null
  sourceEl: HTMLElement | null
}

const props = withDefaults(
  defineProps<{
    direction: 'in' | 'out'
    itemId: string
    cover: string
    targetSelector?: string
    sourceSelector?: string
    shade?: string
    fromRect?: CollectionMorphRect | null
    fromRadius?: number
    fromShade?: string
    toRect?: CollectionMorphRect | null
    toRadius?: number
    sourceEnd?: CollectionMorphEnd | null
    destinationEnd?: CollectionMorphEnd | null
    reducedMotion?: boolean
  }>(),
  {
    targetSelector: '[data-folia-collection-flight-target]',
    sourceSelector: '[data-folia-lattice-tile]',
    shade: '',
    fromRect: null,
    fromRadius: 0,
    fromShade: '',
    toRect: null,
    toRadius: 0,
    sourceEnd: null,
    destinationEnd: null,
    reducedMotion: false,
  },
)

const emit = defineEmits<{
  landed: []
}>()

const rootEl = ref<HTMLElement | null>(null)
const coverEl = ref<HTMLElement | null>(null)
const edgeEl = ref<HTMLElement | null>(null)
const leavingImageEl = ref<HTMLImageElement | null>(null)
const shadeEl = ref<HTMLElement | null>(null)
const flight = ref<Flight | null>(null)
let nextFlightId = 0
let startedFor = ''
let animations: Animation[] = []
let handoverTimer = 0
let disposed = false

const centre = computed(() => {
  const rect = flight.value?.from.rect
  return rect
    ? { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
    : { x: 0, y: 0 }
})

const coverStyle = computed(() => {
  const current = flight.value
  if (!current) return {}
  return {
    left: `${current.to.rect.x}px`,
    top: `${current.to.rect.y}px`,
    width: `${current.to.rect.width}px`,
    height: `${current.to.rect.height}px`,
    borderRadius: `${current.to.radius}px`,
  }
})

const edgeStyle = computed(() => {
  const current = flight.value
  if (!current) return {}
  return {
    left: `${current.to.rect.x}px`,
    top: `${current.to.rect.y}px`,
    width: `${current.to.rect.width}px`,
    height: `${current.to.rect.height}px`,
    borderRadius: `${current.to.radius}px`,
    boxShadow: `inset 0 0 0 1px ${getComputedStyle(document.documentElement).getPropertyValue('--lx-wall-ink') || '#fff'}, 0 14px 36px rgba(0, 0, 0, 0.28)`,
  }
})

const leavingPictureStyle = computed(() => {
  const current = flight.value
  if (!current) return {}
  const picture = flightPictureKeyframes(
    current.from.rect,
    current.to.rect,
    current.from.rect.width / current.from.rect.height,
  )
  return {
    left: `${picture.picture.x}px`,
    top: `${picture.picture.y}px`,
    width: `${picture.picture.width}px`,
    height: `${picture.picture.height}px`,
    transform: String(picture.image[0]?.transform ?? 'scale(1)'),
  }
})

function rectOf(element: Element | null) {
  if (!element) return null
  const rect = element.getBoundingClientRect()
  if (rect.width < 1 || rect.height < 1) return null
  return { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
}

function radiusOf(element: Element | null) {
  if (!element) return 0
  const value = Number.parseFloat(getComputedStyle(element).borderTopLeftRadius)
  return Number.isFinite(value) ? value : 0
}

function shadeOf(element: Element | null) {
  const shade = element?.querySelector<HTMLElement>('[data-folia-morph-shade]')
  return shade ? getComputedStyle(shade).background : (props.shade || null)
}

function veil(element: HTMLElement | null) {
  if (!element || typeof element.animate !== 'function') return () => undefined
  const animation = element.animate(
    [{ opacity: 0 }, { opacity: 0 }],
    { duration: 1, fill: 'both' },
  )
  return () => animation.cancel()
}

function clearAnimations() {
  window.clearTimeout(handoverTimer)
  handoverTimer = 0
  animations.forEach((animation) => animation.cancel())
  animations = []
}

function hasRect(rect: CollectionMorphRect | null | undefined): rect is CollectionMorphRect {
  return Boolean(rect && rect.width > 0 && rect.height > 0)
}

function waitForTarget(selector: string, timeout = 1200) {
  const startedAt = performance.now()
  return new Promise<HTMLElement | null>((resolve) => {
    const look = () => {
      if (disposed) {
        resolve(null)
        return
      }
      const element = document.querySelector<HTMLElement>(selector)
      if (element) {
        resolve(element)
        return
      }
      if (performance.now() - startedAt >= timeout) {
        resolve(null)
        return
      }
      window.setTimeout(look, 30)
    }
    look()
  })
}

async function start() {
  if (props.reducedMotion || !props.cover) {
    finish()
    return
  }
  await nextTick()
  await new Promise((resolve) => requestAnimationFrame(resolve))
  if (disposed) return
  const target = props.targetSelector
    ? await waitForTarget(props.targetSelector)
    : null
  if (disposed) return
  const targetRect = rectOf(target)
  const explicitTo = hasRect(props.toRect)
    ? { rect: props.toRect, radius: props.toRadius }
    : null
  const destination = props.destinationEnd
  const toRect = explicitTo?.rect
    ?? (destination && hasRect(destination.rect) ? destination.rect : null)
    ?? targetRect
  const source = props.sourceSelector && !hasRect(props.fromRect)
    ? document.querySelector<HTMLElement>(
      `${props.sourceSelector}="${CSS.escape(props.itemId)}"`,
    )
    : null
  const sourceRect = rectOf(source)
  const sourceEnd = props.sourceEnd
    ?? (props.direction === 'out' ? collectionMorph.exitFrom : null)
  const fromRect = hasRect(props.fromRect)
    ? props.fromRect
    : sourceEnd && hasRect(sourceEnd.rect)
      ? sourceEnd.rect
      : sourceRect
  if (!fromRect) return
  const from = {
    rect: fromRect,
    radius: hasRect(props.fromRect)
      ? props.fromRadius
      : sourceEnd && hasRect(sourceEnd.rect)
        ? sourceEnd.radius
        : radiusOf(source),
    url: props.cover,
    shade: props.fromShade
      || sourceEnd?.shade
      || (source ? shadeOf(source) : null),
  }
  const to = {
    rect: toRect ?? fromRect,
    radius: toRect
      ? explicitTo?.radius
        ?? (destination && hasRect(destination.rect) ? destination.radius : radiusOf(target))
      : from.radius,
    shade: props.shade
      || destination?.shade
      || (target ? shadeOf(target) : null),
  }
  flight.value = {
    id: ++nextFlightId,
    direction: props.direction,
    itemId: props.itemId,
    cover: props.cover,
    from,
    to,
    targetEl: target,
    sourceEl: source,
  }
  await nextTick()
  if (!disposed) playFlight()
}

function playFlight() {
  const current = flight.value
  const root = rootEl.value
  const cover = coverEl.value
  const edge = edgeEl.value
  if (!current || !root || !cover || !edge) {
    finish()
    return
  }
  const from = current.from
  const to = current.to
  const box = flightBoxKeyframes(
    { rect: from.rect, radius: from.radius },
    { rect: to.rect, radius: to.radius },
  )
  const picture = flightPictureKeyframes(
    from.rect,
    to.rect,
    from.rect.width / from.rect.height,
  )
  const timing: KeyframeAnimationOptions = {
    duration: FLIGHT_MS,
    easing: 'linear',
    fill: 'both',
  }
  animations.push(cover.animate(box.box, timing))
  animations.push(cover.animate(box.corners, timing))
  animations.push(edge.animate(box.box, timing))
  animations.push(edge.animate(box.corners, timing))
  animations.push(edge.animate(flightEdge[current.direction === 'in' ? 'comes' : 'stays'], timing))
  if (leavingImageEl.value) {
    animations.push(leavingImageEl.value.animate(picture.image, timing))
  }
  if (shadeEl.value) {
    const frames = from.shade && to.shade
      ? [{ opacity: 1 }, { opacity: 1 }]
      : from.shade
        ? flightFade(1, 0, 0, 0.4)
        : to.shade
          ? flightFade(0, 1, 0.6, 1)
          : null
    if (frames) animations.push(shadeEl.value.animate(frames, timing))
  }
  const unveil = [current.sourceEl, current.targetEl]
    .filter((element): element is HTMLElement => element !== null)
    .map(veil)
  let landed = false
  const land = () => {
    if (landed || disposed) return
    landed = true
    unveil.forEach((show) => show())
    animations.push(root.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: HANDOVER_MS, easing: 'ease-out', fill: 'both' },
    ))
    handoverTimer = window.setTimeout(landedAndFinish, HANDOVER_MS)
  }
  animations[0]?.finished.then(land, () => undefined)
}

function landedAndFinish() {
  if (props.direction === 'out') {
    window.dispatchEvent(new CustomEvent('lxmusic:collection-flight-landed'))
  }
  finish()
}

function finish() {
  clearAnimations()
  flight.value = null
  if (props.direction === 'out') finishCollectionReturn()
  emit('landed')
}

watch(
  () => [
    props.direction,
    props.itemId,
    props.cover,
    props.reducedMotion,
    props.fromRect?.x ?? '',
    props.fromRect?.y ?? '',
    props.fromRect?.width ?? '',
    props.fromRect?.height ?? '',
    props.toRect?.x ?? '',
    props.toRect?.y ?? '',
    props.toRect?.width ?? '',
    props.toRect?.height ?? '',
    props.sourceEnd?.rect.x ?? '',
    props.sourceEnd?.rect.y ?? '',
    props.sourceEnd?.rect.width ?? '',
    props.sourceEnd?.rect.height ?? '',
    props.destinationEnd?.rect.x ?? '',
    props.destinationEnd?.rect.y ?? '',
    props.destinationEnd?.rect.width ?? '',
    props.destinationEnd?.rect.height ?? '',
  ].join('|'),
  () => {
    const key = [
      props.direction,
      props.itemId,
      props.cover,
      props.fromRect?.x ?? '',
      props.fromRect?.y ?? '',
      props.fromRect?.width ?? '',
      props.fromRect?.height ?? '',
      props.sourceEnd?.rect.x ?? '',
      props.sourceEnd?.rect.y ?? '',
      props.sourceEnd?.rect.width ?? '',
      props.sourceEnd?.rect.height ?? '',
    ].join(':')
    if (key === startedFor) return
    startedFor = key
    void start()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  disposed = true
  clearAnimations()
})
</script>

<style>
.lx-collection-flight {
  position: fixed;
  inset: 0;
  z-index: 80;
  pointer-events: none;
}

.lx-collection-flight-cover,
.lx-collection-flight-edge {
  position: absolute;
  transform-origin: 0 0;
  will-change: transform, border-radius;
}

.lx-collection-flight-cover {
  overflow: hidden;
}

.lx-collection-flight-cover img {
  position: absolute;
  max-width: none;
  object-fit: cover;
  transform-origin: 50% 50%;
}

.lx-collection-flight-shade {
  position: absolute;
  inset: 0;
}

.lx-collection-flight-edge {
  pointer-events: none;
}
</style>
