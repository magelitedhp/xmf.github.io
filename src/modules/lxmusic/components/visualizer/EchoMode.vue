<template>
  <div class="folia-mode folia-echo" :class="[`is-${variant}`, { 'is-breathing': animationEnabled }]">
    <div v-if="!line" class="folia-stage-empty">
      <span>{{ emptyText }}</span>
    </div>

    <Transition v-else name="folia-line">
      <div :key="line.startTime" class="folia-echo-scene" :class="lineTransitionClass">
        <div v-if="variant === 'cadenza'" class="folia-echo-orbit">
          <i v-for="index in 4" :key="index" :style="orbitStyle(index)" />
        </div>
        <div v-if="variant === 'claddagh'" class="folia-echo-ring">
          <i />
          <i />
        </div>
        <div v-if="variant === 'lumiere'" class="folia-echo-beam">
          <i v-for="index in 5" :key="index" :style="beamStyle(index)" />
        </div>
        <div v-if="variant === 'pendolo'" class="folia-echo-pendulum">
          <i />
        </div>

        <div class="folia-echo-copy" :class="{ 'is-stacked': variant === 'sonnet' || variant === 'tempera' }">
          <span
            v-for="(word, index) in line.words"
            :key="index"
            class="folia-echo-word"
            :class="[`is-${wordStates[index]}`, { 'is-accent': variant === 'tempera' && index % 3 === 1 }]"
            :style="wordStyle(index)"
          >{{ word.text }}</span>
        </div>

        <div v-if="variant === 'diorama'" class="folia-echo-floor">
          <i v-for="index in 7" :key="index" :style="floorStyle(index)" />
        </div>
        <div v-if="variant === 'tilt'" class="folia-echo-rail">
          <i v-for="index in 9" :key="index" :style="railStyle(index)" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
/**
 * Secondary Folia lyric layouts.
 *
 * Classic / Partita / Fume each have their own dedicated component. The remaining
 * modes share this renderer, but every variant keeps a distinct composition and
 * motion signature instead of falling back to the same centred line.
 */

import { computed } from 'vue'
import type { LxTheme } from '../../core/theme'
import type { LyricLine } from '../../core/lyric'
import { colorWithAlpha } from '../../core/theme'
import {
  lineTransitionClass as resolveLineTransitionClass,
  resolveWordState,
} from '../../core/foliaMotion'

type EchoVariant =
  | 'cadenza'
  | 'cappella'
  | 'claddagh'
  | 'diorama'
  | 'lumiere'
  | 'monet'
  | 'pendolo'
  | 'sonnet'
  | 'tempera'
  | 'tilt'

const props = withDefaults(
  defineProps<{
    variant: EchoVariant
    line: LyricLine | null
    time: number
    theme: LxTheme
    animationEnabled?: boolean
    fontSizeScale?: number
    emptyText?: string
  }>(),
  {
    animationEnabled: true,
    fontSizeScale: 1,
    emptyText: '等待音乐开始',
  },
)

const random = (index: number, offset: number) => {
  const value = Math.sin((props.line?.startTime ?? 0) + index * 19.17 + offset * 37.31) * 10000
  return value - Math.floor(value)
}

const wordStates = computed(() => {
  const line = props.line
  if (!line) return []
  return line.words.map((word) =>
    resolveWordState(props.time, word, line.renderHints, line.renderHints.renderEndTime),
  )
})

const lineTransitionClass = computed(() => resolveLineTransitionClass(props.line))

function wordStyle(index: number) {
  const scale = props.fontSizeScale
  const layout = {
    cadenza: { rotate: (random(index, 1) - 0.5) * 14, offset: (random(index, 2) - 0.5) * 40 },
    cappella: { rotate: 0, offset: 0 },
    claddagh: { rotate: (random(index, 1) - 0.5) * 5, offset: 0 },
    diorama: { rotate: (random(index, 1) - 0.5) * 8, offset: (random(index, 2) - 0.5) * 18 },
    lumiere: { rotate: 0, offset: (random(index, 2) - 0.5) * 10 },
    monet: { rotate: (random(index, 1) - 0.5) * 11, offset: (random(index, 2) - 0.5) * 24 },
    pendolo: { rotate: (random(index, 1) - 0.5) * 5, offset: 0 },
    sonnet: { rotate: 0, offset: 0 },
    tempera: { rotate: (random(index, 1) - 0.5) * 4, offset: 0 },
    tilt: { rotate: -8 + (random(index, 1) - 0.5) * 4, offset: (random(index, 2) - 0.5) * 12 },
  }[props.variant]
  return {
    '--echo-rotate': `${layout.rotate}deg`,
    '--echo-offset': `${layout.offset}px`,
    '--echo-delay': `${index * 45}ms`,
    '--echo-scale': String(scale),
  }
}

