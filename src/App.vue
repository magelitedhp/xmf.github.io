<template>
  <div class="music-shell" :class="{ 'is-focus': activeView === 'playing' }">
    <AppSidebar :active-view="activeView" @update:view="setView" />

    <main class="workspace">
      <TopBar v-model:search-term="searchTerm" />

      <DiscoverView
        v-if="activeView === 'discover'"
        :tracks="filteredTracks"
        :playlists="playlists"
        :albums="albums"
        :collections="collections"
        :current-id="currentTrack.id"
        @play="playTrackById"
        @play-all="playAll"
      />

      <SearchView
        v-else-if="activeView === 'search'"
        :tracks="filteredTracks"
        :current-id="currentTrack.id"
        @play="playTrackById"
        @play-all="playAll"
      />

      <LibraryView
        v-else-if="activeView === 'library'"
        :recent-tracks="tracks"
        :liked-tracks="likedTracks"
        :current-id="currentTrack.id"
        @play="playTrackById"
      />

      <PlayingView
        v-else
        :track="currentTrack"
        :progress="progress"
        :progress-text="formattedProgress"
        :is-playing="isPlaying"
        @seek="seek"
        @like="toggleLike"
      />
    </main>

    <PlayerBar
      :track="currentTrack"
      :progress="progress"
      :progress-text="formattedProgress"
      :volume="volume"
      :is-playing="isPlaying"
      @open-playing="setView('playing')"
      @previous="previousTrack"
      @next="nextTrack"
      @toggle="togglePlay"
      @seek="seek"
      @volume="setVolume"
      @like="toggleLike"
    />
  </div>
</template>

<script setup lang="ts">
import AppSidebar from './components/music/AppSidebar.vue'
import DiscoverView from './components/music/views/DiscoverView.vue'
import LibraryView from './components/music/views/LibraryView.vue'
import PlayingView from './components/music/views/PlayingView.vue'
import SearchView from './components/music/views/SearchView.vue'
import PlayerBar from './components/music/PlayerBar.vue'
import TopBar from './components/music/TopBar.vue'
import { albums, collections, playlists } from './data/music'
import { usePlayer } from './composables/usePlayer'

const {
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
} = usePlayer()
</script>
