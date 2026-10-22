/**
 * Shared list/playback actions.
 *
 * Collecting these handlers here keeps every view's behaviour identical.
 */

import type { MusicItem } from './api'
import { addTask } from './download'
import { addMusicToList, isMusicInList, LIST_IDS, toggleLove } from './lists'
import player from './player'
import { appSetting } from './settings'
import { openAddToList, toast } from './ui'

/** Plays `music` in the context of `list`, so next/prev walk the same list. */
export function playFromList(list: MusicItem[], music: MusicItem, listId: string = LIST_IDS.DEFAULT) {
  // Keep search playback in the audition list so history survives result replacement.
  if (listId === LIST_IDS.DEFAULT && !isMusicInList(LIST_IDS.DEFAULT, music)) {
    addMusicToList(LIST_IDS.DEFAULT, music, 'top')
  }
  const index = list.findIndex((item) => item.id === music.id)
  void player.playMusic(music, { listId, list, index: index < 0 ? 0 : index, autoplay: appSetting['player.autoPlay'] })
}

/** Plays a whole list from the top. */
export function playAll(list: MusicItem[], listId: string = LIST_IDS.DEFAULT) {
  if (!list.length) return
  void player.playMusic(list[0], { listId, list, index: 0, autoplay: true })
}

export function toggleLoveWithToast(music: MusicItem) {
  const loved = toggleLove(music)
  toast(loved ? '已收藏' : '已取消收藏')
  return loved
}

export function downloadMusic(music: MusicItem) {
  if (!appSetting['download.enable']) {
    toast('下载功能已在设置中关闭')
    return
  }
  addTask(music)
  toast('已加入下载队列')
}

export function promptAddToList(music: MusicItem) {
  openAddToList(music)
}

export function copyMusicName(music: MusicItem) {
  const text = `${music.name} - ${music.singer}`
  void navigator.clipboard?.writeText(text).then(
    () => toast('已复制歌名'),
    () => toast('复制失败'),
  )
}
