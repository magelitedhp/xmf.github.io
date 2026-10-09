import type { PeaKind } from '../art/items'
import { zombieScale } from '../art/zombies'
import { CELL_H, CELL_W, COLS, LAWN_R, LAWN_X, LAWN_Y, ROWS, VIEW_W, colAt, rowFeet } from '../config'
import { PLANTS } from '../data/plants'
import { clamp, easeInOut, lerp, rand } from '../util'
import type { Battle } from './battle'
import type { Plant, Zombie } from './types'

const BLAST_HALF = 1.5 * CELL_W + 14

function remove(b: Battle, p: Plant) {
  p.dead = true
  if (b.grid[p.row][p.col] === p) b.grid[p.row][p.col] = null
}

function ahead(b: Battle, row: number, x: number) {
  for (const z of b.zombies) if (z.row === row && b.targetable(z) && z.x > x - 10) return z
  return null
}

function frontmost(b: Battle, row: number, x: number) {
  let best: Zombie | null = null
  for (const z of b.zombies) {
    if (z.row !== row || !b.targetable(z) || z.x < x - 10) continue
    if (!best || z.x < best.x) best = z
  }
  return best
}

function shoot(b: Battle, kind: PeaKind, row: number, x: number, y: number, ty = y) {
  b.shots.push({ kind, row, x, y, ty, dmg: kind === 'fire' ? 40 : 20, torch: -1, t: 0, dead: false })
  b.sfx('shoot')
}

// ------------------------------------------------------------------ plants

export function updatePlant(b: Battle, p: Plant, dt: number, live: boolean) {
  p.age += dt
  p.flash = Math.max(0, p.flash - dt)
  p.anim = Math.max(0, p.anim - dt)
  if (!live) return
  switch (p.id) {
    case 'peashooter':
    case 'snowpea':
    case 'repeater': {
      const kind: PeaKind = p.id === 'snowpea' ? 'snow' : 'pea'
      p.timer -= dt
      if (p.timer2 >= 0) {
        p.timer2 -= dt
        if (p.timer2 < 0) {
          shoot(b, kind, p.row, p.x + 40, p.y - 61)
          p.anim = 0.2
          p.timer2 = -1
        }
      }
      if (p.timer <= 0) {
        if (ahead(b, p.row, p.x)) {
          shoot(b, kind, p.row, p.x + 40, p.y - 61)
          p.anim = 0.2
          p.timer = 1.4 + rand(-0.06, 0.06)
          if (p.id === 'repeater') p.timer2 = 0.2
        } else p.timer = 0.12
      }
      break
    }
    case 'threepeater': {
      p.timer -= dt
      if (p.timer > 0) break
      const lanes = [p.row - 1, p.row, p.row + 1].filter((r) => r >= 0 && r < ROWS && b.level.rows.includes(r))
      if (!lanes.some((r) => ahead(b, r, p.x))) {
        p.timer = 0.12
        break
      }
      for (const r of lanes) {
        const head = r < p.row ? { x: p.x + 31, y: p.y - 92 } : r > p.row ? { x: p.x + 51, y: p.y - 50 } : { x: p.x + 5, y: p.y - 56 }
        shoot(b, 'pea', r, head.x, head.y, rowFeet(r) - 58)
      }
      p.anim = 0.2
      p.timer = 1.4 + rand(-0.06, 0.06)
      break
    }
    case 'sunflower':
      p.timer -= dt
      if (p.timer < 1) p.anim = Math.max(p.anim, 1 - p.timer)
      if (p.timer <= 0) {
        b.sunflowerSun(p)
        p.timer = 24 + rand(-1, 1)
        p.anim = 1
      }
      break
    case 'cherry':
      p.stateT += dt
      if (p.stateT >= 1.1) {
        remove(b, p)
        b.explode(p.x, p.y - 40, p.row, 1, BLAST_HALF)
      }
      break
    case 'jalapeno':
      p.stateT += dt
      if (p.stateT >= 1.0) {
        remove(b, p)
        b.burnRow(p.row)
      }
      break
    case 'potato':
      p.stateT += dt
      if (p.state === 'arming' && p.stateT >= 15) {
        p.state = 'armed'
        b.dirt(p.x, p.y, 10)
        b.sfx('pop')
      } else if (p.state === 'armed') {
        const trig = b.zombies.some((z) => z.row === p.row && b.isAlive(z) && z.lift < 6 && z.state !== 'fly' && Math.abs(z.x - 22 * zombieScale(z.id) - p.x) < 40)
        if (trig) {
          remove(b, p)
          for (const z of b.zombies) {
            if (z.row === p.row && b.isAlive(z) && z.lift < 30 && Math.abs(z.x - 10 - p.x) < 82) b.damage(z, 1800, 'blast')
          }
          b.burst('boom', p.x, p.y - 20, { size: 100 })
          b.dirt(p.x, p.y, 20)
          b.particles.push(b.particle('text', p.x, p.y - 80, { text: '砰！', life: 1.1, size: 44, color: '#fff2c4' }))
          b.shake = Math.max(b.shake, 0.35)
          b.sfx('explode')
        }
      }
      break
    case 'chomper':
      updateChomper(b, p, dt)
      break
    case 'squash':
      updateSquash(b, p, dt)
      break
    case 'spikeweed': {
      p.timer -= dt
      if (p.timer > 0) break
      let hit = false
      for (const z of b.zombies) {
        if (z.row !== p.row || !b.isAlive(z) || z.state === 'fly' || z.lift > 10) continue
        if (Math.abs(z.x - 14 * zombieScale(z.id) - p.x) > 54) continue
        b.damage(z, 20, 'spike')
        hit = true
      }
      p.timer = hit ? 1 : 0.1
      if (hit) p.anim = 0.25
      break
    }
    case 'cabbage': {
      p.timer -= dt
      if (p.timer > 0) break
      const z = frontmost(b, p.row, p.x)
      if (!z) {
        p.timer = 0.2
        break
      }
      b.lobs.push({ row: p.row, x0: p.x + 18, y0: p.y - 86, target: z.uid, tx: z.x, ty: z.y - 60, t: 0, dur: 1, dmg: 40, dead: false })
      b.sfx('lob')
      p.anim = 0.5
      p.timer = 3
      break
    }
  }
}

