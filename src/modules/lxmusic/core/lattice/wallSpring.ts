/**
 * Spring curves for the poster wall.
 *
 * Framer Motion runs one spring per motion value, with a rest threshold that depends
 * on that value's own travel. The wall ports those values to the Web Animations API
 * by sampling the same analytic spring at 120 Hz, so every property can finish on
 * its own curve instead of sharing one normalized progress curve. The spring's
 * duration matches `calcGeneratorDuration()` (a 50 ms probe); a WAAPI sample can
 * still pin to the target on an earlier frame when the generator itself is done.
 */

export interface WallSpringOptions {
  stiffness: number
  damping: number
  mass?: number
  velocity?: number
  restSpeed?: number
  restDelta?: number
}

export interface WallSpring {
  from: number
  to: number
  /** Sample at `timeMs`; values are already pinned to the target after settling. */
  at: (timeMs: number) => number
  /** First 120 Hz frame at which Framer's distance and speed thresholds are met. */
  durationMs: number
  /** Sample count including both the origin and the settled target. */
  frameCount: number
}

const FRAME_MS = 1000 / 120
const MAX_SETTLE_MS = 10_000
// `calcGeneratorDuration()` in motion-dom probes a spring every 50 ms and that
// probe result is the animation's real duration. The analytic curve itself is
// still sampled at 120 Hz for WAAPI.
const DURATION_STEP_MS = 50

function springState(
  from: number,
  to: number,
  { stiffness, damping, mass = 1, velocity = 0 }: WallSpringOptions,
) {
  const initialDelta = to - from
  const ratio = damping / (2 * Math.sqrt(stiffness * mass))
  // motion-dom integrates springs in milliseconds.
  const angular = Math.sqrt(stiffness / mass) / 1000
  const initialVelocity = velocity / 1000
  const decay = ratio * angular

  if (Math.abs(initialDelta) < 1e-9 && Math.abs(velocity) < 1e-9) {
    return {
      valueAt: () => to,
      velocityAt: () => 0,
    }
  }

  if (ratio < 1 - 1e-9) {
    const damped = angular * Math.sqrt(1 - ratio * ratio)
    const coefficient = (initialVelocity + decay * initialDelta) / damped
    return {
      valueAt: (time: number) => {
        const envelope = Math.exp(-decay * time)
        return to - envelope * (
          coefficient * Math.sin(damped * time)
          + initialDelta * Math.cos(damped * time)
        )
      },
      // Units per second, matching Framer's `restSpeed`.
      velocityAt: (time: number) => {
        const envelope = Math.exp(-decay * time)
        const sinCoefficient = decay * coefficient + initialDelta * damped
        const cosCoefficient = decay * initialDelta - coefficient * damped
        return 1000 * envelope * (
          sinCoefficient * Math.sin(damped * time)
          + cosCoefficient * Math.cos(damped * time)
        )
      },
    }
  }

  if (Math.abs(ratio - 1) <= 1e-9) {
    const coefficient = initialVelocity + angular * initialDelta
    return {
      valueAt: (time: number) =>
        to - Math.exp(-angular * time) * (initialDelta + coefficient * time),
      velocityAt: (time: number) =>
        1000 * Math.exp(-angular * time)
          * (angular * coefficient * time - initialVelocity),
    }
  }

  const damped = angular * Math.sqrt(ratio * ratio - 1)
  return {
    valueAt: (time: number) => {
      const envelope = Math.exp(-decay * time)
      const frequency = Math.min(damped * time, 300)
      return to - envelope * (
        (initialVelocity + decay * initialDelta) * Math.sinh(frequency)
        + damped * initialDelta * Math.cosh(frequency)
      ) / damped
    },
    velocityAt: (time: number) => {
      const envelope = Math.exp(-decay * time)
      const frequency = Math.min(damped * time, 300)
      const hyperbolicPosition = (initialVelocity + decay * initialDelta) / damped
      const sinhCoefficient = decay * hyperbolicPosition - initialDelta * damped
      const coshCoefficient = decay * initialDelta - hyperbolicPosition * damped
      return 1000 * envelope * (
        sinhCoefficient * Math.sinh(frequency)
        + coshCoefficient * Math.cosh(frequency)
      )
    },
  }
}

export function createWallSpring(
  from: number,
  to: number,
  options: WallSpringOptions,
): WallSpring {
  const travel = Math.abs(to - from)
  // Framer switches to its granular thresholds when a value travels less than 5
  // units. This is why a 0.12 scale spring settles independently of a 90px lift.
  const restSpeed = options.restSpeed ?? (travel < 5 ? 0.01 : 2)
  const restDelta = options.restDelta ?? (travel < 5 ? 0.005 : 0.5)
  const state = springState(from, to, options)
  const settled = (timeMs: number) => (
    Math.abs(to - state.valueAt(timeMs)) <= restDelta
    && Math.abs(state.velocityAt(timeMs)) <= restSpeed
  )

  let durationMs = 0
  if (travel > 1e-9 || Math.abs(options.velocity ?? 0) > 1e-9) {
    durationMs = MAX_SETTLE_MS
    for (
      let timeMs = DURATION_STEP_MS;
      timeMs <= MAX_SETTLE_MS + 1e-6;
      timeMs += DURATION_STEP_MS
    ) {
      if (settled(timeMs)) {
        durationMs = Math.min(timeMs, MAX_SETTLE_MS)
        break
      }
    }
  }

  const frameCount = Math.max(1, Math.round(durationMs / FRAME_MS) + 1)
  const settledFrames = durationMs > 0 ? frameCount - 1 : 0

  return {
    from,
    to,
    durationMs,
    frameCount,
    at: (timeMs: number) => {
      if (timeMs >= durationMs) return to
      if (timeMs <= 0 || settledFrames === 0) return from
      // JSAnimation marks a spring `done` at the first frame where its generator
      // meets the thresholds, even when the rounded 50 ms duration has not elapsed.
      return settled(timeMs) ? to : state.valueAt(timeMs)
    },
  }
}

export function sampleWallSpring(spring: WallSpring): number[] {
  return Array.from({ length: spring.frameCount }, (_, index) => {
    if (index === spring.frameCount - 1) return spring.to
    if (spring.durationMs <= 0) return spring.from
    return spring.at(index * FRAME_MS)
  })
}

export function wallSpringDurationMs(spring: WallSpring) {
  return Math.max(spring.durationMs, spring.frameCount > 1 ? FRAME_MS : 0)
}

export { FRAME_MS as WALL_SPRING_FRAME_MS }
