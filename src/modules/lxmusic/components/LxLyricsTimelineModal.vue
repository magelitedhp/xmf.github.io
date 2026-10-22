<template>
  <Teleport to="body">
    <Transition name="lx-timeline">
      <div
        v-if="open"
        ref="windowEl"
        class="lx-timeline-window"
        :style="{
          '--lx-text-accent': accentColor,
          '--lx-text-secondary': secondaryColor,
        }"
        :class="{ 'is-daylight': daylight }"
        data-folia-keyboard-window="true"
        @click="emit('close')"
      >
        <section class="lx-timeline-panel" @click.stop>
          <header class="lx-timeline-head">
            <h2>歌词时间轴</h2>
            <button type="button" class="lx-timeline-close" aria-label="关闭" @click="emit('close')">
              <LxIcon name="close" />
            </button>
          </header>

          <div
            ref="scrollEl"
            class="lx-timeline-scroll"
            @scroll="onScroll"
            @touchmove="onScroll"
          >
            <div v-if="lines.length" class="lx-timeline-list">
              <div class="lx-timeline-rail" aria-hidden="true" />
              <div
                v-for="(line, index) in lines"
                :key="`${line.startTime}-${index}`"
                :ref="(el) => setLineRef(index, el)"
                class="lx-timeline-row"
                :class="{ 'is-active': index === activeIndex }"
              >
                <div class="lx-timeline-side is-left">
                  <button
                    v-if="index % 2 === 0"
                    type="button"
                    class="lx-timeline-card"
                    @click="seekTo(line.startTime)"
                  >
                    <span class="lx-timeline-text is-right">{{ line.fullText }}</span>
                    <span v-if="line.translation" class="lx-timeline-translation is-right">
                      {{ line.translation }}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  class="lx-timeline-dot"
                  :aria-label="`跳转到 ${line.fullText}`"
                  @click="seekTo(line.startTime)"
                />

                <div class="lx-timeline-side is-right">
                  <button
                    v-if="index % 2 !== 0"
                    type="button"
                    class="lx-timeline-card"
                    @click="seekTo(line.startTime)"
                  >
                    <span class="lx-timeline-text">{{ line.fullText }}</span>
                    <span v-if="line.translation" class="lx-timeline-translation">
                      {{ line.translation }}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  class="lx-timeline-card is-mobile"
                  @click="seekTo(line.startTime)"
                >
                  <span class="lx-timeline-text">{{ line.fullText }}</span>
                  <span v-if="line.translation" class="lx-timeline-translation">
                    {{ line.translation }}
                  </span>
                </button>
              </div>
            </div>
            <div v-else class="lx-timeline-empty">当前歌曲没有可用的歌词</div>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * Lyrics timeline modal.
 *
 * Source: `components/modal/LyricsTimelineModal.tsx`. Lines alternate left and
 * right of a centre rail, the current line grows and lights up, and the list
 * follows playback unless the listener has scrolled in the last three seconds.
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import LxIcon from './LxIcon.vue'
import player from '../core/player'

const props = withDefaults(
  defineProps<{
    open: boolean
    accentColor?: string
    secondaryColor?: string
    daylight?: boolean
  }>(),
  {
    accentColor: 'var(--lx-text-accent, #f7f4ee)',
    secondaryColor: 'var(--lx-text-secondary, #a1a1aa)',
    daylight: false,
  },
)

const emit = defineEmits<{ close: [] }>()

const windowEl = ref<HTMLDivElement | null>(null)
const scrollEl = ref<HTMLDivElement | null>(null)
const lineEls = new Map<number, HTMLElement>()
const activeIndex = ref(-1)
const userScrolling = ref(false)
const autoScrolling = ref(false)
let userScrollTimer = 0
let autoScrollTimer = 0
let initialTimer = 0

const lines = computed(() => player.state.lyricLines)
const activeLine = computed(() => lines.value[activeIndex.value] ?? null)

function setLineRef(index: number, value: Element | { $el?: Element } | null) {
  if (value instanceof HTMLElement) lineEls.set(index, value)
  else lineEls.delete(index)
}

function syncActiveLine() {
  if (!lines.value.length) {
    activeIndex.value = -1
    return
  }
  // Source: LyricsTimelineModal.tsx tracks `startTime <= time <= endTime` with
  // findIndex, and keeps the last highlight through instrumental gaps.
  const time = player.state.progress
  const index = lines.value.findIndex(
    (line) => time >= line.startTime && time <= line.endTime,
  )
  if (index !== -1 && index !== activeIndex.value) activeIndex.value = index
}

