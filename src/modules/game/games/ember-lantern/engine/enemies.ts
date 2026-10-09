import type { Game } from './game'
import type { Enemy, EnemyKind } from './types'
import { GROUND_Y, W, approach, clamp, rand } from './core'

interface EnemyDef {
  w: number
  h: number
  hp: number
  dmg: number
  flying: boolean
  weight: number
  boss?: boolean
  name: string
}

export const ENEMY_DEFS: Record<EnemyKind, EnemyDef> = {
  slime: { w: 14, h: 10, hp: 28, dmg: 8, flying: false, weight: 1, name: '烛泥' },
  bat: { w: 12, h: 8, hp: 16, dmg: 6, flying: true, weight: 0.8, name: '夜翼' },
  archer: { w: 12, h: 18, hp: 24, dmg: 7, flying: false, weight: 1, name: '弓影' },
  brute: { w: 20, h: 24, hp: 80, dmg: 14, flying: false, weight: 3, name: '铁卫' },
  wisp: { w: 10, h: 10, hp: 22, dmg: 6, flying: true, weight: 1, name: '霜魂' },
  warden: { w: 34, h: 40, hp: 720, dmg: 16, flying: false, weight: 99, boss: true, name: '守灯人' },
  frost: { w: 28, h: 36, hp: 1100, dmg: 15, flying: true, weight: 99, boss: true, name: '霜月司' },
}

export function createEnemy(id: number, kind: EnemyKind, cx: number, bottom: number, depth: number): Enemy {
  const d = ENEMY_DEFS[kind]
  const hp = Math.round(d.hp * (d.boss ? 1 + 0.1 * (depth - 1) : 1 + 0.2 * (depth - 1)))
  return {
    id,
    kind,
    x: cx - d.w / 2,
    y: bottom - d.h,
    w: d.w,
    h: d.h,
    vx: 0,
    vy: 0,
    onGround: false,
    hp,
    maxHp: hp,
    dmg: Math.round(d.dmg * (1 + 0.08 * (depth - 1))),
    face: -1,
    state: d.boss ? 'intro' : 'idle',
    stateT: d.boss ? 1.2 : rand(0.4, 1),
    t: rand(0, 10),
    hurtT: 0,
    flying: d.flying,
    boss: !!d.boss,
    weight: d.weight,
    dead: false,
    phase: 1,
    aux: 0,
    tx: 0,
    ty: 0,
  }
}

export function updateEnemy(g: Game, e: Enemy, dt: number) {
  e.t += dt
  e.stateT -= dt
  if (e.hurtT > 0) e.hurtT -= dt
  switch (e.kind) {
    case 'slime':
      return slime(g, e, dt)
    case 'bat':
      return bat(g, e, dt)
    case 'archer':
      return archer(g, e, dt)
    case 'brute':
      return brute(g, e, dt)
    case 'wisp':
      return wisp(g, e, dt)
    case 'warden':
      return warden(g, e, dt)
    case 'frost':
      return frost(g, e, dt)
  }
}

function toPlayer(g: Game, e: Enemy) {
  const p = g.player
  const dx = p.x + p.w / 2 - (e.x + e.w / 2)
  const dy = p.y + p.h / 2 - (e.y + e.h / 2)
  return { dx, dy, adx: Math.abs(dx), dist: Math.hypot(dx, dy) || 1 }
}

function slime(g: Game, e: Enemy, dt: number) {
  const { dx } = toPlayer(g, e)
  if (e.onGround) {
    e.vx = approach(e.vx, 0, 500 * dt)
    if (e.stateT <= 0) {
      e.face = dx >= 0 ? 1 : -1
      e.vx = e.face * rand(70, 115)
      e.vy = -rand(170, 250)
      e.stateT = rand(0.7, 1.2)
    }
  }
  g.moveBody(e, dt, 1, false)
}

