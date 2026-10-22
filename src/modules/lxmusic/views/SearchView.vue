<template>
  <div class="lx-page lx-search-page">
    <div class="lx-search-toolbar">
      <div class="lx-segmented is-source" role="tablist" aria-label="搜索音源">
        <button
          v-for="source in availableSources"
          :key="source.id"
          type="button"
          role="tab"
          :aria-selected="searchState.source === source.id"
          :class="{ 'is-active': searchState.source === source.id }"
          @click="selectSource(source.id)"
        >
          {{ source.name }}
        </button>
      </div>
      <div class="lx-segmented is-type" role="tablist" aria-label="搜索类型">
        <button
          v-for="type in searchTypes"
          :key="type.id"
          type="button"
          role="tab"
          :aria-selected="searchType === type.id"
          :class="{ 'is-active': searchType === type.id }"
          @click="selectType(type.id)"
        >
          {{ type.label }}
        </button>
      </div>
    </div>

    <div v-if="!searchState.text" class="lx-search-blank">
      <section class="lx-discover-hero">
        <div class="lx-discover-copy">
          <span class="lx-discover-kicker">DISCOVER / 发现音乐</span>
          <h2>今天想听点什么？</h2>
          <p>从热门搜索、精选歌单与排行榜开始，找到下一首循环播放的歌。</p>
        </div>
        <div class="lx-discover-stats" aria-label="音乐库概览">
          <span><b>{{ availableSources.length }}</b> 个音源</span>
          <span><b>{{ songLists.length }}</b> 个歌单</span>
          <span><b>每日</b> 更新推荐</span>
        </div>
      </section>

      <section v-if="appSetting['search.isShowHotSearch']" class="lx-discover-section">
        <h3>热门搜索</h3>
        <div class="lx-search-chips">
          <button v-for="word in hotSearchKeywords" :key="word" type="button" @click="quickSearch(word)">
            {{ word }}
          </button>
        </div>
      </section>
      <section v-if="appSetting['search.isShowHistorySearch'] && appSetting['search.history'].length" class="lx-discover-section">
        <h3>
          <span>搜索历史</span>
          <button type="button" class="lx-search-clear" aria-label="清空搜索历史" title="清空搜索历史" @click="clearSearchHistory()">
            <LxIcon name="clear" />
          </button>
        </h3>
        <div class="lx-search-chips">
          <button
            v-for="word in appSetting['search.history']"
            :key="word"
            type="button"
            @contextmenu.prevent="removeHistoryWord(word)"
            @click="quickSearch(word)"
          >
            {{ word }}
          </button>
        </div>
      </section>

      <section class="lx-discover-section">
        <h3>
          <span>精选歌单</span>
          <button type="button" class="lx-section-more" @click="selectType('songlist')">
            查看全部
            <LxIcon name="next" />
          </button>
        </h3>
        <div class="lx-discover-grid">
          <button
            v-for="playlist in featuredLists"
            :key="playlist.id"
            type="button"
            class="lx-discover-card"
            @click="openPlaylist(playlist.id)"
          >
            <span class="lx-discover-art" :style="{ '--tint': playlist.tint }">
              <i>{{ playlist.name.slice(0, 1) }}</i>
              <LxIcon name="play" />
            </span>
            <span class="lx-discover-card-copy">
              <strong class="lx-ellipsis">{{ playlist.name }}</strong>
              <small class="lx-ellipsis">{{ playlist.description }}</small>
              <em>{{ playlist.playCount }} 次播放</em>
            </span>
          </button>
        </div>
      </section>
    </div>

    <div v-else class="lx-search-results">
      <p v-if="isLoading && !searchState.list.length" class="lx-search-state">正在搜索…</p>
      <p v-else-if="searchState.error" class="lx-search-state is-error">{{ searchState.error }}</p>

      <LxMusicList
        v-if="searchType === 'music'"
        :list="searchState.list"
        :current-id="currentId"
        :loved-ids="lovedIds"
        :start-index="0"
        empty-title="没有找到相关歌曲"
        empty-text="换一个关键词或音源试试。"
        @play="play"
        @love="toggleLoveWithToast"
        @add="promptAddToList"
        @download="downloadMusic"
        @copy="copyMusicName"
        @action="onListAction"
      />

      <div v-else class="lx-search-playlists">
        <button
          v-for="playlist in searchPlaylists"
          :key="playlist.id"
          type="button"
          class="lx-search-playlist"
          @click="openPlaylist(playlist.id)"
        >
          <span class="lx-search-playlist-art" :style="{ background: playlist.tint }">{{ playlist.name.slice(0, 1) }}</span>
          <span class="lx-search-playlist-copy">
            <strong class="lx-ellipsis">{{ playlist.name }}</strong>
            <small class="lx-ellipsis">{{ playlist.author }} · {{ playlist.playCount }}</small>
          </span>
        </button>
      </div>

      <div v-if="searchType === 'music' && searchState.list.length" class="lx-load-more">
        <button type="button" class="lx-btn" :disabled="isLoading" @click="loadMore">
          {{ searchState.hasMore ? '加载更多' : '没有更多了' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LxIcon from '../components/LxIcon.vue'
import LxMusicList from '../components/LxMusicList.vue'
import { MUSIC_SOURCES, type MusicItem } from '../core/api'
import { hotSearchKeywords, songLists } from '../core/discover'
import { appSetting, clearSearchHistory } from '../core/settings'
import { PAGE_SIZE, runSearch, searchState, setSearchSource } from '../core/search'
import { copyMusicName, downloadMusic, playFromList, promptAddToList, toggleLoveWithToast } from '../core/actions'
import player from '../core/player'
import { LIST_IDS, addMusicToList, isLoved } from '../core/lists'
import { toast } from '../core/ui'

const route = useRoute()
const router = useRouter()
const searchType = ref<'music' | 'songlist'>(route.query.type === 'songlist' ? 'songlist' : 'music')

const isLoading = computed(() => searchState.isLoading)
const currentId = computed(() => player.currentMusic.value.id)
const lovedIds = computed(() => searchState.list.filter((item) => isLoved(item)).map((item) => item.id))

const availableSources = computed(() => {
  const enabled = appSetting['search.searchSourceList']
  const list = MUSIC_SOURCES.filter((source) => !enabled.length || enabled.includes(source.id))
  return list.length ? list : MUSIC_SOURCES
})

const searchTypes = [
  { id: 'music', label: '歌曲' },
  { id: 'songlist', label: '歌单' },
] as const

const searchPlaylists = computed(() => {
  const keyword = searchState.text.trim().toLowerCase()
  if (!keyword) return songLists
  return songLists.filter((item) =>
    [item.name, item.author, item.description, item.query].some((text) => text.toLowerCase().includes(keyword)),
  )
})
const featuredLists = computed(() => songLists.slice(0, 6))

function play(music: MusicItem) {
  playFromList(searchState.list, music, LIST_IDS.DEFAULT)
}

function selectSource(source: string) {
  setSearchSource(source)
  if (searchState.text) void runSearch({ source: searchState.source, page: 1 })
}

function selectType(type: 'music' | 'songlist') {
  searchType.value = type
  void router.replace({ path: route.path, query: { ...route.query, type } })
}

function quickSearch(word: string) {
  if (route.path === '/lxmusic/search' && route.query.text === word) {
    void runSearch({ keyword: word, source: searchState.source, page: 1 })
    return
  }
  void router.push({ path: '/lxmusic/search', query: { text: word } })
}

function openPlaylist(id: string) {
  void router.push(`/lxmusic/songList/${id}`)
}

function removeHistoryWord(word: string) {
  appSetting['search.history'] = appSetting['search.history'].filter((item) => item !== word)
}

function onListAction(action: string, music: MusicItem) {
  if (action !== 'playLater') return
  addMusicToList(LIST_IDS.PLAY_LATER, music, 'bottom')
  toast('已添加到稍后播放')
}

function loadMore() {
  if (!searchState.hasMore || isLoading.value) return
  void runSearch({ source: searchState.source, page: searchState.page + 1, append: true })
}

async function syncFromRoute() {
  const text = typeof route.query.text === 'string' ? route.query.text : ''
  searchType.value = route.query.type === 'songlist' ? 'songlist' : 'music'
  if (!text) return
  await runSearch({ keyword: text, source: searchState.source, page: 1 })
}

watch(() => route.query.text, () => void syncFromRoute())
onMounted(() => void syncFromRoute())
</script>

<style>
.lx-search-page {
  display: flex;
  flex-direction: column;
  padding: 0;
}

.lx-search-toolbar {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 58px;
  padding: 0 22px;
  border-bottom: 1px solid var(--lx-border);
}

.lx-segmented {
  display: flex;
  align-items: center;
  gap: 3px;
}

.lx-segmented button {
  position: relative;
  padding: 9px 13px;
  color: var(--lx-font-label);
  font-size: 14px;
  font-weight: 500;
  transition: color var(--lx-transition-fast);
}

.lx-segmented button::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 2px;
  width: 0;
  height: 2px;
  border-radius: 2px;
  background: var(--lx-primary);
  transform: translateX(-50%);
  transition: width var(--lx-transition-fast);
}

.lx-segmented button:hover {
  color: var(--lx-font);
}

.lx-segmented button.is-active {
  color: var(--lx-primary);
  font-weight: 650;
}

.lx-segmented button.is-active::after {
  width: 18px;
}

.lx-segmented.is-type {
  flex: none;
}

.lx-search-blank {
  flex: auto;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 22px 34px;
}

.lx-discover-hero {
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;
  min-height: 210px;
  overflow: hidden;
  padding: 34px 36px;
  border: 1px solid #cfe1d6;
  border-radius: 20px;
  background:
    radial-gradient(circle at 85% 20%, rgba(255, 255, 255, 0.72), transparent 30%),
    linear-gradient(120deg, #dbeee2 0%, #eef6ef 52%, #dce9f5 100%);
}

.lx-discover-hero::after {
  content: '';
  position: absolute;
  z-index: -1;
  right: -30px;
  top: -90px;
  width: 320px;
  height: 320px;
  border: 46px solid rgba(77, 175, 124, 0.13);
  border-radius: 50%;
}

.lx-discover-copy {
  max-width: 560px;
}

.lx-discover-kicker {
  color: var(--lx-primary-dark);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
}

.lx-discover-copy h2 {
  margin-top: 11px;
  color: #1d3227;
  font-size: clamp(28px, 3.6vw, 44px);
  font-weight: 750;
  line-height: 1.22;
  letter-spacing: -0.04em;
}

.lx-discover-copy p {
  max-width: 480px;
  margin-top: 11px;
  color: #5d7165;
  font-size: 14px;
  line-height: 1.8;
}

.lx-discover-stats {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 300px;
}

.lx-discover-stats span {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 8px 11px;
  border: 1px solid rgba(77, 175, 124, 0.2);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.58);
  color: #526a5b;
  font-size: 12px;
  backdrop-filter: blur(10px);
}

.lx-discover-stats b {
  color: var(--lx-primary-dark);
  font-size: 14px;
}

.lx-discover-section {
  margin-top: 28px;
}

.lx-discover-section h3 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 0 0 12px;
  color: var(--lx-font);
  font-size: 18px;
  font-weight: 650;
}

