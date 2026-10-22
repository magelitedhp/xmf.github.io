<template>
  <GameFrame title="星穹扫雷" number="06" tone="nebula" format="NEBULA / MINESWEEPER">
    <section ref="appEl" class="ns-app" :class="[`ns-${game.phase}`, { 'ns-reduced': reducedMotion }]" :style="spectrumStyle" aria-label="星穹扫雷" @keydown="onKeydown" @pointermove="moveLight">
      <div class="ns-atmosphere" aria-hidden="true"><div class="ns-nebula ns-nebula-a"></div><div class="ns-nebula ns-nebula-b"></div></div>
      <canvas ref="effectsEl" class="ns-effects" aria-hidden="true"></canvas>

      <div class="ns-interface">
        <header class="ns-header">
          <div class="ns-brand"><span class="ns-brand-symbol"><SweepIcon name="orbit" /></span><div><b>NEBULA<span> / 06</span></b><small>深空勘探局 · 扫雷计划</small></div></div>
          <div class="ns-header-actions">
            <span class="ns-online"><i></i> {{ game.phase === 'paused' ? 'STANDBY' : 'SYSTEM ONLINE' }}</span>
            <button type="button" class="ns-icon-button" :aria-label="soundEnabled ? '关闭音效' : '开启音效'" :title="soundEnabled ? '关闭音效' : '开启音效'" :aria-pressed="soundEnabled" @click="toggleSound"><SweepIcon :name="soundEnabled ? 'sound' : 'mute'" /></button>
            <button type="button" class="ns-icon-button" aria-label="查看玩法" title="查看玩法 · ?" @click="openModal('help')"><SweepIcon name="help" /></button>
          </div>
        </header>

        <div class="ns-intro">
          <div><p class="ns-eyebrow"><span></span> THE UNIVERSE IS WAITING</p><h2>在未知里，<br>点亮一片<span>星空。</span></h2><p class="ns-intro-copy">数出暗处的引力，找到安全的航线。<br class="ns-mobile-break">每一次小心翼翼，都值得一场星光。</p></div>
          <div class="ns-mission-stamp" aria-hidden="true"><div class="ns-stamp-orbit"></div><SweepIcon name="sparkle" /><span>BE CURIOUS.<br>STAY ALIVE.</span><small>EST. 20XX</small></div>
        </div>

        <div class="ns-flight-controls">
          <div class="ns-sectors" role="group" aria-label="选择扫雷难度">
            <button v-for="(sector, index) in sectors" :key="sector.id" type="button" :class="{ active: game.sector === sector.id }" :aria-pressed="game.sector === sector.id" @click="requestNew(sector.id, false)"><small>0{{ index + 1 }}</small><span>{{ sector.name }}</span><i>{{ sector.rows }} × {{ sector.cols }}</i></button>
          </div>
          <button type="button" class="ns-daily-button" :class="{ active: game.daily }" :aria-pressed="game.daily" @click="requestNew(game.sector, true)"><SweepIcon name="star" /><span>每日星图<small>{{ today.slice(5).replace('-', ' / ') }}</small></span><SweepIcon name="arrow" /></button>
        </div>

        <div class="ns-play-layout">
          <div class="ns-command-deck">
            <div class="ns-instruments">
              <div class="ns-instrument"><span><SweepIcon name="mine" /> 待标记异常</span><strong :class="{ 'ns-negative': remaining < 0 }">{{ String(remaining).padStart(2, '0') }}<small>/ {{ activeSector.mines }}</small></strong><i>UNIDENTIFIED SIGNALS</i></div>
              <div class="ns-instrument"><span><SweepIcon name="clock" /> 航行时间</span><strong>{{ timeLabel }}<b class="ns-clock-dot" :class="{ running: game.phase === 'playing' }"></b></strong><i>MISSION ELAPSED TIME</i></div>
              <div class="ns-instrument ns-best"><span><SweepIcon name="trophy" /> 最佳航线</span><strong>{{ bestTime === undefined ? '— —' : formatTime(bestTime) }}</strong><i>UNASSISTED RECORD</i></div>
            </div>

            <div class="ns-board-header"><span><i :class="{ live: game.phase === 'playing' }"></i>{{ activeSector.code }} <b>{{ game.daily ? '· DAILY ' + game.day : '· FREE EXPLORATION' }}</b></span><button type="button" class="ns-coordinate-button" title="重新生成星图" @click="requestNew(game.sector, game.daily)"><SweepIcon name="restart" /> 新的航线</button></div>

            <div class="ns-board-shell" :class="{ 'ns-scan-flash': scanFlash }">
              <div class="ns-corner ns-corner-tl"></div><div class="ns-corner ns-corner-tr"></div><div class="ns-corner ns-corner-bl"></div><div class="ns-corner ns-corner-br"></div>
              <div class="ns-board-scroll">
                <div class="ns-map" :style="{ '--ns-cols': activeSector.cols }">
                  <div class="ns-column-labels" aria-hidden="true"><span v-for="col in activeSector.cols" :key="col">{{ String(col).padStart(2, '0') }}</span></div>
                  <div class="ns-map-body"><div class="ns-row-labels" aria-hidden="true"><span v-for="row in activeSector.rows" :key="row">{{ String.fromCharCode(64 + row) }}</span></div>
                    <div ref="boardEl" class="ns-board" role="grid" :aria-rowcount="activeSector.rows" :aria-colcount="activeSector.cols" aria-label="扫雷星图，方向键移动，空格探索，F 标记">
                      <div v-for="(row, rowIndex) in cellRows" :key="rowIndex" class="ns-row" role="row">
                        <button v-for="(cell, colIndex) in row" :key="`${roundId}-${rowIndex}-${colIndex}`" type="button" class="ns-cell" :class="cellClasses(rowIndex * activeSector.cols + colIndex)" :style="{ '--ns-reveal-delay': `${cell.delay}ms`, '--ns-number': numberColors[cell.adjacent] }" :data-cell="rowIndex * activeSector.cols + colIndex" role="gridcell" :tabindex="selected === rowIndex * activeSector.cols + colIndex ? 0 : -1" :aria-label="cellLabel(rowIndex * activeSector.cols + colIndex)" :aria-selected="selected === rowIndex * activeSector.cols + colIndex" :aria-disabled="game.phase === 'paused' || finished" @focus="selected = rowIndex * activeSector.cols + colIndex" @click="activate(rowIndex * activeSector.cols + colIndex)" @contextmenu.prevent="onContext($event, rowIndex * activeSector.cols + colIndex)" @pointerdown="startHold($event, rowIndex * activeSector.cols + colIndex)" @pointerup="cancelHold" @pointercancel="cancelHold" @pointerleave="cancelHold" @pointermove="moveHold" @mouseenter="hovered = rowIndex * activeSector.cols + colIndex" @mouseleave="hovered = -1">
                          <SweepIcon v-if="cell.mine && (cell.revealed || game.phase === 'lost')" name="mine" class="ns-mine-symbol" />
                          <span v-else-if="cell.revealed && cell.adjacent" class="ns-number">{{ cell.adjacent }}</span>
                          <span v-else-if="cell.revealed" class="ns-clear-dot"></span>
                          <SweepIcon v-else-if="cell.mark === 1" name="flag" class="ns-flag-symbol" />
                          <span v-else-if="cell.mark === 2" class="ns-question">?</span>
                          <span v-else class="ns-cell-star" aria-hidden="true">+</span>
                          <span v-if="game.phase === 'lost' && cell.mark === 1 && !cell.mine" class="ns-wrong-flag" aria-hidden="true">×</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="game.phase === 'paused'" class="ns-board-overlay ns-pause-panel"><div class="ns-overlay-orbit"><SweepIcon name="pause" /></div><p>TRANSMISSION PAUSED</p><h3>星空会等你。</h3><span>星图已隐藏，航行计时暂停。</span><button type="button" class="ns-primary" @click="togglePause"><SweepIcon name="play" /> 重新接通信号</button></div>
              <Transition name="ns-result"><div v-if="resultVisible && finished" class="ns-board-overlay ns-result-panel" :class="{ 'ns-result-success': game.phase === 'won' }"><div class="ns-overlay-orbit"><SweepIcon :name="game.phase === 'won' ? 'trophy' : 'orbit'" /></div><p>{{ game.phase === 'won' ? 'CONSTELLATION COMPLETE' : 'SIGNAL LOST · NOT THE END' }}</p><h3>{{ game.phase === 'won' ? '这片星空，属于你。' : '只是迷航，不是终点。' }}</h3><span>{{ game.phase === 'won' ? (newRecord ? '新的最佳航线，已写入你的星际档案。' : '每一颗暗星，都有了自己的坐标。') : '下次出发时，你会更懂宇宙一点。' }}</span><div class="ns-result-stats"><b>{{ timeLabel }}<small>航行用时</small></b><b>{{ game.moves }}<small>操作次数</small></b><b>{{ game.probes ? '辅助' : '纯净' }}<small>探索方式</small></b></div><button type="button" class="ns-primary" @click="beginNew(game.sector, game.daily)">再出发一次 <SweepIcon name="arrow" /></button><button type="button" class="ns-text-button" @click="resultVisible = false">留在这里，看看星图</button></div></Transition>
            </div>

            <div class="ns-map-caption"><span><SweepIcon name="shield" /> 首次探索及周围八格安全</span><span class="ns-cursor-location">{{ coordinate(selected) }} <i> / </i> {{ game.moves }} MOVES</span></div>
            <div class="ns-action-dock">
              <div class="ns-mode-switch" role="group" aria-label="选择点击模式"><button type="button" :class="{ active: !flagMode }" :aria-pressed="!flagMode" @click="setFlagMode(false)"><SweepIcon name="orbit" /> 探索<kbd>SPACE</kbd></button><button type="button" :class="{ active: flagMode }" :aria-pressed="flagMode" @click="setFlagMode(true)"><SweepIcon name="flag" /> 标记<kbd>F</kbd></button></div>
              <button type="button" class="ns-pause-button" :disabled="!game.planted || finished" :title="game.phase === 'paused' ? '继续 · P' : '暂停 · P'" :aria-label="game.phase === 'paused' ? '继续游戏' : '暂停游戏'" @click="togglePause"><SweepIcon :name="game.phase === 'paused' ? 'play' : 'pause'" /></button>
            </div>
            <p class="ns-live-message" role="status" aria-live="polite"><span></span>{{ message }}</p>
          </div>

          <aside class="ns-sidebar" aria-label="任务仪表盘">
            <section class="ns-progress-card"><div class="ns-card-label"><span>探索进度</span><b>LIVE TELEMETRY <i></i></b></div><div class="ns-orbital-progress" :style="{ '--ns-progress': `${progress}%` }" role="progressbar" :aria-valuenow="progress" :aria-valuemin="0" :aria-valuemax="100" aria-label="安全区域探索进度"><span class="ns-progress-orbit"></span><div><strong>{{ progress }}<small>%</small></strong><span>星图已点亮</span></div><i class="ns-orbit-marker"></i></div><div class="ns-progress-foot"><span><i></i> {{ explored }} 已探索</span><span>{{ safeTotal - explored }} 待发现</span></div></section>
            <section class="ns-probe-card"><div class="ns-card-label"><span>脉冲扫描</span><b>SUPPORT SYSTEM</b></div><div class="ns-probe-visual"><span class="ns-radar-circle"></span><span class="ns-radar-sweep"></span><SweepIcon name="scan" /><i></i></div><p>让一道光，替你探探路。</p><small>直接揭开一格安全区域，<br>每次航行限用三次，计入辅助通关。</small><button type="button" class="ns-scan-button" :disabled="game.probes >= 3 || game.phase === 'paused' || finished" @click="useProbe"><SweepIcon name="scan" /><span>{{ game.probes >= 3 ? '扫描能量已耗尽' : '发射扫描脉冲' }}</span><kbd>H</kbd></button><div class="ns-energy"><i v-for="charge in 3" :key="charge" :class="{ used: charge <= game.probes }"></i><span>{{ 3 - game.probes }} / 3</span></div></section>
            <section class="ns-log-card"><div class="ns-card-label"><span>飞行日志</span><SweepIcon name="orbit" /></div><ol><li v-for="entry in log" :key="entry.id" :class="entry.tone"><i></i><div><span>{{ entry.text }}</span><small>{{ entry.time }}</small></div></li></ol></section>
          </aside>
        </div>

        <footer class="ns-footer"><div class="ns-spectrums"><span>选择你的宇宙</span><button v-for="(spectrum, index) in spectrums" :key="spectrum.name" type="button" :class="{ active: spectrumIndex === index }" :style="{ '--swatch': spectrum.color }" :aria-label="`${spectrum.name}光谱`" :aria-pressed="spectrumIndex === index" @click="chooseSpectrum(index)"><i></i><span>{{ spectrum.name }}</span></button></div><div class="ns-career"><span><SweepIcon name="star" /> {{ records.wins }} 次安全着陆</span><span>{{ records.streak }} 连胜</span></div></footer>
      </div>

      <dialog ref="dialogEl" class="ns-dialog" @cancel.prevent="closeModal" @click="onDialogBackdrop">
        <div v-if="modal === 'help'" class="ns-dialog-body"><button type="button" class="ns-dialog-close ns-icon-button" aria-label="关闭玩法说明" @click="closeModal"><SweepIcon name="close" /></button><p class="ns-eyebrow">A SMALL GUIDE TO THE UNKNOWN</p><h3>宇宙有规律，<br>你有好奇心。</h3><div class="ns-help-rules"><div><b>01</b><p><strong>点开星区，读懂数字</strong><span>数字代表周围八格中的地雷数量。空白区域会自动展开，首次点击的周围也保证安全。</span></p></div><div><b>02</b><p><strong>标记异常，连接线索</strong><span>右键或长按循环切换旗帜、问号与清空。也可以切换「标记」模式。数字周围的旗帜足够时，点击数字连锁开格；误标仍会触雷。</span></p></div><div><b>03</b><p><strong>点亮所有安全区域，即可着陆</strong><span>旗帜不必全部插满。每局有三次安全扫描；不用扫描的通关才会竞争最佳时间。</span></p></div></div><div class="ns-help-keys"><kbd>↑ ↓ ← →</kbd> 移动 <kbd>SPACE</kbd> 探索 <kbd>F</kbd> 标记 <kbd>P</kbd> 暂停 <kbd>R</kbd> 重开</div><p class="ns-help-daily">每日星图从中央安全区起航，同一天、同难度使用同一张地图。游戏进度会自动保存在当前浏览器。</p><button type="button" class="ns-primary" @click="closeModal">收到，准备探索 <SweepIcon name="arrow" /></button></div>
        <div v-else-if="modal === 'restart'" class="ns-dialog-body ns-restart-dialog"><div class="ns-overlay-orbit"><SweepIcon name="orbit" /></div><p class="ns-eyebrow">A NEW COORDINATE</p><h3>向另一片星空出发？</h3><p>当前航线将被新的星图替换，<br>你已经创造的最佳纪录会一直保留。</p><div class="ns-dialog-actions"><button type="button" class="ns-secondary" @click="closeModal">留在这里</button><button type="button" class="ns-primary" @click="confirmNew">准备起航 <SweepIcon name="arrow" /></button></div></div>
      </dialog>
    </section>
  </GameFrame>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import GameFrame from '../../components/GameFrame.vue'