function updateChomper(b: Battle, p: Plant, dt: number) {
  p.stateT += dt
  switch (p.state) {
    case 'ready': {
      for (const z of b.zombies) {
        if (z.row !== p.row || !b.targetable(z) || z.lift > 10) continue
        const front = z.x - 24 * zombieScale(z.id)
        if (front >= p.x - 20 && front <= p.x + 112) {
          p.state = 'bite'
          p.stateT = 0
          p.target = z.uid
          break
        }
      }
      break
    }
    case 'bite':
      if (p.stateT >= 0.32) {
        const z = b.zombieById(p.target)
        p.stateT = 0
        if (z && b.targetable(z) && Math.abs(z.x - 24 * zombieScale(z.id) - p.x) < 150) {
          if (z.id === 'garg') {
            b.damage(z, 40, 'pea')
            p.state = 'swallow'
          } else {
            b.kill(z, 'chomp')
            p.state = 'chew'
            b.sfx('gulp')
          }
          b.sfx('bite')
        } else p.state = 'ready'
      }
      break
    case 'chew':
      if (p.stateT >= 42) {
        p.state = 'swallow'
        p.stateT = 0
      }
      break
    case 'swallow':
      if (p.stateT >= 0.6) {
        p.state = 'ready'
        p.stateT = 0
      }
      break
  }
}

