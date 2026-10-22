export const sectors = [
  { id: 'orbit', name: '近地轨道', subtitle: '给好奇心一次温柔的着陆', rows: 9, cols: 9, mines: 10, code: 'SECTOR 01' },
  { id: 'nebula', name: '星云深处', subtitle: '在光与尘埃之间寻找秩序', rows: 12, cols: 12, mines: 26, code: 'SECTOR 02' },
  { id: 'horizon', name: '事件视界', subtitle: '宇宙很安静，每一步都算数', rows: 16, cols: 16, mines: 52, code: 'SECTOR 03' },
] as const

export type SectorId = (typeof sectors)[number]['id']
export type Phase = 'ready' | 'playing' | 'paused' | 'won' | 'lost'
export interface Cell { mine: boolean; adjacent: number; revealed: boolean; mark: 0 | 1 | 2; delay: number }
export interface Expedition {
  sector: SectorId
  seed: number
  daily: boolean
  day: string
  phase: Phase
  planted: boolean
  cells: Cell[]
  moves: number
  probes: number
  detonated: number
}
export interface SweepEvent { kind: 'reveal' | 'flag' | 'chord' | 'probe' | 'none'; opened: number[]; detonated: number }

export function sectorFor(id: SectorId) { return sectors.find((sector) => sector.id === id) ?? sectors[0] }

export function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = Math.imul(state ^ state >>> 15, state | 1)
    value ^= value + Math.imul(value ^ value >>> 7, value | 61)
    return ((value ^ value >>> 14) >>> 0) / 4294967296
  }
}

export function dailySeed(day: string, sector: SectorId) {
  let seed = 2166136261
  for (const char of `${day}/${sector}`) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619)
  return seed >>> 0
}

export function createExpedition(sector: SectorId, seed: number, daily = false, day = ''): Expedition {
  const { rows, cols } = sectorFor(sector)
  return {
    sector, seed: seed >>> 0, daily, day, phase: 'ready', planted: false,
    cells: Array.from({ length: rows * cols }, () => ({ mine: false, adjacent: 0, revealed: false, mark: 0, delay: 0 })),
    moves: 0, probes: 0, detonated: -1,
  }
}

export function neighbors(game: Expedition, index: number): number[] {
  const { rows, cols } = sectorFor(game.sector)
  const row = Math.floor(index / cols), col = index % cols
  const result: number[] = []
  for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
    if ((!dx && !dy) || row + dy < 0 || row + dy >= rows || col + dx < 0 || col + dx >= cols) continue
    result.push((row + dy) * cols + col + dx)
  }
  return result
}

function plant(game: Expedition, first: number) {
  const safe = new Set([first, ...neighbors(game, first)])
  const candidates = game.cells.map((_, index) => index).filter((index) => !safe.has(index))
  const random = seededRandom(game.seed)
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1))
    ;[candidates[index], candidates[other]] = [candidates[other], candidates[index]]
  }
  candidates.slice(0, sectorFor(game.sector).mines).forEach((index) => { game.cells[index].mine = true })
  game.cells.forEach((cell, index) => { cell.adjacent = neighbors(game, index).filter((neighbor) => game.cells[neighbor].mine).length })
  game.planted = true
  game.phase = 'playing'
}

export function flagCount(game: Expedition) { return game.cells.filter((cell) => cell.mark === 1).length }
export function openCount(game: Expedition) { return game.cells.filter((cell) => cell.revealed && !cell.mine).length }
export function isActive(game: Expedition) { return game.phase === 'ready' || game.phase === 'playing' }
const emptyEvent = (): SweepEvent => ({ kind: 'none', opened: [], detonated: -1 })

function uncover(game: Expedition, targets: number[], origin: number, kind: SweepEvent['kind']): SweepEvent {
  const event: SweepEvent = { kind, opened: [], detonated: -1 }
  const queue = [...targets]
  const visited = new Set<number>()
  const { cols, rows, mines } = sectorFor(game.sector)
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor]
    if (visited.has(index)) continue
    visited.add(index)
    const cell = game.cells[index]
    if (!cell || cell.revealed || cell.mark === 1) continue
    if (cell.mine) {
      game.phase = 'lost'
      game.detonated = index
      cell.revealed = true
      event.detonated = index
      break
    }
    cell.revealed = true
    cell.mark = 0
    cell.delay = Math.min(440, Math.hypot(index % cols - origin % cols, Math.floor(index / cols) - Math.floor(origin / cols)) * 32)
    event.opened.push(index)
    if (!cell.adjacent) queue.push(...neighbors(game, index))
  }
  if (game.phase !== 'lost' && openCount(game) === rows * cols - mines) {
    game.phase = 'won'
    game.cells.forEach((cell) => { if (cell.mine) cell.mark = 1 })
  }
  if (event.opened.length || event.detonated >= 0) game.moves += 1
  else event.kind = 'none'
  return event
}

