<template>
  <GameFrame title="数独" number="05" tone="sudoku" format="LOGIC / CLASSIC PUZZLE">
    <section class="sudoku-app" :class="{ 'is-paused': status === 'paused' }" aria-label="数独游戏">
      <header class="sudoku-topbar">
        <div class="sudoku-brand">
          <span class="sudoku-mark" aria-hidden="true"><i v-for="n in 9" :key="n" :class="{ on: [1, 3, 5, 7, 9].includes(n) }"></i></span>
          <span><b>数独</b><small>SUDOKU</small></span>
        </div>
        <div class="difficulty-tabs" role="group" aria-label="选择难度">
          <button
            v-for="item in difficulties"
            :key="item.id"
            type="button"
            :disabled="generating"
            :class="{ active: difficulty === item.id }"
            :aria-pressed="difficulty === item.id"
            @click="requestGame(item.id)"
          >{{ item.label }}</button>
        </div>
        <div class="sudoku-top-actions">
          <button type="button" class="round-action" :aria-label="status === 'paused' ? '继续游戏' : '暂停游戏'" @click="togglePause">
            {{ status === 'paused' ? '▶' : 'Ⅱ' }}
          </button>
          <button type="button" class="new-game-button" :disabled="generating" @click="showNewGame = true">新游戏</button>
        </div>
      </header>

      <div class="sudoku-statusbar">
        <div><span>难度</span><strong>{{ activeDifficulty.label }}</strong></div>
        <div><span>用时</span><strong>{{ formatTime(elapsed) }}</strong></div>
        <div><span>错误</span><strong>{{ mistakes }}</strong></div>
        <div><span>最佳</span><strong>{{ bestTime == null ? '—' : formatTime(bestTime) }}</strong></div>
        <div class="sudoku-progress"><span>完成度 {{ progress }}%</span><i><b :style="{ width: `${progress}%` }"></b></i></div>
      </div>

      <div class="sudoku-play-area">
        <div class="board-wrap">
          <div
            ref="boardEl"
            class="sudoku-board"
            role="grid"
            aria-label="九乘九数独棋盘"
            :aria-busy="generating"
          >
            <button
              v-for="(_, index) in board"
              :key="index"
              type="button"
              class="sudoku-cell"
              :class="cellClasses(index)"
              role="gridcell"
              :tabindex="selected === index ? 0 : -1"
              :aria-label="cellLabel(index)"
              :aria-selected="selected === index"
              @click="selectCell(index)"
              @focus="selectCell(index)"
            >
              <span v-if="board[index]" class="cell-value">{{ board[index] }}</span>
              <span v-else class="cell-notes" aria-hidden="true">
                <i v-for="n in 9" :key="n">{{ hasNote(index, n) ? n : '' }}</i>
              </span>
            </button>

            <span
              v-if="selected >= 0"
              class="selection-cursor"
              :style="{ transform: `translate(${colOf(selected) * 100}%, ${rowOf(selected) * 100}%)` }"
              aria-hidden="true"
            ></span>

            <div v-if="generating" class="board-overlay loading-overlay" role="status">
              <span class="loading-orbit" aria-hidden="true"></span>
              <strong>正在生成唯一解题目</strong>
              <small>GOOD PUZZLES TAKE A MOMENT</small>
            </div>
            <div v-else-if="status === 'paused'" class="board-overlay pause-overlay">
              <span aria-hidden="true">Ⅱ</span>
              <strong>暂停一下</strong>
              <small>棋盘已为你藏好</small>
              <button type="button" @click="togglePause">继续游戏</button>
            </div>
          </div>
          <p class="board-caption"><span>{{ todayLabel }}</span><span>每一格，都有唯一的答案。</span></p>
        </div>

        <aside class="sudoku-controls" aria-label="数独操作面板">
          <div class="selected-card">
            <span>{{ selected >= 0 ? `R${rowOf(selected) + 1} · C${colOf(selected) + 1}` : 'SELECT A CELL' }}</span>
            <strong>{{ selectedValue || '·' }}</strong>
            <small>{{ selectionHint }}</small>
          </div>

          <div class="number-pad" role="group" aria-label="数字键盘">
            <button
              v-for="n in 9"
              :key="n"
              type="button"
              :disabled="numberComplete(n) || status !== 'playing'"
              :class="{ complete: numberComplete(n), matching: selectedValue === n }"
              :aria-label="`填写数字 ${n}`"
              @click="enterNumber(n)"
            ><strong>{{ n }}</strong><small>{{ numberRemaining(n) }}</small></button>
          </div>

          <div class="tool-grid">
            <button type="button" :disabled="!history.length || status !== 'playing'" @click="undo">
              <span aria-hidden="true">↶</span><small>撤销</small>
            </button>
            <button type="button" :disabled="!canEditSelected || status !== 'playing'" @click="eraseSelected">
              <span aria-hidden="true">⌫</span><small>擦除</small>
            </button>
            <button type="button" :class="{ active: noteMode, pulse: noteShortcutPulse }" :aria-pressed="noteMode" :disabled="status !== 'playing'" @click="toggleNoteMode">
              <span aria-hidden="true">✎</span><small>笔记 <b>{{ noteMode ? 'ON' : 'OFF' }}</b></small>
            </button>
            <button type="button" :disabled="status !== 'playing'" @click="giveHint">
              <span aria-hidden="true">◇</span><small>提示 · {{ hintsUsed }}</small>
            </button>
          </div>

          <div class="keyboard-note">
            <span>KEYBOARD</span>
            <p><kbd>1–9</kbd> 填数　<kbd>N</kbd> 笔记<br><kbd>⌫</kbd> 擦除　<kbd>H</kbd> 提示</p>
          </div>
        </aside>
      </div>

      <Transition name="sudoku-modal">
        <div v-if="showNewGame" class="sudoku-modal-backdrop" @click.self="showNewGame = false">
          <section class="sudoku-modal" role="dialog" aria-modal="true" aria-labelledby="new-game-title">
            <button type="button" class="modal-close" aria-label="关闭" @click="showNewGame = false">×</button>
            <p>NEW PUZZLE</p>
            <h2 id="new-game-title">选一个刚好的难度</h2>
            <div class="difficulty-list">
              <button v-for="item in difficulties" :key="item.id" type="button" @click="startFromModal(item.id)">
                <span><b>{{ item.label }}</b><small>{{ item.caption }}</small></span>
                <i>{{ item.clues }} 条线索</i>
              </button>
            </div>
            <small class="modal-footnote">开始新题会替换当前进度，已完成的最佳时间仍会保留。</small>
          </section>
        </div>
      </Transition>

      <Transition name="sudoku-modal">
        <div v-if="showHelp" class="sudoku-modal-backdrop" @click.self="showHelp = false">
          <section class="sudoku-modal help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title">
            <button type="button" class="modal-close" aria-label="关闭" @click="showHelp = false">×</button>
            <p>HOW TO PLAY</p>
            <h2 id="help-title">让 1–9 各归其位</h2>
            <ol>
              <li><b>01</b><span>每一行都填入 1 到 9，数字不能重复。</span></li>
              <li><b>02</b><span>每一列同样包含 1 到 9，且不重复。</span></li>
              <li><b>03</b><span>每个 3×3 宫内也必须完整出现 1 到 9。</span></li>
            </ol>
            <p class="help-tip">卡住时先打开「笔记」记录候选数；提示会直接揭晓当前格，且不会打断继续解题。</p>
          </section>
        </div>
      </Transition>

      <Transition name="sudoku-modal">
        <div v-if="status === 'won' && !winDismissed" class="sudoku-modal-backdrop win-backdrop">
          <section class="sudoku-modal win-modal" role="dialog" aria-modal="true" aria-labelledby="win-title">
            <div class="confetti" aria-hidden="true"><i v-for="n in 18" :key="n"></i></div>
            <span class="win-seal" aria-hidden="true">✓</span>
            <p>PUZZLE COMPLETE</p>
            <h2 id="win-title">漂亮，全部归位。</h2>
            <div class="win-stats">
              <span><small>难度</small><b>{{ activeDifficulty.label }}</b></span>
              <span><small>用时</small><b>{{ formatTime(elapsed) }}</b></span>
              <span><small>错误</small><b>{{ mistakes }}</b></span>
            </div>
            <button type="button" class="modal-primary" @click="startNewGame(difficulty)">再来一局</button>
            <button type="button" class="modal-secondary" @click="winDismissed = true">查看完成棋盘</button>
          </section>
        </div>
      </Transition>
    </section>

    <template #toolbar>
      <button type="button" class="glass-button" @click="showHelp = true">玩法说明</button>
      <button type="button" class="glass-button" @click="restartGame">重新开始</button>
    </template>
  </GameFrame>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import GameFrame from '../../components/GameFrame.vue'

