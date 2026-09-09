import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { currentLyricIndex, parseLrc } from '../api/lyrics'
import {
  fetchArtwork,
  fetchLyrics,
  hydrateArtworks,
  resolveSongUrl,
  searchTracks as requestSearch,
  type SearchHit,
} from '../api/musicApi'
import {
  LIKED_STORAGE_KEY,
  RECENT_STORAGE_KEY,
  collections as collectionSeed,
  discoverQuery,
  emptyTrack,
  playlists as playlistSeed,
  type Album,
  type Collection,
  type Playlist,
  type Track,
  type ViewId,
} from '../data/music'

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0:00'
  const total = Math.floor(value)
  const minutes = Math.floor(total / 60)
  const seconds = String(total % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

function artistText(artist: SearchHit['artist']) {
  return Array.isArray(artist) ? artist.filter(Boolean).join(' / ') : String(artist || '未知艺人')
}

function snapshotTrack(track: Track): Track {
  return {
    ...track,
    lyrics: track.lyrics.map((line) => ({ ...line })),
  }
}

function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStore(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

const SEARCH_PAGE_SIZE = 20

export function usePlayer() {
  const activeView = ref<ViewId>('discover')
  const searchTerm = ref('')
  const searchPage = ref(1)
  const searchHasMore = ref(false)
  const searchSource = ref<string | undefined>()
  const lastSearchQuery = ref('')
  const discoverTracks = ref<Track[]>([])
  const searchResults = ref<Track[]>([])
  const queue = ref<Track[]>([])
  const likedTracks = ref<Track[]>([])
  const recentTracks = ref<Track[]>([])
  const playlists = ref<Playlist[]>(playlistSeed.map((item) => ({ ...item })))
  const collections = ref<Collection[]>(collectionSeed.map((item) => ({ ...item })))
  const currentTrackIndex = ref(0)
  const progress = ref(0)
  const volume = ref(72)
  const isPlaying = ref(false)
  const isShuffle = ref(false)
  const isLoopOne = ref(false)
  const isSearching = ref(false)
  const isDiscovering = ref(false)
  const isBuffering = ref(false)
  const statusMessage = ref('正在连接曲库…')
  const searchError = ref('')
  const discoverError = ref('')
  let searchTimer: number | undefined
  let loadedUid = ''
  let audio: HTMLAudioElement | null = null

  const currentTrack = computed(() => queue.value[currentTrackIndex.value] ?? emptyTrack)
  const albums = computed<Album[]>(() => {
    const seen = new Set<string>()
    return discoverTracks.value
      .filter((track) => {
        if (!track.album || seen.has(track.album)) return false
        seen.add(track.album)
        return true
      })
      .slice(0, 3)
      .map((track) => ({
        title: track.album,
        meta: track.artist,
        artwork: track.artwork,
        query: track.album,
      }))
  })
  const formattedProgress = computed(() => formatTime(progress.value))
  const currentLyric = computed(() => currentLyricIndex(currentTrack.value.lyrics, progress.value))
  const sceneArt = computed(() => currentTrack.value.artwork)

  function mapHits(hits: SearchHit[]): Track[] {
    const likedIds = new Set(likedTracks.value.map((track) => track.uid))
    return hits.map((hit) => {
      const id = String(hit.id)
      const source = hit.source || 'netease'
      const uid = `${source}:${id}`
      const stored = likedTracks.value.find((track) => track.uid === uid)
      return {
        uid,
        id,
        source,
        picId: String(hit.pic_id ?? ''),
        lyricId: String(hit.lyric_id ?? id),
        title: hit.name,
        artist: artistText(hit.artist),
        album: hit.album || '未知专辑',
        duration: stored?.duration || '--:--',
        seconds: stored?.seconds || 0,
        artwork: stored?.artwork || '',
        liked: likedIds.has(uid),
        lyrics: stored?.lyrics ?? [],
      }
    })
  }

  function decorateStations(tracks: Track[]) {
    playlists.value = playlists.value.map((playlist, index) => ({
      ...playlist,
      artwork: tracks[index % Math.max(tracks.length, 1)]?.artwork || playlist.artwork,
    }))
    collections.value = collections.value.map((collection, index) => ({
      ...collection,
      artwork: tracks[(index + 2) % Math.max(tracks.length, 1)]?.artwork || collection.artwork,
    }))
  }

  function persistLibrary() {
    writeStore(
      LIKED_STORAGE_KEY,
      likedTracks.value.map((track) => snapshotTrack(track)),
    )
    writeStore(
      RECENT_STORAGE_KEY,
      recentTracks.value.map((track) => snapshotTrack(track)),
    )
  }

  function rememberRecent(track: Track) {
    if (!track.uid) return
    recentTracks.value = [snapshotTrack(track), ...recentTracks.value.filter((item) => item.uid !== track.uid)].slice(0, 12)
    persistLibrary()
  }

  function applyTrackPatch(uid: string, patch: Partial<Track>) {
    const lists = [discoverTracks.value, searchResults.value, queue.value, likedTracks.value, recentTracks.value]
    lists.forEach((list) => {
      const track = list.find((item) => item.uid === uid)
      if (track) Object.assign(track, patch)
    })
  }

  async function hydrate(list: Track[]) {
    await hydrateArtworks(list)
    decorateStations(discoverTracks.value.length ? discoverTracks.value : list)
  }

  async function loadLyrics(track: Track) {
    if (!track.uid || track.lyrics.length) return
    try {
      const payload = await fetchLyrics(track.source, track.lyricId)
      const lyrics = parseLrc(payload.lyric, payload.tlyric)
      applyTrackPatch(track.uid, { lyrics })
    } catch {
      applyTrackPatch(track.uid, { lyrics: [] })
    }
  }

  async function ensureArtwork(track: Track) {
    if (!track.uid || track.artwork || !track.picId) return
    const artwork = await fetchArtwork(track.source, track.picId, 500)
    if (artwork) applyTrackPatch(track.uid, { artwork })
  }

  function ensureAudio() {
    if (audio) return audio
    audio = new Audio()
    audio.preload = 'metadata'
    audio.volume = volume.value / 100
    audio.addEventListener('timeupdate', () => {
      if (audio) progress.value = audio.currentTime
    })
    audio.addEventListener('loadedmetadata', () => {
      if (!audio || !currentTrack.value.uid) return
      const seconds = Math.floor(audio.duration || 0)
      applyTrackPatch(currentTrack.value.uid, {
        seconds,
        duration: formatTime(seconds),
      })
    })
    audio.addEventListener('ended', () => {
      if (isLoopOne.value) {
        if (audio) {
          audio.currentTime = 0
          void audio.play()
        }
        return
      }
      nextTrack()
    })
    audio.addEventListener('waiting', () => {
      isBuffering.value = true
    })
    audio.addEventListener('playing', () => {
      isBuffering.value = false
      isPlaying.value = true
    })
    audio.addEventListener('pause', () => {
      if (audio && audio.ended) return
      isPlaying.value = false
    })
    audio.addEventListener('error', () => {
      isBuffering.value = false
      isPlaying.value = false
      statusMessage.value = '当前曲目暂时无法播放'
    })
    return audio
  }

  async function startPlayback() {
    const track = currentTrack.value
    if (!track.uid) return
    const element = ensureAudio()
    isBuffering.value = true
    statusMessage.value = `正在准备「${track.title}」`

    try {
      const url = await resolveSongUrl(track.source, track.id)
      if (!url) throw new Error('empty url')
      if (loadedUid !== track.uid) {
        element.src = url
        loadedUid = track.uid
      }
      rememberRecent(track)
      void loadLyrics(track)
      void ensureArtwork(track)
      await element.play()
      isPlaying.value = true
      statusMessage.value = `曲库来源 GD音乐台 · ${track.source}`
    } catch {
      isPlaying.value = false
      statusMessage.value = '当前曲目暂时无法播放，可尝试下一首'
    } finally {
      isBuffering.value = false
    }
  }

  function playAt(index: number) {
    if (!queue.value.length) return
    currentTrackIndex.value = (index + queue.value.length) % queue.value.length
    progress.value = 0
    loadedUid = ''
    void startPlayback()
  }

  function playFromList(list: Track[], uid?: string) {
    if (!list.length) return
    queue.value = list
    const index = uid ? list.findIndex((track) => track.uid === uid) : 0
    playAt(index >= 0 ? index : 0)
  }

  function playTrackById(uid: string, list?: Track[]) {
    playFromList(list ?? queue.value, uid)
  }

  function playAll(list?: Track[]) {
    playFromList(list ?? (activeView.value === 'search' ? searchResults.value : discoverTracks.value))
  }

  function togglePlay() {
    const element = ensureAudio()
    if (!currentTrack.value.uid) {
      playAll()
      return
    }
    if (isPlaying.value) {
      element.pause()
      isPlaying.value = false
      return
    }
    if (loadedUid === currentTrack.value.uid && element.src) {
      void element.play().then(() => {
        isPlaying.value = true
      })
      return
    }
    void startPlayback()
  }

  function previousTrack() {
    if (progress.value > 3) {
      seek(0)
      return
    }
    playAt(currentTrackIndex.value - 1)
  }

  function nextTrack() {
    if (!queue.value.length) return
    if (isShuffle.value && queue.value.length > 1) {
      let next = Math.floor(Math.random() * queue.value.length)
      if (next === currentTrackIndex.value) {
        next = (next + 1) % queue.value.length
      }
      playAt(next)
      return
    }
    playAt(currentTrackIndex.value + 1)
  }

  function toggleLike(uid = currentTrack.value.uid) {
    const lists = [queue.value, discoverTracks.value, searchResults.value, recentTracks.value]
    const found = lists.flat().find((track) => track.uid === uid) ?? likedTracks.value.find((track) => track.uid === uid)
    if (!found) return

    const liked = !found.liked
    applyTrackPatch(uid, { liked })
    if (liked) {
      likedTracks.value = [snapshotTrack({ ...found, liked: true }), ...likedTracks.value.filter((track) => track.uid !== uid)]
    } else {
      likedTracks.value = likedTracks.value.filter((track) => track.uid !== uid)
    }
    persistLibrary()
  }

  function seek(value: number) {
    const next = Math.min(Math.max(0, value), currentTrack.value.seconds || value)
    progress.value = next
    const element = ensureAudio()
    if (loadedUid === currentTrack.value.uid) {
      element.currentTime = next
    }
  }

  function setVolume(value: number) {
    volume.value = Math.min(Math.max(0, Math.round(value)), 100)
    ensureAudio().volume = volume.value / 100
  }

  function setView(view: ViewId) {
    activeView.value = view
  }

  function toggleShuffle() {
    isShuffle.value = !isShuffle.value
  }

  function toggleLoop() {
    isLoopOne.value = !isLoopOne.value
  }

  async function runSearch(keyword: string, source?: string, page = 1) {
    const query = keyword.trim()
    if (!query) return
    const nextPage = Math.max(1, Math.floor(page))
    const isNewQuery = query !== lastSearchQuery.value
    isSearching.value = true
    searchError.value = ''
    searchSource.value = source
    lastSearchQuery.value = query
    if (isNewQuery || nextPage !== searchPage.value) {
      searchResults.value = []
    }
    if (isNewQuery) searchHasMore.value = false
    searchPage.value = nextPage
    statusMessage.value = nextPage > 1 ? `正在搜索「${query}」第 ${nextPage} 页` : `正在搜索「${query}」`
    try {
      const hits = await requestSearch(query, { source, count: SEARCH_PAGE_SIZE, pages: nextPage })
      searchResults.value = mapHits(hits)
      searchHasMore.value = hits.length >= SEARCH_PAGE_SIZE
      const first = searchResults.value[0]
      if (first) void ensureArtwork(first)
      await hydrate(searchResults.value)
      if (searchResults.value.length) {
        statusMessage.value = `第 ${nextPage} 页找到 ${searchResults.value.length} 首与「${query}」相关的曲子`
      } else {
        searchHasMore.value = false
        statusMessage.value = nextPage > 1 ? `「${query}」第 ${nextPage} 页没有更多结果` : `没有找到「${query}」`
      }
    } catch (error) {
      searchError.value = error instanceof Error ? error.message : '搜索失败'
      statusMessage.value = searchError.value
    } finally {
      isSearching.value = false
    }
  }

  function goToSearchPage(page: number) {
    const query = (lastSearchQuery.value || searchTerm.value).trim()
    if (!query || isSearching.value) return
    const nextPage = Math.max(1, Math.floor(page))
    if (nextPage === searchPage.value) return
    if (nextPage > searchPage.value && !searchHasMore.value) return
    void runSearch(query, searchSource.value, nextPage)
  }

  async function loadDiscover() {
    isDiscovering.value = true
    discoverError.value = ''
    statusMessage.value = '正在连接 GD音乐台…'
    try {
      const hits = await requestSearch(discoverQuery, { count: 12 })
      discoverTracks.value = mapHits(hits)
      await hydrate(discoverTracks.value)
      if (!queue.value.length) queue.value = discoverTracks.value
      statusMessage.value = '曲库来源 GD音乐台 music.gdstudio.xyz'
    } catch (error) {
      discoverError.value = error instanceof Error ? error.message : '发现页加载失败'
      statusMessage.value = discoverError.value
    } finally {
      isDiscovering.value = false
    }
  }

  function openStation(station: Playlist | Collection) {
    searchTerm.value = station.query
    setView('search')
    void runSearch(station.query).then(() => {
      if (searchResults.value.length) playAll(searchResults.value)
    })
  }

  function openAlbum(album: Album) {
    searchTerm.value = album.query
    setView('search')
    void runSearch(album.query, 'netease_album')
  }

  function updateSearchTerm(value: string) {
    searchTerm.value = value
    if (searchTimer) window.clearTimeout(searchTimer)
    const keyword = value.trim()
    if (!keyword) return
    searchTimer = window.setTimeout(() => {
      if (activeView.value !== 'search') setView('search')
      void runSearch(keyword)
    }, 500)
  }

  function onKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
    if (event.code === 'Space') {
      event.preventDefault()
      togglePlay()
    }
  }

  onMounted(() => {
    likedTracks.value = readStore<Track[]>(LIKED_STORAGE_KEY, []).map((track) => ({
      ...emptyTrack,
      ...track,
      lyrics: track.lyrics ?? [],
    }))
    recentTracks.value = readStore<Track[]>(RECENT_STORAGE_KEY, []).map((track) => ({
      ...emptyTrack,
      ...track,
      lyrics: track.lyrics ?? [],
    }))
    void loadDiscover()
    window.addEventListener('keydown', onKeydown)
  })

  onBeforeUnmount(() => {
    if (searchTimer) window.clearTimeout(searchTimer)
    window.removeEventListener('keydown', onKeydown)
    audio?.pause()
    audio = null
  })

  return {
    activeView,
    albums,
    collections,
    currentLyric,
    currentTrack,
    discoverError,
    discoverTracks,
    formattedProgress,
    goToSearchPage,
    isBuffering,
    isDiscovering,
    isLoopOne,
    isPlaying,
    isSearching,
    isShuffle,
    likedTracks,
    playlists,
    progress,
    recentTracks,
    sceneArt,
    searchError,
    searchHasMore,
    searchPage,
    searchPageSize: SEARCH_PAGE_SIZE,
    searchResults,
    searchTerm,
    statusMessage,
    volume,
    loadDiscover,
    nextTrack,
    openAlbum,
    openStation,
    playAll,
    playFromList,
    playTrackById,
    previousTrack,
    seek,
    setView,
    setVolume,
    toggleLike,
    toggleLoop,
    togglePlay,
    toggleShuffle,
    updateSearchTerm,
  }
}
