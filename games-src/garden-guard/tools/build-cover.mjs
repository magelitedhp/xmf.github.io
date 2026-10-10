import * as esbuild from 'esbuild'
import fs from 'node:fs/promises'
import path from 'node:path'

// A small SVG recorder for the Canvas operations used by these three portraits.
// Export from the actual character functions, so the arcade cover cannot drift
// away from the seed cards and the lawn. No screenshots or external art assets.
const escape = s => String(s).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
const n = x => Number(x.toFixed(4))
class SvgContext {
  constructor() {
    this.paths = []; this.defs = []; this.stack = []; this.current = ''
    this.state = { matrix: [1, 0, 0, 1, 0, 0], fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, lineCap: 'butt', lineJoin: 'miter', globalAlpha: 1 }
    for (const key of Object.keys(this.state).filter(k => k !== 'matrix')) {
      Object.defineProperty(this, key, { get: () => this.state[key], set: value => { this.state[key] = value } })
    }
  }
  save() { this.stack.push({ ...this.state, matrix: [...this.state.matrix] }) }
  restore() { this.state = this.stack.pop() }
  transform(a, b, c, d, e, f) {
    const [A, B, C, D, E, F] = this.state.matrix
    this.state.matrix = [A*a+C*b, B*a+D*b, A*c+C*d, B*c+D*d, A*e+C*f+E, B*e+D*f+F]
  }
  translate(x, y) { this.transform(1, 0, 0, 1, x, y) }
  scale(x, y) { this.transform(x, 0, 0, y, 0, 0) }
  rotate(a) { this.transform(Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0) }
  beginPath() { this.current = '' }
  moveTo(x, y) { this.current += `M${n(x)} ${n(y)}` }
  lineTo(x, y) { this.current += `L${n(x)} ${n(y)}` }
  quadraticCurveTo(a, b, x, y) { this.current += `Q${n(a)} ${n(b)} ${n(x)} ${n(y)}` }
  bezierCurveTo(a, b, c, d, x, y) { this.current += `C${[a,b,c,d,x,y].map(n).join(' ')}` }
  closePath() { this.current += 'Z' }
  ellipse(x, y, rx, ry, rotation, start, end) {
    if (Math.abs(end - start) < Math.PI * 2 - 0.001) throw Error('Cover export only supports full ellipses')
    const dx = rx * Math.cos(rotation), dy = rx * Math.sin(rotation), angle = rotation * 180 / Math.PI
    this.current += `M${n(x-dx)} ${n(y-dy)}A${n(rx)} ${n(ry)} ${n(angle)} 1 0 ${n(x+dx)} ${n(y+dy)}A${n(rx)} ${n(ry)} ${n(angle)} 1 0 ${n(x-dx)} ${n(y-dy)}Z`
  }
  arc(x, y, radius, start, end) { this.ellipse(x, y, radius, radius, 0, start, end) }
  fill(p) { this.emit(p, false) }
  stroke(p) { this.emit(p, true) }
  emit(p, stroke) {
    const s = this.state
    const color = stroke ? s.strokeStyle : s.fillStyle
    const paint = typeof color === 'string' ? color : `url(#${color.id})`
    this.paths.push(`<path d="${p?.d ?? this.current}" transform="matrix(${s.matrix.map(n).join(' ')})" ${stroke ? `fill="none" stroke="${escape(paint)}" stroke-width="${n(s.lineWidth)}" stroke-linecap="${s.lineCap}" stroke-linejoin="${s.lineJoin}"` : `fill="${escape(paint)}"`} opacity="${s.globalAlpha}"/>`)
  }
  gradient(kind, attributes) {
    const g = { id: `ink${this.defs.length}`, kind, attributes, stops: [], addColorStop(offset, color) { this.stops.push(`<stop offset="${offset}" stop-color="${escape(color)}"/>`) } }
    this.defs.push(g); return g
  }
  createLinearGradient(x1, y1, x2, y2) { return this.gradient('linearGradient', `x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"`) }
  createRadialGradient(fx, fy, fr, cx, cy, r) { return this.gradient('radialGradient', `fx="${fx}" fy="${fy}" fr="${fr}" cx="${cx}" cy="${cy}" r="${r}"`) }
  svg() { return `<defs>${this.defs.map(g => `<${g.kind} id="${g.id}" gradientUnits="userSpaceOnUse" ${g.attributes}>${g.stops.join('')}</${g.kind}>`).join('')}</defs>${this.paths.join('')}` }
}

export async function buildCover(root) {
  const bundle = await esbuild.build({
    stdin: { contents: "export { drawPlant, plantShadow } from './src/art/plants'; export { drawZombie, zombieShadow } from './src/art/zombies'", resolveDir: root },
    bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent',
  })
  const module = { exports: {} }
  new Function('module', 'exports', 'Path2D', bundle.outputFiles[0].text)(module, module.exports, class { constructor(d) { this.d = d } })
  const { drawPlant, plantShadow, drawZombie, zombieShadow } = module.exports
  const ctx = new SvgContext()
  for (const [id, x, y, scale] of [['sunflower', 219, 628, 3.12], ['peashooter', 507, 631, 2.7]]) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale)
    plantShadow(ctx, 0, 0); drawPlant(ctx, id, 0, 0, { t: 0.65 }); ctx.restore()
  }
  ctx.save(); ctx.translate(819, 640); ctx.scale(2.18, 2.18)
  zombieShadow(ctx, 0, 0, 'basic')
  drawZombie(ctx, 0, 0, { id: 'basic', t: 0.65, phase: 1.8, state: 'walk', stateT: 0, deathT: 0, hasArm: true, hasHead: true, hasPole: false, hasImp: false, armorKind: null, armor: 0, angry: false })
  ctx.restore()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 960 720" role="img" aria-labelledby="title desc">
<title id="title">花园保卫战</title><desc id="desc">向日葵与豌豆射手守住草坪，迎战穿着破西装的僵尸。</desc>
<rect width="960" height="720" fill="#e8eedb"/>
<path d="M0 492Q390 364 960 481V720H0Z" fill="#bdd5a7"/><path d="M0 590Q580 476 960 580V720H0Z" fill="#92b990"/>
<g fill="none" stroke="#ffffff55"><path d="M0 588H960M0 643H960M140 479v241M300 458v262M460 442v278M620 454v266M780 468v252"/></g>
<g font-family="Arial,Microsoft YaHei,sans-serif"><text x="50" y="57" fill="#809878" font-family="monospace" font-size="15" letter-spacing="4">Yumo ARCADE / 02</text><text x="44" y="165" fill="#325b45" font-size="81" font-weight="800">花园保卫战</text><text x="50" y="222" fill="#7f9e6f" font-size="28" letter-spacing="4">GARDEN GUARD</text><text x="50" y="280" fill="#688962" font-size="22">种下植物，守住草坪。</text></g>
${ctx.svg()}
<g fill="#345c43" font-family="monospace" font-size="16"><text x="50" y="687" letter-spacing="2">GROW A LITTLE COURAGE.</text><text x="802" y="687">STRATEGY ↗</text></g></svg>\n`
  await fs.writeFile(path.resolve(root, '../../public/games/garden-guard/cover.svg'), svg)
}
