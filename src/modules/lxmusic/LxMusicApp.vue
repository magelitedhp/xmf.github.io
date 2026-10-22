<template>
  <div
    class="lx-app"
    :class="{
      'is-light': isLight,
      'is-detail': showDetail,
      'controls-left': appSetting['common.controlBtnPosition'] === 'left',
      'no-animation': !appSetting['common.animation'],
    }"
    :style="shellStyle"
  >
    <LxAside v-show="!showDetail" />

    <div class="lx-right">
      <LxToolbar v-show="!showDetail" />

      <div class="lx-view">
        <RouterView v-slot="{ Component }">
          <component :is="Component" />
        </RouterView>
      </div>

      <LxPlayBar v-show="!showDetail" @open-detail="showDetail = true" />
    </div>

    <LxPlayDetail v-if="showDetail" @close="showDetail = false" />

    <LxAddToListModal />

    <LxDesktopLyric />

    <Transition name="lx-toast">
      <div v-if="uiState.toast.visible" class="lx-toast">{{ uiState.toast.text }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import LxAside from './components/LxAside.vue'
import LxToolbar from './components/LxToolbar.vue'
import LxPlayBar from './components/LxPlayBar.vue'
import LxPlayDetail from './components/LxPlayDetail.vue'
import LxAddToListModal from './components/LxAddToListModal.vue'
import LxDesktopLyric from './components/LxDesktopLyric.vue'
import { appSetting } from './core/settings'
import { adjustVolume, registerHotKeys } from './core/hotkeys'
import player, { destroyPlayer } from './core/player'
import { uiState } from './core/ui'
import { DEFAULT_THEME, resolveCoverTheme, type LxTheme } from './core/theme'
import { isDaylight, watchSystemTheme } from './core/themeMode'
import './styles/lx.css'
import './styles/folia.css'

const router = useRouter()
const showDetail = ref(false)
const coverTheme = ref<LxTheme | null>(null)
const isLight = isDaylight

/**
 * `theme.id === 'cover'` derives the shell palette from the current artwork — the same
 * behaviour as the cover-following theme. Only the accent + surfaces are
 * overridden so the layout tokens keep working.
 */
const shellStyle = computed(() => {
  const theme = coverTheme.value
  const style: Record<string, string> = { fontSize: `${appSetting['common.fontSize']}px` }
  if (appSetting['theme.id'] !== 'cover' || !theme) return style
  return Object.assign(style, {
    '--lx-primary': theme.accentColor,
    '--lx-primary-dark': theme.accentColor,
    '--lx-primary-light': theme.accentColor,
    '--lx-active': `${theme.accentColor}2e`,
  })
})

watch(
  [() => appSetting['theme.id'], () => player.currentMusic.value.pic],
  async ([mode, cover]) => {
    if (mode !== 'cover' || !cover) {
      coverTheme.value = null
      return
    }
    coverTheme.value = await resolveCoverTheme(cover, { ...DEFAULT_THEME })
  },
  { immediate: true },
)

let unregister: (() => void) | null = null
let unwatchSystemTheme: (() => void) | null = null

onMounted(() => {
  unwatchSystemTheme = watchSystemTheme()
  window.addEventListener('lxmusic:open-detail', openDetail)
  unregister = registerHotKeys({
    togglePlay: () => void player.togglePlay(),
    next: () => void player.playNext(),
    prev: () => void player.playPrev(),
    volumeUp: () => adjustVolume(0.05),
    volumeDown: () => adjustVolume(-0.05),
    toggleMute: () => player.toggleMute(),
    seekForward: () => player.seek(player.state.progress + 5),
    seekBackward: () => player.seek(player.state.progress - 5),
    togglePlayMode: () => player.cyclePlayMode(),
    openSearch: () => void router.push('/lxmusic/search'),
    togglePlayDetail: () => {
      showDetail.value = !showDetail.value
    },
    toggleDesktopLyric: () => {
      appSetting['lyric.enableDesktopLyric'] = !appSetting['lyric.enableDesktopLyric']
    },
    minimize: () => void router.push('/'),
    close: () => {
      showDetail.value = false
      void router.push('/')
    },
  })
})

onBeforeUnmount(() => {
  unregister?.()
  window.removeEventListener('lxmusic:open-detail', openDetail)
  unwatchSystemTheme?.()
  unwatchSystemTheme = null
  destroyPlayer()
})

function openDetail() {
  showDetail.value = true
}

watch(() => appSetting['player.playMode'], (value) => player.setPlayMode(value), { immediate: true })
watch(() => appSetting['player.volume'], (value) => player.setVolume(value), { immediate: true })
watch(
  () => appSetting['player.mute'],
  (value) => {
    if (player.state.isMute !== value) player.toggleMute()
  },
  { immediate: true },
)
watch(() => appSetting['player.playbackRate'], (value) => player.setPlaybackRate(value), { immediate: true })
watch(() => appSetting['player.audioVisualization'], (value) => player.setAudioVisualization(value), { immediate: true })

// Keep the immersive stage in sync with the persisted "start in fullscreen" preference.
watch(
  () => appSetting['common.startInFullscreen'],
  (value) => {
    if (value) showDetail.value = true
  },
  { immediate: true },
)
</script>

<style>
.lx-toast {
  position: fixed;
  left: 50%;
  bottom: 96px;
  z-index: 90;
  transform: translateX(-50%);
  padding: 9px 18px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.78);
  color: #fff;
  font-size: 13px;
  pointer-events: none;
}

.lx-toast-enter-active,
.lx-toast-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.lx-toast-enter-from,
.lx-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
