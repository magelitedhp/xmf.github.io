<template>
  <div
    ref="rootEl"
    class="lattice-tools"
    :class="{ 'is-daylight': isDaylight }"
  >
    <div class="lattice-tools-stack" :class="{ 'has-queue-island': showQueueIsland }">
    <Transition name="lattice-tools-panel">
      <div
        v-if="open"
        id="lx-wall-tools-panel"
        class="lattice-tools-panel has-quick-actions"
        role="menu"
        aria-label="墙面工具"
      >
        <div class="lattice-tools-quick" role="group">
          <button
            v-for="action in quickActions"
            :key="action.id"
            type="button"
            class="lattice-tools-quick-action"
            :class="{ 'is-busy': action.busy }"
            role="menuitem"
            :aria-label="action.label"
            :aria-description="action.status"
            :aria-busy="action.busy || undefined"
            :aria-expanded="action.expanded"
            :aria-controls="action.controls"
            :title="[action.label, action.status].filter(Boolean).join(' · ')"
            :disabled="action.disabled"
            :data-wall-tools-quick="action.id"
            @click="action.run"
          >
            <LxIcon :name="action.icon" />
          </button>
        </div>

        <div class="lattice-tools-slider">
          <button
            type="button"
            class="lattice-tools-slider-icon"
            :aria-label="player.state.isMute ? '取消静音' : '静音'"
            :aria-pressed="player.state.isMute"
            @click="player.toggleMute()"
          >
            <LxIcon :name="player.state.isMute ? 'mute' : 'volume'" />
          </button>
          <input
            type="range"
            min="0"
            max="100"
            :value="Math.round(player.state.volume * 100)"
            aria-label="音量"
            :style="{ '--wall-tools-slider-fill': `${Math.round(player.state.volume * 100)}%` }"
            @input="onVolume"
          >
          <span class="lattice-tools-slider-value">
            {{ player.state.isMute ? '静音' : `${Math.round(player.state.volume * 100)}%` }}
          </span>
        </div>

        <slot />

        <button
          type="button"
          class="lattice-tools-action"
          role="menuitemcheckbox"
          :aria-checked="appSetting['lattice.posterTintEnabled']"
          @click="appSetting['lattice.posterTintEnabled'] = !appSetting['lattice.posterTintEnabled']"
        >
          <LxIcon name="layers" />
          <span>海报叠色</span>
          <span
            class="lattice-tools-toggle"
            :class="{ 'is-on': appSetting['lattice.posterTintEnabled'] }"
            aria-hidden="true"
          ><span /></span>
        </button>

        <div class="lattice-tools-help-section">
          <button
            type="button"
            class="lattice-tools-lights-toggle"
            role="menuitemcheckbox"
            :aria-checked="appSetting['lattice.lightsOn']"
            aria-label="墙面灯光"
            @click="appSetting['lattice.lightsOn'] = !appSetting['lattice.lightsOn']"
          >
            <span :class="{ 'is-active': appSetting['lattice.lightsOn'] }">开灯</span>
            <span :class="{ 'is-active': !appSetting['lattice.lightsOn'] }">关灯</span>
          </button>
          <button
            type="button"
            class="lattice-tools-action lattice-tools-help-trigger"
            role="menuitem"
            aria-label="帮助"
            title="帮助"
            :aria-expanded="helpOpen"
            aria-controls="lx-wall-tools-help"
            @click="helpOpen = !helpOpen"
          >
            <LxIcon name="help" />
          </button>
          <Transition name="lattice-tools-help">
            <div v-if="helpOpen" id="lx-wall-tools-help" class="lattice-tools-help" role="note">
              <ul>
                <li><span>单击海报展开，拖动墙面浏览</span><kbd>ESC</kbd></li>
                <li><span>方向键切换焦点</span><kbd>↑ ↓ ← →</kbd></li>
                <li><span>Page Up / Page Down 切换分区</span></li>
              </ul>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>

    <Transition name="lattice-tools-island">
      <LxWallQueueIsland
        v-if="showQueueIsland"
        id="lx-wall-queue-island"
      />
    </Transition>
    </div>

    <button
      ref="triggerEl"
      type="button"
      class="lattice-tools-trigger"
      :class="{ 'is-open': open }"
      :aria-label="open ? '关闭墙面工具' : '墙面工具'"
      :title="open ? '关闭墙面工具' : '墙面工具'"
      aria-haspopup="menu"
      :aria-expanded="open"
      aria-controls="lx-wall-tools-panel"
      @click="toggle"
    >
      <LxIcon :name="open ? 'close' : 'setting'" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import LxIcon from './LxIcon.vue'
