import { shape } from './paths'
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
  coat: '#79543a',
  coatDark: '#503c2b',
  shirt: '#e6ddbc',
  tie: '#a83424',
  pants: '#525f79',
  pantsDark: '#35425c',
  skin: '#8eaa91',
  skinDark: '#617e69',
  shoe: '#574631',
  scale: 1,
  head: 1,
}

const OUTFITS: Record<ZombieId, Outfit> = {
  basic: BASE,
  flag: BASE,
  cone: BASE,
  bucket: BASE,
  door: { ...BASE, coat: '#6f6a5c', coatDark: '#4f4b40' },
  paper: { ...BASE, coat: '#8b5145', coatDark: '#623c34', shirt: '#ded4b9', tie: null, pants: '#eee3c9', pantsDark: '#b6ad94' },
  pole: { ...BASE, coat: '#e6e1d6', coatDark: '#b8b1a3', shirt: '#e6e1d6', tie: null, pants: '#c23b3b', pantsDark: '#8a2525' },
  football: { ...BASE, coat: '#c8242c', coatDark: '#8f1820', shirt: '#c8242c', tie: null, pants: '#d9d4c8', pantsDark: '#a9a397', scale: 1.08 },
  garg: { ...BASE, coat: '#807968', coatDark: '#595c4e', shirt: '#807968', tie: null, pants: '#55678a', pantsDark: '#3b4a66', skin: '#9fb584', skinDark: '#748a5d', scale: 1.72, head: 0.96 },
  imp: { ...BASE, coat: '#b94932', coatDark: '#793526', shirt: '#b94932', tie: null, pants: '#6b5a44', pantsDark: '#4a3e2e', scale: 0.62, head: 1.25 },
}

interface Point {
  x: number
  y: number
}

/** Two-segment limb. Angles are measured from straight down; negative swings toward −x (forward). */
function segment(ctx: Ctx, x: number, y: number, angle: number, len: number, width: number, fill: string, kind: 'cloth' | 'skin' | 'pants') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-angle); ctx.scale(width / 12, len / 28)
  const d = kind === 'cloth'
    ? 'M-7 0 Q-10 7 -6 21 L-7 28 L-3 25 L0 29 L3 25 L6 28 L7 19 Q8 6 5 0Z'
    : kind === 'pants' ? 'M-7 -2 L7 -2 Q9 11 5 28 L-7 28 L-5 18Z'
    : 'M-5 -2 Q-8 4 -4 11 L-4 28 L4 28 Q2 18 5 6 L5 -2Z'
  shape(ctx, d, fill, kind === 'skin' ? '#454d35' : '#342f23', 2)
  if (kind === 'cloth') shape(ctx, 'M-4 7 L2 11 M-4 20 L2 17', null, '#473e2d', 1.1)
  if (kind === 'skin') shape(ctx, 'M-2 6 L1 10 M0 15 L1 24', null, '#75805e', 1)
  ctx.restore()
  return {x: x + Math.sin(angle) * len, y: y + Math.cos(angle) * len}
}

function hand(ctx: Ctx, p: Point, o: Outfit, angle: number) {
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(-angle)
  shape(ctx, 'M-4 -3 L4 -3 L6 2 L5 8 L9 12 Q10 15 7 14 L2 10 L1 16 Q-1 18 -2 15 L-3 10 L-4 17 Q-7 19 -7 15 L-7 9 L-9 13 Q-12 13 -10 9 L-8 2Z', o.skin, '#454d35', 1.5)
  shape(ctx, 'M-5 3 L2 3 M-4 7 L1 7', null, o.skinDark, 1)
  ctx.restore()
}