export function reveal(game: Expedition, index: number): SweepEvent {
  const cell = game.cells[index]
  if (!isActive(game) || !cell || cell.mark === 1) return emptyEvent()
  if (cell.revealed) return chord(game, index)
  if (!game.planted) plant(game, index)
  return uncover(game, [index], index, 'reveal')
}

export function chord(game: Expedition, index: number): SweepEvent {
  const cell = game.cells[index]
  if (game.phase !== 'playing' || !cell?.revealed || !cell.adjacent || cell.mine) return emptyEvent()
  const adjacent = neighbors(game, index)
  if (adjacent.filter((neighbor) => game.cells[neighbor].mark === 1).length !== cell.adjacent) return emptyEvent()
  return uncover(game, adjacent, index, 'chord')
}

export function mark(game: Expedition, index: number): SweepEvent {
  const cell = game.cells[index]
  if (!isActive(game) || !cell || cell.revealed) return emptyEvent()
  cell.mark = ((cell.mark + 1) % 3) as Cell['mark']
  game.moves += 1
  return { kind: 'flag', opened: [], detonated: -1 }
}

/** A limited, explicitly assisted action: reveal a real safe cell, never guess. */
export function probe(game: Expedition): SweepEvent {
  if (!isActive(game) || game.probes >= 3) return emptyEvent()
  const { cols, rows } = sectorFor(game.sector)
  if (!game.planted) {
    const center = Math.floor(rows / 2) * cols + Math.floor(cols / 2)
    game.cells[center].mark = 0
    game.probes += 1
    const event = reveal(game, center)
    event.kind = 'probe'
    return event
  }
  const eligible = game.cells.map((cell, index) => ({ cell, index }))
    .filter(({ cell }) => !cell.mine && !cell.revealed && cell.mark !== 1)
  eligible.sort((a, b) => {
    const aBoundary = neighbors(game, a.index).some((neighbor) => game.cells[neighbor].revealed) ? 0 : 1
    const bBoundary = neighbors(game, b.index).some((neighbor) => game.cells[neighbor].revealed) ? 0 : 1
    return aBoundary - bBoundary || a.cell.adjacent - b.cell.adjacent || a.index - b.index
  })
  if (!eligible.length) return emptyEvent()
  game.probes += 1
  return uncover(game, [eligible[0].index], eligible[0].index, 'probe')
}

/** Stored state is untrusted: validate board geometry and all adjacency counts. */
export function restoreExpedition(value: unknown): Expedition | null {
  if (!value || typeof value !== 'object') return null
  const game = value as Expedition
  if (!sectors.some((sector) => sector.id === game.sector)) return null
  const { rows, cols, mines } = sectorFor(game.sector)
  if (!Array.isArray(game.cells) || game.cells.length !== rows * cols) return null
  if (!Number.isInteger(game.seed) || game.seed < 0 || game.seed > 0xffffffff) return null
  if (typeof game.daily !== 'boolean' || typeof game.day !== 'string' || typeof game.planted !== 'boolean') return null
  if (!['ready', 'playing', 'paused', 'won', 'lost'].includes(game.phase)) return null
  if (!Number.isInteger(game.moves) || game.moves < 0 || !Number.isInteger(game.probes) || game.probes < 0 || game.probes > 3) return null
  if (!Number.isInteger(game.detonated) || game.detonated < -1 || game.detonated >= game.cells.length) return null
  if (game.cells.some((cell) => !cell || typeof cell.mine !== 'boolean' || typeof cell.revealed !== 'boolean'
    || ![0, 1, 2].includes(cell.mark) || !Number.isInteger(cell.adjacent) || cell.adjacent < 0 || cell.adjacent > 8
    || !Number.isFinite(cell.delay) || cell.delay < 0 || cell.delay > 440)) return null
  if (game.planted) {
    if (game.phase === 'ready' || game.cells.filter((cell) => cell.mine).length !== mines) return null
    if (game.cells.some((cell, index) => cell.adjacent !== neighbors(game, index).filter((neighbor) => game.cells[neighbor].mine).length)) return null
    const revealedMines = game.cells.filter((cell) => cell.mine && cell.revealed).length
    if (game.phase === 'lost' ? game.detonated < 0 || !game.cells[game.detonated].mine || !revealedMines : revealedMines > 0 || game.detonated !== -1) return null
    if ((game.phase === 'won') !== (openCount(game) === rows * cols - mines)) return null
  } else if (game.phase !== 'ready' || game.probes || game.detonated !== -1 || game.cells.some((cell) => cell.mine || cell.revealed || cell.adjacent)) return null
  return JSON.parse(JSON.stringify(game)) as Expedition
}