import SweepIcon from './SweepIcon.vue'
import { createExpedition, dailySeed, flagCount, mark, neighbors, openCount, probe, restoreExpedition, reveal, sectorFor, sectors, type Expedition, type SectorId, type SweepEvent } from './engine'
import { SpaceAudio, Starfield } from './effects'
import './minesweeper.css'

const STORAGE_KEY = 'yumo:nebula-minesweeper:v1'
interface Records { wins: number; streak: number; best: Partial<Record<SectorId, number>> }
interface LogEntry { id: number; text: string; time: string; tone: string }
function localDay() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}` }
function randomSeed() { return crypto.getRandomValues(new Uint32Array(1))[0] }
function readSaved(): { game?: unknown; elapsed?: number; spectrum?: number; sound?: boolean; records?: Records } {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {} } catch { return {} }
}
const saved = readSaved()
const recovered = restoreExpedition(saved.game)
if (recovered?.phase === 'playing') recovered.phase = 'paused'
const game = ref<Expedition>(recovered ?? createExpedition('orbit', randomSeed()))
const today = localDay()
const elapsed = ref(recovered && Number.isFinite(saved.elapsed) && Number(saved.elapsed) >= 0 ? Math.min(Number(saved.elapsed), 604800000) : 0)
const records = ref<Records>({ wins: 0, streak: 0, best: {} })
if (saved.records && Number.isInteger(saved.records.wins) && saved.records.wins >= 0 && Number.isInteger(saved.records.streak) && saved.records.streak >= 0) {
  records.value.wins = saved.records.wins; records.value.streak = saved.records.streak
  for (const sector of sectors) { const time = saved.records.best?.[sector.id]; if (typeof time === 'number' && Number.isFinite(time) && time >= 0) records.value.best[sector.id] = time }
}
const spectrums = [
  { name: '极光', color: '#85f3ce', rgb: '133,243,206', secondary: '#91b9ff', nebula: '#125953' },
  { name: '暮星', color: '#ffc48b', rgb: '255,196,139', secondary: '#f0a5d3', nebula: '#6a3b43' },
  { name: '幻紫', color: '#c6afff', rgb: '198,175,255', secondary: '#8cdbff', nebula: '#403b76' },
]
const spectrumIndex = ref(Number.isInteger(saved.spectrum) && Number(saved.spectrum) >= 0 && Number(saved.spectrum) < spectrums.length ? Number(saved.spectrum) : 0)
const spectrum = computed(() => spectrums[spectrumIndex.value])
const spectrumStyle = computed(() => ({ '--ns-accent': spectrum.value.color, '--ns-accent-rgb': spectrum.value.rgb, '--ns-secondary': spectrum.value.secondary, '--ns-nebula': spectrum.value.nebula }))
const soundEnabled = ref(saved.sound !== false)
const reducedMotion = ref(false)
const appEl = ref<HTMLElement>(), effectsEl = ref<HTMLCanvasElement>(), boardEl = ref<HTMLElement>(), dialogEl = ref<HTMLDialogElement>()
const selected = ref(Math.floor(sectorFor(game.value.sector).rows / 2) * sectorFor(game.value.sector).cols + Math.floor(sectorFor(game.value.sector).cols / 2))
const hovered = ref(-1), flagMode = ref(false), scanFlash = ref(false), resultVisible = ref(false), newRecord = ref(false), roundId = ref(0)
const modal = ref<'help' | 'restart' | null>(null)
const pendingNew = ref<{ sector: SectorId; daily: boolean }>({ sector: game.value.sector, daily: false })
const activeSector = computed(() => sectorFor(game.value.sector))
const explored = computed(() => openCount(game.value))
const safeTotal = computed(() => activeSector.value.rows * activeSector.value.cols - activeSector.value.mines)
const progress = computed(() => Math.round(explored.value / safeTotal.value * 100))
const remaining = computed(() => activeSector.value.mines - flagCount(game.value))
const finished = computed(() => game.value.phase === 'won' || game.value.phase === 'lost')
const bestTime = computed(() => records.value.best[game.value.sector])
const timeLabel = computed(() => formatTime(elapsed.value))
const cellRows = computed(() => Array.from({ length: activeSector.value.rows }, (_, row) => game.value.cells.slice(row * activeSector.value.cols, (row + 1) * activeSector.value.cols)))
const highlighted = computed(() => hovered.value >= 0 && game.value.cells[hovered.value]?.revealed ? neighbors(game.value, hovered.value) : [])
const numberColors = ['transparent', '#8bbcff', '#7ae2bb', '#ffb0a8', '#c6a5ff', '#ffd082', '#8ee9ee', '#f0a8df', '#d7e4ee']
const message = ref(recovered ? (game.value.phase === 'paused' ? '上次的星图已找回，接通信号即可继续。' : '欢迎回来，你的星际档案仍在这里。') : '点击任意星区，让第一次探索发生。')
const log = ref<LogEntry[]>([{ id: 0, text: recovered ? '星图档案恢复完毕' : '导航系统已就绪', time: 'MISSION CONTROL', tone: 'neutral' }])
let logId = 0, effects: Starfield | null = null, ticker = 0, holdTimer = 0, resultTimer = 0, scanTimer = 0
let lastTick = 0, lastSave = 0, suppressedUntil = 0, holdX = 0, holdY = 0, resumeAfterModal = false
let motionQuery: MediaQueryList | null = null
const audio = new SpaceAudio()

function formatTime(milliseconds: number) { const total = Math.floor(milliseconds / 1000); return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}` }
function coordinate(index: number) { return `${String.fromCharCode(65 + Math.floor(index / activeSector.value.cols))}${String(index % activeSector.value.cols + 1).padStart(2, '0')}` }
function addLog(text: string, tone = 'neutral') { log.value = [{ id: ++logId, text, time: timeLabel.value, tone }, ...log.value].slice(0, 4) }
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ game: game.value, elapsed: elapsed.value, spectrum: spectrumIndex.value, sound: soundEnabled.value, records: records.value })) } catch { /* Playing also works when browser storage is unavailable. */ }
}
function updateClock() { const now = performance.now(); if (lastTick && game.value.phase === 'playing' && !document.hidden) elapsed.value += Math.min(2000, now - lastTick); lastTick = now }
function cellPoint(index: number) {
  const cell = boardEl.value?.querySelector<HTMLElement>(`[data-cell="${index}"]`)
  if (!cell || !appEl.value) return { x: 0, y: 0 }
  const rect = cell.getBoundingClientRect(), container = appEl.value.getBoundingClientRect()
  return { x: rect.left + rect.width / 2 - container.left, y: rect.top + rect.height / 2 - container.top }
}
function focusCell() { void nextTick(() => boardEl.value?.querySelector<HTMLElement>(`[data-cell="${selected.value}"]`)?.focus({ preventScroll: true })) }
function cellClasses(index: number) {
  const cell = game.value.cells[index]
  return { 'is-open': cell.revealed && !cell.mine, 'is-empty': cell.revealed && !cell.adjacent && !cell.mine, 'is-flagged': cell.mark === 1 && !cell.revealed, 'is-questioned': cell.mark === 2 && !cell.revealed, 'is-mine': cell.mine && (cell.revealed || game.value.phase === 'lost'), 'is-detonated': index === game.value.detonated, 'is-neighbor': highlighted.value.includes(index) && !cell.revealed, 'is-selected': selected.value === index }
}
function cellLabel(index: number) {
  const cell = game.value.cells[index], position = coordinate(index)
  if (cell.mine && (cell.revealed || game.value.phase === 'lost')) return `${position}，地雷`
  if (cell.revealed) return `${position}，${cell.adjacent ? `周围 ${cell.adjacent} 颗地雷` : '安全区域'}`
  return `${position}，${cell.mark === 1 ? '已标记地雷' : cell.mark === 2 ? '待确认' : '未探索'}`
}
function applyAction(action: () => SweepEvent, index = selected.value) {
  updateClock()
  const event = action()
  if (event.kind === 'none') return
  if (event.kind === 'flag') {
    audio.play('mark'); const point = cellPoint(index); effects?.burst(point.x, point.y, 10)
    message.value = `${coordinate(index)} · ${game.value.cells[index].mark === 1 ? '异常信号已标记。' : game.value.cells[index].mark === 2 ? '留下一个问号，稍后再回来。' : '标记已移除。'}`
  } else {
    const first = event.opened[0] ?? index, point = cellPoint(event.detonated >= 0 ? event.detonated : first)
    if (event.kind === 'probe') { audio.play('scan'); scanFlash.value = true; window.clearTimeout(scanTimer); scanTimer = window.setTimeout(() => { scanFlash.value = false }, 1200); effects?.wave(point.x, point.y, spectrum.value.color, 300); addLog(`安全脉冲到达 ${coordinate(first)}`, 'positive') }
    else if (event.detonated < 0) audio.play(event.opened.length > 3 ? 'bloom' : 'open', game.value.cells[first]?.adjacent ?? 0)
    event.opened.filter((_, position) => position % Math.max(1, Math.ceil(event.opened.length / 12)) === 0).forEach((cellIndex) => { const location = cellPoint(cellIndex); effects?.burst(location.x, location.y, 5) })
    if (event.opened.length > 3) { effects?.wave(point.x, point.y); if (event.kind !== 'probe') addLog(`星潮展开，点亮 ${event.opened.length} 个坐标`, 'positive') }
    message.value = event.kind === 'probe' ? `已揭开一处安全区域，剩余 ${3 - game.value.probes} 次扫描。` : event.opened.length > 1 ? `安全航线延伸了 ${event.opened.length} 格，继续相信你的推理。` : `${coordinate(first)} 已探索 · 周围 ${game.value.cells[first]?.adjacent ?? 0} 处异常。`
    if (finished.value) finishMission(event.detonated)
  }
  lastTick = performance.now()
  save()
}
function finishMission(detonated: number) {
  window.clearTimeout(resultTimer)
  if (game.value.phase === 'won') {
    records.value.wins += 1; records.value.streak += 1
    newRecord.value = !game.value.probes && (bestTime.value === undefined || elapsed.value < bestTime.value)
    if (newRecord.value) records.value.best[game.value.sector] = elapsed.value
    audio.play('win'); addLog(newRecord.value ? '新的最佳航线已存档' : '全域探索完成，安全着陆', 'gold')
    message.value = '所有安全区域已点亮。这一次，宇宙记住了你。'
    const rect = appEl.value?.getBoundingClientRect()
    if (rect) for (let index = 0; index < 5; index += 1) effects?.burst(rect.width * (.16 + index * .17), rect.height * .45, 45, [spectrum.value.color, '#ffdc9b', spectrum.value.secondary][index % 3], true)
  } else {
    records.value.streak = 0; audio.play('lose')
    const point = cellPoint(detonated); effects?.burst(point.x, point.y, 95, '#ff8e91', true); effects?.wave(point.x, point.y, '#ff8e91', 420)
    addLog(`${coordinate(detonated)} · 引力异常，信号中断`, 'danger')
    message.value = '信号中断。休息一下，下一片星空仍在等待。'
  }
  resultTimer = window.setTimeout(() => { resultVisible.value = true }, reducedMotion.value ? 100 : 1100)
}
function activate(index: number) {
  if (performance.now() < suppressedUntil || modal.value || game.value.phase === 'paused' || finished.value) return
  selected.value = index
  const cell = game.value.cells[index]
  if (flagMode.value && !cell.revealed) applyAction(() => mark(game.value, index), index)
  else {
    if (cell.revealed && cell.adjacent && neighbors(game.value, index).filter((neighbor) => game.value.cells[neighbor].mark === 1).length !== cell.adjacent) { message.value = '先为这个数字周围的异常插旗，数量吻合后再连锁探索。'; return }
    applyAction(() => reveal(game.value, index), index)
  }
}
function onContext(event: MouseEvent, index: number) { if (performance.now() < suppressedUntil || modal.value || game.value.phase === 'paused' || finished.value || ('pointerType' in event && event.pointerType === 'touch')) return; selected.value = index; applyAction(() => mark(game.value, index), index) }
function startHold(event: PointerEvent, index: number) {
  cancelHold()
  if (event.pointerType === 'mouse' || modal.value || game.value.phase === 'paused' || finished.value) return
  holdX = event.clientX; holdY = event.clientY
  holdTimer = window.setTimeout(() => { suppressedUntil = performance.now() + 850; selected.value = index; applyAction(() => mark(game.value, index), index); holdTimer = 0 }, 440)
}
function cancelHold() { window.clearTimeout(holdTimer); holdTimer = 0 }
function moveHold(event: PointerEvent) { if (holdTimer && Math.hypot(event.clientX - holdX, event.clientY - holdY) > 10) cancelHold() }
function useProbe() { if (!modal.value) applyAction(() => probe(game.value)) }
function setFlagMode(value: boolean) { flagMode.value = value; audio.play('switch'); message.value = value ? '标记模式已就绪：点击星区插旗，再次点击留下问号。' : '探索模式已就绪：点击未知星区，继续延伸航线。' }
function togglePause() {
  if (!game.value.planted || finished.value || modal.value) return
  updateClock()
  game.value.phase = game.value.phase === 'paused' ? 'playing' : 'paused'
  lastTick = performance.now(); save()
  if (game.value.phase === 'playing') focusCell()
}
function toggleSound() { soundEnabled.value = !soundEnabled.value; audio.enabled = soundEnabled.value; if (soundEnabled.value) audio.play('switch'); save() }
function chooseSpectrum(index: number) { spectrumIndex.value = index; effects?.setTheme(spectrum.value.color); audio.play('switch'); save() }
async function openModal(kind: 'help' | 'restart') {
  if (modal.value) return
  cancelHold(); updateClock()
  resumeAfterModal = game.value.phase === 'playing'
  if (resumeAfterModal) game.value.phase = 'paused'
  modal.value = kind; save()
  await nextTick()
  dialogEl.value?.showModal()
}
function closeModal() { dialogEl.value?.close(); modal.value = null; if (resumeAfterModal && game.value.phase === 'paused') { game.value.phase = 'playing'; lastTick = performance.now() }; resumeAfterModal = false; save(); focusCell() }
function onDialogBackdrop(event: MouseEvent) { if (event.target === dialogEl.value) { const rect = dialogEl.value.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeModal() } }
function requestNew(sector: SectorId, daily: boolean) { pendingNew.value = { sector, daily }; if (game.value.planted && !finished.value) void openModal('restart'); else beginNew(sector, daily) }
function confirmNew() { const next = pendingNew.value; resumeAfterModal = false; closeModal(); beginNew(next.sector, next.daily) }
function beginNew(sector: SectorId, daily: boolean) {
  cancelHold(); window.clearTimeout(resultTimer); window.clearTimeout(scanTimer)
  if (game.value.planted && !finished.value) records.value.streak = 0
  game.value = createExpedition(sector, daily ? dailySeed(today, sector) : randomSeed(), daily, daily ? today : '')
  roundId.value += 1; elapsed.value = 0; lastTick = performance.now(); newRecord.value = false; resultVisible.value = false; scanFlash.value = false; flagMode.value = false; hovered.value = -1
  selected.value = Math.floor(activeSector.value.rows / 2) * activeSector.value.cols + Math.floor(activeSector.value.cols / 2)
  log.value = []; addLog(daily ? `${today} 每日星图已载入` : `${activeSector.value.name} · 新航线已准备`)
  message.value = daily ? '每日星图从中央安全区起航。愿你的推理一路顺风。' : '新的星图，新的可能。点击任意星区起航。'
  if (daily) void nextTick(() => applyAction(() => reveal(game.value, selected.value)))
  else { audio.play('switch'); save() }
  focusCell()
}
function onKeydown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || modal.value || (event.target as HTMLElement).matches('input,select,textarea')) return
  const key = event.key.toLowerCase()
  if (key === 'p' || key === 'escape') { event.preventDefault(); togglePause(); return }
  if (key === 'r') { event.preventDefault(); requestNew(game.value.sector, game.value.daily); return }
  if (key === 'h') { event.preventDefault(); useProbe(); return }
  if (key === '?') { event.preventDefault(); void openModal('help'); return }
  if (!(event.target as HTMLElement).closest('.ns-board')) return
  if (key === 'f') { event.preventDefault(); applyAction(() => mark(game.value, selected.value)); return }
  if (key === ' ' || key === 'enter') { event.preventDefault(); activate(selected.value); return }
  const { cols, rows } = activeSector.value
  let row = Math.floor(selected.value / cols), col = selected.value % cols
  if (key === 'arrowup') row = Math.max(0, row - 1)
  else if (key === 'arrowdown') row = Math.min(rows - 1, row + 1)
  else if (key === 'arrowleft') col = Math.max(0, col - 1)
  else if (key === 'arrowright') col = Math.min(cols - 1, col + 1)
  else return
  event.preventDefault(); selected.value = row * cols + col; focusCell()
}
function moveLight(event: PointerEvent) { if (reducedMotion.value || !appEl.value) return; const rect = appEl.value.getBoundingClientRect(); appEl.value.style.setProperty('--ns-pointer-x', `${event.clientX - rect.left}px`); appEl.value.style.setProperty('--ns-pointer-y', `${event.clientY - rect.top}px`) }
function syncMotion() { reducedMotion.value = motionQuery?.matches ?? false; effects?.setReduced(reducedMotion.value) }
function visibilityChanged() { cancelHold(); if (document.hidden && game.value.phase === 'playing') { updateClock(); game.value.phase = 'paused'; save() }; effects?.setHidden(document.hidden); lastTick = performance.now() }

onMounted(() => {
  audio.enabled = soundEnabled.value
  if (effectsEl.value) { effects = new Starfield(effectsEl.value); effects.setTheme(spectrum.value.color) }
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)'); syncMotion(); motionQuery.addEventListener('change', syncMotion)
  document.addEventListener('visibilitychange', visibilityChanged)
  lastTick = performance.now(); lastSave = lastTick
  ticker = window.setInterval(() => { updateClock(); if (performance.now() - lastSave > 2500 && game.value.phase === 'playing') { save(); lastSave = performance.now() } }, 200)
})
onBeforeUnmount(() => { updateClock(); if (game.value.phase === 'playing') game.value.phase = 'paused'; save(); cancelHold(); window.clearInterval(ticker); window.clearTimeout(resultTimer); window.clearTimeout(scanTimer); motionQuery?.removeEventListener('change', syncMotion); document.removeEventListener('visibilitychange', visibilityChanged); dialogEl.value?.close(); effects?.destroy(); audio.destroy() })
</script>