function arm(ctx: Ctx, x: number, y: number, a: number, fore: number, o: Outfit, id: ZombieId, intact = true, back = false) {
  const heavy = id === 'garg', bare = heavy || id === 'pole' || id === 'imp'
  const w = heavy ? 20 : id === 'football' ? 14 : 12
  const elbow = segment(ctx, x, y, a, intact ? 27 : 10, w, bare ? o.skin : back ? o.coatDark : o.coat, bare ? 'skin' : 'cloth')
  if (!intact) {
    ellipse(ctx, elbow.x, elbow.y, w * 0.35, 3); paint(ctx, C('#7a5944'), C('#454334'), 1)
    return elbow
  }
  const wrist = segment(ctx, elbow.x, elbow.y, fore, 21, heavy ? 15 : 9, back ? o.skinDark : o.skin, 'skin')
  hand(ctx, wrist, o, fore)
  return wrist
}

function leg(ctx: Ctx, x: number, a: number, o: Outfit, id: ZombieId, back: boolean) {
  const heavy = id === 'garg', sport = id === 'pole', paper = id === 'paper'
  const knee = segment(ctx, x, -46, a, 23, heavy ? 20 : 14, back ? o.pantsDark : o.pants, 'pants')
  const lower = a * 0.45 + (a < 0 ? 0.28 : -0.1)
  const ankle = segment(ctx, knee.x, knee.y, lower, 22, heavy ? 16 : 11, sport || paper ? o.skin : back ? o.pantsDark : o.pants, sport || paper ? 'skin' : 'pants')
  if (!sport && !paper) {
    ctx.save(); ctx.translate(knee.x, knee.y); ctx.rotate(-lower)
    shape(ctx, 'M-5 -3 L2 -5 L6 -1 L2 4 L-4 3Z', o.skinDark, '#344334', 1.2)
    shape(ctx, 'M-6 -4 L-2 -1 M4 3 L6 5', null, '#c0c5aa', 1)
    ctx.restore()
  }
  ctx.save(); ctx.translate(ankle.x, ankle.y)
  if (sport || id === 'football') {
    shape(ctx, 'M-7 -8 L5 -8 L5 -1 Q6 4 -5 5 L-21 4 L-23 0 L-16 -4Z', '#e8e2c6', '#504b38', 1.8)
    shape(ctx, 'M-21 1 L5 2 M-12 -3 L-7 -1 M-7 -5 L-2 -3', null, '#b74330', 1.5)
  } else {
    shape(ctx, 'M-7 -7 L5 -6 L7 1 Q9 7 -2 7 L-22 6 Q-28 4 -24 0 L-17 -3 L-13 -8Z', o.shoe, '#332c22', 2)
    shape(ctx, 'M-23 4 L6 4 M-15 -3 L-7 -2 M-13 -5 L-5 -4', null, '#918068', 1.1)
  }
  ctx.restore()
}

