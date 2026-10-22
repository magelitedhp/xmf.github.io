import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import postcss from 'postcss'

const directory = new URL('../src/modules/game/games/minesweeper/', import.meta.url)
const module = { exports: {} }
runInNewContext(ts.transpileModule(readFileSync(new URL('engine.ts', directory), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { module, exports: module.exports })
const { sectors, sectorFor, createExpedition, neighbors, reveal, mark, chord, probe, dailySeed, openCount, restoreExpedition } = module.exports
const clone = (value) => JSON.parse(JSON.stringify(value))

test('all sectors: first click and its neighborhood are safe, counts and flood fill are valid', () => {
  for (const sector of sectors) for (let seed = 0; seed < 40; seed++) {
    const size = sector.rows * sector.cols
    for (const first of [0, size - 1, Math.floor(size / 2)]) {
      const game = createExpedition(sector.id, seed)
      const event = reveal(game, first)
      assert.equal(game.cells.filter((cell) => cell.mine).length, sector.mines)
      assert.equal(game.cells[first].adjacent, 0)
      for (const index of [first, ...neighbors(game, first)]) assert.equal(game.cells[index].mine, false)
      game.cells.forEach((cell, index) => {
        assert.equal(cell.adjacent, neighbors(game, index).filter((n) => game.cells[n].mine).length)
        assert.ok(!cell.revealed || !cell.mine)
      })
      assert.ok(event.opened.length >= neighbors(game, first).length + 1)
      assert.ok(restoreExpedition(game))
    }
  }
})

test('neighbors never wrap across row edges', () => {
  const game = createExpedition('orbit', 1)
  assert.deepEqual(Array.from(neighbors(game, 0)), [1, 9, 10])
  assert.deepEqual(Array.from(neighbors(game, 8)), [7, 16, 17])
  assert.equal(neighbors(game, 40).length, 8)
})

test('daily seeds reproduce the same board for the same date and sector', () => {
  const boards = [0, 1].map(() => {
    const game = createExpedition('nebula', dailySeed('2026-10-22', 'nebula'), true, '2026-10-22')
    reveal(game, 78)
    return clone(game)
  })
  assert.deepEqual(boards[0], boards[1])
  assert.notEqual(dailySeed('2026-10-22', 'nebula'), dailySeed('2026-10-23', 'nebula'))
  assert.notEqual(dailySeed('2026-10-22', 'nebula'), dailySeed('2026-10-22', 'orbit'))
})

test('flags cycle through flag, question, clear and protect against accidental opening', () => {
  const game = createExpedition('orbit', 17)
  mark(game, 40)
  assert.equal(game.cells[40].mark, 1)
  assert.equal(reveal(game, 40).kind, 'none')
  assert.equal(game.planted, false)
  mark(game, 40)
  assert.equal(game.cells[40].mark, 2)
  mark(game, 40)
  assert.equal(game.cells[40].mark, 0)
  reveal(game, 40)
  assert.equal(mark(game, 40).kind, 'none')
})

function chordFixture() {
  for (let seed = 0; seed < 100; seed++) {
    const game = createExpedition('orbit', seed)
    reveal(game, 40)
    const index = game.cells.findIndex((cell, i) => cell.revealed && cell.adjacent && neighbors(game, i).some((n) => !game.cells[n].mine && !game.cells[n].revealed))
    if (index >= 0) return { game, index }
  }
  throw new Error('No chord fixture')
}

test('correct flag chord opens safe neighbors; insufficient flags do nothing', () => {
  const { game, index } = chordFixture()
  assert.equal(chord(game, index).kind, 'none')
  for (const n of neighbors(game, index)) if (game.cells[n].mine) mark(game, n)
  const event = chord(game, index)
  assert.ok(event.opened.length > 0)
  assert.notEqual(game.phase, 'lost')
  assert.ok(event.opened.every((i) => !game.cells[i].mine))
})

test('incorrect flags can detonate during a chord', () => {
  const { game, index } = chordFixture()
  const around = neighbors(game, index)
  const mine = around.find((n) => game.cells[n].mine)
  const wrong = around.find((n) => !game.cells[n].mine && !game.cells[n].revealed)
  for (const n of around) if (game.cells[n].mine && n !== mine) mark(game, n)
  mark(game, wrong)
  assert.ok(chord(game, index).detonated >= 0)
  assert.equal(game.phase, 'lost')
  assert.ok(restoreExpedition(game))
})

test('three probes are safe and limited, including assisted first move', () => {
  const game = createExpedition('horizon', 7)
  for (let i = 0; i < 3; i++) {
    const event = probe(game)
    assert.equal(event.kind, 'probe')
    assert.ok(event.opened.length > 0)
    assert.ok(event.opened.every((index) => !game.cells[index].mine))
  }
  assert.equal(game.probes, 3)
  const previous = clone(game)
  assert.equal(probe(game).kind, 'none')
  assert.deepEqual(clone(game), previous)
})

test('pause prevents all gameplay mutations and safe completion wins without manual flags', () => {
  const game = createExpedition('orbit', 11)
  reveal(game, 40)
  game.phase = 'paused'
  const previous = clone(game)
  for (let index = 0; index < 81; index++) { reveal(game, index); mark(game, index); chord(game, index) }
  probe(game)
  assert.deepEqual(clone(game), previous)
  game.phase = 'playing'
  game.cells.forEach((cell, index) => { if (!cell.mine && !cell.revealed) reveal(game, index) })
  assert.equal(game.phase, 'won')
  assert.equal(openCount(game), 71)
  assert.ok(game.cells.filter((cell) => cell.mine).every((cell) => cell.mark === 1))
  assert.ok(restoreExpedition(game))
  const won = clone(game)
  reveal(game, 0); mark(game, 0); probe(game)
  assert.deepEqual(clone(game), won)
})

test('direct detonation ends play; invalid indices are harmless', () => {
  const game = createExpedition('orbit', 19)
  assert.equal(reveal(game, -1).kind, 'none')
  assert.equal(mark(game, 99).kind, 'none')
  reveal(game, 40)
  const index = game.cells.findIndex((cell) => cell.mine)
  assert.equal(reveal(game, index).detonated, index)
  assert.equal(game.phase, 'lost')
  assert.equal(probe(game).kind, 'none')
})

test('saved state is cloned and malformed or inconsistent boards are rejected', () => {
  const game = createExpedition('orbit', 19)
  assert.ok(restoreExpedition(game))
  reveal(game, 40)
  const restored = restoreExpedition(game)
  assert.ok(restored)
  restored.cells[0].mark = 2
  assert.notEqual(game.cells[0].mark, 2)
  for (const mutate of [
    (g) => g.cells.pop(), (g) => g.sector = 'unknown', (g) => g.seed = -1,
    (g) => g.cells[0].adjacent = 9, (g) => g.cells[0].mine = !g.cells[0].mine,
    (g) => g.probes = 4, (g) => g.phase = 'won', (g) => g.phase = 'ready',
    (g) => g.cells[0].delay = Infinity, (g) => g.detonated = 40,
  ]) { const bad = clone(game); mutate(bad); assert.equal(restoreExpedition(bad), null) }
  for (const bad of [null, {}, [], 'oops']) assert.equal(restoreExpedition(bad), null)
})

test('game registration is unique, Vue templates compile and CSS parses without a build', () => {
  const entries = readFileSync(new URL('../src/modules/game/data/games.ts', import.meta.url), 'utf8')
  assert.equal(entries.match(/slug: 'minesweeper'/g)?.length, 1)
  for (const filename of ['Minesweeper.vue', 'SweepIcon.vue']) {
    const { descriptor, errors } = parse(readFileSync(new URL(filename, directory), 'utf8'))
    assert.deepEqual(errors, [])
    const script = compileScript(descriptor, { id: filename })
    const template = compileTemplate({ source: descriptor.template.content, filename, id: filename, compilerOptions: { bindingMetadata: script.bindings } })
    assert.deepEqual(template.errors, [])
  }
  assert.ok(postcss.parse(readFileSync(new URL('minesweeper.css', directory), 'utf8')).nodes.length > 0)
  assert.equal(sectorFor('horizon').mines, 52)
})