type DifficultyId = 'easy' | 'medium' | 'hard' | 'expert' | 'extreme'
type GameStatus = 'playing' | 'paused' | 'won'

interface Difficulty {
  id: DifficultyId
  label: string
  clues: number
  caption: string
}

interface Snapshot {
  board: number[]
  notes: number[]
  wrong: boolean[]
  hinted: boolean[]
  mistakes: number
  hintsUsed: number
}

interface SavedGame extends Snapshot {
  version: 1
  difficulty: DifficultyId
  solution: number[]
  givens: boolean[]
  elapsed: number
  status: GameStatus
}

const difficulties: Difficulty[] = [
  { id: 'easy', label: '简单', clues: 45, caption: '轻松扫描，适合热身' },
  { id: 'medium', label: '中等', clues: 39, caption: '需要一点候选推理' },
  { id: 'hard', label: '较难', clues: 33, caption: '留心宫格之间的联系' },
  { id: 'expert', label: '专家', clues: 29, caption: '为熟练玩家准备' },
  { id: 'extreme', label: '极限', clues: 25, caption: '少量线索，耐心破局' },
]

const STORAGE_KEY = 'yumo:sudoku:current:v1'
const BEST_KEY = 'yumo:sudoku:best:v1'
const FULL_MASK = 0b1111111110

const boardEl = ref<HTMLDivElement | null>(null)
const difficulty = ref<DifficultyId>('easy')
const board = ref<number[]>(Array(81).fill(0))
const solution = ref<number[]>(Array(81).fill(0))
const givens = ref<boolean[]>(Array(81).fill(false))
const notes = ref<number[]>(Array(81).fill(0))
const wrong = ref<boolean[]>(Array(81).fill(false))
const hinted = ref<boolean[]>(Array(81).fill(false))
const selected = ref(-1)
const noteMode = ref(false)
const noteShortcutPulse = ref(false)
const mistakes = ref(0)
const hintsUsed = ref(0)
const elapsed = ref(0)
const status = ref<GameStatus>('playing')
const history = ref<Snapshot[]>([])
const generating = ref(false)
const showNewGame = ref(false)
const showHelp = ref(false)
const winDismissed = ref(false)
const bestTimes = ref<Partial<Record<DifficultyId, number>>>({})
let timerId: number | undefined
let notePulseId: number | undefined

