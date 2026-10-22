import type { BindGroup, Texture } from 'pixi.js'

// Pixi 8.21.0 prunes screen-sized textures while FilterSystem still references
// the previous pass. The shim is version-gated so a future Pixi release can keep
// its own fixes when this app upgrades.
type PixiModule = typeof import('pixi.js')
const PATCHED = Symbol.for('folia.pixi821FilterPoolCompat')

interface FilterSystemCompat {
  _globalFilterBindGroup: BindGroup
  _filterStack: { inputTexture: Texture | null }[]
  _filterStackIndex: number
  init?: () => void
  push: (instruction: unknown) => void
  destroy: () => void
  [PATCHED]?: boolean
}

interface TexturePoolCompat {
  _poolKey: Record<number, number | undefined>
  _buckets: Map<number, Texture[]>
  _dropTextures: (textures: Texture[], destroy: boolean) => void
  returnTexture: (texture: Texture, resetStyle?: boolean) => void
}

export function installPixiFilterPoolCompat(pixi: PixiModule) {
  if ((pixi.VERSION as string) !== '8.21.0') return
  const prototype = pixi.FilterSystem.prototype as unknown as FilterSystemCompat
  if (prototype[PATCHED]) return
  prototype[PATCHED] = true

  const groups = new Set<BindGroup>()
  const pool = pixi.TexturePool as unknown as TexturePoolCompat
  const unbindPassTextures = () => {
    const source = pixi.Texture.EMPTY.source
    groups.forEach((group) => {
      group.setResource(source, 1)
      group.setResource(source.style, 2)
      group.setResource(source, 3)
    })
  }

  const init = prototype.init
  prototype.init = function () {
    init?.call(this)
    groups.add(this._globalFilterBindGroup)
  }

  const destroy = prototype.destroy
  prototype.destroy = function () {
    groups.delete(this._globalFilterBindGroup)
    this._globalFilterBindGroup.destroy()
    destroy.call(this)
  }

  const push = prototype.push
  prototype.push = function (instruction) {
    const entry = this._filterStack[this._filterStackIndex]
    if (entry) entry.inputTexture = null
    push.call(this, instruction)
  }

  const dropTextures = pool._dropTextures
  pool._dropTextures = function (textures, shouldDestroy) {
    if (shouldDestroy && textures.length > 0) unbindPassTextures()
    dropTextures.call(this, textures, shouldDestroy)
  }

  const returnTexture = pool.returnTexture
  pool.returnTexture = function (texture, resetStyle) {
    const key = this._poolKey[texture.uid]
    if (key !== undefined && !this._buckets.has(key)) unbindPassTextures()
    returnTexture.call(this, texture, resetStyle)
  }
}