function updateSquash(b: Battle, p: Plant, dt: number) {
  p.stateT += dt
  switch (p.state) {
    case 'idle': {
      let near: Zombie | null = null
      for (const z of b.zombies) {
        if (z.row !== p.row || !b.targetable(z) || z.lift > 10) continue
        const dx = z.x - 20 - p.x
        if (Math.abs(dx) < 320) p.lookX = dx > 0 ? 4 : -4
        if (dx >= -80 && dx <= 120 && (!near || Math.abs(z.x - p.x) < Math.abs(near.x - p.x))) near = z
      }
      if (near) {
        p.state = 'aim'
        p.stateT = 0
        p.target = near.uid
        p.lookX = near.x - 20 > p.x ? 5 : -5
        b.sfx('pop')
      }
      break
    }
    case 'aim':
      if (p.stateT >= 0.45) {
        const z = b.zombieById(p.target)
        p.state = 'jump'
        p.stateT = 0
        p.fromX = p.x
        p.toX = z && b.isAlive(z) ? z.x - 16 * zombieScale(z.id) : p.x
        if (b.grid[p.row][p.col] === p) b.grid[p.row][p.col] = null
      }
      break
    case 'jump': {
      const z = b.zombieById(p.target)
      if (z && b.isAlive(z) && p.stateT < 0.3) p.toX = z.x - 16 * zombieScale(z.id)
      const k = clamp(p.stateT / 0.5, 0, 1)
      p.x = lerp(p.fromX, p.toX, easeInOut(k))
      if (k >= 1) {
        for (const zz of b.zombies) {
          if (zz.row !== p.row || !b.isAlive(zz) || zz.lift > 30 || zz.state === 'fly') continue
          if (Math.abs(zz.x - 14 * zombieScale(zz.id) - p.x) < 64) b.damage(zz, 1800, 'crush')
        }
        b.shake = Math.max(b.shake, 0.4)
        b.sfx('squash')
        b.dirt(p.x, p.y, 14)
        b.burst('shock', p.x, p.y, {})
        p.state = 'done'
        p.stateT = 0
      }
      break
    }
    case 'done':
      if (p.stateT >= 0.8) remove(b, p)
      break
  }
}

export function squashLift(p: Plant) {
  if (p.state !== 'jump') return 0
  const k = clamp(p.stateT / 0.5, 0, 1)
  return Math.sin(k * Math.PI) * 130 * (1 - k * 0.3)
}

// ------------------------------------------------------------------ zombies

function blocker(b: Battle, z: Zombie) {
  const s = zombieScale(z.id)
  const garg = z.id === 'garg'
  const front = z.x - (garg ? 64 : 26 * s)
  const reach = z.id === 'pole' && z.hasPole ? 56 : 34
  let best: Plant | null = null
  for (const p of b.plants) {
    if (p.dead || p.row !== z.row) continue
    if (p.state === 'jump' || p.state === 'done') continue
    if (PLANTS[p.id].walkable && !garg) continue
    if (front <= p.x + reach && front >= p.x - 40 && (!best || p.x > best.x)) best = p
  }
  return best
}