const activeDifficulty = computed(() => difficulties.find(item => item.id === difficulty.value) ?? difficulties[0]!)
const selectedValue = computed(() => selected.value >= 0 ? board.value[selected.value] ?? 0 : 0)
const canEditSelected = computed(() => selected.value >= 0 && !givens.value[selected.value])
const filledCount = computed(() => board.value.filter((value, index) => value === solution.value[index]).length)
const progress = computed(() => Math.round((filledCount.value / 81) * 100))
const bestTime = computed(() => bestTimes.value[difficulty.value] ?? null)
const todayLabel = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date())
const selectionHint = computed(() => {
  if (selected.value < 0) return '点击任意格开始'
  if (givens.value[selected.value]) return '题目给定数字'
  if (wrong.value[selected.value]) return '与答案不符，再想一想'
  if (hinted.value[selected.value]) return '由提示填入'
  if (noteMode.value) return '笔记模式已开启'
  return board.value[selected.value] ? '你填写的数字' : '等待填写'
})

function rowOf(index: number) { return Math.floor(index / 9) }
function colOf(index: number) { return index % 9 }
function boxOf(index: number) { return Math.floor(rowOf(index) / 3) * 3 + Math.floor(colOf(index) / 3) }

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

function makeSolution(): number[] {
  const bands = shuffle([0, 1, 2])
  const stacks = shuffle([0, 1, 2])
  const rows = bands.flatMap(band => shuffle([0, 1, 2]).map(row => band * 3 + row))
  const cols = stacks.flatMap(stack => shuffle([0, 1, 2]).map(col => stack * 3 + col))
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
  return rows.flatMap(row => cols.map(col => digits[(row * 3 + Math.floor(row / 3) + col) % 9]!))
}

function countSolutions(puzzle: number[], limit = 2): number {
  const rows = Array(9).fill(0) as number[]
  const cols = Array(9).fill(0) as number[]
  const boxes = Array(9).fill(0) as number[]
  for (let i = 0; i < 81; i++) {
    const value = puzzle[i]!
    if (!value) continue
    const bit = 1 << value
    rows[rowOf(i)]! |= bit
    cols[colOf(i)]! |= bit
    boxes[boxOf(i)]! |= bit
  }

  let found = 0
  function solve() {
    if (found >= limit) return
    let target = -1
    let targetMask = 0
    let fewest = 10
    for (let i = 0; i < 81; i++) {
      if (puzzle[i]) continue
      const mask = FULL_MASK & ~(rows[rowOf(i)]! | cols[colOf(i)]! | boxes[boxOf(i)]!)
      let choices = 0
      for (let n = 1; n <= 9; n++) if (mask & (1 << n)) choices++
      if (!choices) return
      if (choices < fewest) {
        fewest = choices
        target = i
        targetMask = mask
        if (choices === 1) break
      }
    }
    if (target < 0) {
      found++
      return
    }
    const row = rowOf(target)
    const col = colOf(target)
    const box = boxOf(target)
    for (let n = 1; n <= 9 && found < limit; n++) {
      const bit = 1 << n
      if (!(targetMask & bit)) continue
      puzzle[target] = n
      rows[row]! |= bit
      cols[col]! |= bit
      boxes[box]! |= bit
      solve()
      puzzle[target] = 0
      rows[row]! &= ~bit
      cols[col]! &= ~bit
      boxes[box]! &= ~bit
    }
  }
  solve()
  return found
}

function makePuzzle(answer: number[], targetClues: number): number[] {
  const puzzle = [...answer]
  const pairs = shuffle(Array.from({ length: 41 }, (_, index) => index))
  let clues = 81
  for (const index of pairs) {
    const mirror = 80 - index
    const cells = index === mirror ? [index] : [index, mirror]
    if (clues - cells.length < targetClues) continue
    const previous = cells.map(cell => puzzle[cell]!)
    cells.forEach(cell => { puzzle[cell] = 0 })
    if (countSolutions([...puzzle]) === 1) clues -= cells.length
    else cells.forEach((cell, cellIndex) => { puzzle[cell] = previous[cellIndex]! })
  }
  if (clues > targetClues) {
    for (const index of shuffle(Array.from({ length: 81 }, (_, i) => i))) {
      if (!puzzle[index] || clues <= targetClues) continue
      const previous = puzzle[index]!
      puzzle[index] = 0
      if (countSolutions([...puzzle]) === 1) clues--
      else puzzle[index] = previous
    }
  }
  return puzzle
}

function captureSnapshot(): Snapshot {
  return {
    board: [...board.value],
    notes: [...notes.value],
    wrong: [...wrong.value],
    hinted: [...hinted.value],
    mistakes: mistakes.value,
    hintsUsed: hintsUsed.value,
  }
}

function pushHistory() {
  history.value.push(captureSnapshot())
  if (history.value.length > 100) history.value.shift()
}

async function startNewGame(level: DifficultyId) {
  if (generating.value) return
  showNewGame.value = false
  showHelp.value = false
  generating.value = true
  status.value = 'playing'
  difficulty.value = level
  await nextTick()
  await new Promise(resolve => window.setTimeout(resolve, 35))
  const answer = makeSolution()
  const puzzle = makePuzzle(answer, activeDifficulty.value.clues)
  solution.value = answer
  board.value = puzzle
  givens.value = puzzle.map(Boolean)
  notes.value = Array(81).fill(0)
  wrong.value = Array(81).fill(false)
  hinted.value = Array(81).fill(false)
  selected.value = puzzle.findIndex(value => !value)
  noteMode.value = false
  mistakes.value = 0
  hintsUsed.value = 0
  elapsed.value = 0
  history.value = []
  winDismissed.value = false
  generating.value = false
  saveGame()
  await nextTick()
  boardEl.value?.focus({ preventScroll: true })
}

function requestGame(level: DifficultyId) {
  if (level === difficulty.value && elapsed.value === 0 && history.value.length === 0) return
  void startNewGame(level)
}

function startFromModal(level: DifficultyId) {
  void startNewGame(level)
}

