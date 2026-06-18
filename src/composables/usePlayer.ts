import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { tracksSeed, type Track, type ViewId } from '../data/music'

function cloneTracks(): Track[] {
  return tracksSeed.map((track) => ({
    ...track,
    lyrics: [...track.lyrics],
  }))
}

function formatTime(value: number) {
  const minutes = Math.floor(value / 60)
  const seconds = String(value % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export function usePlayer() {
  const activeView = ref<ViewId>('discover')
  const tracks = ref<Track[]>(cloneTracks())
  const currentTrackIndex = ref(0)
  const progress = ref(84)
  const volume = ref(72)
  const searchTerm = ref('')
  const isPlaying = ref(false)
  let timer: number | undefined

  const currentTrack = computed(() => tracks.value[currentTrackIndex.value])

  const filteredTracks = computed(() => {
    const keyword = searchTerm.value.trim().toLowerCase()
    if (!keyword) return tracks.value
    return tracks.value.filter((track) =>
      [track.title, track.artist, track.album].some((value) => value.toLowerCase().includes(keyword)),
    )
  })

  const likedTracks = computed(() => tracks.value.filter((track) => track.liked))
  const formattedProgress = computed(() => formatTime(progress.value))

  function setView(view: ViewId) {
    activeView.value = view
  }

  function playTrack(index: number) {
    currentTrackIndex.value = index
    progress.value = Math.min(progress.value, currentTrack.value.seconds)
    isPlaying.value = true
  }

  function playTrackById(id: number) {
    const index = tracks.value.findIndex((track) => track.id === id)
    if (index >= 0) {
      playTrack(index)
    }
  }

  function playAll() {
    playTrack(0)
  }

  function togglePlay() {
    isPlaying.value = !isPlaying.value
  }

  function previousTrack() {
    currentTrackIndex.value = (currentTrackIndex.value - 1 + tracks.value.length) % tracks.value.length
    progress.value = 0
    isPlaying.value = true
  }

  function nextTrack() {
    currentTrackIndex.value = (currentTrackIndex.value + 1) % tracks.value.length
    progress.value = 0
    isPlaying.value = true
  }

  function toggleLike(id = currentTrack.value.id) {
    const track = tracks.value.find((item) => item.id === id)
    if (track) {
      track.liked = !track.liked
    }
  }

  function seek(value: number) {
    progress.value = Math.min(Math.max(0, Math.round(value)), currentTrack.value.seconds)
  }

  function setVolume(value: number) {
    volume.value = Math.min(Math.max(0, Math.round(value)), 100)
  }

  watch(isPlaying, (playing) => {
    if (timer) {
      window.clearInterval(timer)
      timer = undefined
    }

    if (playing) {
      timer = window.setInterval(() => {
        if (progress.value >= currentTrack.value.seconds) {
          nextTrack()
          return
        }

        progress.value += 1
      }, 1000)
    }
  })

  onBeforeUnmount(() => {
    if (timer) {
      window.clearInterval(timer)
    }
  })

  return {
    activeView,
    currentTrack,
    filteredTracks,
    formattedProgress,
    isPlaying,
    likedTracks,
    progress,
    searchTerm,
    tracks,
    volume,
    nextTrack,
    playAll,
    playTrackById,
    previousTrack,
    seek,
    setView,
    setVolume,
    toggleLike,
    togglePlay,
  }
}
