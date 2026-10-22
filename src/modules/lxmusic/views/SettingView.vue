<template>
  <div class="lx-page">
    <div class="lx-page-head">
      <h1 class="lx-page-title">设置</h1>
      <span class="lx-page-sub">所有设置都会保存在本地</span>
      <button type="button" class="lx-btn" @click="onResetAll">恢复默认</button>
    </div>

    <div class="lx-setting-layout">
      <nav class="lx-setting-nav">
        <button
          v-for="group in groups"
          :key="group.id"
          type="button"
          :class="{ 'is-active': activeGroup === group.id, 'is-pressing': pressedSetting === group.id }"
          @click="selectGroup(group.id)"
          @pointerdown="pressedSetting = group.id"
          @pointerup="pressedSetting = ''"
          @pointercancel="pressedSetting = ''"
          @pointerleave="pressedSetting = ''"
        >
          <i v-if="activeGroup === group.id" class="lx-setting-mark" aria-hidden="true" />
          {{ group.name }}
        </button>
      </nav>

      <section class="lx-setting-panel">
        <h3>{{ activeGroupName }}</h3>

        <!-- 基本设置 -->
        <div v-if="activeGroup === 'common'" class="lx-setting-group">
          <div class="lx-field">
            <span class="lx-field-label">控制按钮位置</span>
            <div class="lx-field-control">
              <label class="lx-checkbox"><input v-model="appSetting['common.controlBtnPosition']" type="radio" value="left">左侧</label>
              <label class="lx-checkbox"><input v-model="appSetting['common.controlBtnPosition']" type="radio" value="right">右侧</label>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">播放栏进度条</span>
            <div class="lx-field-control">
              <select v-model="appSetting['common.playBarProgressStyle']" class="lx-select">
                <option value="full">顶部通栏</option>
                <option value="middle">跟随播放栏</option>
                <option value="mini">迷你</option>
              </select>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">界面动画</span>
            <div class="lx-field-control">
              <label class="lx-checkbox"><input v-model="appSetting['common.animation']" type="checkbox">启用过渡动画</label>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">界面字号</span>
            <div class="lx-field-control">
              <input v-model.number="appSetting['common.fontSize']" class="lx-range" type="range" min="12" max="18" step="1">
              <span class="lx-field-tip">{{ appSetting['common.fontSize'] }}px</span>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">启动时打开播放详情</span>
            <div class="lx-field-control">
              <label class="lx-checkbox"><input v-model="appSetting['common.startInFullscreen']" type="checkbox">进入音乐模块即沉浸</label>
            </div>
          </div>
        </div>

        <!-- 播放设置 -->
        <div v-else-if="activeGroup === 'player'" class="lx-setting-group">
          <div class="lx-field">
            <span class="lx-field-label">播放模式</span>
            <div class="lx-field-control">
              <select v-model="appSetting['player.playMode']" class="lx-select">
                <option value="list">列表循环</option>
                <option value="single">单曲循环</option>
                <option value="random">随机播放</option>
              </select>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">音质</span>
            <div class="lx-field-control">
              <select v-model.number="appSetting['player.bitrate']" class="lx-select">
                <option v-for="br in BITRATES" :key="br" :value="br">{{ BITRATE_LABEL[br] }}</option>
              </select>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">音量</span>
            <div class="lx-field-control">
              <input class="lx-range" type="range" min="0" max="100" :value="Math.round(appSetting['player.volume'] * 100)" @input="onVolume">
              <span class="lx-field-tip">{{ Math.round(appSetting['player.volume'] * 100) }}%</span>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">播放倍速</span>
            <div class="lx-field-control">
              <select :value="appSetting['player.playbackRate']" class="lx-select" @change="onRate">
                <option v-for="rate in RATES" :key="rate" :value="rate">{{ rate }}x</option>
              </select>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">自动播放</span>
            <div class="lx-field-control">
              <label class="lx-checkbox"><input v-model="appSetting['player.autoPlay']" type="checkbox">选中后立即播放</label>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">音频可视化</span>
            <div class="lx-field-control">
              <label class="lx-checkbox"><input v-model="appSetting['player.audioVisualization']" type="checkbox">启用频谱分析</label>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">歌词翻译 / 音译</span>
            <div class="lx-field-control">
              <label class="lx-checkbox"><input v-model="appSetting['lyric.isShowLyricTranslation']" type="checkbox">显示翻译</label>
              <label class="lx-checkbox"><input v-model="appSetting['lyric.isShowLyricRoma']" type="checkbox">显示音译</label>
            </div>
          </div>
        </div>

        <!-- 歌词设置 -->
        <div v-else-if="activeGroup === 'lyric'" class="lx-setting-group">
          <div class="lx-field">
            <span class="lx-field-label">桌面歌词</span>
            <div class="lx-field-control">
              <label class="lx-checkbox"><input v-model="appSetting['lyric.enableDesktopLyric']" type="checkbox">启用桌面歌词</label>
              <span class="lx-field-tip">浏览器环境下以悬浮歌词条呈现</span>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">歌词字号</span>
            <div class="lx-field-control">
              <input v-model.number="appSetting['lyric.fontSize']" class="lx-range" type="range" min="14" max="40" step="1">
              <span class="lx-field-tip">{{ appSetting['lyric.fontSize'] }}px</span>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">歌词字重</span>
            <div class="lx-field-control">
              <input v-model.number="appSetting['lyric.fontWeight']" class="lx-range" type="range" min="300" max="900" step="100">
              <span class="lx-field-tip">{{ appSetting['lyric.fontWeight'] }}</span>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">歌词对齐</span>
            <div class="lx-field-control">
              <select v-model="appSetting['lyric.scrollAlign']" class="lx-select">
                <option value="top">顶部</option>
                <option value="center">居中</option>
                <option value="bottom">底部</option>
              </select>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">歌词样式</span>
            <div class="lx-field-control">
              <select v-model="appSetting['lyric.style']" class="lx-select">
                <option value="font">字体</option>
                <option value="outline">描边</option>
                <option value="shadow">阴影</option>
              </select>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">歌词颜色</span>
            <div class="lx-field-control">
              <input v-model="appSetting['lyric.color']" class="lx-select" type="color">
              <input v-model="appSetting['lyric.shadowColor']" class="lx-select" type="color">
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">歌词动画</span>
            <div class="lx-field-control">
              <label class="lx-checkbox"><input v-model="appSetting['lyric.animation']" type="checkbox">逐字动画</label>
              <label class="lx-checkbox"><input v-model="appSetting['lyric.showLyricProgress']" type="checkbox">显示进度</label>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">桌面歌词排版</span>
            <div class="lx-field-control">
              <label class="lx-checkbox"><input v-model="appSetting['lyric.singleLine']" type="checkbox">单行模式</label>
              <label class="lx-checkbox"><input v-model="appSetting['lyric.isLockDesktopLyric']" type="checkbox">锁定位置</label>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">歌词偏移</span>
            <div class="lx-field-control">
              <input
                class="lx-range"
                type="range"
                min="-5"
                max="5"
                step="0.5"
                :value="appSetting['lyric.offset']"
                @input="onLyricOffset"
              >
              <span class="lx-field-tip">{{ appSetting['lyric.offset'] > 0 ? '+' : '' }}{{ appSetting['lyric.offset'].toFixed(1) }}s</span>
            </div>
          </div>
        </div>

        <!-- 下载设置 -->
        <div v-else-if="activeGroup === 'download'" class="lx-setting-group">
          <div class="lx-field">
            <span class="lx-field-label">启用下载</span>
            <div class="lx-field-control">
              <label class="lx-checkbox"><input v-model="appSetting['download.enable']" type="checkbox">在侧栏显示下载入口</label>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">文件命名</span>
            <div class="lx-field-control">
              <input v-model="appSetting['download.fileName']" class="lx-select" type="text">
              <span class="lx-field-tip">可用：歌名 / 歌手 / 专辑 / 音源</span>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">同时下载数</span>
            <div class="lx-field-control">
              <input v-model.number="appSetting['download.maxDownloadNum']" class="lx-range" type="range" min="1" max="6" step="1">
              <span class="lx-field-tip">{{ appSetting['download.maxDownloadNum'] }}</span>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">同时下载歌词</span>
            <div class="lx-field-control">
              <label class="lx-checkbox"><input v-model="appSetting['download.isDownloadLrc']" type="checkbox">下载 .lrc 文件</label>
            </div>
          </div>
        </div>

        <!-- 列表设置 -->
        <div v-else-if="activeGroup === 'list'" class="lx-setting-group">
          <div class="lx-field">
            <span class="lx-field-label">单击播放</span>
            <div class="lx-field-control">
              <label class="lx-checkbox"><input v-model="appSetting['list.isClickPlay']" type="checkbox">单击列表项即播放</label>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">显示音源</span>
            <div class="lx-field-control">
              <label class="lx-checkbox"><input v-model="appSetting['list.isShowSource']" type="checkbox">在列表中显示音源列</label>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">添加位置</span>
            <div class="lx-field-control">
              <select v-model="appSetting['list.addMusicLocationType']" class="lx-select">
                <option value="top">添加到顶部</option>
                <option value="bottom">添加到底部</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 搜索设置 -->
        <div v-else-if="activeGroup === 'search'" class="lx-setting-group">
          <div class="lx-field">
            <span class="lx-field-label">热门搜索</span>
            <div class="lx-field-control">
              <label class="lx-checkbox"><input v-model="appSetting['search.isShowHotSearch']" type="checkbox">显示热门搜索</label>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">搜索历史</span>
            <div class="lx-field-control">
              <label class="lx-checkbox"><input v-model="appSetting['search.isShowHistorySearch']" type="checkbox">显示搜索历史</label>
              <button type="button" class="lx-btn is-small" @click="clearSearchHistory()">清空历史</button>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">进入自动聚焦</span>
            <div class="lx-field-control">
              <label class="lx-checkbox"><input v-model="appSetting['search.isFocusSearchBox']" type="checkbox">自动聚焦搜索框</label>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">可用音源</span>
            <div class="lx-field-control lx-field-wrap">
              <label v-for="source in MUSIC_SOURCES" :key="source.id" class="lx-checkbox">
                <input type="checkbox" :checked="appSetting['search.searchSourceList'].includes(source.id)" @change="toggleSource(source.id)">
                {{ source.name }}
              </label>
            </div>
          </div>
        </div>

        <!-- 主题设置 -->
        <div v-else-if="activeGroup === 'theme'" class="lx-setting-group">
          <div class="lx-field">
            <span class="lx-field-label">主题</span>
            <div class="lx-field-control">
              <select v-model="appSetting['theme.id']" class="lx-select">
                <option value="auto">跟随系统</option>
                <option value="light">浅色</option>
                <option value="dark">深色</option>
                <option value="cover">跟随封面</option>
              </select>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">浅色模式</span>
            <div class="lx-field-control">
              <label class="lx-checkbox"><input v-model="appSetting['theme.light']" type="checkbox">使用浅色界面</label>
            </div>
          </div>
        </div>

        <!-- 视觉设置 -->
        <div v-else-if="activeGroup === 'visualizer'" class="lx-setting-group">
          <div class="lx-field">
            <span class="lx-field-label">可视化模式</span>
            <div class="lx-field-control">
              <select v-model="appSetting['visualizer.mode']" class="lx-select">
                <option v-for="mode in VISUALIZER_MODES" :key="mode" :value="mode">
                  {{ VISUALIZER_MODE_LABELS[mode] }}
                </option>
              </select>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">动画强度</span>
            <div class="lx-field-control">
              <select v-model="appSetting['visualizer.animationIntensity']" class="lx-select">
                <option value="calm">舒缓</option>
                <option value="normal">标准</option>
                <option value="chaotic">强烈</option>
              </select>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">舞台歌词大小</span>
            <div class="lx-field-control">
              <input v-model.number="appSetting['visualizer.lyricsFontScale']" class="lx-range" type="range" min="0.7" max="1.4" step="0.05">
              <span class="lx-field-tip">{{ Math.round(appSetting['visualizer.lyricsFontScale'] * 100) }}%</span>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">背景</span>
            <div class="lx-field-control">
              <select v-model="appSetting['visualizer.background']" class="lx-select">
                <option v-for="mode in VISUALIZER_BACKGROUND_MODES" :key="mode" :value="mode">
                  {{ VISUALIZER_BACKGROUND_LABELS[mode] }}
                </option>
              </select>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">背景不透明度</span>
            <div class="lx-field-control">
              <input v-model.number="appSetting['visualizer.backgroundOpacity']" class="lx-range" type="range" min="0" max="1" step="0.05">
              <span class="lx-field-tip">{{ Math.round(appSetting['visualizer.backgroundOpacity'] * 100) }}%</span>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">封面取色</span>
            <div class="lx-field-control">
              <label class="lx-checkbox"><input v-model="appSetting['visualizer.useCoverColor']" type="checkbox">用封面颜色生成主题</label>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">显示开关</span>
            <div class="lx-field-control">
              <label class="lx-checkbox"><input v-model="appSetting['visualizer.disableGeometric']" type="checkbox">隐藏几何层</label>
              <label class="lx-checkbox"><input v-model="appSetting['visualizer.disableVignette']" type="checkbox">隐藏暗角</label>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">模式参数</span>
            <div class="lx-field-control">
              <label class="lx-checkbox"><input v-model="appSetting['visualizer.showGuideLines']" type="checkbox">云阶引导线</label>
              <label class="lx-checkbox"><input v-model="appSetting['visualizer.showPrintSymbols']" type="checkbox">烟岚印章</label>
            </div>
          </div>
          <div class="lx-field">
            <span class="lx-field-label">字幕</span>
            <div class="lx-field-control">
              <select v-model="appSetting['visualizer.subtitleContentMode']" class="lx-select">
                <option value="translation">翻译</option>
                <option value="romanization">罗马音</option>
                <option value="both">罗马音 + 翻译</option>
                <option value="none">关闭</option>
              </select>
              <label class="lx-checkbox"><input v-model="appSetting['visualizer.showUpcoming']" type="checkbox">显示下一句</label>
            </div>
          </div>
        </div>

        <!-- 快捷键 -->
        <div v-else class="lx-setting-group">
          <div class="lx-field">
            <span class="lx-field-label">启用快捷键</span>
            <div class="lx-field-control">
              <label class="lx-checkbox"><input v-model="appSetting['hotKey.enable']" type="checkbox">允许全局快捷键</label>
            </div>
          </div>
          <div class="lx-key-list">
            <div v-for="key in hotKeyList" :key="key.id" class="lx-key-row">
              <span>{{ key.label }}</span>
              <span>{{ key.keys }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { BITRATE_LABEL, BITRATES, MUSIC_SOURCES } from '../core/api'
import { hotKeyList } from '../core/hotkeys'
import player from '../core/player'
import {
  appSetting,
  clearSearchHistory,
  resetAllSettings,
  VISUALIZER_BACKGROUND_LABELS,
  VISUALIZER_BACKGROUND_MODES,
  VISUALIZER_MODE_LABELS,
  VISUALIZER_MODES,
} from '../core/settings'
import { toast } from '../core/ui'

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2]