function orbitStyle(index: number) {
  return {
    width: `${38 + index * 13}%`,
    height: `${38 + index * 13}%`,
    animationDuration: `${12 + index * 4}s`,
    animationDelay: `${-index * 2.4}s`,
    borderColor: colorWithAlpha(index % 2 ? props.theme.accentColor : props.theme.primaryColor, 0.16),
  }
}

function beamStyle(index: number) {
  return {
    left: `${12 + index * 18}%`,
    background: colorWithAlpha(index % 2 ? props.theme.accentColor : props.theme.primaryColor, 0.1),
    animationDelay: `${-index * 1.8}s`,
  }
}

function floorStyle(index: number) {
  const depth = index / 7
  return {
    bottom: `${depth * 42}%`,
    width: `${44 + depth * 82}%`,
    opacity: String(0.14 + depth * 0.22),
    borderColor: colorWithAlpha(props.theme.accentColor, 0.28),
  }
}

function railStyle(index: number) {
  return {
    top: `${12 + index * 9}%`,
    opacity: String(0.12 + index * 0.035),
    background: colorWithAlpha(index % 2 ? props.theme.primaryColor : props.theme.accentColor, 0.34),
    animationDelay: `${-index * 0.35}s`,
  }
}
</script>

<style>
.folia-echo {
  position: relative;
  overflow: hidden;
}

.folia-echo-scene {
  position: relative;
  width: min(1160px, 100%);
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 900px;
  transform-style: preserve-3d;
}

.folia-echo-copy {
  position: relative;
  z-index: 4;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  width: 100%;
  color: var(--folia-primary);
  text-align: center;
}

.folia-echo-word {
  display: inline-block;
  white-space: pre;
  font-size: calc(clamp(2.3rem, 6vw, 4.6rem) * var(--echo-scale, 1));
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: 0.015em;
  transform: translate3d(var(--echo-offset, 0), 0, 0) rotate(var(--echo-rotate, 0deg));
  transition:
    opacity 0.32s ease,
    transform 0.46s cubic-bezier(0.22, 1.4, 0.36, 1),
    color 0.3s ease,
    filter 0.3s ease,
    text-shadow 0.3s ease;
  will-change: transform, opacity, filter;
}

.folia-echo-word.is-waiting {
  opacity: 0.28;
  filter: blur(0.45px);
}

.folia-echo-word.is-active {
  opacity: 1;
  color: var(--folia-accent);
  transform: translate3d(var(--echo-offset, 0), -4px, 0) rotate(var(--echo-rotate, 0deg)) scale(1.12);
  text-shadow: 0 0 12px var(--folia-accent), 0 0 42px var(--folia-glow);
}

.folia-echo-word.is-passed {
  opacity: 0.72;
}

.folia-echo-orbit,
.folia-echo-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  display: grid;
  place-items: center;
  width: min(78vw, 640px);
  aspect-ratio: 1 / 1;
  transform: translate(-50%, -50%);
}

.folia-echo-orbit i {
  position: absolute;
  border: 1px solid;
  border-radius: 50%;
  animation: folia-echo-orbit linear infinite;
}

.folia-echo-orbit i:nth-child(even) {
  border-style: dashed;
  animation-direction: reverse;
}

@keyframes folia-echo-orbit {
  to { transform: rotate(360deg); }
}

.folia-echo-ring {
  width: min(48vw, 390px);
}

.folia-echo-ring i {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 1px solid var(--folia-accent);
  border-radius: 50%;
  opacity: 0.18;
  animation: folia-echo-pulse 4.8s ease-out infinite;
}

.folia-echo-ring i:last-child {
  animation-delay: -2.4s;
}

@keyframes folia-echo-pulse {
  0% { transform: scale(0.5); opacity: 0.34; }
  100% { transform: scale(1.6); opacity: 0; }
}

.folia-echo-beam {
  position: absolute;
  inset: -20% 0;
  overflow: hidden;
  opacity: 0.7;
}

.folia-echo-beam i {
  position: absolute;
  top: -20%;
  width: 8%;
  height: 140%;
  filter: blur(22px);
  transform: rotate(14deg);
  animation: folia-echo-beam 9s ease-in-out infinite alternate;
}

@keyframes folia-echo-beam {
  from { transform: translateX(-40px) rotate(10deg); }
  to { transform: translateX(60px) rotate(18deg); }
}

