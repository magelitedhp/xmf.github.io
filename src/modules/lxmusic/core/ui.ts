/**
 * Cross-view UI state for Yumo Music.
 *
 * Holds the "添加到列表" dialog and the transient toast, so any view (search results,
 * song lists, my lists, downloads) can trigger them without prop drilling — the same
 * role for the add-to-list dialog and toast notification.
 */

import { reactive } from 'vue'
import type { MusicItem } from './api'

interface AddToListState {
  open: boolean
  music: MusicItem | null
}

interface ToastState {
  visible: boolean
  text: string
}

export const uiState = reactive({
  addToList: { open: false, music: null } as AddToListState,
  toast: { visible: false, text: '' } as ToastState,
})

export function openAddToList(music: MusicItem) {
  uiState.addToList.music = music
  uiState.addToList.open = true
}

export function closeAddToList() {
  uiState.addToList.open = false
  uiState.addToList.music = null
}

let toastTimer = 0

/** Short-lived status message, mirroring the desktop app's bottom toast. */
export function toast(text: string) {
  uiState.toast.text = text
  uiState.toast.visible = true
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    uiState.toast.visible = false
  }, 2200)
}