.lx-section-more {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: auto;
  padding: 5px 8px;
  border-radius: 7px;
  color: var(--lx-font-label);
  font-size: 13px;
}

.lx-section-more:hover {
  background: var(--lx-hover);
  color: var(--lx-primary-dark);
}

.lx-section-more svg {
  width: 16px;
  height: 16px;
}

.lx-search-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.lx-search-chips > button {
  max-width: 180px;
  overflow: hidden;
  padding: 9px 14px;
  border: 1px solid #dce8e0;
  border-radius: 999px;
  background: var(--lx-button-background);
  color: var(--lx-button-font);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: background-color var(--lx-transition-fast), border-color var(--lx-transition-fast), color var(--lx-transition-fast);
}

.lx-search-chips > button:hover {
  border-color: var(--lx-primary-light);
  background: var(--lx-content-background);
  color: var(--lx-primary-dark);
}

.lx-search-clear {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: var(--lx-font-muted);
  opacity: 0.55;
}

.lx-search-clear:hover {
  color: var(--lx-primary);
  opacity: 1;
}

.lx-search-clear svg {
  width: 17px;
  height: 17px;
}

.lx-discover-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.lx-discover-card {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 0;
  padding: 11px;
  border: 1px solid #dfe9e3;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.72);
  text-align: left;
  transition: background-color var(--lx-transition-fast), border-color var(--lx-transition-fast), transform var(--lx-transition-fast);
}