import LxWallQueueIsland from './LxWallQueueIsland.vue'
import player from '../core/player'
import { appSetting } from '../core/settings'
import { toast } from '../core/ui'

const props = withDefaults(
  defineProps<{
    isDaylight?: boolean
    canGoHome?: boolean
  }>(),
  { isDaylight: false, canGoHome: true },
)

const emit = defineEmits<{
  home: []
}>()

const rootEl = ref<HTMLElement | null>(null)
const triggerEl = ref<HTMLButtonElement | null>(null)
const open = ref(false)
const helpOpen = ref(false)
const queueIslandOpen = ref(false)
const themeBusy = ref(false)
let themeFallbackTimer = 0

const showQueueIsland = computed(() => open.value && queueIslandOpen.value)
const hasCurrent = computed(() => Boolean(player.currentMusic.value.id))

const quickActions = computed(() => ([
  {
    id: 'shuffle-queue',
    icon: 'shuffle',
    label: '打乱播放队列',
    status: player.state.playList.length < 2 ? '队列不足两首' : '',
    disabled: player.state.playList.length < 2,
    busy: false,
    expanded: undefined as boolean | undefined,
    controls: undefined as string | undefined,
    run: () => {
      if (player.shuffleQueue()) toast('播放队列已打乱')
    },
  },
  {
    id: 'generate-theme',
    icon: 'sparkles',
    label: '为当前歌曲生成主题',
    status: themeBusy.value ? '正在生成主题…' : hasCurrent.value ? '' : '没有正在播放的歌曲',
    disabled: !hasCurrent.value || themeBusy.value,
    busy: themeBusy.value,
    expanded: undefined,
    controls: undefined,
    run: generateTheme,
  },
  {
    id: 'queue',
    icon: 'queue',
    label: queueIslandOpen.value ? '收起播放队列' : '展开播放队列',
    status: queueIslandOpen.value ? '队列浮岛已展开' : '队列浮岛已收起',
    disabled: false,
    busy: false,
    expanded: queueIslandOpen.value,
    controls: queueIslandOpen.value ? 'lx-wall-queue-island' : undefined,
    run: () => {
      queueIslandOpen.value = !queueIslandOpen.value
    },
  },
  {
    id: 'destination',
    icon: 'home',
    label: '回到歌单',
    status: props.canGoHome ? '' : '已经在歌单首页',
    disabled: !props.canGoHome,
    busy: false,
    expanded: undefined,
    controls: undefined,
    run: () => {
      close()
      emit('home')
    },
  },
  {
    id: 'open-player',
    icon: 'disc',
    label: '打开播放详情',
    status: hasCurrent.value ? '' : '没有正在播放的歌曲',
    disabled: !player.currentMusic.value.id,
    busy: false,
    expanded: undefined,
    controls: undefined,
    run: () => {
      close()
      window.dispatchEvent(new CustomEvent('lxmusic:open-detail'))
    },
  },
]))

function close() {
  open.value = false
  helpOpen.value = false
}

function toggle() {
  open.value = !open.value
  if (!open.value) helpOpen.value = false
}

function generateTheme() {
  if (!hasCurrent.value || themeBusy.value) return
  themeBusy.value = true
  window.clearTimeout(themeFallbackTimer)
  const done = () => {
    window.clearTimeout(themeFallbackTimer)
    themeFallbackTimer = 0
    themeBusy.value = false
  }
  window.dispatchEvent(new CustomEvent('lxmusic:generate-theme', { detail: { done } }))
  themeFallbackTimer = window.setTimeout(done, 1800)
}