function scrollToActive(behavior: ScrollBehavior = 'smooth') {
  const container = scrollEl.value
  const item = lineEls.get(activeIndex.value)
  if (!container || !item || activeIndex.value < 0) return
  const top = item.offsetTop - container.clientHeight / 2 + item.clientHeight / 2
  container.scrollTo({ top, behavior })
  autoScrolling.value = true
  window.clearTimeout(autoScrollTimer)
  autoScrollTimer = window.setTimeout(() => {
    autoScrolling.value = false
  }, 1000)
}

function onScroll() {
  if (autoScrolling.value) return
  userScrolling.value = true
  window.clearTimeout(userScrollTimer)
  userScrollTimer = window.setTimeout(() => {
    userScrolling.value = false
  }, 3000)
}

function seekTo(time: number) {
  player.seek(time)
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || event.repeat) return
  const target = event.target
  if (target instanceof Element) {
    const owner = target.closest('[data-folia-keyboard-window="true"]') as HTMLElement | null
    if (owner && owner !== windowEl.value) return
  }
  event.preventDefault()
  event.stopPropagation()
  emit('close')
}

watch(
  () => props.open,
  (open) => {
    window.clearTimeout(initialTimer)
    if (!open) {
      window.removeEventListener('keydown', onKeyDown)
      userScrolling.value = false
      return
    }
    window.addEventListener('keydown', onKeyDown)
    // A paused player may have stopped emitting progress before the modal
    // opens, so resolve the current line once from the last known position.
    syncActiveLine()
    initialTimer = window.setTimeout(() => {
      syncActiveLine()
      const container = scrollEl.value
      const item = lineEls.get(activeIndex.value)
      if (!container || !item || activeIndex.value < 0) return
      container.scrollTo({
        top: item.offsetTop - container.clientHeight / 2 + item.clientHeight / 2,
        behavior: 'auto',
      })
    }, 100)
  },
  { immediate: true },
)

watch(
  () => player.state.progress,
  () => {
    syncActiveLine()
  },
)

watch(
  () => player.state.lyricLines,
  () => {
    // Source resets on a new track; syncing immediately keeps a paused open
    // modal correct instead of waiting for the next progress event.
    activeIndex.value = -1
    syncActiveLine()
  },
)

watch(
  () => [activeIndex.value, userScrolling.value] as const,
  ([index, paused]) => {
    if (paused || index < 0) return
    void nextTick(() => scrollToActive('smooth'))
  },
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.clearTimeout(userScrollTimer)
  window.clearTimeout(autoScrollTimer)
  window.clearTimeout(initialTimer)
})
</script>

<style>
.lx-timeline-window {
  position: fixed;
  inset: 0;
  z-index: 240;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  font-family: "Inter", "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #fff;
}

.lx-timeline-window.is-daylight {
  color: #27272a;
}

.lx-timeline-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 90vw;
  max-width: 896px;
  height: 80vh;
  padding: 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.4);
  box-shadow: 0 32px 90px rgba(0, 0, 0, 0.54);
  backdrop-filter: blur(12px);
}

.lx-timeline-window.is-daylight .lx-timeline-panel {
  border-color: rgb(0 0 0 / 5%);
  background: rgb(255 255 255 / 70%);
  box-shadow: 0 32px 90px rgb(42 35 27 / 18%);
}