function bat(g: Game, e: Enemy, dt: number) {
  const { dx, dy, adx, dist } = toPlayer(g, e)
  const p = g.player
  if (e.state === 'wind') {
    e.vx = approach(e.vx, 0, 400 * dt)
    e.vy = approach(e.vy, -30, 300 * dt)
    if (e.stateT <= 0) {
      e.state = 'dive'
      e.stateT = 0.55
      e.vx = (dx / dist) * 200
      e.vy = (dy / dist) * 200
    }
  } else if (e.state === 'dive') {
    if (e.stateT <= 0) {
      e.state = 'fly'
      e.stateT = rand(1.4, 2.4)
    }
  } else {
    const tx = p.x + p.w / 2 + Math.sin(e.t * 1.3) * 60
    const ty = p.y - 40 + Math.sin(e.t * 3) * 12
    e.vx = approach(e.vx, clamp((tx - e.x) * 1.5, -85, 85), 260 * dt)
    e.vy = approach(e.vy, clamp((ty - e.y) * 1.5, -75, 75), 260 * dt)
    if (e.stateT <= 0 && adx < 150) {
      e.state = 'wind'
      e.stateT = 0.4
    }
  }
  e.face = dx >= 0 ? 1 : -1
  g.moveFlyer(e, dt)
}

function archer(g: Game, e: Enemy, dt: number) {
  const { dx, dy, adx } = toPlayer(g, e)
  e.face = dx >= 0 ? 1 : -1
  if (e.state === 'aim') {
    e.vx = approach(e.vx, 0, 600 * dt)
    if (e.stateT <= 0) {
      const travel = Math.max(0.3, adx / 210)
      g.enemyShot({
        kind: 'arrow',
        x: e.x + e.w / 2 + e.face * 6,
        y: e.y + 7,
        vx: e.face * 210,
        vy: clamp(dy / travel, -110, 110),
        w: 8,
        h: 3,
        dmg: e.dmg,
        color: '#ffd7a0',
      })
      g.sound.play('shoot')
      e.state = 'walk'
      e.stateT = rand(1.6, 2.6)
    }
  } else {
    let target = 0
    if (adx < 90) target = -e.face * 55
    else if (adx > 170) target = e.face * 50
    e.vx = approach(e.vx, target, 300 * dt)
    if (e.stateT <= 0 && adx < 280) {
      e.state = 'aim'
      e.stateT = 0.55
    }
  }
  g.moveBody(e, dt, 1, false)
}

function brute(g: Game, e: Enemy, dt: number) {
  const { dx, dy, adx } = toPlayer(g, e)
  switch (e.state) {
    case 'wind':
      e.vx = approach(e.vx, 0, 800 * dt)
      if (e.stateT <= 0) {
        e.state = 'charge'
        e.stateT = 0.65
        g.sound.play('dash')
      }
      break
    case 'charge':
      e.vx = e.face * 270
      if (Math.random() < 0.5) g.dust(e.x + e.w / 2, e.y + e.h, 1, '#8a6a5a')
      if (e.stateT <= 0 || e.x <= 0 || e.x >= W - e.w) {
        if (e.x <= 0 || e.x >= W - e.w) g.shake = Math.max(g.shake, 4)
        e.state = 'tired'
        e.stateT = 0.9
      }
      break
    case 'tired':
      e.vx = approach(e.vx, 0, 600 * dt)
      if (e.stateT <= 0) {
        e.state = 'walk'
        e.stateT = rand(1, 1.8)
      }
      break
    default:
      e.face = dx >= 0 ? 1 : -1
      e.vx = approach(e.vx, e.face * 38, 220 * dt)
      if (e.stateT <= 0 && adx < 170 && Math.abs(dy) < 40) {
        e.state = 'wind'
        e.stateT = 0.6
      }
  }
  g.moveBody(e, dt, 1, false)
}

function wisp(g: Game, e: Enemy, dt: number) {
  const { dx, dy, dist } = toPlayer(g, e)
  const p = g.player
  const tx = p.x + p.w / 2 + Math.cos(e.t * 0.7) * 110
  const ty = Math.max(36, p.y - 42 + Math.sin(e.t * 2) * 10)
  const slow = e.state === 'wind' ? 0.25 : 1
  e.vx = approach(e.vx, clamp((tx - e.x) * 1.2, -65, 65) * slow, 220 * dt)
  e.vy = approach(e.vy, clamp((ty - e.y) * 1.2, -65, 65) * slow, 220 * dt)
  if (e.state === 'wind') {
    if (e.stateT <= 0) {
      const base = Math.atan2(dy, dx)
      for (const off of [-0.28, 0, 0.28]) {
        g.enemyShot({
          kind: 'orb',
          x: e.x + e.w / 2,
          y: e.y + e.h / 2,
          vx: Math.cos(base + off) * 125,
          vy: Math.sin(base + off) * 125,
          w: 6,
          h: 6,
          dmg: e.dmg,
          color: '#9fe3ff',
        })
      }
      g.sound.play('shoot')
      e.state = 'fly'
      e.stateT = rand(2.2, 3.2)
    }
  } else if (e.stateT <= 0 && dist < 320) {
    e.state = 'wind'
    e.stateT = 0.6
  }
  e.face = dx >= 0 ? 1 : -1
  g.moveFlyer(e, dt)
}

