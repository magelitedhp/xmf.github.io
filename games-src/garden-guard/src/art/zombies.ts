import type { ArmorKind, ZombieId } from '../data/zombies'
import { C, circle, clamp, easeInCubic, easeOutCubic, ellipse, lerp, linear, paint, radial, rrect, type Ctx } from '../util'

export interface ZombieView {
  id: ZombieId
  t: number
  phase: number
  state: string
  stateT: number
  deathT: number
  hasArm: boolean
  hasHead: boolean
  hasPole: boolean
  hasImp: boolean
  armorKind: ArmorKind | null
  /** Remaining armor as a 0–1 ratio; 0 means gone. */
  armor: number
  angry: boolean
}

interface Outfit {
  coat: string
  coatDark: string
  shirt: string
  tie: string | null
  pants: string
  pantsDark: string
  skin: string
  skinDark: string
  shoe: string
  scale: number
  head: number
}

const BASE: Outfit = {
  coat: '#7d6850',
  coatDark: '#5a4a38',
  shirt: '#ece7da',
  tie: '#b3262a',
  pants: '#5b4a36',
  pantsDark: '#3e3224',
  skin: '#aac08e',
  skinDark: '#7d9465',
  shoe: '#2b2420',
  scale: 1,
  head: 1,
}

const OUTFITS: Record<ZombieId, Outfit> = {
  basic: BASE,
  flag: BASE,
  cone: BASE,
  bucket: BASE,
  door: { ...BASE, coat: '#6f6a5c', coatDark: '#4f4b40' },
  paper: { ...BASE, coat: '#8a7a62', coatDark: '#665944', tie: '#3a5a8a', pants: '#4a5768', pantsDark: '#323c49' },
  pole: { ...BASE, coat: '#e6e1d6', coatDark: '#b8b1a3', shirt: '#e6e1d6', tie: null, pants: '#c23b3b', pantsDark: '#8a2525' },
  football: { ...BASE, coat: '#c8242c', coatDark: '#8f1820', shirt: '#c8242c', tie: null, pants: '#d9d4c8', pantsDark: '#a9a397', scale: 1.08 },
  garg: { ...BASE, coat: '#c9b89a', coatDark: '#9c8c70', shirt: '#c9b89a', tie: null, pants: '#55678a', pantsDark: '#3b4a66', skin: '#9fb584', skinDark: '#748a5d', scale: 1.72, head: 0.85 },
  imp: { ...BASE, coat: '#d8cfb8', coatDark: '#aaa08a', shirt: '#d8cfb8', tie: null, pants: '#6b5a44', pantsDark: '#4a3e2e', scale: 0.62, head: 1.3 },
}

interface Point {
  x: number
  y: number
}

/** Two-segment limb. Angles are measured from straight down; negative swings toward −x (forward). */
function limb(ctx: Ctx, x: number, y: number, a1: number, l1: number, a2: number, l2: number, w: number, color: string, edge: string) {
  const kx = x + Math.sin(a1) * l1
  const ky = y + Math.cos(a1) * l1
  const fx = kx + Math.sin(a2) * l2
  const fy = ky + Math.cos(a2) * l2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(kx, ky)
  ctx.lineTo(fx, fy)
  ctx.lineWidth = w + 3.4
  ctx.strokeStyle = C(edge)
  ctx.stroke()
  ctx.lineWidth = w
  ctx.strokeStyle = C(color)
  ctx.stroke()
  return { kx, ky, fx, fy }
}

function hand(ctx: Ctx, p: Point, o: Outfit, a: number) {
  circle(ctx, p.x, p.y, 6)
  paint(ctx, C(o.skin), C('#3d4a30'), 1.8)
  ctx.lineWidth = 2.2
  ctx.lineCap = 'round'
  ctx.strokeStyle = C(o.skinDark)
  ctx.beginPath()
  for (let i = -1; i <= 1; i++) {
    const fa = a + i * 0.35
    ctx.moveTo(p.x + Math.sin(fa) * 4, p.y + Math.cos(fa) * 4)
    ctx.lineTo(p.x + Math.sin(fa) * 10, p.y + Math.cos(fa) * 10)
  }
  ctx.stroke()
}

