<template>
  <Transition name="lx-queue">
    <div v-if="open" class="lx-queue-layer" @mousedown.self="emit('close')">
        <aside class="lx-queue-drawer" aria-label="当前播放列表">
          <header class="lx-queue-head">
            <div>
              <strong>当前播放</strong>
              <span>{{ queue.length }} 首歌曲</span>
            </div>
            <button type="button" class="lx-btn is-small" :disabled="!queue.length" @click="player.clearQueue()">清空</button>
            <button type="button" class="lx-icon-btn" aria-label="关闭播放列表" @click="emit('close')">
              <LxIcon name="close" />
            </button>
          </header>

          <div v-if="queue.length" class="lx-queue-list">
            <div
              v-for="(music, index) in queue"
              :key="music.id"
              class="lx-queue-row"
              :class="{ 'is-active': music.id === currentId }"
            >
              <button type="button" class="lx-queue-main" @click="player.playIndex(index)">
                <span class="lx-queue-index">{{ music.id === currentId ? '♪' : index + 1 }}</span>
                <LxCover :src="music.pic" :alt="`${music.name} 封面`" />
                <span class="lx-queue-copy">
                  <strong class="lx-ellipsis">{{ music.name }}</strong>
                  <small class="lx-ellipsis">{{ music.singer }}<template v-if="music.album"> · {{ music.album }}</template></small>
                </span>
                <span class="lx-queue-time">{{ music.interval }}</span>
              </button>
              <button type="button" class="lx-icon-btn" :aria-label="`从队列移除 ${music.name}`" @click="player.removeFromQueue(music.id)">
                <LxIcon name="close" />
              </button>
            </div>
          </div>

          <div v-else class="lx-queue-empty">
            <LxIcon name="playlist" />
            <strong>播放列表还是空的</strong>
            <span>从搜索、歌单或排行榜选择一首歌曲。</span>
          </div>
        </aside>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LxCover from './LxCover.vue'
import LxIcon from './LxIcon.vue'
import player from '../core/player'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const queue = computed(() => player.state.playList)
const currentId = computed(() => player.currentMusic.value.id)
</script>

<style>
.lx-queue-layer {
  position: fixed;
  inset: 0;
  z-index: 88;
  background: rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(2px);
}

.lx-queue-drawer {
  position: absolute;
  top: 12px;
  right: 12px;
  bottom: 12px;
  width: min(420px, calc(100vw - 24px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--lx-border-strong);
  border-radius: 12px;
  background: var(--lx-content-background);
  color: var(--lx-font);
  box-shadow: var(--lx-shadow);
}

.lx-queue-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 58px;
  padding: 10px 12px 10px 16px;
  border-bottom: 1px solid var(--lx-border);
}

.lx-queue-head > div { margin-right: auto; }
.lx-queue-head strong { display: block; font-size: 15px; }
.lx-queue-head span { display: block; margin-top: 2px; color: var(--lx-font-muted); font-size: 12px; }

.lx-queue-list {
  flex: auto;
  min-height: 0;
  overflow-y: auto;
  padding: 6px;
}

.lx-queue-row {
  display: flex;
  align-items: center;
  border-radius: var(--lx-radius);
  transition: background-color var(--lx-transition-fast);
}

.lx-queue-row:hover { background: var(--lx-hover); }
.lx-queue-row.is-active { background: var(--lx-active); color: var(--lx-primary); }

.lx-queue-main {
  flex: auto;
  min-width: 0;
  display: grid;
  grid-template-columns: 28px 38px minmax(0, 1fr) 42px;
  align-items: center;
  gap: 9px;
  padding: 7px 4px;
  text-align: left;
}

.lx-queue-main img,
.lx-queue-main .lx-cover-fallback { width: 38px; height: 38px; border-radius: var(--lx-radius); object-fit: cover; }
.lx-queue-index { color: var(--lx-font-muted); font-size: 12px; text-align: center; }
.lx-queue-copy { min-width: 0; }
.lx-queue-copy strong { display: block; color: inherit; font-size: 13px; font-weight: 500; }
.lx-queue-copy small { display: block; margin-top: 2px; color: var(--lx-font-muted); font-size: 12px; }
.lx-queue-time { color: var(--lx-font-muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.lx-queue-row > .lx-icon-btn { flex: none; margin-right: 5px; opacity: 0; }
.lx-queue-row:hover > .lx-icon-btn { opacity: 1; }

.lx-queue-empty {
  flex: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 30px;
  color: var(--lx-font-muted);
  text-align: center;
}

.lx-queue-empty svg { width: 42px; height: 42px; opacity: 0.5; }
.lx-queue-empty strong { color: var(--lx-font-label); font-size: 14px; }
.lx-queue-empty span { max-width: 240px; font-size: 12px; }

.lx-queue-enter-active,
.lx-queue-leave-active {
  transition: opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.lx-queue-enter-active .lx-queue-drawer,
.lx-queue-leave-active .lx-queue-drawer {
  transition:
    opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.lx-queue-enter-from,
.lx-queue-leave-to { opacity: 0; }

.lx-queue-enter-from .lx-queue-drawer {
  opacity: 0;
  transform: translateY(18px) scale(0.985);
}

.lx-queue-leave-from .lx-queue-drawer {
  transform: translateY(0) scale(1);
}

.lx-queue-leave-to .lx-queue-drawer {
  transform: translateY(12px) scale(0.99);
}

@media (max-width: 620px) {
  .lx-queue-drawer { inset: 8px; width: auto; }
  .lx-queue-row > .lx-icon-btn { opacity: 0.72; }
}
</style>
