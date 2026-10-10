import type { PlantId } from '../data/plants'
import { C, TAU, circle, clamp, ellipse, linear, paint, radial, type Ctx } from '../util'
import { shape } from './paths'

export interface PlantView {
  t: number
  anim?: number
  hp?: number
  state?: string
  stateT?: number
  lookX?: number
  rot?: number
  loaded?: boolean
}
interface PeaPalette { light: string; base: string; shade: string; dark: string; hole: string }
const PEA: PeaPalette = { light: '#c1ed56', base: '#82c72d', shade: '#4e9320', dark: '#284718', hole: '#12250d' }
const SNOW: PeaPalette = { light: '#c1eff6', base: '#78c9df', shade: '#3792b2', dark: '#235368', hole: '#153646' }
const REPEAT: PeaPalette = { light: '#99cc4e', base: '#559c2c', shade: '#327324', dark: '#233f18', hole: '#14280f' }

export function leaf(ctx: Ctx, x: number, y: number, angle: number, len: number, w: number, light = '#80b940', dark = '#447f28', edge = '#294e1d') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(len / 30, w / 10)
  shape(ctx, 'M0 0 C8 -12 23 -10 30 0 C23 1 13 12 0 0Z', linear(ctx, 0, -10, 0, 9, [[0, light], [1, dark]]), edge, 2)
  shape(ctx, 'M2 0 Q15 -3 27 0 M12 -1 L16 -5 M18 -1 L22 3', null, edge, 1)
  ctx.restore()
}
function stem(ctx: Ctx, d: string, pal = PEA, w = 8) {
  shape(ctx, d, null, pal.dark, w + 2.8)
  shape(ctx, d, null, pal.base, w)
  shape(ctx, d, null, pal.light, w * 0.28)
}
function roots(ctx: Ctx, pal = PEA) {
  shape(ctx, 'M-1 -6 C-8 -23 -25 -20 -29 -12 Q-15 -15 -11 -3Z M2 -6 C8 -25 26 -22 31 -12 Q20 -16 13 -3Z', pal.shade, pal.dark, 2)
  shape(ctx, 'M0 -5 C-10 -18 -33 -16 -37 4 Q-31 -3 -24 0 L-27 6 Q-8 12 0 -5Z', linear(ctx, 0, -17, 0, 10, [[0, pal.base], [1, pal.shade]]), pal.dark, 2.2)
  shape(ctx, 'M0 -5 C6 -23 28 -24 36 -9 L37 0 L31 -3 L28 3 Q12 10 0 -5Z', linear(ctx, 0, -23, 0, 8, [[0, pal.light], [0.5, pal.base], [1, pal.shade]]), pal.dark, 2.2)
  shape(ctx, 'M-2 -5 Q-17 -9 -29 -4 M3 -7 Q18 -16 30 -10', null, pal.dark, 1.2)
}
function eye(ctx: Ctx, x: number, y: number, rx: number, ry: number, dx = 1, dy = 0, r = 2.3) {
  ellipse(ctx, x, y, rx, ry); paint(ctx, C('#fffbe8'), C('#323220'), 1.5)
  ellipse(ctx, x + dx, y + dy, r, r * 1.2); paint(ctx, C('#20251a'))
}
function dotEye(ctx: Ctx, x: number, y: number, rx: number, ry: number, blink = false) {
  if (blink) {
    ctx.beginPath(); ctx.moveTo(x - rx, y); ctx.quadraticCurveTo(x, y + 2, x + rx, y)
    paint(ctx, null, C('#25281a'), 2)
  } else {
    ellipse(ctx, x, y, rx, ry, -0.08); paint(ctx, C('#20291b'))
    ellipse(ctx, x - 0.7, y - ry * 0.4, rx * 0.32, ry * 0.23); paint(ctx, C('#f5ffdc'))
  }
}
function peaHead(ctx: Ctx, x: number, y: number, scale: number, pal: PeaPalette, recoil: number, crest: 'leaf' | 'ice' | 'double', t: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale)
  if (crest === 'ice') {
    shape(ctx, 'M-13 -17 L-22 -34 L-24 -20 L-36 -27 L-30 -12 L-42 -9 L-27 -1 L-38 7 L-19 10Z', '#b8e9f5', pal.dark, 2)
    shape(ctx, 'M-24 -19 L-19 -8 M-32 -9 L-22 -4 M-27 5 L-20 2', null, '#66aec7', 1.4)
  } else {
    shape(ctx, 'M-20 -11 C-29 -15 -38 -12 -38 -2 Q-33 -8 -24 -2Z', pal.base, pal.dark, 2)
    if (crest === 'double') {
      leaf(ctx, -18, -9, -3.03, 25, 9, pal.base, pal.shade, pal.dark)
      leaf(ctx, -17, -2, 2.7, 20, 7, pal.base, pal.shade, pal.dark)
    }
  }
  // One continuous cheek and flaring muzzle silhouette, with the lower cheek
  // hanging below the mouth axis. All portraits share this animated geometry.
  ctx.save(); ctx.scale(1 - recoil * 0.09, 1 + recoil * 0.055)
  shape(ctx, 'M-23 5 C-30 -7 -25 -24 -11 -28 C3 -33 14 -24 20 -16 C26 -11 33 -14 38 -18 C43 -18 47 -10 47 -1 C48 8 45 17 39 18 C31 15 27 10 20 12 C13 16 10 26 -5 25 C-16 25 -22 18 -23 5Z', linear(ctx, -13, -27, 10, 27, [[0, pal.light], [0.45, pal.base], [1, pal.shade]]), pal.dark, 2.7)
  shape(ctx, 'M-20 1 C-17 18 -4 23 9 16 C5 27 -18 26 -20 1Z', pal.shade, null)
  shape(ctx, 'M-18 -15 C-15 -25 -3 -27 4 -22', null, pal.light, 3.8)
  ellipse(ctx, 39, 0, 8.5, 17.5, -0.04)
  paint(ctx, linear(ctx, 31, 0, 48, 0, [[0, pal.light], [1, pal.base]]), C(pal.dark), 2.4)
  ellipse(ctx, 40.5, 0, 5.5, 12.3, -0.03); paint(ctx, C(pal.hole))
  shape(ctx, 'M40 9 Q44 6 44 -1', null, pal.shade, 1.7)
  const blink = Math.sin(t * 0.83) > 0.996
  ctx.save(); ctx.translate(5, -11); ctx.rotate(0.28); dotEye(ctx, 0, 0, 3.5, 5.1, blink); ctx.restore()
  dotEye(ctx, 17.5, -16, 2, 3.5, blink)
  if (crest === 'double') shape(ctx, 'M-2 -22 Q5 -23 12 -17 M13 -22 L20 -19', null, pal.dark, 4)
  ctx.restore(); ctx.restore()
}
function shooter(ctx: Ctx, v: PlantView, pal: PeaPalette, crest: 'leaf' | 'ice' | 'double') {
  const recoil = clamp((v.anim ?? 0) / 0.2, 0, 1)
  roots(ctx, pal); stem(ctx, 'M0 -6 C-8 -21 -4 -36 0 -49', pal, 7)
  peaHead(ctx, -3 + Math.sin(v.t * 2.1) * 1.4 - recoil * 3, -59 + Math.cos(v.t * 2.1) * 0.7, 1, pal, recoil, crest, v.t)
}
function threepeater(ctx: Ctx, v: PlantView) {
  const sw = Math.sin(v.t * 2) * 1.4, recoil = clamp((v.anim ?? 0) / 0.2, 0, 1)
  roots(ctx)
  stem(ctx, 'M0 -5 C-7 -27 8 -51 4 -78', PEA, 7)
  stem(ctx, 'M0 -25 C-17 -29 -24 -37 -22 -49', PEA, 5)
  stem(ctx, 'M0 -28 C18 -28 26 -34 24 -43', PEA, 5)
  peaHead(ctx, 4 + sw, -92, 0.68, PEA, recoil, 'leaf', v.t)
  peaHead(ctx, -22 + sw, -56, 0.67, PEA, recoil, 'leaf', v.t)
  peaHead(ctx, 24 + sw, -50, 0.72, PEA, recoil, 'leaf', v.t)
}
function sunflower(ctx: Ctx, v: PlantView) {
  const sw = Math.sin(v.t * 1.9)
  stem(ctx, 'M0 -5 C-5 -21 4 -37 0 -55', PEA, 7)
  ctx.save(); ctx.translate(0, -7); ctx.scale(0.83, 1.1); roots(ctx); ctx.restore()
  ctx.translate(sw * 2.3, -62 + Math.cos(v.t * 1.9) * 0.8); ctx.rotate(sw * 0.045)
  if ((v.anim ?? 0) > 0) {
    circle(ctx, 0, 0, 54); paint(ctx, radial(ctx, 0, 0, 16, 0, 0, 54, [[0, '#fff1a078'], [1, '#fff1a000']]))
  }
  for (let layer = 0; layer < 2; layer++) for (let i = 0; i < 12; i++) {
    ctx.save(); ctx.rotate(i * TAU / 12 + layer * 0.26)
    if (layer === 0) ctx.scale(0.96, 1.03)
    shape(ctx, 'M-7 -18 C-13 -25 -10 -32 -4 -36 C0 -39 4 -36 7 -31 C11 -24 8 -19 3 -17Z', linear(ctx, 0, -38, 0, -16, [[0, layer ? '#ffdf4a' : '#e8b72b'], [0.65, '#f4bf26'], [1, '#cf8317']]), '#956019', 1.5)
    ctx.restore()
  }
  ellipse(ctx, 0, 0, 25, 23); paint(ctx, C('#985a25'), C('#643913'), 2.5)
  ellipse(ctx, 0, 0, 22.6, 20.5); paint(ctx, radial(ctx, -7, -9, 2, 0, 0, 28, [[0, '#dca153'], [0.65, '#bf803a'], [1, '#a16528']]), C('#b17a34'), 1.1)
  for (let i = 0; i < 18; i++) {
    const a = i * 2.399, r = 18 + (i % 2) * 1.5
    ellipse(ctx, Math.cos(a) * r, Math.sin(a) * r, 0.65, 1); paint(ctx, C('#b78746'))
  }
  const blink = Math.sin(v.t * 0.9) > 0.992
  dotEye(ctx, -8, -4, 3, 5.4, blink); dotEye(ctx, 8, -4, 3, 5.4, blink)
  shape(ctx, 'M-10 7 Q0 19 11 6 M-12 6 L-8 7 M9 6 L12 5', null, '#593818', 2)
  ellipse(ctx, -14, 5, 3.5, 1.8); paint(ctx, C('#d58b44'))
  ellipse(ctx, 14, 5, 3.5, 1.8); paint(ctx, C('#d58b44'))
}