.lx-discover-card:hover {
  border-color: #b9d3c4;
  background: #fff;
  transform: translateY(-2px);
}

.lx-discover-art {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  overflow: hidden;
  border-radius: 11px;
  background:
    radial-gradient(circle at 72% 24%, rgba(255, 255, 255, 0.38), transparent 34%),
    var(--tint);
  color: #fff;
  box-shadow: 0 5px 14px rgba(37, 64, 49, 0.17);
}

.lx-discover-art i {
  font-size: 22px;
  font-style: normal;
  font-weight: 700;
}

.lx-discover-art svg {
  position: absolute;
  right: 5px;
  bottom: 5px;
  width: 21px;
  height: 21px;
  padding: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #1c3426;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity var(--lx-transition-fast), transform var(--lx-transition-fast);
}

.lx-discover-card:hover .lx-discover-art svg {
  opacity: 1;
  transform: translateY(0);
}

.lx-discover-card-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.lx-discover-card-copy strong {
  color: var(--lx-font);
  font-size: 14px;
  font-weight: 600;
}

.lx-discover-card-copy small {
  margin-top: 3px;
  color: var(--lx-font-label);
  font-size: 12px;
}

.lx-discover-card-copy em {
  margin-top: 5px;
  color: var(--lx-font-muted);
  font-size: 12px;
  font-style: normal;
}

