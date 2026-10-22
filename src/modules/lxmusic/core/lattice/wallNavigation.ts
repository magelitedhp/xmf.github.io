import {
  getLatticeGeometry,
  locateStepCandidates,
  type QueueInstance,
  type WallMetrics,
  type WallRect,
} from './layout'

export type WallDirection = 'up' | 'down' | 'left' | 'right'

type Axis = {
  along: 'x' | 'y'
  cross: 'y' | 'x'
  alongSize: 'width' | 'height'
  crossSize: 'height' | 'width'
  sign: 1 | -1
}

const AXES: Record<WallDirection, Axis> = {
  right: { along: 'x', cross: 'y', alongSize: 'width', crossSize: 'height', sign: 1 },
  left: { along: 'x', cross: 'y', alongSize: 'width', crossSize: 'height', sign: -1 },
  down: { along: 'y', cross: 'x', alongSize: 'height', crossSize: 'width', sign: 1 },
  up: { along: 'y', cross: 'x', alongSize: 'height', crossSize: 'width', sign: -1 },
}

const centerOf = (rect: WallRect, axis: 'x' | 'y', size: 'width' | 'height') =>
  rect[axis] + rect[size] / 2

const crossOverlap = (a: WallRect, b: WallRect, axis: Axis) => {
  const aStart = a[axis.cross]
  const bStart = b[axis.cross]
  return Math.min(aStart + a[axis.crossSize], bStart + b[axis.crossSize])
    - Math.max(aStart, bStart)
}

const alongGap = (from: WallRect, candidate: WallRect, axis: Axis) =>
  axis.sign === 1
    ? candidate[axis.along] - (from[axis.along] + from[axis.alongSize])
    : from[axis.along] - (candidate[axis.along] + candidate[axis.alongSize])

/** Port of `components/wall/wallNavigation.ts#pickAdjacentRect`. */
export function pickAdjacentRect<T>(
  source: WallRect,
  candidates: Iterable<{ value: T; rect: WallRect }>,
  direction: WallDirection,
  metrics: WallMetrics,
): T | null {
  const axis = AXES[direction]
  const missPenalty = metrics.cellSize + metrics.gap
  let best: T | null = null
  let bestScore = Number.POSITIVE_INFINITY
  let bestCross = Number.POSITIVE_INFINITY

  for (const { value, rect } of candidates) {
    const step = alongGap(source, rect, axis)
    if (step < 0) continue

    const overlap = crossOverlap(source, rect, axis)
    const score = step + (overlap > 0 ? 0 : -overlap * 2 + missPenalty)
    const crossDelta = Math.abs(
      centerOf(rect, axis.cross, axis.crossSize)
      - centerOf(source, axis.cross, axis.crossSize),
    )
    if (score < bestScore || (score === bestScore && crossDelta < bestCross)) {
      bestScore = score
      bestCross = crossDelta
      best = value
    }
  }

  return best
}

export function pickAdjacentInstance(
  from: QueueInstance,
  direction: WallDirection,
  candidates: QueueInstance[],
  metrics: WallMetrics,
  rendered?: Map<string, WallRect>,
): QueueInstance | null {
  const drawn = (instance: QueueInstance): QueueInstance => {
    const override = rendered?.get(instance.instanceId)
    return override ? { ...instance, ...override } : instance
  }

  return pickAdjacentRect(
    drawn(from),
    candidates
      .filter((candidate) => candidate.instanceId !== from.instanceId)
      .map((candidate) => ({ value: candidate, rect: drawn(candidate) })),
    direction,
    metrics,
  )
}

export function findAdjacentInstance(
  from: QueueInstance,
  direction: WallDirection,
  totalEntries: number,
  metrics: WallMetrics,
  rendered?: Map<string, WallRect>,
): QueueInstance | null {
  if (totalEntries <= 0) return null
  const geometry = getLatticeGeometry(totalEntries, metrics)
  return pickAdjacentInstance(
    from,
    direction,
    locateStepCandidates(geometry, totalEntries, from, metrics),
    metrics,
    rendered,
  )
}

export function findNearestInstance<T extends WallRect>(
  instances: readonly T[],
  point: { x: number; y: number },
): T | null {
  let best: T | null = null
  let bestDistance = Number.POSITIVE_INFINITY
  for (const instance of instances) {
    const dx = instance.x + instance.width / 2 - point.x
    const dy = instance.y + instance.height / 2 - point.y
    const distance = dx * dx + dy * dy
    if (distance < bestDistance) {
      bestDistance = distance
      best = instance
    }
  }
  return best
}