.lx-timeline-head {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.lx-timeline-head h2 {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.lx-timeline-window.is-daylight .lx-timeline-head h2 {
  color: rgb(39 39 42 / 90%);
}

.lx-timeline-close {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 8px;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.7);
  transition: background-color 160ms ease;
}

.lx-timeline-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

.lx-timeline-window.is-daylight .lx-timeline-close {
  color: rgb(39 39 42 / 70%);
}

.lx-timeline-window.is-daylight .lx-timeline-close:hover {
  background: rgb(0 0 0 / 5%);
}

.lx-timeline-close svg {
  width: 24px;
  height: 24px;
}

.lx-timeline-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0 32px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.lx-timeline-list {
  position: relative;
  padding: 32px 0;
}

.lx-timeline-rail {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  background: var(--lx-text-secondary, #a1a1aa);
  opacity: 0.3;
  transform: translateX(-50%);
}

.lx-timeline-row {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 80px;
  z-index: 1;
}

.lx-timeline-row.is-active {
  z-index: 20;
}

.lx-timeline-side {
  display: flex;
  width: 50%;
}

.lx-timeline-side.is-left {
  justify-content: flex-end;
  padding-right: 16px;
}

.lx-timeline-side.is-right {
  justify-content: flex-start;
  padding-left: 16px;
}

.lx-timeline-card {
  display: inline-block;
  max-width: 90%;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  text-align: left;
  opacity: 0.7;
  transform: scale(0.85);
  transform-origin: center;
  transition:
    background-color 160ms ease,
    opacity 300ms ease,
    transform 300ms ease;
  backdrop-filter: blur(24px);
}

.lx-timeline-window.is-daylight .lx-timeline-card {
  border-color: rgb(0 0 0 / 5%);
  background: rgb(255 255 255 / 60%);
  color: #27272a;
}

.lx-timeline-card:hover {
  background: rgba(0, 0, 0, 0.7);
}

.lx-timeline-window.is-daylight .lx-timeline-card:hover {
  background: rgb(255 255 255 / 80%);
}

.lx-timeline-row.is-active .lx-timeline-card {
  opacity: 1;
  transform: scale(1);
}

.lx-timeline-card.is-mobile {
  display: none;
}

.lx-timeline-text {
  display: block;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.45;
  transition: font-size 300ms ease;
}

.lx-timeline-window.is-daylight .lx-timeline-text {
  color: rgb(39 39 42);
}

.lx-timeline-text.is-right {
  text-align: right;
}

.lx-timeline-row.is-active .lx-timeline-text {
  font-size: 16px;
}

.lx-timeline-translation {
  display: block;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  line-height: 1.4;
  transition: font-size 300ms ease;
}

.lx-timeline-window.is-daylight .lx-timeline-translation {
  color: rgb(113 113 122);
}

.lx-timeline-translation.is-right {
  text-align: right;
}

.lx-timeline-row.is-active .lx-timeline-translation {
  font-size: 14px;
}

.lx-timeline-dot {
  position: relative;
  z-index: 10;
  flex: none;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: var(--lx-text-secondary, #a1a1aa);
  transform: scale(1);
  transition:
    background-color 300ms ease,
    box-shadow 300ms ease,
    transform 300ms ease;
}

.lx-timeline-dot:hover {
  transform: scale(1.3);
}

.lx-timeline-row.is-active .lx-timeline-dot {
  background: var(--lx-text-accent, #f7f4ee);
  box-shadow: 0 0 20px var(--lx-text-accent, #f7f4ee);
  transform: scale(1.5);
}

.lx-timeline-row.is-active .lx-timeline-dot:hover {
  transform: scale(1.7);
}

.lx-timeline-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.lx-timeline-window.is-daylight .lx-timeline-empty {
  color: rgb(113 113 122);
}

.lx-timeline-enter-active,
.lx-timeline-leave-active {
  transition: opacity 200ms ease;
}

.lx-timeline-enter-active .lx-timeline-panel,
.lx-timeline-leave-active .lx-timeline-panel {
  transition: opacity 200ms ease, transform 200ms ease;
}

.lx-timeline-enter-from,
.lx-timeline-leave-to {
  opacity: 0;
}

.lx-timeline-enter-from .lx-timeline-panel,
.lx-timeline-leave-to .lx-timeline-panel {
  opacity: 0;
  transform: scale(0.9);
}

@media (max-width: 767px) {
  .lx-timeline-panel {
    width: 94vw;
    height: 84vh;
    padding: 20px 14px;
  }

  .lx-timeline-head {
    margin-bottom: 16px;
  }

  .lx-timeline-head h2 {
    font-size: 20px;
  }

  .lx-timeline-scroll {
    padding: 0;
  }

  .lx-timeline-list {
    padding: 24px 0 24px 6px;
  }

  .lx-timeline-rail {
    left: 6px;
    transform: none;
  }

  .lx-timeline-side {
    display: none;
  }

  .lx-timeline-row {
    display: block;
    min-height: 74px;
    margin-bottom: 36px;
    padding-left: 24px;
  }

  .lx-timeline-dot {
    position: absolute;
    top: 20px;
    left: 0;
  }

  .lx-timeline-card.is-mobile {
    display: block;
    width: 100%;
    max-width: none;
    padding: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lx-timeline-window,
  .lx-timeline-panel,
  .lx-timeline-card,
  .lx-timeline-dot {
    transition: none;
  }
}
</style>
