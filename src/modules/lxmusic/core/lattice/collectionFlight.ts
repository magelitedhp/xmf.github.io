/**
 * Shared-element geometry and keyframes for a collection cover.
 *
 * Ported from Folia's `library/suites/grid/transitions/morphFlight.ts`. The
 * carrier is laid out at its destination, and every moving piece is expressed
 * as a transform keyframe. This keeps the flight off the layout path while the
 * collection page mounts underneath it.
 */

export interface CollectionMorphRect {
  x: number
  y: number
  width: number
  height: number
}

export interface CollectionMorphCard {
  rect: CollectionMorphRect
  radius: number
  url: string | null
  proportions: number
  shade: string | null
}

export interface CollectionFlightCapture {
  itemId: string
  cover: string
  title: string
  rect: CollectionMorphRect
  radius: number
  shade: string | null
}

export interface CollectionFlightTarget {
  rect: CollectionMorphRect
  radius: number
}

/** How long the card is in the air. Source: `FLIGHT_MS`. */
export const FLIGHT_MS = 460
/** How long the carrier dissolves over the card it has landed on. Source: `HANDOVER_MS`. */
export const HANDOVER_MS = 140
const SAMPLES = 32
const RESPONSE = 0.36
const DAMPING = 0.86

/** How far the flight has come, 0 to 1, at `time` of 0 to 1. */
export function flightProgress(time: number): number {
  if (time <= 0) return 0
  if (time >= 1) return 1
  const seconds = time * (FLIGHT_MS / 1000)
  const natural = (2 * Math.PI) / RESPONSE
  const damped = natural * Math.sqrt(1 - DAMPING * DAMPING)
  const decay = Math.exp(-DAMPING * natural * seconds)
  return 1 - decay * (
    Math.cos(damped * seconds)
    + ((DAMPING * natural) / damped) * Math.sin(damped * seconds)
  )
}

const between = (from: number, to: number, progress: number) =>
  from + (to - from) * progress
const rounded = (value: number) => Number(value.toFixed(4))

function coverSize(
  box: { width: number; height: number },
  proportions: number,
) {
  const width = Math.max(box.width, box.height * proportions)
  return { width, height: width / proportions }
}

function curve() {
  return Array.from({ length: SAMPLES }, (_, sample) => {
    const offset = sample / (SAMPLES - 1)
    return { offset, progress: flightProgress(offset) }
  })
}

function samplesOf(
  source: CollectionMorphRect,
  target: CollectionMorphRect,
) {
  return curve().map(({ offset, progress }) => {
    const width = between(source.width, target.width, progress)
    const height = between(source.height, target.height, progress)
    return {
      offset,
      progress,
      width,
      height,
      x: between(source.x, target.x, progress) - target.x,
      y: between(source.y, target.y, progress) - target.y,
      scaleX: width / target.width,
      scaleY: height / target.height,
    }
  })
}

export function flightBoxKeyframes(
  source: CollectionFlightTarget,
  target: CollectionFlightTarget,
): { box: Keyframe[]; corners: Keyframe[] } {
  const samples = samplesOf(source.rect, target.rect)
  return {
    box: samples.map(({ offset, x, y, scaleX, scaleY }) => ({
      offset,
      transform:
        `translate(${rounded(x)}px, ${rounded(y)}px) `
        + `scale(${rounded(scaleX)}, ${rounded(scaleY)})`,
    })),
    corners: samples.map(({ offset, progress, scaleX, scaleY }) => {
      const radius = Math.max(0, between(source.radius, target.radius, progress))
      return {
        offset,
        borderRadius:
          `${rounded(radius / scaleX)}px / ${rounded(radius / scaleY)}px`,
      }
    }),
  }
}

export function flightPictureKeyframes(
  source: CollectionMorphRect,
  target: CollectionMorphRect,
  proportions: number,
): {
  picture: CollectionMorphRect
  image: Keyframe[]
} {
  const shape = proportions > 0 && Number.isFinite(proportions)
    ? proportions
    : source.width / source.height
  const home = coverSize(target, shape)
  return {
    picture: {
      x: (target.width - home.width) / 2,
      y: (target.height - home.height) / 2,
      width: home.width,
      height: home.height,
    },
    image: samplesOf(source, target).map(
      ({ offset, width, height, scaleX, scaleY }) => {
        const cover = coverSize({ width, height }, shape).width / home.width
        return {
          offset,
          transform:
            `scale(${rounded(cover / scaleX)}, ${rounded(cover / scaleY)})`,
        }
      },
    ),
  }
}

export const flightTurn = {
  leaving: [
    { opacity: 1, offset: 0 },
    { opacity: 1, offset: 0.2 },
    { opacity: 0, offset: 0.7 },
    { opacity: 0, offset: 1 },
  ] satisfies Keyframe[],
  arriving: [
    { opacity: 0, offset: 0 },
    { opacity: 0, offset: 0.2 },
    { opacity: 1, offset: 0.7 },
    { opacity: 1, offset: 1 },
  ] satisfies Keyframe[],
}

export const flightFade = (
  from: number,
  to: number,
  start: number,
  end: number,
): Keyframe[] => [
  { opacity: from, offset: 0 },
  ...(start > 0 ? [{ opacity: from, offset: start }] : []),
  ...(end < 1 ? [{ opacity: to, offset: end }] : []),
  { opacity: to, offset: 1 },
]

const edgeSwell = (
  peak: number,
  rise: { from: number; to: number },
  fall: { from: number; to: number },
): Keyframe[] => [
  { opacity: 0, offset: 0 },
  ...(rise.from > 0 ? [{ opacity: 0, offset: rise.from }] : []),
  { opacity: peak, offset: rise.to },
  { opacity: peak, offset: fall.from },
  ...(fall.to < 1 ? [{ opacity: 0, offset: fall.to }] : []),
  { opacity: 0, offset: 1 },
]

const EDGE_PEAK = 0.9
export const flightEdge = {
  stays: edgeSwell(EDGE_PEAK, { from: 0, to: 0.16 }, { from: 0.6, to: 1 }),
  comes: edgeSwell(EDGE_PEAK, { from: 0.1, to: 0.4 }, { from: 0.6, to: 1 }),
  goes: edgeSwell(EDGE_PEAK, { from: 0, to: 0.16 }, { from: 0.45, to: 0.8 }),
}

export const NO_LANDING_SCALE = 0.86
