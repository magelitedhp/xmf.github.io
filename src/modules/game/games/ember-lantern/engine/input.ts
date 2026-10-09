export type Action = 'left' | 'right' | 'up' | 'down' | 'jump' | 'attack' | 'dash' | 'confirm' | 'pause'

const KEYMAP: Record<string, Action[]> = {
  ArrowLeft: ['left'],
  KeyA: ['left'],
  ArrowRight: ['right'],
  KeyD: ['right'],
  ArrowUp: ['up', 'jump'],
  KeyW: ['up', 'jump'],
  ArrowDown: ['down'],
  KeyS: ['down'],
  Space: ['jump', 'confirm'],
  KeyK: ['jump'],
  KeyZ: ['jump'],
  KeyJ: ['attack', 'confirm'],
  KeyX: ['attack'],
  KeyL: ['dash'],
  KeyC: ['dash'],
  ShiftLeft: ['dash'],
  ShiftRight: ['dash'],
  Enter: ['confirm'],
  Escape: ['pause'],
  KeyP: ['pause'],
}

export class Input {
  private held = new Map<Action, number>()
  private justPressed = new Set<Action>()
  private keys = new Set<string>()
  onAny: (() => void) | null = null

  attach() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  detach() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }

  press(action: Action) {
    this.held.set(action, (this.held.get(action) ?? 0) + 1)
    this.justPressed.add(action)
    this.onAny?.()
  }

  release(action: Action) {
    this.held.set(action, Math.max(0, (this.held.get(action) ?? 0) - 1))
  }

  down(action: Action) {
    return (this.held.get(action) ?? 0) > 0
  }

  pressed(action: Action) {
    return this.justPressed.has(action)
  }

  /** Called after each fixed update step so presses are seen exactly once. */
  endStep() {
    this.justPressed.clear()
  }

  reset() {
    this.held.clear()
    this.justPressed.clear()
    this.keys.clear()
  }

  private onKeyDown = (e: KeyboardEvent) => {
    // Let the cabinet toolbar and navigation keep their native keyboard behavior.
    if (e.target instanceof HTMLElement && e.target.closest('button, a, input, textarea, select')) return
    const actions = KEYMAP[e.code]
    if (!actions) return
    e.preventDefault()
    if (this.keys.has(e.code)) return
    this.keys.add(e.code)
    for (const a of actions) this.press(a)
  }

  private onKeyUp = (e: KeyboardEvent) => {
    const actions = KEYMAP[e.code]
    if (!actions || !this.keys.has(e.code)) return
    this.keys.delete(e.code)
    for (const a of actions) this.release(a)
  }
}
