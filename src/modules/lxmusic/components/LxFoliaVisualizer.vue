<template>
  <canvas ref="canvasEl" class="folia-visualizer" aria-hidden="true" />
</template>

<script setup lang="ts">
/**
 * Audio-reactive geometric field for the immersive stage.
 *
 * Rotating petals and drifting fluid blobs driven by the analyser bands owned by
 * `core/player`, reproduced on a 2D canvas to stay dependency-free.
 */

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import player from '../core/player'
import type { LxTheme } from '../core/theme'

const props = withDefaults(
  defineProps<{
    theme: LxTheme
    mode?: 'classic' | 'partita' | 'still'
    intensity?: 'calm' | 'normal' | 'chaotic'
  }>(),
  { mode: 'partita', intensity: 'normal' },
)

interface Blob {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  hue: number
}

const canvasEl = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let rafId = 0
let width = 0
let height = 0
let dpr = 1
let phase = 0
const blobs: Blob[] = []

const intensityScale = computed(() => {
  const map = { calm: 0.6, normal: 1, chaotic: 1.55 } as const
  return map[props.intensity]
})

function hexToRgb(hex: string): [number, number, number] {
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex.trim())
  if (short) {
    return [parseInt(short[1] + short[1], 16), parseInt(short[2] + short[2], 16), parseInt(short[3] + short[3], 16)]
  }
  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim())
  if (long) return [parseInt(long[1], 16), parseInt(long[2], 16), parseInt(long[3], 16)]
  return [120, 140, 255]
}

function seedBlobs() {
  blobs.length = 0
  const count = 6
  for (let i = 0; i < count; i += 1) {
    blobs.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.min(width, height) * (0.12 + Math.random() * 0.16),
      hue: i / count,
    })
  }
}

function resize() {
  const el = canvasEl.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = Math.max(1, Math.floor(rect.width))
  height = Math.max(1, Math.floor(rect.height))
  el.width = Math.floor(width * dpr)
  el.height = Math.floor(height * dpr)
  ctx = el.getContext('2d')
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  seedBlobs()
}

function drawBlobs(power: number) {
  if (!ctx) return
  const [ar, ag, ab] = hexToRgb(props.theme.accentColor)
  const [br, bg, bb] = hexToRgb(props.theme.secondaryColor)
  ctx.globalCompositeOperation = 'lighter'
  for (const blob of blobs) {
    blob.x += blob.vx * (0.6 + power * 2.4)
    blob.y += blob.vy * (0.6 + power * 2.4)
    if (blob.x < -blob.radius) blob.x = width + blob.radius
    if (blob.x > width + blob.radius) blob.x = -blob.radius
    if (blob.y < -blob.radius) blob.y = height + blob.radius
    if (blob.y > height + blob.radius) blob.y = -blob.radius

    const radius = blob.radius * (0.82 + power * 0.5)
    const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, radius)
    const mix = blob.hue
    const r = Math.round(ar * (1 - mix) + br * mix)
    const g = Math.round(ag * (1 - mix) + bg * mix)
    const b = Math.round(ab * (1 - mix) + bb * mix)
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.28 + power * 0.3})`)
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(blob.x, blob.y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'
}

function drawPetals(bands: { bass: number; lowMid: number; mid: number; vocal: number; treble: number }) {
  if (!ctx) return
  const cx = width / 2
  const cy = height / 2
  const base = Math.min(width, height) * 0.16
  const scale = intensityScale.value
  const [r, g, b] = hexToRgb(props.theme.accentColor)

  const layers = 3
  for (let layer = 0; layer < layers; layer += 1) {
    const petals = 6 + layer * 3
    const band = layer === 0 ? bands.bass : layer === 1 ? bands.mid : bands.treble
    const energy = (band / 255) * scale
    const radius = base * (1 + layer * 0.55) * (1 + energy * 0.6)
    const rotation = phase * (layer % 2 === 0 ? 1 : -1) * (0.35 + layer * 0.2)

    ctx.beginPath()
    for (let i = 0; i <= 120; i += 1) {
      const t = (i / 120) * Math.PI * 2
      const wobble = Math.sin(t * petals + rotation * 6) * (0.12 + energy * 0.3)
      const rr = radius * (1 + wobble)
      const x = cx + Math.cos(t + rotation) * rr
      const y = cy + Math.sin(t + rotation) * rr * 0.78
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.16 + energy * 0.32})`
    ctx.lineWidth = 1.4
    ctx.stroke()
  }
}

function drawClassic(bands: { bass: number; lowMid: number; mid: number; vocal: number; treble: number }, power: number) {
  if (!ctx) return
  const [r, g, b] = hexToRgb(props.theme.accentColor)
  const energies = [bands.bass, bands.lowMid, bands.mid, bands.vocal, bands.treble].map((value) => value / 255)
  const baseY = height * 0.72
  const layers = 3
  for (let layer = 0; layer < layers; layer += 1) {
    ctx.beginPath()
    const points = 90
    for (let i = 0; i <= points; i += 1) {
      const ratio = i / points
      const band = energies[Math.min(energies.length - 1, Math.floor(ratio * energies.length))]
      const amplitude = height * (0.035 + band * 0.18 + power * 0.08) * intensityScale.value
      const y = baseY + Math.sin(ratio * Math.PI * (4 + layer * 2) + phase * (3 + layer)) * amplitude
      const x = ratio * width
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.16 + layer * 0.1 + power * 0.2})`
    ctx.lineWidth = 1 + layer * 0.8
    ctx.stroke()
  }
}

function tick() {
  rafId = requestAnimationFrame(tick)
  if (!ctx) return
  const state = player.state
  const bands = state.audioBands
  const measuredPower = Math.min(1, state.audioPower / 200)
  // Cross-origin streams do not always expose analyser samples. Keep the stage alive
  // with a restrained playback pulse instead of freezing the Folia scene completely.
  const fallbackPulse = state.isPlay ? 0.12 + (Math.sin(phase * 7) + 1) * 0.035 : 0
  const power = Math.max(measuredPower, fallbackPulse)
  phase += 0.004 + power * 0.02

  ctx.clearRect(0, 0, width, height)
  if (props.mode === 'still') {
    drawBlobs(power * 0.5)
    return
  }
  if (props.mode === 'classic') {
    drawBlobs(power * 0.35)
    drawClassic(bands, power)
    return
  }
  drawBlobs(power)
  drawPetals(bands)
}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  rafId = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', resize)
})

watch(() => props.mode, seedBlobs)
</script>