.folia-echo-pendulum {
  position: absolute;
  left: 50%;
  top: -26%;
  width: 1px;
  height: 78%;
  background: var(--folia-accent);
  opacity: 0.28;
  transform-origin: top center;
  animation: folia-echo-pendulum 5.4s ease-in-out infinite alternate;
}

.folia-echo-pendulum i {
  position: absolute;
  left: 50%;
  bottom: -18px;
  width: 36px;
  height: 36px;
  border: 1px solid var(--folia-accent);
  border-radius: 50%;
  transform: translateX(-50%);
}

@keyframes folia-echo-pendulum {
  from { transform: rotate(-14deg); }
  to { transform: rotate(14deg); }
}

.folia-echo-floor {
  position: absolute;
  left: 50%;
  bottom: -10%;
  width: min(960px, 92%);
  height: 46%;
  transform: translateX(-50%) rotateX(62deg);
  transform-origin: bottom center;
  perspective: 500px;
}

.folia-echo-floor i {
  position: absolute;
  left: 50%;
  height: 1px;
  border-top: 1px solid;
  transform: translateX(-50%);
}

.folia-echo-rail {
  position: absolute;
  inset: 0;
  overflow: hidden;
  transform: skewY(-6deg);
}

.folia-echo-rail i {
  position: absolute;
  left: -10%;
  width: 120%;
  height: 1px;
  animation: folia-echo-rail 6s linear infinite;
}

@keyframes folia-echo-rail {
  from { transform: translateX(-5%); }
  to { transform: translateX(5%); }
}

/* ---------------------------------------------------------- signatures ---- */

.folia-echo.is-cappella .folia-echo-word {
  font-family: Georgia, "Songti SC", serif;
  font-weight: 400;
  letter-spacing: 0.06em;
}

.folia-echo.is-claddagh .folia-echo-word.is-active {
  color: var(--folia-primary);
  text-shadow: 0 0 18px var(--folia-accent), 0 0 52px var(--folia-glow);
}

.folia-echo.is-diorama .folia-echo-copy {
  transform: translateY(-6%) rotateX(-8deg);
  transform-origin: center;
}

.folia-echo.is-lumiere .folia-echo-word {
  font-weight: 300;
  letter-spacing: 0.08em;
}

.folia-echo.is-monet .folia-echo-word {
  font-family: Georgia, "Songti SC", serif;
  font-style: italic;
  font-weight: 500;
  letter-spacing: 0.03em;
}

.folia-echo.is-pendolo .folia-echo-word {
  font-family: "Courier New", monospace;
  font-weight: 400;
  letter-spacing: 0.04em;
}

.folia-echo.is-sonnet .folia-echo-copy,
.folia-echo.is-tempera .folia-echo-copy {
  flex-direction: column;
  align-items: center;
  gap: 0.1em;
}

.folia-echo.is-sonnet .folia-echo-copy {
  display: block;
  max-width: min(760px, 88vw);
  font-size: clamp(2rem, 4.6vw, 3.4rem);
  line-height: 1.42;
  letter-spacing: 0.04em;
  text-wrap: balance;
}

.folia-echo.is-sonnet .folia-echo-word {
  display: inline;
  font-size: inherit;
  font-family: Georgia, "Songti SC", serif;
  font-weight: 400;
  letter-spacing: 0.05em;
  white-space: normal;
}

.folia-echo.is-tempera .folia-echo-word {
  color: var(--folia-secondary);
  font-weight: 600;
}

.folia-echo.is-tempera .folia-echo-word.is-accent,
.folia-echo.is-tempera .folia-echo-word.is-active {
  color: var(--folia-accent);
}

.folia-echo.is-tilt .folia-echo-copy {
  transform: rotate(-8deg) skewX(-3deg);
}

.folia-echo.is-tilt .folia-echo-word {
  font-style: italic;
}

@media (max-width: 760px) {
  .folia-echo-scene {
    min-height: 260px;
  }

  .folia-echo-word {
    font-size: calc(clamp(1.9rem, 8.8vw, 3.2rem) * var(--echo-scale, 1));
  }

  .folia-echo.is-sonnet .folia-echo-copy {
    max-width: calc(100vw - 44px);
    font-size: calc(clamp(1.75rem, 7.4vw, 2.7rem) * var(--echo-scale, 1));
    line-height: 1.36;
  }

  .folia-echo-orbit {
    width: 104vw;
  }
}

@media (prefers-reduced-motion: reduce) {
  .folia-echo-orbit i,
  .folia-echo-ring i,
  .folia-echo-beam i,
  .folia-echo-pendulum,
  .folia-echo-rail i {
    animation: none;
  }
}
</style>
