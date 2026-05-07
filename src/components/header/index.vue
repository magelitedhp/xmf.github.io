<template>
  <header class="bili-top-banner">
    <div class="banner-graphic">
      <img
        v-if="!bannerFailed"
        class="bili-banner-img"
        :src="bannerSrc"
        alt=""
        @error="onBannerError"
      />
      <div v-else class="bili-banner-fallback" aria-hidden="true" />
    </div>

    <div class="banner-nav">
      <div class="banner-container">
        <div class="banner-bar left">
          <div v-for="(item, i) in bannerLeftList" :key="'l' + i" class="banner-item">
            <el-icon v-if="item.icon" class="left-nav-ico" :size="17"><component :is="item.icon" /></el-icon>
            <div class="banner-item-text">
              {{ item.title }}
              <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
            </div>
          </div>
        </div>
        <el-input
          v-model="keyword"
          class="banner-search"
          placeholder="bilibili第一个视频"
          clearable
          @keyup.enter="search"
        >
          <template #suffix>
            <el-icon class="el-input__icon" @click="search"><IEpSearch /></el-icon>
          </template>
        </el-input>
        <div class="banner-bar right">
          <el-avatar class="header-avatar" :size="36" :src="avatarUrl" @click="jumpTo" />
          <div v-for="(item, i) in bannerRightList" :key="'r' + i" class="banner-item">
            <el-icon v-if="item.icon" class="right-nav-ico" :size="18"><component :is="item.icon" /></el-icon>
            <div>{{ item.title }}</div>
          </div>
          <div class="upload" @click="jumpContribute">
            <el-icon class="upload-ico" :size="16"><Upload /></el-icon>投稿
          </div>
        </div>
      </div>
    </div>

    <div class="banner-brand" aria-hidden="true">
      <div class="brand-lockup">
        <el-icon class="brand-icon" :size="44"><VideoPlay /></el-icon>
        <span class="brand-text">bilibili</span>
      </div>
    </div>
  </header>
</template>

<script setup>
import {
  VideoPlay,
  Download,
  Trophy,
  Message,
  Share,
  CollectionTag,
  Clock,
  EditPen,
  Upload,
} from '@element-plus/icons-vue'

const keyword = ref('')
const bannerFailed = ref(false)
const bannerSrc = `${import.meta.env.BASE_URL}bili-banner.png`

function onBannerError() {
  bannerFailed.value = true
}

const avatarUrl =
  'https://i0.hdslb.com/bfs/face/member/noface.jpg@96w_96h_1c_1s.webp'

const search = () => {
  const q = (keyword.value || '').trim()
  if (!q) return
  const url = `https://search.bilibili.com/all?keyword=${encodeURIComponent(q)}`
  window.open(url, '_blank')
}

const jumpTo = () => {
  window.open('https://space.bilibili.com/', '_blank')
}

const jumpContribute = () => {
  window.open('https://member.bilibili.com/platform/upload/video/frame', '_blank')
}

const bannerLeftList = ref([
  { title: '首页', icon: VideoPlay },
  { title: '番剧' },
  { title: '直播' },
  { title: '游戏中心' },
  { title: '会员购' },
  { title: '漫画' },
  { title: '赛事' },
  { title: '分机线' },
  { title: '下载客户端', icon: Download, badge: 'New' },
])

const bannerRightList = ref([
  { title: '大会员', icon: Trophy },
  { title: '消息', icon: Message },
  { title: '动态', icon: Share },
  { title: '收藏', icon: CollectionTag },
  { title: '历史', icon: Clock },
  { title: '创作中心', icon: EditPen },
])
</script>

<style lang="scss" scoped>
.bili-top-banner {
  position: relative;
  width: 100%;
  min-width: 1000px;
}

.banner-graphic {
  width: 100%;
  min-height: 155px;
  height: 9.375vw;
  max-height: 240px;
  background: #e3e5e7;
}

.bili-banner-img {
  width: 100%;
  height: 100%;
  min-height: 155px;
  object-fit: cover;
  object-position: center top;
  display: block;
}

.bili-banner-fallback {
  width: 100%;
  height: 100%;
  min-height: 155px;
  background: linear-gradient(125deg, #ffd6e3 0%, #ffe8d1 28%, #c8dcff 58%, #d4c8ff 100%);
}

.banner-nav {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  z-index: 1002;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.banner-container {
  color: #18191c;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  max-width: 2560px;
  margin: 0 auto;
  width: 100%;
  height: 64px;
  box-sizing: border-box;
  font-size: 14px;

  :deep(.banner-search) {
    width: min(480px, 32vw);
    flex: 0 1 480px;
    margin: 0 16px;

    .el-input__wrapper {
      border-radius: 8px;
      background: #f1f2f3;
      box-shadow: none;
      border: 1px solid transparent;
      transition:
        border-color 0.2s,
        background 0.2s;

      &:hover,
      &.is-focus {
        background: #fff;
        border-color: #e3e5e7;
      }
    }
  }

  .banner-bar {
    display: flex;
    align-items: center;
    flex-shrink: 0;

    &.left {
      min-width: 0;
      flex-wrap: wrap;
    }

    .banner-item {
      display: flex;
      align-items: center;
      margin-right: 10px;
      cursor: pointer;
      color: #61666d;
      transition: color 0.2s;
      white-space: nowrap;

      &:hover {
        color: #fb7299;
      }

      .left-nav-ico {
        margin-right: 6px;
        color: #fb7299;
      }

      .banner-item-text {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
    }
  }

  .nav-badge {
    display: inline-block;
    padding: 0 5px;
    height: 16px;
    line-height: 16px;
    font-size: 10px;
    font-weight: 600;
    color: #fff;
    background: #fa9600;
    border-radius: 4px;
    transform: scale(0.95);
  }

  .right {
    .header-avatar {
      margin-right: 14px;
      cursor: pointer;
      flex-shrink: 0;
    }

    .banner-item {
      flex-direction: column;
      margin-right: 12px;
      font-size: 12px;
      line-height: 1.15;
      color: #61666d;

      &:hover {
        color: #fb7299;
      }

      .right-nav-ico {
        margin-right: 0;
        margin-bottom: 3px;
        color: #61666d;
      }

      &:hover .right-nav-ico {
        color: #fb7299;
      }
    }

    .upload {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 8px;
      width: 90px;
      height: 34px;
      border-radius: 8px;
      background: #fb7299;
      color: #fff;
      text-align: center;
      font-size: 14px;
      line-height: 20px;
      cursor: pointer;
      transition:
        background-color 0.25s,
        transform 0.15s;

      &:hover {
        background: #fc8bab;
      }

      &:active {
        transform: scale(0.98);
      }

      .upload-ico {
        margin-right: 6px;
        color: #fff;
      }
    }
  }

  .el-input__icon {
    cursor: pointer;
    color: #9499a0;
  }
}

.banner-brand {
  position: absolute;
  left: 20px;
  bottom: -22px;
  z-index: 1003;
  pointer-events: none;
}

  .brand-lockup {
  display: flex;
  align-items: center;
  gap: 6px;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.12));

  .brand-icon {
    color: #fb7299;
  }

  .brand-text {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: #fb7299;
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei',
      sans-serif;
  }
}
</style>