function torso(ctx: Ctx, o: Outfit, id: ZombieId) {
  ctx.beginPath()
  ctx.moveTo(-19, -100)
  ctx.quadraticCurveTo(-2, -107, 14, -100)
  ctx.lineTo(18, -60)
  ctx.quadraticCurveTo(17, -42, 12, -38)
  ctx.lineTo(-16, -40)
  ctx.quadraticCurveTo(-23, -70, -19, -100)
  paint(ctx, linear(ctx, -20, 0, 18, 0, [[0, o.coat], [0.7, o.coat], [1, o.coatDark]]), C('#2a2219'), 2.6)
  if (id === 'pole') {
    ctx.lineWidth = 4
    ctx.strokeStyle = C('#c23b3b')
    ctx.beginPath()
    ctx.moveTo(-17, -98)
    ctx.lineTo(-14, -42)
    ctx.moveTo(12, -100)
    ctx.lineTo(15, -40)
    ctx.stroke()
    return
  }
  if (id === 'football') {
    ctx.font = `900 18px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = C('#ffffff')
    ctx.fillText('13', -2, -70)
    return
  }
  if (id === 'garg' || id === 'imp') {
    ctx.lineWidth = 1.6
    ctx.strokeStyle = C(o.coatDark)
    ctx.beginPath()
    ctx.moveTo(-8, -60)
    ctx.lineTo(-2, -52)
    ctx.lineTo(4, -60)
    ctx.moveTo(6, -84)
    ctx.lineTo(10, -78)
    ctx.stroke()
    if (id === 'garg') {
      rrect(ctx, -17, -64, 32, 26, 4)
      paint(ctx, C(o.pants), C('#2a2219'), 2)
      ctx.lineWidth = 4
      ctx.strokeStyle = C(o.pants)
      ctx.beginPath()
      ctx.moveTo(-12, -64)
      ctx.lineTo(-14, -98)
      ctx.moveTo(10, -64)
      ctx.lineTo(10, -98)
      ctx.stroke()
    }
    return
  }
  ctx.beginPath()
  ctx.moveTo(-13, -101)
  ctx.lineTo(3, -103)
  ctx.lineTo(-4, -74)
  ctx.closePath()
  paint(ctx, C(o.shirt), C('#5a5448'), 1.4)
  if (o.tie) {
    ctx.beginPath()
    ctx.moveTo(-7, -100)
    ctx.lineTo(-1, -100)
    ctx.lineTo(2, -84)
    ctx.lineTo(-3, -68)
    ctx.lineTo(-8, -84)
    ctx.closePath()
    paint(ctx, C(o.tie), C('#4a0c0e'), 1.4)
  }
  ctx.lineWidth = 1.6
  ctx.strokeStyle = C(o.coatDark)
  ctx.beginPath()
  ctx.moveTo(-13, -101)
  ctx.lineTo(-8, -76)
  ctx.moveTo(3, -103)
  ctx.lineTo(-1, -78)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(6, -64)
  ctx.lineTo(13, -60)
  ctx.lineTo(9, -54)
  ctx.closePath()
  paint(ctx, C(o.coatDark))
  for (const by of [-62, -51]) {
    circle(ctx, -12, by, 1.8)
    paint(ctx, C('#2a2219'))
  }
}

function headwear(ctx: Ctx, v: ZombieView, hx: number, hy: number) {
  const r = v.armor
  if (r <= 0) return
  switch (v.armorKind) {
    case 'cone': {
      const tipY = r < 0.66 ? hy - 50 : hy - 64
      ctx.beginPath()
      ctx.moveTo(hx - 22, hy - 13)
      if (r < 0.66) {
        ctx.lineTo(hx - 8, tipY)
        ctx.lineTo(hx - 3, tipY + 5)
        ctx.lineTo(hx + 3, tipY - 2)
        ctx.lineTo(hx + 8, tipY + 3)
      } else ctx.lineTo(hx - 2, tipY)
      ctx.lineTo(hx + 24, hy - 13)
      ctx.quadraticCurveTo(hx + 1, hy - 6, hx - 22, hy - 13)
      paint(ctx, linear(ctx, hx - 22, 0, hx + 24, 0, [[0, '#ffb062'], [0.5, '#f27a22'], [1, '#c4520f']]), C('#6e2d07'), 2.4)
      ctx.save()
      ctx.clip()
      ctx.fillStyle = C('#fff4e6')
      ctx.fillRect(hx - 30, hy - 34, 60, 7)
      ctx.fillRect(hx - 30, hy - 48 + (r < 0.66 ? 6 : 0), 60, 5)
      if (r < 0.33) {
        ctx.fillStyle = C('#4a2a14')
        ctx.beginPath()
        ctx.moveTo(hx + 6, hy - 14)
        ctx.lineTo(hx + 12, hy - 34)
        ctx.lineTo(hx + 20, hy - 22)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()
      ellipse(ctx, hx + 1, hy - 12, 25, 5)
      paint(ctx, C('#d9600f'), C('#6e2d07'), 2)
      return
    }
    case 'bucket': {
      const dent = r < 0.66
      ctx.beginPath()
      ctx.moveTo(hx - 23, hy - 6)
      ctx.lineTo(hx - 18, hy - 46)
      ctx.lineTo(hx + 20, hy - (dent ? 42 : 46))
      ctx.lineTo(hx + 25, hy - 6)
      ctx.closePath()
      paint(ctx, linear(ctx, hx - 23, 0, hx + 25, 0, [[0, '#7a838a'], [0.35, '#dfe5ea'], [0.6, '#a8b0b7'], [1, '#6d757c']]), C('#3b4146'), 2.4)
      ellipse(ctx, hx + 1, hy - 45, 19, 4)
      paint(ctx, C('#c4ccd2'), C('#3b4146'), 1.8)
      rrect(ctx, hx - 25, hy - 11, 52, 7, 2)
      paint(ctx, C('#8f979e'), C('#3b4146'), 1.8)
      if (dent) {
        ellipse(ctx, hx + 9, hy - 30, 6, 4, 0.4)
        paint(ctx, C('#5c646b'))
      }
      if (r < 0.33) {
        ellipse(ctx, hx - 9, hy - 22, 5, 7, -0.3)
        paint(ctx, C('#545b61'))
        ellipse(ctx, hx + 14, hy - 16, 4, 3)
        paint(ctx, C('#545b61'))
      }
      ctx.beginPath()
      ctx.arc(hx + 1, hy - 18, 26, 0.15 * Math.PI, 0.45 * Math.PI)
      ctx.lineWidth = 2
      ctx.strokeStyle = C('#4b5258')
      ctx.stroke()
      return
    }
    case 'helmet': {
      ctx.beginPath()
      ctx.ellipse(hx + 1, hy - 2, 25, 27, 0, Math.PI, 2 * Math.PI)
      ctx.lineTo(hx + 26, hy + 10)
      ctx.lineTo(hx + 8, hy + 12)
      ctx.lineTo(hx + 6, hy - 2)
      ctx.lineTo(hx - 24, hy - 2)
      ctx.closePath()
      paint(ctx, radial(ctx, hx - 8, hy - 18, 3, hx, hy - 4, 30, [[0, '#ff7676'], [0.6, '#d0232c'], [1, '#86121a']]), C('#4a070c'), 2.4)
      ctx.lineWidth = 5
      ctx.strokeStyle = C('#f3f3f3')
      ctx.beginPath()
      ctx.moveTo(hx - 2, hy - 28)
      ctx.quadraticCurveTo(hx + 18, hy - 22, hx + 24, hy - 4)
      ctx.stroke()
      ctx.lineWidth = 2.6
      ctx.strokeStyle = C('#9aa1a8')
      ctx.beginPath()
      ctx.moveTo(hx - 24, hy - 4)
      ctx.lineTo(hx - 28, hy + 14)
      ctx.lineTo(hx - 10, hy + 18)
      ctx.moveTo(hx - 26, hy + 5)
      ctx.lineTo(hx - 8, hy + 7)
      ctx.stroke()
      if (r < 0.5) {
        ctx.lineWidth = 1.6
        ctx.strokeStyle = C('#3a0508')
        ctx.beginPath()
        ctx.moveTo(hx + 4, hy - 26)
        ctx.lineTo(hx + 8, hy - 16)
        ctx.lineTo(hx + 2, hy - 10)
        ctx.stroke()
      }
      return
    }
  }
}

function head(ctx: Ctx, v: ZombieView, o: Outfit, hx: number, hy: number, jaw: number) {
  const skin = v.angry ? '#c99c86' : o.skin
  const skinDark = v.angry ? '#a0705c' : o.skinDark
  rrect(ctx, hx + 2, hy + 12, 11, 14, 3)
  paint(ctx, C(skinDark), C('#3d4a30'), 1.6)
  ellipse(ctx, hx + 17, hy + 1, 5, 7)
  paint(ctx, C(skinDark), C('#3d4a30'), 1.6)
  ellipse(ctx, hx, hy, 20.5, 22.5)
  paint(ctx, radial(ctx, hx - 6, hy - 8, 3, hx, hy, 24, [[0, skin], [0.75, skin], [1, skinDark]]), C('#3d4a30'), 2.4)
  if (!(v.armor > 0 && (v.armorKind === 'bucket' || v.armorKind === 'helmet' || v.armorKind === 'cone'))) {
    ctx.lineWidth = 1.6
    ctx.strokeStyle = C('#3a3328')
    ctx.beginPath()
    ctx.moveTo(hx + 2, hy - 21)
    ctx.quadraticCurveTo(hx + 4, hy - 30, hx + 12, hy - 31)
    ctx.moveTo(hx + 7, hy - 20)
    ctx.quadraticCurveTo(hx + 12, hy - 27, hx + 18, hy - 24)
    ctx.moveTo(hx - 4, hy - 21)
    ctx.quadraticCurveTo(hx - 6, hy - 28, hx - 2, hy - 33)
    ctx.stroke()
  }
  ctx.lineWidth = 1.6
  ctx.strokeStyle = C(skinDark)
  ctx.beginPath()
  ctx.arc(hx - 11, hy - 2, 9, 0.2 * Math.PI, 0.8 * Math.PI)
  ctx.stroke()
  circle(ctx, hx - 11, hy - 5, 7.5)
  paint(ctx, C('#f4f1e6'), C('#3d4a30'), 1.6)
  circle(ctx, hx - 13, hy - 4, 2.2)
  paint(ctx, C('#1a1a1a'))
  circle(ctx, hx + 2, hy - 7, 5.2)
  paint(ctx, C('#ebe6d6'), C('#3d4a30'), 1.4)
  circle(ctx, hx + 1, hy - 6, 1.7)
  paint(ctx, C('#1a1a1a'))
  if (v.id === 'paper') {
    ctx.lineWidth = 1.6
    ctx.strokeStyle = C('#222222')
    ctx.beginPath()
    ctx.arc(hx - 11, hy - 5, 9, 0, Math.PI * 2)
    ctx.moveTo(hx + 7.5, hy - 7)
    ctx.arc(hx + 2, hy - 7, 6.5, 0, Math.PI * 2)
    ctx.moveTo(hx - 2, hy - 6)
    ctx.lineTo(hx - 4.5, hy - 6)
    ctx.stroke()
  }
  ctx.lineWidth = 2.2
  ctx.strokeStyle = C('#3d4a30')
  ctx.beginPath()
  ctx.moveTo(hx - 19, hy - 15)
  ctx.lineTo(hx - 6, hy - 13 + (v.angry ? 4 : 0))
  ctx.stroke()
  const mOpen = 2 + jaw * 5
  ellipse(ctx, hx - 10, hy + 12 + mOpen * 0.4, 7.5, mOpen)
  paint(ctx, C('#2a1a14'))
  ctx.fillStyle = C('#efe8cc')
  ctx.fillRect(hx - 14, hy + 10, 3, 3)
  ctx.fillRect(hx - 9, hy + 10, 3, 3.5)
  ctx.lineWidth = 1.8
  ctx.strokeStyle = C('#3d4a30')
  ctx.beginPath()
  ctx.arc(hx - 6, hy + 14 + jaw * 4, 13, 0.55 * Math.PI, 0.95 * Math.PI)
  ctx.stroke()
  if (v.id === 'pole') {
    ctx.fillStyle = C('#c23b3b')
    ctx.fillRect(hx - 21, hy - 19, 42, 6)
  }
  if (v.angry) {
    const k = (v.t * 2) % 1
    ctx.globalAlpha *= 1 - k
    for (const sx of [-6, 8]) {
      circle(ctx, hx + sx, hy - 30 - k * 20, 4 + k * 4)
      paint(ctx, 'rgba(255,255,255,0.8)')
    }
    ctx.globalAlpha /= Math.max(0.01, 1 - k)
  }
  headwear(ctx, v, hx, hy)
}

export function drawZombieHead(ctx: Ctx, id: ZombieId, x: number, y: number, rot: number, scale = 1) {
  const o = OUTFITS[id]
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.scale(o.scale * o.head * scale, o.scale * o.head * scale)
  head(
    ctx,
    { id, t: 0, phase: 0, state: 'walk', stateT: 0, deathT: 0, hasArm: true, hasHead: true, hasPole: false, hasImp: false, armorKind: null, armor: 0, angry: false },
    o,
    0,
    0,
    0.6,
  )
  ctx.restore()
}

function newspaper(ctx: Ctx, r: number, wob: number) {
  ctx.save()
  ctx.translate(-54, -92)
  ctx.rotate(-0.08 + wob * 0.03)
  ctx.beginPath()
  ctx.moveTo(-20, -28)
  ctx.lineTo(18, -30)
  if (r < 0.5) {
    ctx.lineTo(16, -6)
    ctx.lineTo(6, 2)
    ctx.lineTo(12, 12)
  }
  ctx.lineTo(18, 26)
  ctx.lineTo(-20, 28)
  ctx.closePath()
  paint(ctx, linear(ctx, -20, 0, 18, 0, [[0, '#f2f0e6'], [1, '#d6d3c4']]), C('#6b6b62'), 1.8)
  ctx.fillStyle = C('#4a4a44')
  ctx.fillRect(-15, -24, 26, 6)
  ctx.fillStyle = C('#9a988c')
  for (let i = 0; i < 6; i++) ctx.fillRect(-15, -13 + i * 6, i % 3 === 2 ? 14 : 26, 2)
  ctx.restore()
}

function screenDoor(ctx: Ctx, r: number) {
  ctx.save()
  ctx.translate(-48, -84)
  ctx.rotate(r < 0.33 ? -0.06 : 0)
  rrect(ctx, -22, -66, 44, 128, 3)
  paint(ctx, 'rgba(200,210,215,0.28)', C('#4c5156'), 6)
  ctx.save()
  rrect(ctx, -19, -63, 38, 122, 2)
  ctx.clip()
  ctx.strokeStyle = C('#8e959b')
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let i = -66; i < 66; i += 7) {
    ctx.moveTo(-22, i)
    ctx.lineTo(22, i)
  }
  for (let i = -22; i < 22; i += 7) {
    ctx.moveTo(i, -66)
    ctx.lineTo(i, 66)
  }
  ctx.stroke()
  if (r < 0.66) {
    ellipse(ctx, 6, -30, 8, 6)
    paint(ctx, 'rgba(30,30,30,0.35)')
  }
  if (r < 0.33) {
    ellipse(ctx, -6, 20, 9, 12)
    paint(ctx, 'rgba(30,30,30,0.35)')
  }
  ctx.restore()
  ctx.lineWidth = 4
  ctx.strokeStyle = C('#4c5156')
  ctx.beginPath()
  ctx.moveTo(-22, 0)
  ctx.lineTo(22, 0)
  ctx.stroke()
  circle(ctx, 15, 4, 3)
  paint(ctx, C('#c9a227'))
  ctx.restore()
}

function flag(ctx: Ctx, hand: Point, t: number) {
  ctx.lineCap = 'round'
  ctx.lineWidth = 3.4
  ctx.strokeStyle = C('#5a3a1a')
  ctx.beginPath()
  ctx.moveTo(hand.x, hand.y + 16)
  ctx.lineTo(hand.x + 2, hand.y - 92)
  ctx.stroke()
  const top = hand.y - 90
  const wave = (k: number) => Math.sin(t * 5 + k) * 3
  ctx.beginPath()
  ctx.moveTo(hand.x + 2, top)
  ctx.quadraticCurveTo(hand.x + 22, top - 4 + wave(0), hand.x + 44, top + wave(1))
  ctx.lineTo(hand.x + 38, top + 12 + wave(2))
  ctx.lineTo(hand.x + 46, top + 22 + wave(2))
  ctx.lineTo(hand.x + 34, top + 34 + wave(3))
  ctx.quadraticCurveTo(hand.x + 18, top + 32 + wave(1), hand.x + 2, top + 36)
  ctx.closePath()
  paint(ctx, linear(ctx, hand.x, 0, hand.x + 46, 0, [[0, '#8e1d1d'], [1, '#5a1010']]), C('#300606'), 1.8)
  const sx = hand.x + 20
  const sy = top + 16
  circle(ctx, sx, sy - 2, 7)
  paint(ctx, C('#f1ead8'))
  ctx.fillRect(sx - 4, sy + 3, 8, 5)
  ctx.fillStyle = C('#5a1010')
  circle(ctx, sx - 2.6, sy - 2, 2)
  ctx.fill()
  circle(ctx, sx + 2.6, sy - 2, 2)
  ctx.fill()
}

function imp(ctx: Ctx, x: number, y: number, s: number, t: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  drawBody(
    ctx,
    { id: 'imp', t, phase: t * 3, state: 'preview', stateT: 0, deathT: 0, hasArm: true, hasHead: true, hasPole: false, hasImp: false, armorKind: null, armor: 0, angry: false },
    OUTFITS.imp,
  )
  ctx.restore()
}

function drawBody(ctx: Ctx, v: ZombieView, o: Outfit) {
  const st = v.state
  const running = v.id === 'pole' && v.hasPole
  let legA = 0
  let backArm = -1.3
  let backFore = -1.45
  let frontArm = -1.3
  let frontFore = -1.5
  let jaw = 0.15
  let headDy = 0
  let lean = -0.06

  if (st === 'walk' || st === 'preview' || st === 'angry' || st === 'fly') {
    const amp = running ? 0.62 : v.id === 'imp' ? 0.5 : 0.42
    legA = Math.sin(v.phase) * amp
    const sw = Math.sin(v.phase) * 0.12
    backArm += sw
    frontArm -= sw
    headDy = -Math.abs(Math.cos(v.phase)) * 2
    if (running) lean = -0.22
    if (st === 'preview') {
      legA = Math.sin(v.phase) * 0.08
      headDy = Math.sin(v.phase) * 1.5
    }
  } else if (st === 'eat') {
    legA = Math.sin(v.phase * 0.25) * 0.05
    const k = Math.sin(v.phase)
    frontArm = -1.05 + k * 0.35
    backArm = -1.15 - k * 0.3
    frontFore = -1.3
    jaw = (k + 1) / 2
    headDy = k * 2
    lean = -0.16
  } else if (st === 'vault') {
    legA = 0.5
    lean = -0.55
  } else if (st === 'dying' || st === 'ash' || st === 'squashed' || st === 'mowed') {
    frontArm = -0.5
    backArm = -0.4
    frontFore = -0.3
    backFore = -0.3
  }
  if (v.armorKind === 'paper' && v.armor > 0 && st !== 'eat') {
    frontArm = -1.2
    frontFore = -1.9
    backArm = -1.1
    backFore = -1.8
  }
  if (v.armorKind === 'door' && v.armor > 0) {
    frontArm = -1.0
    frontFore = -1.6
  }
  if (running) {
    frontArm = -0.9
    frontFore = -1.8
    backArm = -0.7
    backFore = -1.9
  }
  if (v.id === 'flag') {
    backArm = -2.2
    backFore = -2.9
  }
  if (v.id === 'garg' && st !== 'smash' && st !== 'dying' && st !== 'ash' && st !== 'squashed' && st !== 'mowed') {
    frontArm = -0.75 + Math.sin(v.phase) * 0.08
    frontFore = -2.55
  }
  if (v.id === 'garg' && st === 'smash') {
    const t = v.stateT
    frontArm = t < 0.9 ? lerp(-1.3, -3.0, easeOutCubic(t / 0.9)) : t < 1.05 ? lerp(-3.0, -0.8, easeInCubic((t - 0.9) / 0.15)) : -0.8
    frontFore = frontArm - 0.2
  }
  if (v.id === 'garg' && st === 'throw') {
    const t = v.stateT
    backArm = t < 0.9 ? lerp(-1.2, 0.9, t / 0.9) : lerp(0.9, -2.4, clamp((t - 0.9) / 0.2, 0, 1))
    backFore = backArm - 0.3
  }

  ctx.rotate(lean)
  if (v.id === 'garg' && v.hasImp && !(st === 'throw' && v.stateT > 0.9)) {
    if (st === 'throw') {
      const sx = 10 + Math.sin(backArm) * 40
      const sy = -96 + Math.cos(backArm) * 40
      imp(ctx, sx, sy + 30, 0.42, v.t)
    } else imp(ctx, 20, -86, 0.42, v.t)
  }

  const bs = { x: 10, y: -97 }
  const ba = limb(ctx, bs.x, bs.y, backArm, 21, backFore, 19, 9, o.coatDark, '#2a2219')
  hand(ctx, { x: ba.fx, y: ba.fy }, o, backFore)
  if (v.id === 'flag') flag(ctx, { x: ba.fx, y: ba.fy }, v.t)

  for (const [hx, a, col] of [
    [6, legA, o.pantsDark],
    [-4, -legA, o.pants],
  ] as const) {
    const a2 = a * 0.55 + (a < 0 ? 0.32 : 0.12)
    const l = limb(ctx, hx, -50, a, 25, a2, 24, 11, col, '#231b12')
    ellipse(ctx, l.fx - 5, l.fy + 1, 10, 5)
    paint(ctx, C(o.shoe), C('#111111'), 1.6)
  }

  torso(ctx, o, v.id)

  if (v.id === 'football') {
    for (const sx of [-14, 10]) {
      ellipse(ctx, sx, -98, 15, 10, sx < 0 ? 0.2 : -0.2)
      paint(ctx, radial(ctx, sx - 4, -102, 2, sx, -98, 16, [[0, '#ff6b6b'], [1, '#9a141c']]), C('#4a070c'), 2)
    }
  }

  if (v.armorKind === 'paper' && v.armor > 0) newspaper(ctx, v.armor, Math.sin(v.phase))

  if (v.hasHead) head(ctx, v, o, -12, -124 * 1 + headDy - (o.head - 1) * 10, jaw)
  else {
    ellipse(ctx, -3, -104, 8, 4)
    paint(ctx, C('#6e2b20'), C('#3d1810'), 1.5)
  }

  const fs = { x: -12, y: -95 }
  if (v.hasArm) {
    const fa = limb(ctx, fs.x, fs.y, frontArm, 21, frontFore, 19, 9.5, o.coat, '#2a2219')
    hand(ctx, { x: fa.fx, y: fa.fy }, o, frontFore)
    if (v.id === 'garg') {
      const len = 78
      ctx.lineCap = 'round'
      ctx.lineWidth = 12
      ctx.strokeStyle = C('#3a2610')
      ctx.beginPath()
      ctx.moveTo(fa.fx - Math.sin(frontFore) * 10, fa.fy - Math.cos(frontFore) * 10)
      ctx.lineTo(fa.fx + Math.sin(frontFore) * len, fa.fy + Math.cos(frontFore) * len)
      ctx.stroke()
      ctx.lineWidth = 8
      ctx.strokeStyle = C('#8a5a2a')
      ctx.stroke()
    }
    if (running) {
      ctx.lineWidth = 4
      ctx.strokeStyle = C('#8b5a2b')
      ctx.beginPath()
      ctx.moveTo(fa.fx - 54, fa.fy + 8)
      ctx.lineTo(fa.fx + 62, fa.fy - 8)
      ctx.stroke()
    }
  } else {
    limb(ctx, fs.x, fs.y, frontArm, 8, frontArm, 1, 9.5, o.coat, '#2a2219')
    circle(ctx, fs.x + Math.sin(frontArm) * 9, fs.y + Math.cos(frontArm) * 9, 3.4)
    paint(ctx, C('#6e2b20'))
  }

  if (v.armorKind === 'door' && v.armor > 0) screenDoor(ctx, v.armor)
}

export function drawZombie(ctx: Ctx, x: number, y: number, v: ZombieView, lift = 0) {
  const o = OUTFITS[v.id]
  ctx.save()
  ctx.translate(x, y - lift)
  let alpha = 1
  if (v.state === 'dying') {
    const fall = easeInCubic(clamp(v.deathT / 0.85, 0, 1))
    ctx.rotate(fall * 1.42)
    alpha = clamp(1 - (v.deathT - 1.3) / 0.8, 0, 1)
  } else if (v.state === 'ash') {
    alpha = clamp(1 - (v.deathT - 0.8) / 0.7, 0, 1)
  } else if (v.state === 'squashed') {
    ctx.scale(1.25, clamp(1 - v.deathT * 5, 0.12, 1))
    alpha = clamp(1 - (v.deathT - 0.9) / 0.4, 0, 1)
  } else if (v.state === 'mowed') {
    ctx.rotate(-v.deathT * 7)
    ctx.scale(1 - v.deathT * 0.6, 1 - v.deathT * 0.6)
    alpha = clamp(1 - v.deathT / 0.8, 0, 1)
  } else if (v.state === 'vault') {
    const t = clamp(v.stateT / 0.9, 0, 1)
    ctx.rotate(-Math.sin(t * Math.PI) * 0.6)
  } else if (v.state === 'fly') {
    ctx.rotate(-v.stateT * 9)
  } else if (v.state === 'angry') {
    ctx.translate(Math.sin(v.t * 60) * 1.5, 0)
  }
  ctx.globalAlpha *= alpha
  ctx.scale(o.scale, o.scale)
  drawBody(ctx, v, o)
  ctx.restore()
  if (v.state === 'vault' && v.hasPole) {
    const t = clamp(v.stateT / 0.9, 0, 1)
    const gx = x - 30 + t * 40
    ctx.lineCap = 'round'
    ctx.lineWidth = 4
    ctx.strokeStyle = C('#8b5a2b')
    ctx.beginPath()
    ctx.moveTo(gx, y)
    ctx.lineTo(x - 10, y - lift - 90)
    ctx.stroke()
  }
}

export function zombieShadow(ctx: Ctx, x: number, y: number, id: ZombieId, lift = 0) {
  const s = OUTFITS[id].scale
  const k = clamp(1 - lift / 220, 0.35, 1)
  ellipse(ctx, x - 2, y, 30 * s * k, 8 * s * k)
  ctx.fillStyle = `rgba(0,0,0,${0.24 * k})`
  ctx.fill()
}

export const zombieScale = (id: ZombieId) => OUTFITS[id].scale