function torso(ctx: Ctx, o: Outfit, id: ZombieId) {
  if (id === 'garg') {
    shape(ctx, 'M-31 -99 Q-11 -111 17 -102 Q36 -99 38 -80 L28 -43 L-26 -40 Q-39 -60 -31 -99Z', linear(ctx, -27, -90, 33, -45, [[0, o.coat], [1, o.coatDark]]), '#343c2c', 2.8)
    shape(ctx, 'M-27 -99 L-17 -94 L-14 -100 L-8 -93 L7 -96 L11 -103 M-31 -69 L-20 -65 L-22 -48 M29 -68 L18 -65 L20 -46', null, '#3d4437', 2)
    shape(ctx, 'M-21 -45 L-25 -83 L-17 -88 L-9 -52 L11 -52 L16 -91 L24 -86 L23 -45Z', o.pants, '#344535', 2)
    shape(ctx, 'M-26 -52 L27 -54 L28 -36 L3 -33 L-25 -37Z', o.pants, '#303e35', 2)
    shape(ctx, 'M-8 -53 L-8 -39 L10 -39 L10 -53 M-18 -78 L-14 -76 M17 -78 L21 -77', null, '#94a4a1', 1.4)
    return
  }
  const sport = id === 'pole' || id === 'football', imp = id === 'imp'
  shape(ctx, 'M-19 -99 Q-1 -105 16 -92 Q24 -76 19 -53 L23 -42 L13 -38 L8 -43 L0 -37 L-10 -41 L-16 -37 Q-20 -55 -22 -75Z', linear(ctx, -19, -90, 19, -50, [[0, o.coat], [1, o.coatDark]]), '#362e23', 2.5)
  if (sport) {
    if (id === 'pole') {
      shape(ctx, 'M-16 -96 L-14 -42 M11 -94 L15 -43', null, '#a83b2c', 3.5)
      shape(ctx, 'M-10 -69 L10 -69 L9 -52 L-9 -52Z', '#f6ebcb', '#b1a687', 1)
    }
    ctx.font = '900 17px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = C(id === 'pole' ? '#a53626' : '#f8ebcd'); ctx.fillText(id === 'pole' ? '1' : '13', 0, -63)
    return
  }
  if (imp) {
    shape(ctx, 'M-17 -84 L-6 -77 L-13 -66 M16 -82 L7 -74 L14 -69 M-5 -50 L2 -46 L9 -52', null, '#e47e52', 1.8)
    return
  }
  shape(ctx, 'M-15 -99 L1 -99 L6 -85 L-1 -51 L-13 -54 L-16 -72Z', o.shirt, '#706448', 1.6)
  shape(ctx, 'M-15 -98 L-21 -86 L-12 -80 L-17 -75 L-9 -58 M3 -96 L11 -86 L5 -76 L8 -70 L-2 -54', o.coat, '#493b29', 1.8)
  if (o.tie) {
    shape(ctx, 'M-11 -94 L-4 -95 L-2 -88 L-6 -84 L-1 -65 L-7 -55 L-13 -63 L-10 -85 L-14 -88Z', o.tie, '#633221', 1.5)
    shape(ctx, 'M-10 -80 L-5 -76 M-10 -70 L-4 -66 M-10 -61 L-6 -58', null, '#dfb77a', 2)
  }
  shape(ctx, 'M9 -66 L15 -64 L12 -57 L6 -59 M-16 -49 L-12 -48', null, '#493c2c', 1.6)
  if (id === 'paper') shape(ctx, 'M-10 -76 L-9 -47 M-5 -73 L-6 -66 M-7 -58 L-7 -52', null, '#a27f63', 1.3)
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
      ctx.save()
      ctx.translate(hx, hy)
      shape(ctx, 'M-25 1 L-34 5 L-33 24 L-14 33 L5 28 L10 9 M-33 14 L-9 22 L6 18 M-23 8 L-22 27 M-10 11 L-10 29', null, '#464e48', 4)
      shape(ctx, 'M-25 1 L-34 5 L-33 24 L-14 33 L5 28 L10 9 M-33 14 L-9 22 L6 18 M-23 8 L-22 27 M-10 11 L-10 29', null, '#a8b5a7', 2)
      ctx.restore()
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
  const skin = v.angry ? '#bfa284' : o.skin, dark = v.angry ? '#947858' : o.skinDark
  ctx.save(); ctx.translate(hx, hy); ctx.scale(o.head, o.head)
  shape(ctx, 'M3 17 L15 12 L15 32 L2 33 L-3 26Z', dark, '#414b34', 1.8)
  shape(ctx, 'M21 -3 Q34 -12 33 0 Q32 12 23 10 L19 5Z', skin, '#414b34', 1.8)
  shape(ctx, 'M26 0 Q31 -3 28 5', null, dark, 1.8)
  // Asymmetric forehead, projecting nose, sunken cheek and a separate jaw.
  shape(ctx, 'M-23 -8 C-28 -17 -18 -31 -4 -32 C13 -36 26 -25 27 -11 Q28 3 19 11 L13 23 Q-1 31 -19 23 L-24 13 L-30 8 L-31 2 L-24 -1Z', linear(ctx, -19, -29, 22, 24, [[0, '#b0bea0'], [0.35, skin], [1, dark]]), '#374735', 2.5)
  shape(ctx, 'M12 -23 Q17 -19 20 -19 M16 9 L22 5 M10 15 L16 13 M-16 -25 L-8 -27', null, dark, 1.4)
  const covered = v.armor > 0 && ['bucket', 'helmet', 'cone'].includes(v.armorKind ?? '')
  if (!covered) {
    shape(ctx, 'M-7 -31 Q-13 -40 -8 -43 M0 -33 Q-1 -42 6 -43 M7 -31 Q12 -39 18 -37', null, '#424533', 1.8)
    if (v.id === 'paper') shape(ctx, 'M13 -28 Q23 -36 28 -21 M18 -27 Q28 -30 29 -16', null, '#d9d8bb', 3)
  }
  ellipse(ctx, -16, -7, 9, 10, -0.18); paint(ctx, C('#f1edcf'), C('#454a35'), 1.8)
  ellipse(ctx, 3, -9, 10.6, 11.2, 0.08); paint(ctx, C('#faf5dc'), C('#454a35'), 1.8)
  circle(ctx, -18.5, -6, 2.2); paint(ctx, C('#272e20'))
  circle(ctx, 0.5, -7.5, 2.8); paint(ctx, C('#272e20'))
  shape(ctx, 'M-23 4 L-27 7 L-18 9 L-14 7', skin, '#4a5239', 1.5)
  shape(ctx, 'M-23 -19 Q-16 -24 -9 -19 M-6 -23 Q3 -27 12 -22', null, '#69764f', 2)
  if (v.id === 'garg' || v.angry) shape(ctx, 'M-26 -18 L-10 -14 M-5 -16 L15 -22', null, '#4a5539', 4)
  const open = 3 + jaw * 5
  ctx.save(); ctx.translate(0, open)
  shape(ctx, 'M-25 9 Q-12 12 5 7 L7 16 Q-1 26 -17 23 L-25 20Z', dark, '#374735', 2)
  shape(ctx, 'M-25 7 Q-13 11 4 6 L3 17 Q-7 21 -22 16Z', '#392d23', '#42432c', 1.5)
  shape(ctx, 'M-22 9 L-21 14 L-16 15 L-15 10 M-7 10 L-7 14 L-3 13 L-3 9 M-12 18 L-12 15 L-7 15 L-6 19', '#e6dfb6', '#7f7955', 0.7)
  ctx.restore()
  shape(ctx, 'M-23 6 Q-11 10 8 5 L10 9', null, '#535b3d', 2)
  if (v.id === 'paper') {
    ellipse(ctx, -16, -7, 10.5, 11); paint(ctx, null, C('#565040'), 1.6)
    ellipse(ctx, 3, -9, 12, 12.5); paint(ctx, null, C('#565040'), 1.6)
    shape(ctx, 'M-5 -9 L-7 -8 M15 -10 L27 -6', null, '#565040', 1.6)
  }
  if (v.id === 'pole') {
    shape(ctx, 'M-24 -22 Q0 -28 26 -21 L26 -15 Q0 -23 -25 -16Z', '#c9402d', '#6d3824', 1.5)
    shape(ctx, 'M26 -20 L39 -12 L27 -13 L37 -4 L24 -10Z', '#c9402d', '#6d3824', 1.3)
  }
  if (v.angry) {
    ctx.save(); const k = (v.t * 2) % 1; ctx.globalAlpha *= 1 - k
    for (const x of [-6, 8]) { circle(ctx, x, -36 - k * 20, 3 + k * 4); paint(ctx, C('#eae6cf')) }
    ctx.restore()
  }
  headwear(ctx, v, 0, -10)
  ctx.restore()
}