function restartGame() {
  if (generating.value || !solution.value.some(Boolean)) return
  pushHistory()
  board.value = solution.value.map((value, index) => givens.value[index] ? value : 0)
  notes.value = Array(81).fill(0)
  wrong.value = Array(81).fill(false)
  hinted.value = Array(81).fill(false)
  mistakes.value = 0
  hintsUsed.value = 0
  elapsed.value = 0
  status.value = 'playing'
  selected.value = board.value.findIndex(value => !value)
  saveGame()
}

function selectCell(index: number) {
  if (status.value !== 'playing' || generating.value) return
  selected.value = index
}

function enterNumber(value: number) {
  const index = selected.value
  if (index < 0 || givens.value[index] || status.value !== 'playing' || generating.value) return
  if (!noteMode.value && board.value[index] === value) return
  if (noteMode.value && board.value[index]) return
  pushHistory()
  if (noteMode.value) {
    notes.value[index] = notes.value[index]! ^ (1 << value)
    notes.value = [...notes.value]
    saveGame()
    return
  }
  board.value[index] = value
  notes.value[index] = 0
  hinted.value[index] = false
  const isWrong = value !== solution.value[index]
  wrong.value[index] = isWrong
  if (isWrong) mistakes.value++
  else clearPeerNotes(index, value)
  board.value = [...board.value]
  wrong.value = [...wrong.value]
  hinted.value = [...hinted.value]
  checkWin()
  saveGame()
}

function clearPeerNotes(index: number, value: number) {
  const bit = ~(1 << value)
  notes.value = notes.value.map((mask, peer) => (
    rowOf(peer) === rowOf(index) || colOf(peer) === colOf(index) || boxOf(peer) === boxOf(index)
      ? mask & bit
      : mask
  ))
}

function eraseSelected() {
  const index = selected.value
  if (index < 0 || givens.value[index] || status.value !== 'playing') return
  if (!board.value[index] && !notes.value[index]) return
  pushHistory()
  board.value[index] = 0
  notes.value[index] = 0
  wrong.value[index] = false
  hinted.value[index] = false
  board.value = [...board.value]
  notes.value = [...notes.value]
  wrong.value = [...wrong.value]
  hinted.value = [...hinted.value]
  saveGame()
}

function undo() {
  const snapshot = history.value.pop()
  if (!snapshot || status.value !== 'playing') return
  board.value = snapshot.board
  notes.value = snapshot.notes
  wrong.value = snapshot.wrong
  hinted.value = snapshot.hinted
  mistakes.value = snapshot.mistakes
  hintsUsed.value = snapshot.hintsUsed
  saveGame()
}

function giveHint() {
  if (status.value !== 'playing') return
  let index = selected.value
  if (index < 0 || givens.value[index] || board.value[index] === solution.value[index]) {
    index = board.value.findIndex((value, cell) => !givens.value[cell] && value !== solution.value[cell])
  }
  if (index < 0) return
  pushHistory()
  selected.value = index
  const value = solution.value[index]!
  board.value[index] = value
  notes.value[index] = 0
  wrong.value[index] = false
  hinted.value[index] = true
  hintsUsed.value++
  board.value = [...board.value]
  notes.value = [...notes.value]
  wrong.value = [...wrong.value]
  hinted.value = [...hinted.value]
  clearPeerNotes(index, value)
  checkWin()
  saveGame()
}

function checkWin() {
  if (!board.value.every((value, index) => value === solution.value[index])) return
  status.value = 'won'
  winDismissed.value = false
  const previous = bestTimes.value[difficulty.value]
  if (previous == null || elapsed.value < previous) {
    bestTimes.value = { ...bestTimes.value, [difficulty.value]: elapsed.value }
    localStorage.setItem(BEST_KEY, JSON.stringify(bestTimes.value))
  }
  localStorage.removeItem(STORAGE_KEY)
}

function togglePause() {
  if (generating.value || status.value === 'won') return
  status.value = status.value === 'paused' ? 'playing' : 'paused'
  saveGame()
}

function toggleNoteMode() {
  if (status.value !== 'playing' || generating.value) return
  noteMode.value = !noteMode.value
  noteShortcutPulse.value = false
  if (notePulseId != null) window.clearTimeout(notePulseId)
  requestAnimationFrame(() => {
    noteShortcutPulse.value = true
    notePulseId = window.setTimeout(() => { noteShortcutPulse.value = false }, 260)
  })
}

function hasNote(index: number, value: number) {
  return Boolean(notes.value[index]! & (1 << value))
}

function numberComplete(value: number) {
  return board.value.filter((cell, index) => cell === value && !wrong.value[index]).length >= 9
}

function numberRemaining(value: number) {
  return Math.max(0, 9 - board.value.filter((cell, index) => cell === value && !wrong.value[index]).length)
}

function isPeer(index: number) {
  return selected.value >= 0 && index !== selected.value && (
    rowOf(index) === rowOf(selected.value) || colOf(index) === colOf(selected.value) || boxOf(index) === boxOf(selected.value)
  )
}

function cellClasses(index: number) {
  const value = board.value[index]
  const selectedNumber = selectedValue.value
  return {
    'is-selected': selected.value === index,
    'is-peer': isPeer(index),
    'is-match': Boolean(selectedNumber && value === selectedNumber && selected.value !== index),
    'is-given': givens.value[index],
    'is-user': Boolean(value && !givens.value[index]),
    'is-wrong': wrong.value[index],
    'is-hint': hinted.value[index],
    'box-right': colOf(index) === 2 || colOf(index) === 5,
    'box-bottom': rowOf(index) === 2 || rowOf(index) === 5,
  }
}