function enterPhase2(g: Game, e: Enemy, title: string) {
  if (e.phase === 1 && e.hp < e.maxHp * 0.5) {
    e.phase = 2
    e.state = 'roar'
    e.stateT = 1
    e.vx = 0
    g.showBanner(title, '第二相 · 攻势加剧', '#ff8a5c')
    g.shake = Math.max(g.shake, 8)
    g.sound.play('boss')
    return true
  }
  return false
}

function warden(g: Game, e: Enemy, dt: number) {
  const { dx, dy, adx } = toPlayer(g, e)
  enterPhase2(g, e, '守灯人 · 怒焰')
  const p2 = e.phase === 2
  const spd = p2 ? 1.35 : 1
  switch (e.state) {
    case 'intro':
    case 'roar':
    case 'stun':
    case 'recover':
      e.vx = approach(e.vx, 0, 600 * dt)
      if (e.stateT <= 0) {
        e.state = 'walk'
        e.stateT = rand(0.7, 1.3) / spd
      }
      break
    case 'walk': {
      e.face = dx >= 0 ? 1 : -1
      e.vx = approach(e.vx, e.face * 45 * spd, 300 * dt)
      if (e.stateT <= 0) {
        const r = Math.random()
        if (adx > 150) e.state = r < 0.5 ? 'chargeWind' : 'volleyWind'
        else e.state = r < 0.5 ? 'slamWind' : r < 0.75 ? 'volleyWind' : 'chargeWind'
        e.stateT = 0.6 / spd
        if (e.state === 'slamWind') e.aux = p2 ? 2 : 1
      }
      break
    }
    case 'slamWind':
      e.vx = approach(e.vx, 0, 800 * dt)
      if (e.stateT <= 0) {
        e.vy = -360
        e.vx = clamp(dx * 1.3, -230, 230)
        e.onGround = false
        e.state = 'slamAir'
        e.stateT = 0
      }
      break
    case 'slamAir':
      if (e.onGround && e.stateT < -0.15) {
        for (const dir of [-1, 1]) {
          g.enemyShot({
            kind: 'shock',
            x: e.x + e.w / 2 + dir * 14,
            y: GROUND_Y - 7,
            vx: dir * (p2 ? 240 : 200),
            vy: 0,
            w: 10,
            h: 14,
            dmg: e.dmg,
            color: '#ffb067',
            life: 1.8,
            pierce: true,
          })
        }
        g.shake = Math.max(g.shake, 10)
        g.dust(e.x + e.w / 2, GROUND_Y, 14, '#c79a6a')
        g.sound.play('slam')
        e.vx = 0
        e.aux -= 1
        e.state = e.aux > 0 ? 'slamWind' : 'recover'
        e.stateT = e.aux > 0 ? 0.3 : 0.8 / spd
      }
      break
    case 'volleyWind':
      e.vx = approach(e.vx, 0, 800 * dt)
      if (e.stateT <= 0) {
        const n = p2 ? 9 : 6
        const base = Math.atan2(dy - 10, dx)
        const spread = p2 ? 1.3 : 0.9
        for (let i = 0; i < n; i++) {
          const a = base - spread / 2 + (spread * i) / (n - 1)
          g.enemyShot({
            kind: 'orb',
            x: e.x + e.w / 2,
            y: e.y + 14,
            vx: Math.cos(a) * 140,
            vy: Math.sin(a) * 140,
            w: 7,
            h: 7,
            dmg: e.dmg - 4,
            color: '#ff9b54',
          })
        }
        g.sound.play('shoot')
        e.state = 'recover'
        e.stateT = 0.9 / spd
      }
      break
    case 'chargeWind':
      e.face = dx >= 0 ? 1 : -1
      e.vx = approach(e.vx, 0, 800 * dt)
      if (e.stateT <= 0) {
        e.state = 'charge'
        e.stateT = 1.4
        g.sound.play('dash')
      }
      break
    case 'charge':
      e.vx = e.face * 300 * Math.sqrt(spd)
      if (Math.random() < 0.6) g.dust(e.x + e.w / 2, e.y + e.h, 1, '#c79a6a')
      if (e.stateT <= 0 || e.x <= 0 || e.x >= W - e.w) {
        g.shake = Math.max(g.shake, 8)
        g.sound.play('slam')
        e.state = 'stun'
        e.stateT = p2 ? 0.8 : 1.2
      }
      break
  }
  g.moveBody(e, dt, 1, true)
}