export function drawZombieHead(ctx: Ctx, id: ZombieId, x: number, y: number, rot: number, scale = 1) {
  const o = OUTFITS[id]
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.scale(o.scale * scale, o.scale * scale)
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

/** Detached pieces use exactly the same outfit and contours as living sprites. */
export function drawZombieArm(ctx: Ctx, id: ZombieId, x: number, y: number, rot: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.scale(0.7, 0.7)
  arm(ctx, 0, -25, 0.1, -0.2, OUTFITS[id], id)
  ctx.restore()
}

export function drawZombieArmor(ctx: Ctx, kind: ArmorKind) {
  ctx.save()
  if (kind === 'door') {
    ctx.translate(48, 84)
    screenDoor(ctx, 0.3)
  } else if (kind === 'paper') {
    ctx.translate(48, 78)
    newspaper(ctx, 0.3, 0)
  } else {
    headwear(ctx, { id: 'basic', t: 0, phase: 0, state: 'preview', stateT: 0, deathT: 0, hasArm: true, hasHead: true, hasPole: false, hasImp: false, armorKind: kind, armor: 0.3, angry: false }, 0, 20)
  }
  ctx.restore()
}

function newspaper(ctx: Ctx, r: number, wob: number) {
  ctx.save()
  ctx.translate(-48, -78)
  ctx.rotate(-0.08 + wob * 0.03)
  shape(ctx, r < 0.5 ? 'M-26 -25 L0 -21 L27 -27 L25 -7 L16 0 L24 7 L17 20 L0 27 L-27 23Z' : 'M-26 -25 L0 -21 L27 -27 L29 23 L0 28 L-27 23Z', linear(ctx, -26, 0, 29, 0, [[0, '#e5e1cc'], [0.45, '#f1edd7'], [0.5, '#c9c5ad'], [1, '#e9e5d0']]), '#767762', 1.8)
  shape(ctx, 'M0 -21 L0 26', null, '#aaa68e', 1)
  ctx.fillStyle = C('#4a4a44')
  ctx.fillRect(-21, -18, 16, 4)
  ctx.fillRect(4, -20, 17, 4)
  ctx.fillStyle = C('#9a988c')
  for (let i = 0; i < 7; i++) {
    ctx.fillRect(-21, -10 + i * 4, i % 3 === 2 ? 11 : 16, 1.3)
    if (i < 3 || r >= 0.5) ctx.fillRect(4, -12 + i * 4, i % 3 === 2 ? 11 : 17, 1.3)
  }
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
  const st = v.state, running = (v.id === 'pole' && v.hasPole) || v.id === 'football'
  const dead = ['dying', 'ash', 'squashed', 'mowed'].includes(st)
  let legA = Math.sin(v.phase) * (running ? 0.65 : 0.28)
  let frontArm = -0.12 + Math.sin(v.phase) * 0.08, frontFore = -0.35
  let backArm = -0.28 - Math.sin(v.phase) * 0.1, backFore = -0.55
  let jaw = 0.2, headDy = Math.sin(v.phase) * 1.4, lean = 0.045
  if (st === 'preview') legA *= 0.18
  if (running) { lean = -0.1; frontArm = -0.65; frontFore = -1.7; backArm = 0.5; backFore = -0.9 }
  if (v.id === 'football') lean = -0.28
  if (st === 'eat') {
    legA *= 0.12; jaw = (Math.sin(v.phase) + 1) * 0.5; headDy = Math.sin(v.phase) * 2
    frontArm = -0.75 + Math.sin(v.phase) * 0.18; frontFore = -1.85; backArm = -0.65; lean = -0.04
  }
  if (st === 'vault') { legA = 0.8; lean = -0.35 }
  if (dead) { frontArm = 0.1; backArm = 0.2; frontFore = -0.3; backFore = -0.4 }
  if (v.armorKind === 'paper' && v.armor > 0) { frontArm = -0.55; frontFore = -2; backArm = -0.7; backFore = -1.9 }
  if (v.id === 'flag') { backArm = -1.6; backFore = -2.75 }
  if (v.id === 'garg' && !dead) { frontArm = -0.5; frontFore = -1.7 }
  if (v.id === 'garg' && st === 'smash') {
    const t = v.stateT
    frontArm = t < 0.9 ? lerp(-0.5, -2.8, easeOutCubic(t / 0.9)) : t < 1.05 ? lerp(-2.8, -0.7, easeInCubic((t - 0.9) / 0.15)) : -0.7
    frontFore = frontArm - 0.4
  }
  if (v.id === 'garg' && st === 'throw') {
    backArm = v.stateT < 0.9 ? lerp(-0.6, 1.3, v.stateT / 0.9) : lerp(1.3, -2.4, clamp((v.stateT - 0.9) / 0.2, 0, 1))
    backFore = backArm - 0.3
  }
  ctx.rotate(lean)
  if (v.id === 'garg' && v.hasImp && !(st === 'throw' && v.stateT > 0.9)) {
    shape(ctx, 'M20 -87 L18 -127 L42 -126 L44 -78Z', '#765333', '#413b28', 2)
    if (st === 'throw') imp(ctx, 18 + Math.sin(backArm) * 40, -68 + Math.cos(backArm) * 40, 0.44, v.t)
    else imp(ctx, 34, -87, 0.44, v.t)
  }
  const ba = arm(ctx, v.id === 'garg' ? 25 : 10, -92, backArm, backFore, o, v.id, true, true)
  if (v.id === 'flag') flag(ctx, ba, v.t)
  leg(ctx, v.id === 'garg' ? 14 : 8, legA, o, v.id, true)
  leg(ctx, v.id === 'garg' ? -13 : -7, -legA, o, v.id, false)
  torso(ctx, o, v.id)
  if (v.id === 'football') {
    shape(ctx, 'M-25 -101 Q-34 -99 -29 -85 L-13 -85 L-6 -96 L15 -94 L18 -83 L36 -87 Q47 -98 39 -106 Q27 -113 15 -104Z', '#e0dfcd', '#504b39', 2.5)
    shape(ctx, 'M-29 -89 L-12 -88 M18 -87 Q32 -84 40 -97', null, '#bf3827', 6)
    shape(ctx, 'M20 -103 Q28 -108 36 -106', null, '#fff6de', 2)
  }
  if (v.hasHead) head(ctx, v, o, v.id === 'garg' ? -15 : -17, -117 + headDy, jaw)
  else { ellipse(ctx, -8, -100, 8, 4); paint(ctx, C('#78694b'), C('#414331'), 1.5) }
  if (v.armorKind === 'paper' && v.armor > 0) newspaper(ctx, v.armor, Math.sin(v.phase))
  const fa = arm(ctx, v.id === 'garg' ? -28 : -17, -92, frontArm, frontFore, o, v.id, v.hasArm)
  if (v.hasArm && v.id === 'garg') {
    ctx.save(); ctx.translate(fa.x, fa.y); ctx.rotate(-frontFore - 0.2)
    shape(ctx, 'M-7 -23 L7 -23 L8 78 L4 87 L-7 84Z', '#9a8052', '#51462e', 2.3)
    shape(ctx, 'M-3 -19 L-2 76 M4 -10 L4 53', null, '#c0a777', 1.6)
    shape(ctx, 'M-22 55 L21 55 L21 64 L-22 64Z', '#79684b', '#45422e', 2)
    shape(ctx, 'M-15 50 L-15 68 M15 50 L15 68', null, '#b6bba5', 5)
    ctx.restore(); hand(ctx, fa, o, frontFore)
  }
  if (v.hasArm && v.id === 'pole' && v.hasPole) {
    ctx.save(); ctx.translate(fa.x, fa.y); ctx.rotate(-0.1)
    shape(ctx, 'M-76 0 L94 0', null, '#665839', 4.5)
    shape(ctx, 'M-73 -1 L93 -1', null, '#d5bd80', 2)
    shape(ctx, 'M-3 -2 L9 -2', null, '#e6dbb8', 4)
    ctx.restore()
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
