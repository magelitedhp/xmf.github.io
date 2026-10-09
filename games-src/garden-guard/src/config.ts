/** Logical resolution. The canvas is letterboxed to keep this 5:3 view. */
export const VIEW_W = 1200
export const VIEW_H = 720

export const ROWS = 5
export const COLS = 9
export const CELL_W = 98
export const CELL_H = 114
export const LAWN_X = 262
export const LAWN_Y = 138
export const LAWN_R = LAWN_X + COLS * CELL_W
export const LAWN_B = LAWN_Y + ROWS * CELL_H

/** Zombies that cross this x with no mower left in their row win the game. */
export const HOUSE_X = 150
export const MOWER_X = 214
export const SPAWN_X = LAWN_R + 78

/** The world is wider than the view: the street lies to the right of the lawn. */
export const WORLD_W = 1740
export const STREET_CAM = WORLD_W - VIEW_W

export const STEP = 1 / 60
export const MAX_SLOTS = 8

export const rowFeet = (row: number) => LAWN_Y + (row + 1) * CELL_H - 18
export const rowCenter = (row: number) => LAWN_Y + row * CELL_H + CELL_H / 2
export const colCenter = (col: number) => LAWN_X + col * CELL_W + CELL_W / 2
export const colAt = (x: number) => Math.floor((x - LAWN_X) / CELL_W)
export const rowAt = (y: number) => Math.floor((y - LAWN_Y) / CELL_H)

export const SAVE_KEY = 'garden-guard-save-v1'