function frost(g: Game, e: Enemy, dt: number) {
  const { dx } = toPlayer(g, e)
  const p = g.player
  enterPhase2(g, e, '霜月司 · 寒潮')
  const p2 = e.phase === 2
  const hoverY = 62 + Math.sin(e.t * 1.4) * 10
  const ecx = e.x + e.w / 2
  const ecy = e.y + e.h / 2
  const float = (slow: number) => {
    const tx = clamp(p.x + p.w / 2, 60, W - 60)
    e.vx = approach(e.vx, clamp((tx - ecx) * 0.8, -70, 70) * slow, 220 * dt)
    e.vy = approach(e.vy, clamp((hoverY - ecy) * 2, -90, 90), 260 * dt)
  }
  e.face = dx >= 0 ? 1 : -1
  switch (e.state) {
    case 'intro':
    case 'roar':
    case 'recover':
      float(0.4)
      if (e.stateT <= 0) {
        e.state = 'float'
        e.stateT = rand(0.8, 1.4) / (p2 ? 1.3 : 1)
      }
      break
    case 'float': {
      float(1)
      if (e.stateT <= 0) {
        const options = ['rainWind', 'ringWind', 'diveWind']
        if (p2 && g.enemies.length < 4) options.push('summon')
        e.state = options[Math.floor(Math.random() * options.length)]
        e.stateT = 0.6
      }
      break
    }
    case 'rainWind':
      float(0.3)
      if (e.stateT <= 0) {
        const n = p2 ? 9 : 6
        const xs = [p.x + p.w / 2]
        for (let i = 1; i < n; i++) xs.push(rand(16, W - 16))
        xs.forEach((x, i) =>
          g.enemyShot({
            kind: 'icicle',
            x,
            y: -8,
            vx: 0,
            vy: 280,
            w: 6,
            h: 12,
            dmg: e.dmg,
            color: '#cfeaff',
            delay: 0.7 + i * 0.06,
            life: 3,
          }),
        )
        e.state = 'recover'
        e.stateT = 1.1
      }
      break
    case 'ringWind':
      float(0.2)
      if (e.stateT <= 0) {
        const n = p2 ? 16 : 12
        const off = Math.random() * Math.PI
        for (let i = 0; i < n; i++) {
          const a = off + (i / n) * Math.PI * 2
          g.enemyShot({
            kind: 'orb',
            x: ecx,
            y: ecy,
            vx: Math.cos(a) * 100,
            vy: Math.sin(a) * 100,
            w: 7,
            h: 7,
            dmg: e.dmg - 4,
            color: '#a8dcff',
          })
        }
        g.sound.play('shoot')
        e.state = 'recover'
        e.stateT = 0.9
      }
      break
    case 'diveWind':
      e.vx = approach(e.vx, 0, 400 * dt)
      e.vy = approach(e.vy, -40, 300 * dt)
      e.tx = p.x + p.w / 2
      e.ty = p.y + p.h / 2
      if (e.stateT <= 0) {
        const dist = Math.hypot(e.tx - ecx, e.ty - ecy) || 1
        e.vx = ((e.tx - ecx) / dist) * 280
        e.vy = ((e.ty - ecy) / dist) * 280
        e.state = 'dive'
        e.stateT = Math.min(0.9, dist / 280)
        g.sound.play('dash')
      }
      break
    case 'dive':
      if (e.stateT <= 0 || e.y + e.h >= GROUND_Y - 1) {
        g.shake = Math.max(g.shake, 6)
        g.dust(ecx, e.y + e.h, 10, '#cfeaff')
        e.state = 'recover'
        e.stateT = 0.8
      }
      break
    case 'summon':
      float(0.3)
      if (e.stateT <= 0) {
        g.queueSpawn('bat', clamp(ecx - 60, 20, W - 20), 90)
        g.queueSpawn('wisp', clamp(ecx + 60, 20, W - 20), 70)
        e.state = 'recover'
        e.stateT = 1
      }
      break
  }
  g.moveFlyer(e, dt)
}

export const enemyName = (kind: EnemyKind) => ENEMY_DEFS[kind].name
export const isFlying = (kind: EnemyKind) => ENEMY_DEFS[kind].flying