export function updateZombie(b: Battle, z: Zombie, dt: number, live: boolean) {
  z.flash = Math.max(0, z.flash - dt)
  if (z.slow > 0) z.slow -= dt
  const mul = z.slow > 0 ? 0.5 : 1
  switch (z.state) {
    case 'dying':
      z.deathT += dt
      if (z.deathT > 2.1) z.remove = true
      return
    case 'ash':
      z.deathT += dt
      if (z.deathT > 1.5) z.remove = true
      return
    case 'squashed':
      z.deathT += dt
      if (z.deathT > 1.3) z.remove = true
      return
    case 'mowed':
      z.deathT += dt
      z.x += 320 * dt
      if (z.deathT > 0.8) z.remove = true
      return
  }
  if (!live) return
  z.stateT += dt * (z.state === 'smash' ? mul : 1)
  switch (z.state) {
    case 'fly': {
      const k = clamp(z.stateT / 0.95, 0, 1)
      z.x = lerp(z.fromX, z.toX, k)
      z.lift = Math.sin(k * Math.PI) * 200
      if (k >= 1) {
        z.lift = 0
        z.state = 'walk'
        b.dirt(z.x, z.y, 5)
      }
      return
    }
    case 'angry':
      z.phase += dt * 3
      if (z.stateT >= 1.1) {
        z.state = 'walk'
        z.angry = true
        z.speed = 36 * rand(0.95, 1.05)
      }
      return
    case 'vault': {
      const k = clamp(z.stateT / 0.9, 0, 1)
      z.x = lerp(z.fromX, z.toX, easeInOut(k))
      z.lift = Math.sin(k * Math.PI) * 104
      if (k >= 1) {
        z.lift = 0
        z.state = 'walk'
        z.hasPole = false
        z.speed = 17 * rand(0.95, 1.05)
      }
      return
    }
    case 'smash': {
      const prev = z.stateT - dt * mul
      if (prev < 1 && z.stateT >= 1) {
        const p = b.plantById(z.target)
        if (p) b.killPlant(p, true)
        else b.burst('shock', z.x - 90, z.y, {})
        b.shake = Math.max(b.shake, 0.4)
        b.sfx('smash')
      }
      if (z.stateT >= 1.7) z.state = 'walk'
      return
    }
    case 'throw': {
      const prev = z.stateT - dt
      if (prev < 0.9 && z.stateT >= 0.9) {
        z.hasImp = false
        const imp = b.makeZombie('imp', z.row, z.x - 30)
        imp.state = 'fly'
        imp.stateT = 0
        imp.fromX = z.x - 30
        imp.toX = Math.max(LAWN_X + 30, z.x - rand(300, 430))
        imp.wave = z.wave
        b.zombies.push(imp)
        b.sfx('vault')
      }
      if (z.stateT >= 1.5) z.state = 'walk'
      return
    }
    case 'eat': {
      z.phase += dt * mul * 7
      const p = b.plantById(z.target)
      if (!p || p.state === 'jump') {
        z.state = 'walk'
        return
      }
      p.hp -= z.def.eat * mul * dt
      p.flash = 0.06
      z.biteT -= dt
      if (z.biteT <= 0) {
        b.sfx('chomp')
        z.biteT = 0.5 / mul
      }
      if (p.hp <= 0) {
        b.killPlant(p)
        b.sfx('gulp')
        z.state = 'walk'
      }
      return
    }
    case 'walk': {
      z.x -= z.speed * mul * dt
      z.phase += dt * mul * z.speed * 0.105
      if (z.id === 'garg' && z.hasImp && z.hp < z.maxHp / 2 && z.x > LAWN_X + 4 * CELL_W && z.x < LAWN_R) {
        z.state = 'throw'
        z.stateT = 0
        return
      }
      const p = blocker(b, z)
      if (p) {
        if (z.id === 'pole' && z.hasPole) {
          if (p.id === 'tallnut') {
            z.hasPole = false
            z.speed = 17
            z.state = 'eat'
            z.target = p.uid
            b.sfx('hitSoft')
          } else {
            z.state = 'vault'
            z.stateT = 0
            z.fromX = z.x
            z.toX = p.x - 70
            b.sfx('vault')
          }
        } else if (z.id === 'garg') {
          z.state = 'smash'
          z.stateT = 0
          z.target = p.uid
        } else {
          z.state = 'eat'
          z.target = p.uid
          z.biteT = 0.2
        }
      }
      b.checkHouse(z)
      return
    }
  }
}

// ------------------------------------------------------------------ projectiles

const SPLAT: Record<PeaKind, string> = { pea: '#7fd648', snow: '#bfe8ff', fire: '#ffb030' }

export function updateShots(b: Battle, dt: number) {
  for (const s of b.shots) {
    s.t += dt
    s.x += 430 * dt
    s.y += (s.ty - s.y) * Math.min(1, dt * 9)
    const col = colAt(s.x)
    if (col >= 0 && col < COLS) {
      const tp = b.grid[s.row][col]
      if (tp && tp.id === 'torchwood' && s.torch !== col && Math.abs(s.x - tp.x) < 18) {
        s.torch = col
        if (s.kind === 'pea') {
          s.kind = 'fire'
          s.dmg = 40
          b.sfx('fire')
        } else if (s.kind === 'snow') {
          s.kind = 'pea'
          s.dmg = 20
        }
      }
    }
    let hit: Zombie | null = null
    for (const z of b.zombies) {
      if (z.row !== s.row || !b.targetable(z) || z.lift > 60) continue
      const sc = zombieScale(z.id)
      if (s.x >= z.x - 28 * sc && s.x <= z.x + 30 * sc && (!hit || z.x < hit.x)) hit = z
    }
    if (hit) {
      b.damage(hit, s.dmg, 'pea')
      if (s.kind === 'snow' && !(hit.armorKind === 'door' && hit.armor > 0)) {
        if (hit.slow <= 0) b.sfx('freeze')
        hit.slow = 10
      }
      if (s.kind === 'fire') {
        hit.slow = 0
        for (const z of b.zombies) {
          if (z === hit || z.row !== s.row || !b.targetable(z)) continue
          if (Math.abs(z.x - hit.x) < 72) b.damage(z, 13, 'spike')
        }
        b.particles.push(b.particle('fire', s.x + 8, s.y + 18, { life: 0.4, size: 0.5 }))
      }
      b.splat(s.x + 6, s.y, SPLAT[s.kind])
      s.dead = true
    }
    if (s.x > VIEW_W + 40) s.dead = true
  }
  b.shots = b.shots.filter((s) => !s.dead)
}

