<template>
  <GameFrame>
    <canvas
      ref="canvasEl"
      class="game-canvas"
      :width="UW"
      :height="UH"
      @pointerdown="onPointer($event, true)"
      @pointermove="onPointer($event, false)"
    ></canvas>

    <div v-if="touch" class="game-touch">
      <div class="game-touch-pad">
        <button
          v-for="b in padButtons"
          :key="b.action"
          type="button"
          class="game-touch-btn"
          @pointerdown.prevent="hold(b.action, $event)"
          @pointerup.prevent="letGo(b.action)"
          @pointercancel="letGo(b.action)"
          @lostpointercapture="letGo(b.action)"
        >{{ b.label }}</button>
      </div>
      <div class="game-touch-actions">
        <button
          v-for="b in actionButtons"
          :key="b.action"
          type="button"
          class="game-touch-btn"
          :class="`is-${b.action}`"
          @pointerdown.prevent="hold(b.action, $event)"
          @pointerup.prevent="letGo(b.action)"
          @pointercancel="letGo(b.action)"
          @lostpointercapture="letGo(b.action)"
        >{{ b.label }}</button>
      </div>
    </div>

    <template #toolbar>
      <button type="button" class="glass-button" @click="toggleMute">{{ muted ? '开启音效' : '静音' }}</button>
      <button type="button" class="glass-button" @click="game?.togglePause()">暂停 / 继续</button>
    </template>
  </GameFrame>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import GameFrame from '../../components/GameFrame.vue'
import { Game } from './engine/game'
import { UH, UW } from './engine/core'
import type { Action } from './engine/input'

const canvasEl = ref<HTMLCanvasElement | null>(null)
const touch = ref(false)
const muted = ref(false)
const held = new Set<Action>()
let game: Game | null = null

const padButtons: { action: Action; label: string }[] = [
  { action: 'left', label: '◀' },
  { action: 'down', label: '▼' },
  { action: 'right', label: '▶' },
]

const actionButtons: { action: Action; label: string }[] = [
  { action: 'dash', label: '冲' },
  { action: 'jump', label: '跳' },
  { action: 'attack', label: '斩' },
]

function onPointer(e: PointerEvent, down: boolean) {
  const canvas = canvasEl.value
  if (!canvas || !game) return
  const rect = canvas.getBoundingClientRect()
  game.pointer(((e.clientX - rect.left) / rect.width) * UW, ((e.clientY - rect.top) / rect.height) * UH, down)
}

function hold(action: Action, e: PointerEvent) {
  if (!game || held.has(action)) return
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  held.add(action)
  game.input.press(action)
  if (action === 'attack' || action === 'jump') game.input.press('confirm')
}

function letGo(action: Action) {
  if (!game || !held.has(action)) return
  held.delete(action)
  game.input.release(action)
  if (action === 'attack' || action === 'jump') game.input.release('confirm')
}

function toggleMute() {
  if (!game) return
  game.sound.muted = !game.sound.muted
  muted.value = game.sound.muted
}

onMounted(() => {
  touch.value = window.matchMedia('(pointer: coarse)').matches
  if (!canvasEl.value) return
  game = new Game(canvasEl.value)
  game.start()
})

onBeforeUnmount(() => {
  game?.destroy()
  game = null
})
</script>