type NutPal = [string, string, string, string]
const NUT: NutPal = ['#efc26e', '#c39542', '#977028', '#59451e']
const NUT_RED: NutPal = ['#ffab78', '#df6844', '#a83b28', '#602c1d']
function nut(ctx: Ctx, v: PlantView, tall = false, pal = NUT, rolling = false, giant = false) {
  const hp = v.hp ?? 1
  ctx.translate(0, tall ? -59 : rolling ? -30 : -36)
  if (v.rot) ctx.rotate(v.rot)
  if (rolling) ctx.scale(1, 30 / 36)
  if (giant) ctx.scale(2, 2)
  const body = tall
    ? 'M-31 43 C-33 18 -29 -24 -22 -43 Q-17 -57 -5 -61 Q5 -64 15 -55 C28 -42 28 -21 31 0 L32 38 Q32 56 21 59 Q0 64 -17 58 Q-30 55 -31 43Z'
    : 'M-29 17 C-34 3 -26 -17 -17 -28 Q-8 -39 0 -37 C9 -39 22 -22 26 -12 Q34 4 29 19 C26 31 14 36 1 36 C-13 38 -25 32 -29 17Z'
  shape(ctx, body, linear(ctx, -28, -28, 32, 29, [[0, pal[0]], [0.55, pal[1]], [1, pal[2]]]), pal[3], 2.8)
  shape(ctx, tall ? 'M-21 -43 Q-24 -18 -22 1 M21 -38 Q26 -17 23 5 M-23 32 L-17 38 L-21 47 M19 32 L24 38 L19 46 M-6 48 L-2 51 L3 49' : 'M-19 -24 Q-24 -13 -24 -6 M-25 7 L-21 11 L-23 16 M-16 24 L-12 21 L-8 25 M16 22 L20 18 L24 21 M8 30 L12 28 M17 -23 L22 -16', null, pal[2], 1.5)
  shape(ctx, tall ? 'M-11 -56 C-25 -28 -15 3 -19 21 Q-22 42 -12 57 M-8 4 L-2 8 L5 4 L10 8 M-6 24 L0 21 L8 26 M-6 40 L2 44 L8 40' : 'M-9 -32 C-24 -17 -15 0 -20 10 Q-23 25 -11 32 M-9 22 L-2 18 L4 22 L12 18 M-4 29 L1 27 L7 30', null, pal[2], 1.3)
  shape(ctx, tall ? 'M-13 -39 Q-18 -21 -17 -7' : 'M-13 -22 Q-17 -13 -17 -6', null, pal[0], 2.6)
  if (hp < 0.67) shape(ctx, tall ? 'M4 -58 L-2 -41 L7 -31 L1 -18' : 'M-8 -37 L-4 -25 L-12 -17 L-8 -9', null, pal[3], 2.2)
  if (hp < 0.34) {
    shape(ctx, tall ? 'M30 3 L17 9 L23 18 L12 30 M-29 -18 L-17 -9 L-22 0' : 'M29 10 L16 14 L19 23 L9 28 M-28 -9 L-17 -4 L-22 3', null, pal[3], 2.3)
    shape(ctx, tall ? 'M26 -46 L18 -35 L29 -24Z' : 'M19 -28 L10 -17 L27 -13Z', pal[3], null)
  }
  const ey = tall ? -22 : -8
  eye(ctx, -3, ey, 8.7, tall ? 9 : 9.8, 2, hp < 0.34 ? 2 : 0, 1.5)
  eye(ctx, 17, ey - 2, 7.7, tall ? 8.4 : 8.9, 1.5, hp < 0.34 ? 2 : 0, 1.4)
  if (tall) shape(ctx, 'M-13 -35 Q-4 -35 2 -30 M10 -31 Q16 -38 24 -36 M4 -5 Q9 -9 14 -5', null, pal[3], 2)
  else if (hp < 0.34) shape(ctx, 'M-16 -21 L-2 -24 M4 -24 L17 -19 M-5 13 Q2 5 10 13', null, pal[3], 2)
  else {
    shape(ctx, 'M1 8 Q7 10 12 7', null, pal[3], 1.8)
    if (hp < 0.67) shape(ctx, 'M-16 -21 L-3 -24 M5 -23 L16 -20', null, pal[3], 2)
  }
}
function cherry(ctx: Ctx, v: PlantView) {
  const fuse = v.state === 'fuse' ? v.stateT ?? 0 : 0, k = 1 + fuse * 0.25
  ctx.translate(fuse ? Math.sin(v.t * 70) * fuse * 2 : 0, 0); ctx.scale(k, k)
  shape(ctx, 'M-15 -36 C-13 -58 3 -54 5 -73 M19 -45 Q24 -66 5 -73', null, '#554323', 4)
  shape(ctx, 'M-15 -36 C-13 -58 3 -54 5 -73 M19 -45 Q24 -66 5 -73', null, '#78933b', 2)
  leaf(ctx, 5, -72, -0.35, 23, 9, '#9fc64e')
  for (const [x, y, s, tilt] of [[-18, -23, 1, -0.1], [19, -28, 1.14, 0.16]]) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(s, s)
    shape(ctx, 'M-19 -6 C-17 -18 -7 -22 0 -17 C10 -22 20 -14 21 -3 C24 11 12 21 0 20 C-15 20 -24 9 -19 -6Z', linear(ctx, -12, -18, 14, 20, [[0, '#f35a45'], [0.5, '#d83228'], [1, '#991b1d']]), '#5d2420', 2.5)
    shape(ctx, 'M-15 -8 Q-13 -14 -8 -14', null, '#ff9780', 3.2)
    eye(ctx, -6, -3, 5.3, 6.5, 1.5, 1.5, 1.8); eye(ctx, 7, -4, 5.2, 6, -1, 1.5, 1.8)
    shape(ctx, 'M-13 -11 L-2 -7 M3 -8 L14 -14', null, '#53251c', 3)
    shape(ctx, 'M-7 11 Q0 3 10 10 L9 14 Q0 10 -7 14Z', '#58251c', '#58251c', 1)
    ctx.restore()
  }
}
function jalapeno(ctx: Ctx, v: PlantView) {
  const fuse = v.state === 'fuse' ? v.stateT ?? 0 : 0
  ctx.translate(Math.sin(v.t * (fuse ? 65 : 2)) * (fuse ? 2 : 0.6), 0); ctx.scale(1 + fuse * 0.25, 1 - fuse * 0.1)
  shape(ctx, 'M-12 -72 C-32 -60 -29 -29 -13 -13 C1 2 27 1 40 -13 C20 -8 16 -20 18 -36 C23 -55 13 -78 -12 -72Z', linear(ctx, -24, -50, 22, -18, [[0, '#fb6741'], [0.5, '#e52b21'], [1, '#a21c16']]), '#662a19', 2.7)
  shape(ctx, 'M-12 -72 L-17 -76 L-7 -80 L-6 -86 Q-5 -95 6 -94 L10 -90 Q-1 -90 1 -80 L12 -77 L16 -70 Q-1 -77 -12 -72Z', '#639835', '#35531c', 2)
  shape(ctx, 'M-22 -55 Q-26 -44 -19 -33', null, '#ff9e65', 3)
  eye(ctx, -9, -49, 6.5, 8, 2, 2, 2); eye(ctx, 6, -49, 6.5, 8, -1, 2, 2)
  shape(ctx, 'M-18 -61 Q-9 -58 -2 -54 M1 -54 L14 -61', null, '#512514', 3.4)
  shape(ctx, 'M-12 -32 Q-1 -43 12 -33 L12 -22 Q0 -28 -9 -22Z', '#fff6cc', '#692617', 2)
  shape(ctx, 'M-5 -35 L-4 -25 M3 -36 L4 -25 M-10 -29 L12 -29', null, '#a96a44', 1)
}
function potato(ctx: Ctx, v: PlantView) {
  shape(ctx, 'M-34 -2 Q-40 -8 -29 -10 L-25 -15 L-15 -12 Q-3 -20 12 -14 L23 -17 L29 -11 Q41 -7 34 -1 Q0 6 -34 -2Z', '#805630', '#513b25', 1.8)
  if (v.state !== 'armed') {
    shape(ctx, 'M-17 -7 Q-17 -24 -2 -25 Q16 -25 19 -8Z', '#b28a52', '#64492c', 2)
    shape(ctx, 'M0 -22 L1 -32', null, '#777566', 3)
    circle(ctx, 1, -34, 4); paint(ctx, C('#ae4330'), C('#5c3326'), 1.4); return
  }
  ctx.translate(0, Math.sin(v.t * 3) * 0.6)
  shape(ctx, 'M-27 -6 C-32 -19 -23 -38 -12 -41 C-6 -45 -2 -42 2 -42 C17 -46 29 -30 28 -15 Q29 -2 13 -3 L-12 -2Z', linear(ctx, -12, -42, 19, -1, [[0, '#e6c493'], [0.5, '#cda36c'], [1, '#aa7745']]), '#655035', 2.5)
  shape(ctx, 'M2 -42 L3 -54 L-1 -58 L2 -62', null, '#5e6157', 3.2)
  ellipse(ctx, 2, -65, 7, 6); paint(ctx, C(Math.floor(v.t * 3) % 2 === 0 ? '#f43f28' : '#b43228'), C('#633022'), 1.8)
  ellipse(ctx, 0, -67, 2.5, 1.7); paint(ctx, C('#ffb990'))
  dotEye(ctx, -10, -23, 2.8, 4); dotEye(ctx, 7, -24, 2.7, 4)
  shape(ctx, 'M-10 -12 Q1 -7 14 -13 L12 -5 L-5 -5Z', '#ffefc9', '#675031', 1.7)
  shape(ctx, 'M1 -10 L2 -5 M8 -11 L9 -5', null, '#b18d59', 1)
  for (const [dx, dy, r] of [[-21, -17, 2], [-15, -33, 1.4], [17, -30, 1.7], [22, -17, 2], [-19, -8, 1.5]]) {
    ellipse(ctx, dx, dy, r, r * 0.7); paint(ctx, C('#a57b4e'))
  }
}
function chomper(ctx: Ctx, v: PlantView) {
  roots(ctx)
  stem(ctx, 'M-2 -6 C-15 -22 -9 -46 0 -58', { light: '#ba74cc', base: '#9746ac', shade: '#712a87', dark: '#462351', hole: '#271531' }, 11)
  ctx.translate(2 + Math.sin(v.t * 1.8) * 1.5, -65)
  for (const a of [-2.8, 2.9, 2.2]) leaf(ctx, -15, 7, a, 29, 10)
  const closed = v.state === 'chew' || v.state === 'swallow'
  const bite = v.state === 'bite' ? clamp((v.stateT ?? 0) / 0.32, 0, 1) : 0
  const gape = closed ? 0 : v.state === 'bite' ? 1.15 * (1 - bite * bite) : 0.55 + Math.sin(v.t * 2.5) * 0.055
  if (closed) ctx.scale(1 + Math.sin(v.t * 9) * 0.035, 1 - Math.sin(v.t * 9) * 0.045)
  const purple = linear(ctx, -10, -33, 18, 23, [[0, '#c679d2'], [0.48, '#9c42b3'], [1, '#642776']])
  shape(ctx, 'M-24 4 C-35 -10 -19 -29 2 -30 C29 -30 39 -13 39 7 C23 28 -8 30 -24 4Z', '#392039', '#3d2946', 2)
  if (!closed) shape(ctx, 'M-10 12 Q16 1 34 13 Q15 23 -10 12Z', '#c46782', '#843e60', 1.4)
  ctx.save(); ctx.translate(-24, 2); ctx.rotate(-gape * 0.47); ctx.translate(24, -2)
  shape(ctx, 'M-24 3 L-34 -5 L-28 -12 L-34 -21 L-21 -23 L-24 -34 L-10 -31 L-7 -41 L3 -33 L13 -38 L17 -28Z', '#b6ce73', '#445b30', 1.6)
  shape(ctx, 'M-24 7 C-37 -13 -23 -35 0 -36 C23 -38 41 -20 42 -2 C19 6 -1 5 -24 7Z', purple, '#42294f', 2.6)
  shape(ctx, 'M-23 -14 C-16 -28 2 -32 18 -23', null, '#c997d6', 3.5)
  for (const [sx, sy, rx] of [[-17, -11, 4.5], [-4, -20, 5], [10, -17, 4], [23, -9, 3.5]]) {
    ellipse(ctx, sx, sy, rx, rx * 0.65, -0.2); paint(ctx, C('#79438c'))
  }
  shape(ctx, 'M-23 5 Q10 0 41 -3', null, '#345329', 7)
  shape(ctx, 'M-23 5 Q10 0 41 -3', null, '#8cba6a', 4.5)
  shape(ctx, 'M-15 5 L-10 16 L-4 3 M0 3 L7 14 L12 1 M17 1 L24 10 L29 -1 M32 -1 L37 5 L40 -2', '#fff6d8', '#5b3c57', 1.2)
  ctx.restore()
  ctx.save(); ctx.translate(-24, 4); ctx.rotate(gape * 0.55); ctx.translate(24, -4)
  shape(ctx, 'M-25 5 Q7 17 39 6 C39 24 13 34 -6 26 Q-24 22 -25 5Z', purple, '#42294f', 2.4)
  shape(ctx, 'M-24 6 Q8 19 39 6', null, '#345329', 6.5)
  shape(ctx, 'M-24 6 Q8 19 39 6', null, '#8cba6a', 4)
  shape(ctx, 'M-14 11 L-9 2 L-3 15 M3 16 L8 5 L14 15 M19 14 L25 3 L29 11', '#fff6d8', '#5b3c57', 1.2)
  ctx.restore()
}
function squash(ctx: Ctx, v: PlantView) {
  const aim = v.state === 'aim' ? Math.sin(clamp((v.stateT ?? 0) / 0.45, 0, 1) * Math.PI) * 0.12 : 0
  ctx.scale(v.state === 'done' ? 1.3 : 1 + aim, v.state === 'done' ? 0.6 : 1 - aim)
  shape(ctx, 'M-30 -4 C-38 -9 -30 -24 -26 -35 C-23 -43 -28 -65 -15 -77 C-6 -85 11 -82 19 -71 C27 -62 23 -46 27 -32 C32 -20 40 -8 31 -3 C13 1 -15 1 -30 -4Z', linear(ctx, -28, -30, 31, -25, [[0, '#9cba62'], [0.45, '#c0d884'], [1, '#749449']]), '#475d2d', 2.8)
  shape(ctx, 'M-15 -72 C-20 -61 -16 -51 -18 -39 M19 -63 Q15 -46 24 -19 M-23 -24 L-26 -9 M-13 -14 L-15 -5 M22 -9 L27 -5', null, '#8aa557', 1.7)
  shape(ctx, 'M-5 -78 Q-8 -87 0 -90 L10 -88 Q1 -86 1 -79Z', '#6f953e', '#425e27', 2)
  const look = clamp(v.lookX ?? 2, -3, 3)
  eye(ctx, -9, -50, 7, 7, look, 1, 2); eye(ctx, 9, -50, 7, 7, look, 1, 2)
  shape(ctx, 'M-20 -59 Q-12 -60 -2 -53 M2 -53 Q12 -61 21 -59', null, '#43592c', 4.3)
  shape(ctx, 'M-2 -47 Q-8 -41 -3 -38 Q2 -35 7 -40', '#adca73', '#688444', 1.6)
  shape(ctx, 'M-17 -26 Q1 -39 19 -25 Q2 -30 -17 -26Z', '#42552b', '#42552b', 1.8)
  shape(ctx, 'M-20 -24 C-29 -15 -24 -6 -12 -5 M12 -24 Q24 -14 17 -5 M1 -27 Q-3 -14 2 -4', null, '#8ba65a', 1.8)
  shape(ctx, 'M-16 -20 Q-20 -14 -16 -10 M8 -22 Q12 -15 10 -9', null, '#d1df95', 2.4)
}
function spikeweed(ctx: Ctx, v: PlantView) {
  ctx.scale(1, 1 + clamp((v.anim ?? 0) / 0.25, 0, 1) * 0.2)
  shape(ctx, 'M-39 -3 L-32 -10 L-37 -16 L-22 -14 L-16 -22 L-4 -18 L7 -23 L18 -17 L30 -18 L29 -10 L40 -5 Q27 5 0 1 Q-25 5 -39 -3Z', '#9b7849', '#56482b', 2)
  for (let i = 0; i < 9; i++) {
    ctx.save(); ctx.translate(-33 + i * 8, -6 + (i % 2) * 4); ctx.rotate((i - 4) * 0.1); ctx.scale(1, i % 2 ? 1 : 0.8)
    shape(ctx, 'M-5 0 Q-3 -10 1 -24 Q2 -10 6 0Z', linear(ctx, -4, 0, 4, 0, [[0, '#e5d0a4'], [1, '#9c895f']]), '#62563b', 1.5)
    ctx.restore()
  }
  eye(ctx, -7, -5, 4.4, 3.1, 1, 0, 1.4); eye(ctx, 5, -5, 4.4, 3.1, 1, 0, 1.4)
  shape(ctx, 'M-13 -9 L-3 -7 M1 -7 L11 -9', null, '#58492c', 2)
}
export function flame(ctx: Ctx, x: number, y: number, s: number, t: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.transform(1, 0, Math.sin(t * 8) * 3 / 80, 1, 0, 0)
  shape(ctx, 'M-23 3 C-40 -10 -24 -26 -26 -40 Q-18 -36 -16 -27 C-13 -42 1 -49 -1 -66 C15 -56 16 -38 13 -30 Q26 -35 25 -48 C43 -24 34 -11 25 1 Q1 14 -23 3Z', '#ee641e', '#9a3f1b', 1.6)
  shape(ctx, 'M-15 4 Q-27 -9 -15 -26 L-10 -17 Q-6 -38 1 -47 Q13 -28 8 -17 L18 -26 Q28 -9 14 5Z', '#ffb52b', null)
  shape(ctx, 'M-7 6 Q-16 -3 -5 -17 L0 -29 Q4 -16 9 -10 Q15 3 5 7Z', '#ffe675', null)
  ctx.restore()
}
function torchwood(ctx: Ctx, v: PlantView) {
  shape(ctx, 'M-35 -1 L-25 -16 L-25 -47 L-32 -53 L-31 -66 L-18 -60 L-16 -70 L15 -69 L24 -61 L31 -64 L29 -44 L25 -29 L28 -13 L38 0 L22 2 L13 -3 L6 2 L-6 -1 L-16 3 L-21 -2Z', linear(ctx, -28, -30, 30, -30, [[0, '#946036'], [0.4, '#b57c43'], [1, '#724326']]), '#51351f', 2.8)
  shape(ctx, 'M-19 -57 L-16 -44 L-20 -29 L-18 -15 L-25 -4 M18 -53 L13 -39 L18 -23 L14 -10 L23 -1 M-6 -57 L-10 -47 M7 -54 L3 -48 M-9 -17 L-6 -5 M5 -17 L3 -3', null, '#684324', 2)
  ellipse(ctx, 0, -64, 23, 7); paint(ctx, C('#d0a066'), C('#674326'), 2)
  ellipse(ctx, 0, -64, 14, 3.5); paint(ctx, null, C('#996632'), 1.6)
  shape(ctx, 'M-17 -43 L-4 -37 L-8 -30 L-17 -32Z M4 -37 L17 -43 L17 -32 L8 -30Z', '#3e2e1b', null)
  shape(ctx, 'M-9 -40 L-8 -35 M10 -40 L9 -35', null, '#e6af51', 2)
  shape(ctx, 'M-11 -24 L-4 -27 L0 -24 L4 -27 L12 -22 L9 -18 L2 -20 L-5 -18Z', '#49301c', null)
  flame(ctx, 0, -65, 0.84, v.t)
}
export function cabbageBall(ctx: Ctx, scale = 1) {
  ctx.save(); ctx.scale(scale, scale)
  shape(ctx, 'M-21 12 C-31 2 -20 -17 -13 -16 C-11 -28 7 -27 13 -20 C29 -18 30 4 21 14 Q3 26 -21 12Z', linear(ctx, -12, -23, 14, 20, [[0, '#bbd777'], [0.5, '#88b657'], [1, '#4d813e']]), '#355b2d', 2.3)
  shape(ctx, 'M-14 -15 Q-24 -1 -13 9 Q-4 14 -9 21 M-7 -20 Q9 -9 -5 5 M3 -21 Q23 -11 12 3 Q8 10 14 18 M-24 0 Q-13 4 -14 15 M24 -2 Q13 2 11 14', null, '#629349', 1.7)
  shape(ctx, 'M-11 -16 Q-5 -20 0 -17 M16 -11 L19 -5', null, '#d0e58b', 2)
  ctx.restore()
}
function cabbage(ctx: Ctx, v: PlantView) {
  roots(ctx)
  const a = clamp((v.anim ?? 0) / 0.5, 0, 1)
  ctx.save(); ctx.translate(-8, -35); ctx.rotate(a > 0 ? a * a : Math.sin(v.t * 1.8) * 0.02)
  stem(ctx, 'M0 5 C-25 -3 -17 -39 -28 -46', PEA, 6)
  shape(ctx, 'M-44 -49 Q-29 -34 -12 -51 Q-14 -33 -29 -34 Q-41 -34 -44 -49Z', '#689543', '#355c2b', 2)
  if (v.loaded !== false) { ctx.save(); ctx.translate(-29, -50); cabbageBall(ctx, 0.49); ctx.restore() }
  ctx.restore()
  ctx.translate(3, -26 + Math.sin(v.t * 2) * 0.6); cabbageBall(ctx)
  shape(ctx, 'M-23 0 Q-17 4 -13 17 L-4 22 Q-21 23 -26 10Z M24 0 Q19 4 15 17 L5 22 Q26 22 28 8Z', '#739f4c', '#426c32', 1.6)
  eye(ctx, -5, -4, 5, 6, 2, 0, 1.8); eye(ctx, 9, -5, 5, 6, 2, 0, 1.8)
  shape(ctx, 'M-12 -12 L0 -9 M4 -10 L15 -14', null, '#35562a', 2.5)
  shape(ctx, 'M-2 10 Q4 7 10 9', null, '#35562a', 1.8)
}
export function drawPlant(ctx: Ctx, id: PlantId, x: number, y: number, v: PlantView) {
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.lineCap = 'round'
  switch (id) {
    case 'peashooter': shooter(ctx, v, PEA, 'leaf'); break
    case 'snowpea': shooter(ctx, v, SNOW, 'ice'); break
    case 'repeater': shooter(ctx, v, REPEAT, 'double'); break
    case 'threepeater': threepeater(ctx, v); break
    case 'sunflower': sunflower(ctx, v); break
    case 'wallnut': nut(ctx, v); break
    case 'tallnut': nut(ctx, v, true); break
    case 'bowlnut': nut(ctx, v, false, NUT, true); break
    case 'bombnut': nut(ctx, v, false, NUT_RED, true); break
    case 'giantnut': ctx.translate(0, -30); nut(ctx, v, false, NUT, true, true); break
    case 'cherry': cherry(ctx, v); break
    case 'jalapeno': jalapeno(ctx, v); break
    case 'potato': potato(ctx, v); break
    case 'chomper': chomper(ctx, v); break
    case 'squash': squash(ctx, v); break
    case 'spikeweed': spikeweed(ctx, v); break
    case 'torchwood': torchwood(ctx, v); break
    case 'cabbage': cabbage(ctx, v); break
  }
  ctx.restore()
}
export function plantShadow(ctx: Ctx, x: number, y: number, w = 30) {
  ellipse(ctx, x, y, w, w * 0.25); ctx.fillStyle = 'rgba(35,48,17,0.23)'; ctx.fill()
}
