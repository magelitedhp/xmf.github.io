type PixiModule = typeof import('pixi.js')

import { installPixiFilterPoolCompat } from './pixiFilterPoolCompat'

/**
 * Must be awaited before any renderer, filter or shader is constructed: Pixi
 * caches compiled programs, so a program built before this flip would keep its
 * mediump variant.
 */
export async function loadPixi(): Promise<PixiModule> {
  const pixi = await import('pixi.js')
  installPixiFilterPoolCompat(pixi)
  pixi.GlProgram.defaultOptions.preferredFragmentPrecision = 'highp'
  return pixi
}
