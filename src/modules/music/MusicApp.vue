<template>
  <div
    class="music-shell"
    :class="{ 'is-focus': activeView === 'playing' }"
    :style="sceneStyle"
  >
    <div class="night-scene" aria-hidden="true">
      <div class="scene-art"></div>
      <div class="scene-scrim"></div>
      <div class="light-well light-well-moon"></div>
      <div class="light-well light-well-steel"></div>
      <div class="light-well light-well-gold"></div>
    </div>
    <div class="vignette" aria-hidden="true"></div>
    <div class="film-grain" aria-hidden="true"></div>

    <AppSidebar :active-view="activeView" @update:view="setView" />

    <main class="workspace">
      <TopBar :search-term="searchTerm" :status="statusMessage" :busy="isSearching || isDiscovering || isBuffering" @update:search-term="updateSearchTerm" />

      <DiscoverView
        v-if="activeView === 'discover'"
        :tracks="discoverTracks"
        :playlists="playlists"
        :albums="albums"
        :collections="collections"
        :current-id="currentTrack.uid"
        :loading="isDiscovering"
        :error="discoverError"
        @play="playDiscoverTrack"
        @play-all="playAll(discoverTracks)"
        @open-station="openStation"
        @open-album="openAlbum"
        @retry="loadDiscover"
      />

      <SearchView
        v-else-if="activeView === 'search'"
        :tracks="searchResults"
        :query="searchTerm"
        :current-id="currentTrack.uid"
        :loading="isSearching"
        :error="searchError"
        :page="searchPage"
        :page-size="searchPageSize"
        :has-more="searchHasMore"
        @play="playSearchTrack"
        @play-all="playAll(searchResults)"
        @page-change="goToSearchPage"
      />

      <LibraryView
        v-else-if="activeView === 'library'"
        :recent-tracks="recentTracks"
        :liked-tracks="likedTracks"
        :current-id="currentTrack.uid"
        @play-recent="playRecentTrack"
        @play-liked="playLikedTrack"
      />

      <PlayingView
        v-else
        :track="currentTrack"
        :progress="progress"
        :progress-text="formattedProgress"
        :current-lyric="currentLyric"
        :is-playing="isPlaying"
        @seek="seek"
        @like="toggleLike()"
      />
    </main>

    <PlayerBar
      :track="currentTrack"
      :progress="progress"
      :progress-text="formattedProgress"
      :volume="volume"
      :is-playing="isPlaying"
      :is-buffering="isBuffering"
      :is-shuffle="isShuffle"
      :is-loop-one="isLoopOne"
      @open-playing="setView('playing')"
      @previous="previousTrack"
      @next="nextTrack"
      @toggle="togglePlay"
      @seek="seek"
      @volume="setVolume"
      @like="toggleLike()"
      @shuffle="toggleShuffle"
      @loop="toggleLoop"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppSidebar from './components/AppSidebar.vue'
import DiscoverView from './components/views/DiscoverView.vue'
import LibraryView from './components/views/LibraryView.vue'
import PlayingView from './components/views/PlayingView.vue'
import SearchView from './components/views/SearchView.vue'
import PlayerBar from './components/PlayerBar.vue'
import TopBar from './components/TopBar.vue'
import { usePlayer } from './composables/usePlayer'

const {
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
  searchPageSize,
  searchResults,
  searchTerm,
  statusMessage,
  volume,
  loadDiscover,
  nextTrack,
  openAlbum,
  openStation,
  playAll,
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
} = usePlayer()

const sceneStyle = computed(() => {
  const art = sceneArt.value ? `url("${sceneArt.value}")` : 'none'
  return { '--scene-art': art } as Record<string, string>
})

function playDiscoverTrack(uid: string) {
  playTrackById(uid, discoverTracks.value)
}

function playSearchTrack(uid: string) {
  playTrackById(uid, searchResults.value)
}

function playRecentTrack(uid: string) {
  playTrackById(uid, recentTracks.value)
}

function playLikedTrack(uid: string) {
  playTrackById(uid, likedTracks.value)
}
</script>