.lx-search-results {
  flex: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 0 22px 22px;
}

.lx-search-state {
  margin: 0;
  padding: 24px 0;
  color: var(--lx-font-muted);
  font-size: 14px;
}

.lx-search-state.is-error {
  color: #e2564a;
}

.lx-search-playlists {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
  padding-top: 8px;
}

.lx-search-playlist {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border: 1px solid var(--lx-border);
  border-radius: 12px;
  text-align: left;
  transition: background-color var(--lx-transition-fast);
}

.lx-search-playlist:hover {
  border-color: var(--lx-border-strong);
  background: var(--lx-content-background);
}

.lx-search-playlist-art {
  flex: none;
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 9px;
  color: #fff;
  font-size: 21px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16);
}

.lx-search-playlist-copy {
  min-width: 0;
}

.lx-search-playlist-copy strong {
  display: block;
  color: var(--lx-font);
  font-size: 14px;
  font-weight: 600;
}

.lx-search-playlist-copy small {
  display: block;
  margin-top: 5px;
  color: var(--lx-font-muted);
  font-size: 12px;
}

.lx-load-more {
  display: flex;
  justify-content: center;
  padding: 16px 0 4px;
}

@media (max-width: 620px) {
  .lx-search-toolbar {
    align-items: flex-start;
    flex-direction: column;
    gap: 0;
    padding: 0 10px;
  }

  .lx-segmented {
    width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .lx-segmented::-webkit-scrollbar {
    display: none;
  }

  .lx-segmented button {
    flex: none;
    padding: 7px 9px;
  }

  .lx-segmented.is-type {
    justify-content: flex-end;
    border-top: 1px solid var(--lx-border);
  }

  .lx-search-blank {
    padding: 12px 10px 24px;
  }

  .lx-discover-hero {
    align-items: flex-start;
    flex-direction: column;
    gap: 22px;
    min-height: 0;
    padding: 24px 21px;
    border-radius: 16px;
  }

  .lx-discover-stats {
    max-width: none;
  }

  .lx-discover-grid {
    grid-template-columns: 1fr;
  }

  .lx-search-results {
    padding: 0 10px 12px;
  }
}
</style>