function cellLabel(index: number) {
  const place = `第 ${rowOf(index) + 1} 行，第 ${colOf(index) + 1} 列`
  const value = board.value[index]
  if (!value) return `${place}，空格${notes.value[index] ? '，有候选笔记' : ''}`
  return `${place}，数字 ${value}${givens.value[index] ? '，题目给定' : wrong.value[index] ? '，填写错误' : hinted.value[index] ? '，提示填入' : '，已填写'}`
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

function saveGame() {
  if (generating.value || status.value === 'won' || !solution.value.some(Boolean)) return
  const saved: SavedGame = {
    version: 1,
    difficulty: difficulty.value,
    solution: [...solution.value],
    givens: [...givens.value],
    elapsed: elapsed.value,
    status: status.value,
    ...captureSnapshot(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
}

function loadSavedGame(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const saved = JSON.parse(raw) as SavedGame
    const validDifficulty = difficulties.some(item => item.id === saved.difficulty)
    const arraysValid = [saved.board, saved.solution, saved.givens, saved.notes, saved.wrong, saved.hinted]
      .every(value => Array.isArray(value) && value.length === 81)
    if (saved.version !== 1 || !validDifficulty || !arraysValid) return false
    difficulty.value = saved.difficulty
    board.value = saved.board
    solution.value = saved.solution
    givens.value = saved.givens
    notes.value = saved.notes
    wrong.value = saved.wrong
    hinted.value = saved.hinted
    mistakes.value = saved.mistakes || 0
    hintsUsed.value = saved.hintsUsed || 0
    elapsed.value = saved.elapsed || 0
    status.value = saved.status === 'paused' ? 'paused' : 'playing'
    selected.value = board.value.findIndex((value, index) => !givens.value[index] && value !== solution.value[index])
    history.value = []
    return true
  } catch {
    return false
  }
}

function onKeydown(event: KeyboardEvent) {
  if (showNewGame.value || showHelp.value || generating.value) {
    if (event.key === 'Escape') {
      showNewGame.value = false
      showHelp.value = false
    }
    return
  }
  if (event.key === 'Escape' || event.key.toLowerCase() === 'p' || event.code === 'KeyP') {
    event.preventDefault()
    togglePause()
    return
  }
  if (status.value !== 'playing') return
  const key = event.key.toLowerCase()
  const code = event.code
  if (/^[1-9]$/.test(key)) {
    event.preventDefault()
    enterNumber(Number(key))
    return
  }
  if (key === 'n' || code === 'KeyN') {
    event.preventDefault()
    if (!event.repeat) toggleNoteMode()
    return
  }
  if (key === 'h' || code === 'KeyH') {
    event.preventDefault()
    giveHint()
    return
  }
  if (key === 'backspace' || key === 'delete' || key === '0') {
    event.preventDefault()
    eraseSelected()
    return
  }
  if ((key === 'z' || code === 'KeyZ') && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    undo()
    return
  }
  const delta: Record<string, number> = { arrowleft: -1, arrowright: 1, arrowup: -9, arrowdown: 9 }
  if (delta[key] != null) {
    event.preventDefault()
    const current = selected.value < 0 ? 0 : selected.value
    const next = current + delta[key]!
    if (next >= 0 && next < 81 && !(key === 'arrowleft' && colOf(current) === 0) && !(key === 'arrowright' && colOf(current) === 8)) selected.value = next
  }
}

function onVisibilityChange() {
  if (document.hidden && status.value === 'playing') {
    status.value = 'paused'
    saveGame()
  }
}

onMounted(() => {
  try {
    bestTimes.value = JSON.parse(localStorage.getItem(BEST_KEY) || '{}')
  } catch {
    bestTimes.value = {}
  }
  if (!loadSavedGame()) void startNewGame('easy')
  timerId = window.setInterval(() => {
    if (status.value === 'playing' && !generating.value) {
      elapsed.value++
      if (elapsed.value % 5 === 0) saveGame()
    }
  }, 1000)
  window.addEventListener('keydown', onKeydown, true)
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onBeforeUnmount(() => {
  if (timerId != null) window.clearInterval(timerId)
  if (notePulseId != null) window.clearTimeout(notePulseId)
  window.removeEventListener('keydown', onKeydown, true)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  saveGame()
})
</script>

<style scoped>
.sudoku-app { --sd-blue:#3157dc; --sd-blue-deep:#1f3eaa; --sd-ink:#263550; --sd-muted:#71809a; --sd-line:#cad4e5; --sd-soft:#eef3fb; position:relative; min-height:720px; padding:24px clamp(18px,3vw,42px) 30px; color:var(--sd-ink); background:radial-gradient(circle at 0 0,#dfe9ff 0,transparent 28%),linear-gradient(145deg,#fbfcff,#f3f6fb 55%,#ebf0f9); font-family:Inter,"PingFang SC","Microsoft YaHei",sans-serif; }
.sudoku-topbar { display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:28px; padding-bottom:20px; border-bottom:1px solid #d8e0ec; }
.sudoku-brand { display:flex; align-items:center; gap:12px; }
.sudoku-brand > span:last-child { display:grid; gap:2px; }
.sudoku-brand b { font-size:18px; line-height:1; }
.sudoku-brand small { color:#7d8b9e; font:10px/1.3 var(--font-mono); letter-spacing:1.2px; }
.sudoku-mark { display:grid; grid-template-columns:repeat(3,6px); gap:2px; padding:7px; border-radius:8px; background:var(--sd-blue); box-shadow:0 7px 16px #3157dc36; }
.sudoku-mark i { width:6px; height:6px; border-radius:2px; background:#ffffff42; }
.sudoku-mark i.on { background:#fff; }
.difficulty-tabs { justify-self:center; display:flex; align-items:center; gap:3px; padding:4px; border:1px solid #d2dceb; border-radius:12px; background:#ffffffa8; }
.difficulty-tabs button { min-width:58px; padding:8px 10px; border:0; border-radius:8px; color:#68778f; background:transparent; font-size:12px; transition:.2s ease; }
.difficulty-tabs button:hover { color:var(--sd-blue); background:#edf2ff; }
.difficulty-tabs button.active { color:#fff; background:var(--sd-blue); box-shadow:0 6px 14px #3157dc2b; }
.sudoku-top-actions { display:flex; align-items:center; gap:8px; }
.round-action,.new-game-button { border:1px solid #cbd6e6; color:var(--sd-ink); background:#fff; }
.round-action { width:38px; height:38px; padding:0; border-radius:50%; font-size:13px; }
.new-game-button { min-height:38px; padding:0 18px; border-color:var(--sd-blue); border-radius:10px; color:#fff; background:var(--sd-blue); font-size:12px; font-weight:700; }
.sudoku-statusbar { display:grid; grid-template-columns:repeat(4,auto) minmax(180px,1fr); align-items:center; gap:28px; max-width:980px; margin:19px auto 22px; }
.sudoku-statusbar > div:not(.sudoku-progress) { display:grid; gap:3px; }
.sudoku-statusbar span { color:#7c8a9e; font:10px var(--font-mono); letter-spacing:.7px; }
.sudoku-statusbar strong { font:600 13px var(--font-mono); color:#40516d; }
.sudoku-progress { display:grid; grid-template-columns:auto 1fr; align-items:center; gap:12px; }
.sudoku-progress i { height:5px; overflow:hidden; border-radius:10px; background:#dce4f0; }
.sudoku-progress b { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,#6b8bf1,var(--sd-blue)); transition:width .35s ease; }
.sudoku-play-area { display:grid; grid-template-columns:minmax(420px,590px) minmax(230px,290px); justify-content:center; align-items:start; gap:clamp(25px,4vw,58px); }
.board-wrap { min-width:0; }
.sudoku-board { position:relative; display:grid; grid-template-columns:repeat(9,1fr); aspect-ratio:1; overflow:hidden; border:2px solid #344c76; border-radius:10px; background:#fff; box-shadow:0 25px 60px #36558d1b,0 5px 16px #36558d16; outline:none; }
.sudoku-cell { position:relative; display:grid; place-items:center; min-width:0; padding:0; border:0; border-right:1px solid var(--sd-line); border-bottom:1px solid var(--sd-line); border-radius:0; outline:0; color:#53627a; background:#fff; font:500 clamp(18px,2.8vw,31px)/1 var(--font-mono); -webkit-tap-highlight-color:transparent; transition:background-color .18s ease,color .18s ease; }
.sudoku-cell:nth-child(9n) { border-right:0; }
.sudoku-cell:nth-child(n+73) { border-bottom:0; }
.sudoku-cell.box-right { border-right:2px solid #617494; }
.sudoku-cell.box-bottom { border-bottom:2px solid #617494; }
.sudoku-cell:hover { background:#f2f6ff; }
.sudoku-cell.is-peer { background:#f0f4fa; }
.sudoku-cell.is-match { color:var(--sd-blue-deep); background:#dfe8fb; }
.sudoku-cell.is-selected { color:var(--sd-blue-deep); background:#cbdafe; }
.sudoku-cell.is-given { color:#263750; font-weight:750; }
.sudoku-cell.is-user { color:var(--sd-blue); }
.sudoku-cell.is-hint { color:#7c55bc; background:#f0eaff; }
.sudoku-cell.is-wrong { color:#d34e59; background:#fff0f1; animation:wrong-shake .22s ease; }
.selection-cursor { position:absolute; z-index:3; top:0; left:0; width:calc(100% / 9); height:calc(100% / 9); border:2px solid var(--sd-blue); border-radius:2px; pointer-events:none; will-change:transform; transition:transform .2s cubic-bezier(.2,.78,.28,1); }
.cell-notes { position:absolute; inset:3px; display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:repeat(3,1fr); color:#6780a9; font:600 clamp(6px,.85vw,10px)/1 var(--font-mono); }
.cell-notes i { display:grid; place-items:center; font-style:normal; }
.board-overlay { position:absolute; z-index:4; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; color:#fff; text-align:center; background:#1f3155f2; backdrop-filter:blur(8px); }
.board-overlay strong { font-size:20px; }
.board-overlay small { color:#bac9e6; font:10px var(--font-mono); letter-spacing:1.4px; }
.pause-overlay > span { display:grid; place-items:center; width:64px; height:64px; margin-bottom:4px; border:1px solid #ffffff4d; border-radius:50%; color:#cddaff; font:24px var(--font-mono); }
.pause-overlay button { margin-top:12px; padding:11px 23px; border:0; border-radius:9px; color:var(--sd-blue-deep); background:#fff; font-weight:700; }
.loading-orbit { width:54px; height:54px; margin-bottom:5px; border:3px solid #ffffff30; border-top-color:#fff; border-radius:50%; animation:spin 1s linear infinite; }
.board-caption { display:flex; justify-content:space-between; gap:15px; margin:13px 2px 0; color:#8291a5; font:10px var(--font-mono); letter-spacing:.4px; }
.sudoku-controls { display:grid; gap:15px; }
.selected-card { display:grid; grid-template-columns:1fr auto; align-items:center; gap:3px 15px; min-height:98px; padding:16px 18px; border:1px solid #ced9e9; border-radius:15px; background:linear-gradient(135deg,#fff,#f0f4fb); box-shadow:0 10px 28px #526f9b12; }
.selected-card > span { color:#7f8d9f; font:10px var(--font-mono); letter-spacing:.7px; }
.selected-card strong { grid-row:1/3; grid-column:2; color:var(--sd-blue); font:700 46px/1 var(--font-mono); }
.selected-card small { color:#5e6e86; font-size:12px; }
.number-pad { display:grid; grid-template-columns:repeat(3,1fr); gap:7px; }
.number-pad button { display:grid; place-items:center; gap:1px; aspect-ratio:1.12; padding:6px; border:1px solid #cad6e7; border-radius:11px; color:var(--sd-blue); background:#fff; box-shadow:0 4px 10px #54709e0c; transition:.15s ease; }
.number-pad button:hover:not(:disabled) { transform:translateY(-2px); border-color:#94a9d0; background:#edf2ff; }
.number-pad button.matching { color:#fff; border-color:var(--sd-blue); background:var(--sd-blue); }
.number-pad button strong { font:650 22px/1 var(--font-mono); }
.number-pad button small { color:#8493a5; font:10px var(--font-mono); }
.number-pad button.matching small { color:#dbe4ff; }
.number-pad button.complete { opacity:.28; }
.tool-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; }
.tool-grid button { display:grid; justify-items:center; gap:6px; min-width:0; padding:11px 3px 9px; border:1px solid #ccd7e6; border-radius:10px; color:#586a83; background:#ffffffb3; }
.tool-grid button:hover:not(:disabled),.tool-grid button.active { color:var(--sd-blue); border-color:#9eb0db; background:#eaf0ff; }
.tool-grid button.pulse { animation:note-key-pulse .26s ease; }
.tool-grid button > span { font:21px/1 Georgia,serif; }
.tool-grid button small { font-size:11px; white-space:nowrap; }
.tool-grid button b { color:var(--sd-blue); font:10px var(--font-mono); }
.tool-grid button:disabled { opacity:.35; }
.keyboard-note { padding:13px 15px; border:1px dashed #c7d2e3; border-radius:11px; color:#7d8ca1; background:#f8faff8c; }
.keyboard-note > span { color:#8795a7; font:10px var(--font-mono); letter-spacing:1px; }
.keyboard-note p { margin-top:7px; font-size:12px; line-height:1.9; }
.keyboard-note kbd { padding:2px 5px; border:1px solid #c9d4e2; border-radius:4px; background:#fff; color:#52647f; font:10px var(--font-mono); box-shadow:0 1px 0 #bac6d7; }
.sudoku-modal-backdrop { position:absolute; z-index:10; inset:0; display:grid; place-items:center; padding:20px; background:#1c2b49ad; backdrop-filter:blur(8px); }
.sudoku-modal { position:relative; width:min(440px,100%); padding:35px; border:1px solid #ffffffde; border-radius:22px; background:linear-gradient(145deg,#fff,#edf2fa); box-shadow:0 35px 90px #14234063; }
.sudoku-modal > p:first-of-type { color:var(--sd-blue); font:10px var(--font-mono); letter-spacing:1.5px; }
.sudoku-modal h2 { margin:8px 0 23px; font-size:26px; letter-spacing:-1px; }
.modal-close { position:absolute; top:15px; right:15px; width:32px; height:32px; padding:0; border:1px solid #d5deeb; border-radius:50%; color:#77859a; background:#fff; font-size:20px; }
.difficulty-list { display:grid; gap:7px; }
.difficulty-list button { display:flex; align-items:center; justify-content:space-between; gap:20px; padding:13px 15px; border:1px solid #d6deea; border-radius:11px; color:var(--sd-ink); background:#fff; text-align:left; }
.difficulty-list button:hover { color:var(--sd-blue); border-color:#9eafe0; background:#f1f5ff; }
.difficulty-list span { display:grid; gap:3px; }
.difficulty-list b { font-size:13px; }
.difficulty-list small,.difficulty-list i { color:#78879a; font-size:12px; font-style:normal; }
.modal-footnote { display:block; margin-top:18px; color:#7d8b9e; font-size:12px; line-height:1.7; }
.help-modal ol { display:grid; gap:10px; margin:0; padding:0; list-style:none; }
.help-modal li { display:grid; grid-template-columns:38px 1fr; align-items:center; gap:12px; padding:12px; border-radius:10px; background:#fff; }
.help-modal li b { color:var(--sd-blue); font:11px var(--font-mono); }
.help-modal li span { color:#61718a; font-size:12px; line-height:1.6; }
.help-tip { margin-top:16px; padding:13px; border-left:3px solid var(--sd-blue); color:#5f7088; background:#e8effd; font-size:12px; line-height:1.7; }
.win-backdrop { background:radial-gradient(circle at 50% 45%,#536ed0b8,#172541e8); }
.win-modal { overflow:hidden; text-align:center; }
.win-seal { display:grid; place-items:center; width:72px; height:72px; margin:0 auto 18px; border-radius:50%; color:#fff; background:linear-gradient(145deg,#5878ec,#294bc5); box-shadow:0 12px 35px #3157dc4a; font-size:34px; }
.win-stats { display:grid; grid-template-columns:repeat(3,1fr); margin:22px 0; border-block:1px solid #d6dfeb; }
.win-stats span { display:grid; gap:5px; padding:15px 8px; border-right:1px solid #d6dfeb; }
.win-stats span:last-child { border-right:0; }
.win-stats small { color:#78879b; font-size:12px; }
.win-stats b { font:600 13px var(--font-mono); }
.modal-primary,.modal-secondary { width:100%; padding:12px; border-radius:10px; font-size:12px; font-weight:700; }
.modal-primary { border:1px solid var(--sd-blue); color:#fff; background:var(--sd-blue); }
.modal-secondary { margin-top:7px; border:1px solid #cdd7e4; color:#6f7e93; background:#fff; }
.confetti i { position:absolute; width:7px; height:17px; left:calc((var(--n, 1) * 5.2%)); top:-20px; background:#3157dc; transform:rotate(18deg); animation:confetti-fall 3s ease-in infinite; }
.confetti i:nth-child(3n) { background:#f0bb4e; }
.confetti i:nth-child(3n+1) { background:#79c7b5; }
.confetti i:nth-child(1){--n:1;animation-delay:.1s}.confetti i:nth-child(2){--n:2;animation-delay:1.3s}.confetti i:nth-child(3){--n:3;animation-delay:.7s}.confetti i:nth-child(4){--n:4;animation-delay:2s}.confetti i:nth-child(5){--n:5;animation-delay:.4s}.confetti i:nth-child(6){--n:6;animation-delay:1.7s}.confetti i:nth-child(7){--n:7;animation-delay:.2s}.confetti i:nth-child(8){--n:8;animation-delay:2.3s}.confetti i:nth-child(9){--n:9;animation-delay:1s}.confetti i:nth-child(10){--n:10;animation-delay:.5s}.confetti i:nth-child(11){--n:11;animation-delay:1.9s}.confetti i:nth-child(12){--n:12;animation-delay:.8s}.confetti i:nth-child(13){--n:13;animation-delay:2.5s}.confetti i:nth-child(14){--n:14;animation-delay:1.4s}.confetti i:nth-child(15){--n:15;animation-delay:.3s}.confetti i:nth-child(16){--n:16;animation-delay:2.1s}.confetti i:nth-child(17){--n:17;animation-delay:1.1s}.confetti i:nth-child(18){--n:18;animation-delay:.6s}
.sudoku-modal-enter-active,.sudoku-modal-leave-active { transition:opacity .2s ease; }
.sudoku-modal-enter-active .sudoku-modal,.sudoku-modal-leave-active .sudoku-modal { transition:transform .22s ease; }
.sudoku-modal-enter-from,.sudoku-modal-leave-to { opacity:0; }
.sudoku-modal-enter-from .sudoku-modal,.sudoku-modal-leave-to .sudoku-modal { transform:translateY(12px) scale(.97); }
@keyframes wrong-shake { 33%{transform:translateX(-2px)} 66%{transform:translateX(2px)} }
@keyframes note-key-pulse { 45%{transform:translateY(-2px) scale(1.035);box-shadow:0 5px 14px #3157dc2b} }
@keyframes spin { to{transform:rotate(360deg)} }
@keyframes confetti-fall { to{transform:translateY(530px) rotate(420deg)} }
@media(prefers-reduced-motion:reduce) {
  .selection-cursor,.sudoku-cell { transition:none; }
}
@media(max-width:900px) {
  .sudoku-app { min-height:0; padding:18px; }
  .sudoku-topbar { grid-template-columns:auto 1fr; gap:15px; }
  .difficulty-tabs { grid-row:2; grid-column:1/-1; justify-self:stretch; overflow-x:auto; }
  .difficulty-tabs button { flex:1; min-width:58px; }
  .sudoku-top-actions { justify-self:end; }
  .sudoku-statusbar { grid-template-columns:repeat(4,1fr); gap:12px; }
  .sudoku-progress { grid-column:1/-1; }
  .sudoku-play-area { grid-template-columns:minmax(340px,560px); gap:22px; }
  .sudoku-controls { grid-template-columns:140px 1fr; }
  .selected-card { min-height:100%; }
  .number-pad { grid-template-columns:repeat(9,1fr); grid-column:1/-1; grid-row:2; }
  .number-pad button { aspect-ratio:1; }
  .number-pad button small { display:none; }
  .tool-grid { grid-column:2; grid-row:1; align-self:stretch; }
  .keyboard-note { display:none; }
}
@media(max-width:560px) {
  .sudoku-app { padding:14px 10px 18px; }
  .sudoku-topbar { gap:11px; padding-bottom:14px; }
  .sudoku-brand { gap:8px; }
  .sudoku-brand b { font-size:15px; }
  .sudoku-mark { grid-template-columns:repeat(3,5px); padding:6px; }
  .sudoku-mark i { width:5px; height:5px; }
  .round-action { display:none; }
  .new-game-button { padding:0 12px; }
  .difficulty-tabs { gap:2px; padding:3px; }
  .difficulty-tabs button { min-width:52px; padding:7px 5px; font-size:12px; }
  .sudoku-statusbar { margin:13px 3px 15px; }
  .sudoku-statusbar > div:nth-child(1),.sudoku-statusbar > div:nth-child(4) { display:none; }
  .sudoku-statusbar { grid-template-columns:1fr 1fr; }
  .sudoku-progress { grid-column:1/-1; }
  .sudoku-play-area { grid-template-columns:minmax(0,1fr); gap:17px; }
  .sudoku-board { border-radius:6px; }
  .sudoku-cell { font-size:clamp(18px,7vw,27px); }
  .cell-notes { font-size:clamp(5px,2.2vw,9px); }
  .board-caption { font-size:10px; }
  .sudoku-controls { display:grid; grid-template-columns:1fr; gap:9px; }
  .selected-card { display:none; }
  .number-pad { grid-column:1; grid-row:auto; gap:3px; }
  .number-pad button { border-radius:7px; }
  .number-pad button strong { font-size:clamp(15px,5vw,20px); }
  .tool-grid { grid-column:1; grid-row:auto; gap:5px; }
  .tool-grid button { padding:9px 2px 7px; }
  .tool-grid button > span { font-size:18px; }
  .sudoku-modal { padding:29px 22px; }
  .sudoku-modal h2 { font-size:22px; }
}
:global(.game-frame.is-fullscreen) .sudoku-app { width:100%; height:100%; min-height:0; overflow:auto; }
:global(.game-frame.is-fullscreen) .sudoku-board { max-height:calc(100dvh - 230px); }
</style>
