import { createApp, h, ref } from 'vue'
import LxLyricsTimelineModal from '../components/LxLyricsTimelineModal.vue'
import player from './player'
import type { LyricLine } from './lyric'

const words = (text: string, start: number, end: number) => {
  const glyphs = Array.from(text)
  const unit = (end - start) / glyphs.length
  return glyphs.map((glyph, index) => ({
    text: glyph,
    startTime: start + unit * index,
    endTime: start + unit * (index + 1),
  }))
}

const line = (
  fullText: string,
  translation: string,
  start: number,
  end: number,
): LyricLine => ({
  startTime: start,
  endTime: end,
  fullText,
  words: words(fullText, start, end),
  translation,
  romanization: '',
  isChorus: false,
  renderHints: {
    rawDuration: end - start,
    timingClass: 'normal',
    renderEndTime: end + 0.3,
    wordRevealMode: 'normal',
    lineTransitionMode: 'normal',
  },
})

player.state.lyricLines = [
  line('夜が明けるまで踊ろう', '一起跳舞直到天明', 3.0, 6.4),
  line('ガラス越しの街が揺れる', '隔着玻璃的城市在摇晃', 6.2, 9.1),
  line('君の声だけが聞こえてる', '只听得见你的声音', 9.0, 12.4),
  line('遠く消えてゆく電子音', '渐渐远去的电子音', 12.2, 15.2),
  line('もう一度だけ君に会いたい', '想再见你一次', 15.4, 18.6),
]
player.state.progress = 10.5

createApp({
  setup() {
    const open = ref(true)
    return () =>
      h(LxLyricsTimelineModal, {
        open: open.value,
        accentColor: '#ff7add',
        secondaryColor: '#c7b8d9',
        daylight: false,
        onClose: () => {
          open.value = false
        },
      })
  },
}).mount('#app')