const groups = [
  { id: 'common', name: '基本设置' },
  { id: 'player', name: '播放设置' },
  { id: 'lyric', name: '歌词设置' },
  { id: 'download', name: '下载设置' },
  { id: 'list', name: '列表设置' },
  { id: 'search', name: '搜索设置' },
  { id: 'theme', name: '主题设置' },
  { id: 'visualizer', name: '视觉设置' },
  { id: 'hotKey', name: '快捷键' },
] as const

const activeGroup = ref<(typeof groups)[number]['id']>('common')
const pressedSetting = ref('')
const activeGroupName = computed(() => groups.find((group) => group.id === activeGroup.value)?.name ?? '设置')

function selectGroup(id: (typeof groups)[number]['id']) {
  activeGroup.value = id
}

function onVolume(event: Event) {
  const value = Number((event.target as HTMLInputElement).value) / 100
  appSetting['player.volume'] = value
  player.setVolume(value)
}

function onRate(event: Event) {
  const rate = Number((event.target as HTMLSelectElement).value)
  appSetting['player.playbackRate'] = rate
  player.setPlaybackRate(rate)
}

function onLyricOffset(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  appSetting['lyric.offset'] = value
  player.setLyricOffset(value)
}

function toggleSource(id: string) {
  const list = appSetting['search.searchSourceList']
  const index = list.indexOf(id)
  if (index >= 0) list.splice(index, 1)
  else list.push(id)
}

function onResetAll() {
  if (!window.confirm('确定恢复所有设置为默认值吗？')) return
  resetAllSettings()
  player.setVolume(appSetting['player.volume'])
  player.setPlaybackRate(appSetting['player.playbackRate'])
  player.setPlayMode(appSetting['player.playMode'])
  toast('已恢复默认设置')
}
</script>

<style>
.lx-field-wrap {
  flex-wrap: wrap;
  gap: 8px 16px;
}
</style>