export function lobPos(l: { x0: number; y0: number; tx: number; ty: number; t: number; dur: number }) {
  const k = clamp(l.t / l.dur, 0, 1)
  return { x: lerp(l.x0, l.tx, k), y: lerp(l.y0, l.ty, k) - 4 * 160 * k * (1 - k), k }
}

export function updateLobs(b: Battle, dt: number) {
  for (const l of b.lobs) {
    l.t += dt
    const z = b.zombieById(l.target)
    if (z && b.isAlive(z)) {
      l.tx = z.x - 8
      l.ty = z.y - 62 * zombieScale(z.id) - z.lift
    }
    if (l.t >= l.dur) {
      if (z && b.isAlive(z) && z.state !== 'fly') {
        b.damage(z, l.dmg, 'lob')
        b.sfx('hitSoft')
      }
      b.splat(l.tx, l.ty, '#9ad65a')
      l.dead = true
    }
  }
  b.lobs = b.lobs.filter((l) => !l.dead)
}

export function updateMowers(b: Battle, dt: number) {
  for (const m of b.mowers) {
    if (m.state !== 'run') continue
    m.t += dt
    m.x += 560 * dt
    for (const z of b.zombies) {
      if (z.row !== m.row || !b.isAlive(z) || z.state === 'fly') continue
      if (z.x - 30 < m.x + 40 && z.x + 30 > m.x - 10) b.kill(z, 'mow')
    }
    if (m.x > VIEW_W + 120) m.state = 'gone'
  }
}

const BOWL_SPEED = 250

export function updateBowls(b: Battle, dt: number) {
  const top = rowFeet(0)
  const bottom = rowFeet(ROWS - 1)
  for (const w of b.bowls) {
    const giant = w.id === 'giantnut'
    const sp = giant ? 200 : BOWL_SPEED
    w.x += sp * dt
    w.rot += (sp / (giant ? 60 : 30)) * dt
    if (w.vy) {
      w.y += w.vy * dt
      if (w.y < top) {
        w.y = top
        w.vy = Math.abs(w.vy)
      } else if (w.y > bottom) {
        w.y = bottom
        w.vy = -Math.abs(w.vy)
      }
    }
    w.row = clamp(Math.round((w.y + 18 - LAWN_Y) / CELL_H - 1), 0, ROWS - 1)
    if (Math.abs(w.y - rowFeet(w.row)) > 40) continue
    for (const z of b.zombies) {
      if (z.row !== w.row || !b.isAlive(z) || z.state === 'fly' || z.lift > 20) continue
      if (Math.abs(z.x - 14 * zombieScale(z.id) - w.x) > (giant ? 70 : 42) || w.hitIds.includes(z.uid)) continue
      w.hitIds.push(z.uid)
      if (w.id === 'bombnut') {
        w.dead = true
        b.explode(w.x, w.y - 30, w.row, 1, BLAST_HALF, '轰！')
        break
      }
      if (giant) {
        b.damage(z, 3000, 'crush')
        b.shake = Math.max(b.shake, 0.18)
        b.sfx('bowl')
        continue
      }
      b.damage(z, 900, 'bowl')
      w.hits++
      b.sfx('bowl')
      b.splat(w.x + 20, w.y - 30, '#c88a44')
      if (w.hits >= 2) {
        b.particles.push(b.particle('text', w.x, w.y - 90, { text: `连击 ×${w.hits}`, life: 1.1, size: 30 + w.hits * 3, color: '#ffe066', vy: -40 }))
        b.bestCombo = Math.max(b.bestCombo, w.hits)
      }
      const dir = w.vy === 0 ? (w.row === 0 ? 1 : w.row === ROWS - 1 ? -1 : Math.random() < 0.5 ? -1 : 1) : w.vy > 0 ? -1 : 1
      w.vy = dir * 230
      break
    }
    if (w.x > VIEW_W + 80) w.dead = true
  }
  b.bowls = b.bowls.filter((w) => !w.dead)
}
