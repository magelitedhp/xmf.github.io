/**
 * Geometry for the wall-tools queue island. Ported from Folia's
 * `components/wall/queueDragGeometry.ts`.
 */

export const QUEUE_ISLAND_ROW_HEIGHT = 40
export const QUEUE_DRAG_THRESHOLD_PX = 4
export const QUEUE_AUTOSCROLL_EDGE_PX = 32
export const QUEUE_AUTOSCROLL_MAX_SPEED = 14

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export function resolveDropIndex({
  centerY,
  rowHeight = QUEUE_ISLAND_ROW_HEIGHT,
  rowCount,
}: {
  centerY: number
  rowHeight?: number
  rowCount: number
}) {
  if (rowCount <= 0 || !Number.isFinite(centerY)) return 0
  return clamp(Math.floor(centerY / rowHeight), 0, rowCount - 1)
}

export function queueRowShift(
  index: number,
  from: number,
  to: number,
  rowHeight = QUEUE_ISLAND_ROW_HEIGHT,
) {
  if (index === from || from === to) return 0
  if (from < to && index > from && index <= to) return -rowHeight
  if (to < from && index >= to && index < from) return rowHeight
  return 0
}

const autoScrollZone = (top: number, bottom: number, edge: number) =>
  Math.min(edge, Math.max(0, (bottom - top) / 2))

export type QueueAutoScrollEdge = 'top' | 'bottom'

export function autoScrollEdgeAt({
  pointerY,
  top,
  bottom,
  edge = QUEUE_AUTOSCROLL_EDGE_PX,
}: {
  pointerY: number
  top: number
  bottom: number
  edge?: number
}): QueueAutoScrollEdge | null {
  const zone = autoScrollZone(top, bottom, edge)
  if (zone <= 0) return null
  if (pointerY < top + zone) return 'top'
  if (pointerY > bottom - zone) return 'bottom'
  return null
}

export function autoScrollVelocity({
  pointerY,
  top,
  bottom,
  edge = QUEUE_AUTOSCROLL_EDGE_PX,
  maxSpeed = QUEUE_AUTOSCROLL_MAX_SPEED,
}: {
  pointerY: number
  top: number
  bottom: number
  edge?: number
  maxSpeed?: number
}) {
  const zone = autoScrollZone(top, bottom, edge)
  if (zone <= 0) return 0
  if (pointerY < top + zone) {
    const depth = clamp((top + zone - pointerY) / zone, 0, 1)
    return -maxSpeed * depth
  }
  if (pointerY > bottom - zone) {
    const depth = clamp((pointerY - (bottom - zone)) / zone, 0, 1)
    return maxSpeed * depth
  }
  return 0
}

export function resolveAutoScroll({
  pointerY,
  top,
  bottom,
  suppressedEdge,
  edge = QUEUE_AUTOSCROLL_EDGE_PX,
  maxSpeed = QUEUE_AUTOSCROLL_MAX_SPEED,
}: {
  pointerY: number
  top: number
  bottom: number
  suppressedEdge: QueueAutoScrollEdge | null
  edge?: number
  maxSpeed?: number
}) {
  if (
    suppressedEdge !== null
    && autoScrollEdgeAt({ pointerY, top, bottom, edge }) === suppressedEdge
  ) {
    return { velocity: 0, suppressedEdge }
  }
  return {
    velocity: autoScrollVelocity({ pointerY, top, bottom, edge, maxSpeed }),
    suppressedEdge: null,
  }
}
