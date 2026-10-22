<template>
  <div class="folia-backdrop" :class="`is-${mode}`" aria-hidden="true">
    <div class="folia-backdrop-base" :style="{ background: theme.backgroundColor }" />

    <template v-if="mode !== 'nomand'">
      <img
        v-if="cover"
        class="folia-backdrop-cover"
        :src="cover"
        alt=""
        referrerpolicy="no-referrer"
        decoding="async"
      >
      <div class="folia-backdrop-blur" />
    </template>

    <div class="folia-backdrop-gradient" :style="gradientStyle" />
    <div class="folia-backdrop-wash" :style="washStyle" />

    <div v-if="mode === 'latent' || mode === 'sora'" class="folia-aurora" :style="auroraStyle">
      <i />
      <i />
      <i />
    </div>

    <div v-if="mode === 'monet'" class="folia-monet" :style="monetStyle">
      <i v-for="(brush, index) in brushes" :key="index" :style="brush" />
    </div>

    <template v-if="!disableGeometric">
      <div
        v-for="shape in shapes"
        :key="`shape-${shape.id}`"
        class="folia-geometric-drift"
        :style="shape.drift"
      >
        <i class="folia-shape" :class="`is-${shape.type}`" :style="shape.face" />
      </div>
      <i
        v-for="particle in particles"
        :key="`particle-${particle.id}`"
        class="folia-particle"
        :style="particle.style"
      />
    </template>

    <div v-if="!disableVignette" class="folia-vignette" />
  </div>
</template>

<script setup lang="ts">
/**
 * Shared Folia backdrop. The cover is rendered as one blurred, scaled layer with a
 * theme-colour overlay, while the geometric field is seeded deterministically per
 * song so a re-render does not reshuffle the scene.
 */

import { computed } from 'vue'
import type { LxTheme } from '../../core/theme'
import type { VisualizerBackgroundMode } from '../../core/settings'
import { colorWithAlpha } from '../../core/theme'

const props = withDefaults(
  defineProps<{
    theme: LxTheme
    cover?: string
    seed?: string | number
    mode?: VisualizerBackgroundMode
    opacity?: number
    disableGeometric?: boolean
    disableVignette?: boolean
    paused?: boolean
  }>(),
  {
    cover: '',
    seed: 'yumo',
    mode: 'latent',
    opacity: 0.75,
    disableGeometric: false,
    disableVignette: false,
    paused: false,
  },
)

function randomFactory(seed: string) {
  let value = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index)
    value = Math.imul(value, 16777619)
  }
  return () => {
    value += 0x6d2b79f5
    let next = value
    next = Math.imul(next ^ (next >>> 15), next | 1)
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61)
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}

const random = computed(() => randomFactory(`${props.seed}:${props.mode}`))

const gradientStyle = computed(() => ({
  background: `linear-gradient(135deg, ${colorWithAlpha(props.theme.primaryColor, 0.2)} 0%, transparent 44%, ${colorWithAlpha(props.theme.secondaryColor, 0.22)} 100%)`,
}))

const washStyle = computed(() => ({
  background: `radial-gradient(ellipse at 52% 45%, ${colorWithAlpha(props.theme.backgroundColor, 0.06)} 0%, ${colorWithAlpha(props.theme.backgroundColor, 0.7)} 100%)`,
  opacity: String(props.opacity),
}))

const auroraStyle = computed(() => ({
  '--aurora-a': colorWithAlpha(props.theme.primaryColor, 0.22),
  '--aurora-b': colorWithAlpha(props.theme.accentColor, 0.17),
  '--aurora-c': colorWithAlpha(props.theme.secondaryColor, 0.2),
  animationPlayState: props.paused ? 'paused' : 'running',
}))

const brushes = computed(() => {
  const next = random.value
  return Array.from({ length: 11 }, (_, index) => ({
    left: `${-15 + next() * 125}%`,
    top: `${-20 + next() * 135}%`,
    width: `${15 + next() * 38}%`,
    height: `${8 + next() * 22}%`,
    borderRadius: `${35 + next() * 45}% ${25 + next() * 60}% ${40 + next() * 45}%`,
    opacity: String(0.05 + next() * 0.12),
    background: index % 3 === 0 ? props.theme.primaryColor : index % 3 === 1 ? props.theme.accentColor : props.theme.secondaryColor,
    filter: `blur(${18 + next() * 36}px)`,
    transform: `rotate(${-35 + next() * 70}deg)`,
  }))
})

const monetStyle = computed(() => ({ animationPlayState: props.paused ? 'paused' : 'running' }))

const shapes = computed(() => {
  const next = random.value
  const types = ['circle', 'square', 'triangle', 'cross'] as const
  return Array.from({ length: 15 }, (_, id) => {
    const size = 38 + next() * 100
    const duration = 28 + next() * 34
    const delay = next() * 8
    const opacity = 0.08 + next() * 0.1
    const reverse = next() > 0.5 ? 1 : -1
    return {
      id,
      type: types[Math.floor(next() * types.length)],
      drift: {
        left: `${next() * 100}%`,
        top: `${next() * 100}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        animationDirection: reverse > 0 ? 'normal' : 'reverse',
        animationPlayState: props.paused ? 'paused' : 'running',
        '--shape-rotate': `${next() * 360}deg`,
      },
      face: {
        borderColor: colorWithAlpha(next() > 0.3 ? props.theme.primaryColor : props.theme.secondaryColor, opacity),
        background: next() > 0.72 ? colorWithAlpha(props.theme.accentColor, opacity * 0.6) : 'transparent',
        opacity,
      },
    }
  })
})

const particles = computed(() => {
  const next = random.value
  return Array.from({ length: 20 }, (_, id) => ({
    id,
    style: {
      left: `${next() * 100}%`,
      top: `${next() * 100}%`,
      width: `${1 + next() * 3.5}px`,
      height: `${1 + next() * 3.5}px`,
      background: id % 2 ? props.theme.accentColor : props.theme.secondaryColor,
      '--particle-opacity': String(0.12 + next() * 0.26),
      animationDuration: `${15 + next() * 20}s`,
      animationDelay: `${next() * 10}s`,
      animationPlayState: props.paused ? 'paused' : 'running',
    },
  }))
})
</script>