function onVolume(event: Event) {
  const value = Number((event.target as HTMLInputElement).value) / 100
  if (player.state.isMute && value > 0) player.toggleMute()
  player.setVolume(value)
}

let removeOutside: (() => void) | null = null

watch(open, (value) => {
  removeOutside?.()
  removeOutside = null
  if (!value) return
  const onPointerDown = (event: PointerEvent) => {
    if (event.target instanceof Node && rootEl.value?.contains(event.target)) return
    close()
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.isComposing || event.defaultPrevented) return
    event.preventDefault()
    close()
    void nextTick(() => triggerEl.value?.focus({ preventScroll: true }))
  }
  document.addEventListener('pointerdown', onPointerDown, true)
  document.addEventListener('keydown', onKeyDown)
  removeOutside = () => {
    document.removeEventListener('pointerdown', onPointerDown, true)
    document.removeEventListener('keydown', onKeyDown)
  }
})

onBeforeUnmount(() => {
  removeOutside?.()
  window.clearTimeout(themeFallbackTimer)
})
</script>

<style>
.lattice-tools {
  --wall-tools-panel-width: min(296px, calc(100vw - 32px));
  --wall-tools-top-reserve: 48px;
  --wall-tools-panel-chrome: 300px;
  position: absolute;
  right: 24px;
  bottom: 24px;
  z-index: 31;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  color: var(--lx-wall-ink, #f7f4ee);
}

.lattice-tools-stack {
  position: absolute;
  right: 0;
  bottom: 64px;
  display: flex;
  max-height: calc(100vh - 88px - var(--wall-tools-top-reserve));
  flex-direction: column-reverse;
  align-items: flex-end;
  gap: 8px;
}

.lattice-tools-panel {
  display: flex;
  width: var(--wall-tools-panel-width);
  max-height: calc(100vh - 136px);
  flex: none;
  flex-direction: column;
  gap: 2px;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: 24px;
  background: rgb(0 0 0 / 40%);
  box-shadow: 0 24px 64px rgb(0 0 0 / 42%);
  backdrop-filter: blur(24px);
  transform-origin: 100% 100%;
}

.lattice-tools.is-daylight .lattice-tools-panel {
  border-color: rgb(0 0 0 / 7%);
  background: rgb(255 255 255 / 62%);
  box-shadow: 0 24px 64px rgb(42 35 27 / 18%);
}

.lattice-tools-trigger {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgb(0 0 0 / 40%);
  color: inherit;
  box-shadow: 0 18px 42px rgb(0 0 0 / 24%);
  backdrop-filter: blur(12px);
  cursor: pointer;
  transition: transform 300ms ease, background-color 300ms ease;
}

.lattice-tools.is-daylight .lattice-tools-trigger {
  background: rgb(255 255 255 / 70%);
  color: rgb(24 24 27);
}

.lattice-tools-trigger:hover {
  transform: scale(1.05);
  background: rgb(255 255 255 / 16%);
}

.lattice-tools.is-daylight .lattice-tools-trigger:hover {
  background: rgb(255 255 255 / 90%);
}

.lattice-tools-trigger svg {
  width: 20px;
  height: 20px;
}

.lattice-tools-panel-enter-active,
.lattice-tools-panel-leave-active {
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}

.lattice-tools-panel-enter-from,
.lattice-tools-panel-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.lattice-tools-island-enter-active {
  transition: opacity 180ms ease-out 90ms, transform 180ms ease-out 90ms;
}

.lattice-tools-island-leave-active {
  transition: opacity 180ms ease-out, transform 180ms ease-out;
}

.lattice-tools-island-enter-from,
.lattice-tools-island-leave-to {
  opacity: 0;
  transform: scale(0.96);
  transform-origin: 100% 100%;
}

.lattice-tools-quick {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 4px;
  margin-bottom: 4px;
}

.lattice-tools-quick-action {
  display: grid;
  min-width: 0;
  height: 40px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: rgb(255 255 255 / 6%);
  color: inherit;
  cursor: pointer;
  transition: background-color 160ms ease, opacity 160ms ease;
}

.lattice-tools.is-daylight .lattice-tools-quick-action {
  background: rgb(0 0 0 / 5%);
}

.lattice-tools-quick-action:hover,
.lattice-tools-quick-action:focus-visible {
  background: rgb(255 255 255 / 13%);
}

.lattice-tools.is-daylight .lattice-tools-quick-action:hover,
.lattice-tools.is-daylight .lattice-tools-quick-action:focus-visible {
  background: rgb(0 0 0 / 10%);
}

.lattice-tools-quick-action:disabled {
  opacity: 0.35;
  cursor: default;
}

.lattice-tools-quick-action svg {
  width: 18px;
  height: 18px;
  flex: none;
}

.lattice-tools-quick-action span {
  display: none;
}

.lattice-tools-slider {
  display: flex;
  min-height: 38px;
  align-items: center;
  gap: 8px;
  padding: 0 12px 0 4px;
  border-radius: 12px;
  background: rgb(255 255 255 / 6%);
}

.lattice-tools.is-daylight .lattice-tools-slider {
  background: rgb(0 0 0 / 5%);
}

.lattice-tools-slider-icon {
  display: grid;
  width: 30px;
  height: 30px;
  flex: none;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.lattice-tools-slider-icon:hover {
  background: rgb(255 255 255 / 10%);
}

.lattice-tools-slider-icon[aria-pressed='true'] {
  color: var(--lx-primary, currentColor);
}

.lattice-tools-slider-icon svg {
  width: 17px;
  height: 17px;
}

.lattice-tools-slider input[type='range'] {
  --wall-tools-slider-track: color-mix(in srgb, currentColor 18%, transparent);
  min-width: 0;
  height: 22px;
  flex: 1;
  margin: 0;
  color: inherit;
  background: transparent;
  cursor: pointer;
  appearance: none;
}

.lattice-tools-slider input[type='range']::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(
    to right,
    var(--lx-primary, currentColor) var(--wall-tools-slider-fill, 0%),
    var(--wall-tools-slider-track) var(--wall-tools-slider-fill, 0%)
  );
}

.lattice-tools-slider input[type='range']::-webkit-slider-thumb {
  width: 14px;
  height: 14px;
  margin-top: -5px;
  border: 0;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 1px rgb(0 0 0 / 22%), 0 2px 6px rgb(0 0 0 / 30%);
  appearance: none;
}

.lattice-tools-slider-value {
  width: 38px;
  flex: none;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  opacity: 0.66;
  text-align: right;
}

.lattice-tools-action {
  display: flex;
  width: 100%;
  min-height: 38px;
  align-items: center;
  gap: 11px;
  padding: 0 12px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: inherit;
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background-color 160ms ease;
}

.lattice-tools-action:hover,
.lattice-tools-action:focus-visible {
  background: rgb(255 255 255 / 10%);
}

.lattice-tools.is-daylight .lattice-tools-action:hover,
.lattice-tools.is-daylight .lattice-tools-action:focus-visible {
  background: rgb(0 0 0 / 7%);
}

.lattice-tools-action svg {
  width: 17px;
  height: 17px;
  flex: none;
}

.lattice-tools-toggle {
  width: 30px;
  height: 18px;
  margin-left: auto;
  padding: 2px;
  border: 1px solid currentColor;
  border-radius: 999px;
  opacity: 0.42;
  transition: background-color 160ms ease, opacity 160ms ease;
}

.lattice-tools-toggle > span {
  display: block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: currentColor;
  transition: transform 160ms ease;
}

.lattice-tools-toggle.is-on {
  background: var(--lx-primary, currentColor);
  opacity: 1;
}

.lattice-tools-toggle.is-on > span {
  color: var(--lx-wall-bg, #09090b);
  transform: translateX(12px);
}

.lattice-tools-help-section {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px solid rgb(255 255 255 / 10%);
}

.lattice-tools.is-daylight .lattice-tools-help-section {
  border-top-color: rgb(0 0 0 / 9%);
}

.lattice-tools-lights-toggle {
  display: inline-grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  padding: 3px;
  border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
  border-radius: 999px;
  color: inherit;
  background: rgb(255 255 255 / 6%);
  cursor: pointer;
}

.lattice-tools.is-daylight .lattice-tools-lights-toggle {
  background: rgb(0 0 0 / 5%);
}

.lattice-tools-lights-toggle span {
  min-width: 44px;
  padding: 4px 9px;
  border-radius: 999px;
  color: color-mix(in srgb, currentColor 58%, transparent);
  font-size: 10.5px;
  font-weight: 650;
  text-align: center;
  transition: color 160ms ease, background-color 160ms ease;
}

.lattice-tools-lights-toggle span.is-active {
  color: var(--lx-wall-bg, #09090b);
  background: var(--lx-primary, currentColor);
}

.lattice-tools-help-trigger {
  width: 32px;
  min-height: 32px;
  justify-content: center;
  align-self: flex-end;
  padding: 0;
}

.lattice-tools-help {
  flex-basis: 100%;
  margin-top: 6px;
  overflow: hidden;
}

.lattice-tools-help ul {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 7px 12px;
  border-radius: 14px;
  background: rgb(255 255 255 / 6%);
  list-style: none;
}

.lattice-tools-panel:has(.lattice-tools-help) {
  max-height: min(430px, calc(100vh - 112px));
}

.lattice-tools-panel.has-quick-actions .lattice-tools-help ul {
  max-height: max(150px, calc(100vh - 600px));
  overflow-y: auto;
  overscroll-behavior: contain;
}

.lattice-tools-stack.has-queue-island .lattice-tools-panel .lattice-tools-help ul {
  max-height: min(
    max(150px, calc(100vh - 600px)),
    max(
      48px,
      calc(
        100vh - 88px - var(--wall-tools-top-reserve)
        - var(--wall-tools-panel-chrome) - 8px - 112px
      )
    )
  );
}

.lattice-tools.is-daylight .lattice-tools-help ul {
  background: rgb(0 0 0 / 5%);
}

.lattice-tools-help li {
  display: flex;
  min-height: 30px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: color-mix(in srgb, currentColor 76%, transparent);
  font-size: 12px;
  line-height: 1.4;
}

.lattice-tools-help li + li {
  border-top: 1px solid rgb(255 255 255 / 7%);
}

.lattice-tools.is-daylight .lattice-tools-help li + li {
  border-top-color: rgb(0 0 0 / 6%);
}

.lattice-tools-help kbd {
  flex: none;
  padding: 2px 6px;
  border: 1px solid color-mix(in srgb, currentColor 36%, transparent);
  border-radius: 6px;
  font-family: inherit;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.lattice-tools-help-enter-active,
.lattice-tools-help-leave-active {
  transition: opacity 180ms ease-out, max-height 180ms ease-out;
}

.lattice-tools-help-enter-from,
.lattice-tools-help-leave-to {
  max-height: 0;
  opacity: 0;
}

@media (max-width: 640px) {
  .lattice-tools {
    --wall-tools-panel-width: min(296px, calc(100vw - 88px));
    right: 16px;
    bottom: 16px;
  }

  .lattice-tools-panel {
    max-height: calc(100vh - 120px);
  }

  .lattice-tools-stack {
    bottom: 56px;
    /* The wall itself starts below the app header, so cap the stack by the
       available wall height rather than the full viewport. */
    max-height: calc(100dvh - 168px - var(--wall-tools-top-reserve));
  }
}

@media (prefers-reduced-motion: reduce) {
  .lattice-tools-trigger,
  .lattice-tools-panel-enter-active,
  .lattice-tools-panel-leave-active,
  .lattice-tools-island-enter-active,
  .lattice-tools-island-leave-active,
  .lattice-tools-help-enter-active,
  .lattice-tools-help-leave-active {
    transition: none;
  }
}
</style>
