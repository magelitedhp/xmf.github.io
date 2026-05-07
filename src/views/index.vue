<template>
  <div class="bili-home">
    <Header />

    <div class="channel-strip">
      <div class="channel-inner">
        <div class="channel-quick">
          <button
            type="button"
            class="quick-pill dynamic"
            :class="{ on: activeQuick === 'dynamic' }"
            @click="activeQuick = 'dynamic'"
          >
            <span class="quick-icon"><el-icon><Plus /></el-icon></span>
            <span class="quick-label">动态</span>
          </button>
          <button
            type="button"
            class="quick-pill hot"
            :class="{ on: activeQuick === 'hot' }"
            @click="activeQuick = 'hot'"
          >
            <span class="quick-icon hot-ico-wrap"><el-icon><TrendCharts /></el-icon></span>
            <span class="quick-label">热门</span>
          </button>
        </div>

        <div class="channel-center">
          <div class="channel-chips">
            <button
              v-for="(name, i) in chipCategories"
              :key="name + i"
              type="button"
              class="channel-chip"
              :class="{ active: activeChip === name }"
              @click="activeChip = name"
            >
              {{ name }}
            </button>
            <el-dropdown trigger="click" placement="bottom-end" popper-class="bili-more-dd">
              <button type="button" class="channel-chip channel-more-btn">
                更多
                <span class="caret">▾</span>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="ex in moreCategories" :key="ex">{{ ex }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <div class="channel-side-grid">
          <a v-for="item in sideEntries" :key="item.name" href="javascript:;" class="side-entry">
            <el-icon v-if="item.elIcon" class="side-el-ico" :size="16"><component :is="item.elIcon" /></el-icon>
            <svg-icon v-else-if="item.svg" :name="item.svg" />
            <span>{{ item.name }}</span>
          </a>
        </div>
      </div>
    </div>

    <div class="home-body">
      <div class="home-inner">
        <main class="home-main">
          <!-- 首屏：左轮播 + 右 2×4 与截图一致 -->
          <section class="hero-panel">
            <div
              class="hero-carousel"
              @mouseenter="pauseCarousel"
              @mouseleave="resumeCarousel"
            >
              <div class="carousel-viewport">
                <div
                  v-for="(slide, i) in carouselSlides"
                  :key="i"
                  class="carousel-slide"
                  :style="{
                    opacity: carouselIndex === i ? 1 : 0,
                    zIndex: carouselIndex === i ? 1 : 0,
                  }"
                >
                  <img :src="slide.img" :alt="slide.title" loading="lazy" />
                  <div class="carousel-mask">
                    <p v-if="slide.sub" class="carousel-sub">{{ slide.sub }}</p>
                    <span class="carousel-title">{{ slide.title }}</span>
                  </div>
                </div>
              </div>
              <div class="carousel-dots">
                <button
                  v-for="(_, i) in carouselSlides"
                  :key="'d' + i"
                  type="button"
                  class="dot"
                  :class="{ on: carouselIndex === i }"
                  @click="goSlide(i)"
                />
              </div>
              <button type="button" class="carousel-nav prev" @click="prevSlide" aria-label="上一张">
                ‹
              </button>
              <button type="button" class="carousel-nav next" @click="nextSlide" aria-label="下一张">
                ›
              </button>
            </div>

            <div class="hero-video-grid">
              <article v-for="v in heroVideos" :key="v.id" class="video-card hero-card">
                <a class="card-cover" href="javascript:;">
                  <img :src="v.cover" :alt="v.title" loading="lazy" />
                  <div class="card-stats-bar">
                    <span class="stats-left">
                      {{ v.plays }}播放 · {{ v.danmu }}弹幕
                    </span>
                    <span class="duration">{{ v.duration }}</span>
                  </div>
                </a>
                <h3 class="card-title">
                  <a href="javascript:;">{{ v.title }}</a>
                </h3>
                <div class="card-meta">
                  <span v-if="v.likeTag" class="like-tag">{{ v.likeTag }}</span>
                  <span class="up"><svg-icon name="user" /> {{ v.author }}</span>
                  <span class="dot">·</span>
                  <span class="time">{{ v.time }}</span>
                </div>
              </article>
            </div>
          </section>

          <section class="feed-block">
            <div class="feed-lower">
              <div class="feed-main-col">
                <div class="feed-head">
                  <div class="feed-tabs">
                    <span
                      v-for="tab in feedTabs"
                      :key="tab"
                      class="feed-tab"
                      :class="{ on: activeFeedTab === tab }"
                      @click="activeFeedTab = tab"
                    >
                      {{ tab }}
                    </span>
                  </div>
                  <div class="feed-sub">
                    <a v-for="s in feedSubLinks" :key="s" href="javascript:;" class="sub-link">{{ s }}</a>
                    <span class="feed-meta">
                      <el-icon class="feed-meta-ico" :size="14"><DataLine /></el-icon>
                      {{ onlineText }}
                    </span>
                  </div>
                  <button type="button" class="refresh-feed hide-on-wide" @click="shuffleVideos">
                    <el-icon :size="14"><Refresh /></el-icon>
                    换一换
                  </button>
                </div>

                <div class="video-grid">
                  <article v-for="v in restVideos" :key="v.id" class="video-card">
                    <a class="card-cover" href="javascript:;">
                      <img :src="v.cover" :alt="v.title" loading="lazy" />
                      <div class="card-stats-bar">
                        <span class="stats-left">{{ v.plays }}播放 · {{ v.danmu }}弹幕</span>
                        <span class="duration">{{ v.duration }}</span>
                      </div>
                    </a>
                    <h3 class="card-title">
                      <a href="javascript:;">{{ v.title }}</a>
                    </h3>
                    <div class="card-meta">
                      <span v-if="v.likeTag" class="like-tag">{{ v.likeTag }}</span>
                      <span class="up"><svg-icon name="user" /> {{ v.author }}</span>
                      <span class="dot">·</span>
                      <span class="time">{{ v.time }}</span>
                    </div>
                  </article>
                </div>
              </div>

              <aside class="home-aside" aria-label="排行榜">
                <div class="rank-card">
                  <div class="rank-tabs">
                    <span
                      v-for="t in rankTabs"
                      :key="t"
                      class="rank-tab"
                      :class="{ on: activeRankTab === t }"
                      @click="activeRankTab = t"
                      >{{ t }}</span
                    >
                  </div>
                  <ol class="rank-list">
                    <li v-for="(item, idx) in rankList" :key="item.id" class="rank-item">
                      <span class="rank-num" :class="rankClass(idx)">{{ idx + 1 }}</span>
                      <a href="javascript:;" class="rank-title">{{ item.title }}</a>
                      <span class="rank-hot">{{ item.score }}</span>
                    </li>
                  </ol>
                  <a href="javascript:;" class="rank-more">查看完整榜单</a>
                </div>
              </aside>
            </div>
          </section>

          <section class="feed-block secondary">
            <div class="feed-head">
              <h2 class="section-title">推广</h2>
              <span class="feed-meta light">广告</span>
            </div>
            <div class="promo-row">
              <a v-for="p in promoList" :key="p.id" href="javascript:;" class="promo-card">
                <img :src="p.cover" :alt="p.title" loading="lazy" />
                <span class="promo-title">{{ p.title }}</span>
              </a>
            </div>
          </section>
        </main>
      </div>
    </div>

    <div class="float-tools" role="toolbar" aria-label="快捷操作">
      <button type="button" class="float-btn" title="换一换" @click="shuffleVideos">
        <el-icon :size="18"><Refresh /></el-icon>
      </button>
      <button type="button" class="float-btn" title="回顶部" @click="scrollTop">
        <el-icon :size="18"><Top /></el-icon>
      </button>
    </div>
  </div>
</template>

<script setup>
import { Plus, TrendCharts, DataLine, Refresh, Top, ChatDotRound } from '@element-plus/icons-vue'
import Header from '@c/header/index.vue'

const activeQuick = ref('hot')
const activeChip = ref('番剧')

const chipCategories = [
  '番剧',
  '国创',
  '综艺',
  '动画',
  '鬼畜',
  '舞蹈',
  '娱乐',
  '科技数码',
  '美食',
  '汽车',
  '体育运动',
  'vlog',
  '电影',
  '电视剧',
  '纪录片',
  '游戏',
  '音乐',
  '影视',
  '知识',
  '资讯',
  '小剧场',
  '时尚美妆',
  '动物',
]

const moreCategories = ['公开课', '搞笑', '单机游戏', '网络游戏', 'MV', '手游']

const sideEntries = [
  { name: '专栏', svg: 'column' },
  { name: '活动', svg: 'activity' },
  { name: '社区中心', elIcon: ChatDotRound },
  { name: '直播', svg: 'live' },
  { name: '课堂', svg: 'classroom' },
  { name: '新歌热榜', svg: 'song-top' },
]

const carouselSlides = [
  {
    sub: '中国话',
    title: '让我们一起大声说！！！',
    img: 'https://picsum.photos/seed/bilicar1/640/360',
  },
  {
    sub: '热门精选',
    title: '二周年版本纪念快乐！',
    img: 'https://picsum.photos/seed/bilicar2/640/360',
  },
  {
    sub: '番剧',
    title: '本周必追 · 高分连载',
    img: 'https://picsum.photos/seed/bilicar3/640/360',
  },
]

const carouselIndex = ref(0)
let carouselTimer = null
let carouselPaused = false

function goSlide(i) {
  carouselIndex.value = i
}

function nextSlide() {
  carouselIndex.value = (carouselIndex.value + 1) % carouselSlides.length
}

function prevSlide() {
  carouselIndex.value = (carouselIndex.value - 1 + carouselSlides.length) % carouselSlides.length
}

function tickCarousel() {
  if (!carouselPaused) nextSlide()
}

function pauseCarousel() {
  carouselPaused = true
}

function resumeCarousel() {
  carouselPaused = false
}

onMounted(() => {
  carouselTimer = window.setInterval(tickCarousel, 4500)
})

onUnmounted(() => {
  if (carouselTimer) clearInterval(carouselTimer)
})

const feedTabs = ['推荐', '热门', '追番', '影视', '全程开奖']
const activeFeedTab = ref('推荐')
const feedSubLinks = ['番剧', '电影', '国产剧', '综艺']
const onlineText = '10000+ 人在看'

function pad2(n) {
  return String(n).padStart(2, '0')
}

function buildVideos(seedOffset = 0) {
  const titles = [
    '【合集】一口气看完系列 · 高能解说',
    '这首歌有毒！循环一百遍停不下来',
    '硬核科普：5分钟搞懂原理',
    '实况全程录像 · 字幕已校对',
    '画画过程 · 附笔刷与图层解析',
    '厨房翻车合集 · 但成品居然还行',
    '游戏速通 · 新版本路线优化',
    '摄影教程：自然光人像这样拍',
    'MAD · 镜头节奏练习作',
    'VLOG 日常 · 城市黄昏漫步',
    '配音整活 · 原片毁灭级',
    '二胡版二次元名曲串烧',
    '纪录片精读 · 笔记向',
    '桌搭分享 · 性价比清单',
    '猫片治愈 · 4K',
  ]
  return Array.from({ length: 20 }, (_, i) => {
    const n = i + seedOffset * 7
    const mi = Math.floor(Math.random() * 50) + 1
    const sec = Math.floor(Math.random() * 59)
    const showLike = Math.random() > 0.72
    const month = pad2((i % 12) + 1)
    const day = pad2((i % 27) + 1)
    return {
      id: `v-${n}-${i}-${seedOffset}`,
      title: `${titles[i % titles.length]}`,
      author: `演示用户${2000 + ((n + i) % 8000)}`,
      plays: `${(Math.random() * 85 + 2).toFixed(1)}万`,
      danmu: `${Math.floor(Math.random() * 8000) + 400}`,
      duration: `${pad2(mi)}:${pad2(sec)}`,
      cover: `https://picsum.photos/seed/bilivid${n + i}/320/180`,
      time: `${month}-${day}`,
      likeTag: showLike ? `${(Math.random() * 8 + 2).toFixed(1)}万点赞` : '',
    }
  })
}

const videoList = ref(buildVideos(0))

const heroVideos = computed(() => videoList.value.slice(0, 8))
const restVideos = computed(() => videoList.value.slice(8))

function shuffleVideos() {
  videoList.value = buildVideos(Math.floor(Math.random() * 900) + 1)
}

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const promoList = [
  { id: 1, title: '品牌合作 · 活动页', cover: 'https://picsum.photos/seed/bilip1/520/160' },
  { id: 2, title: '会员购 · 新品上架', cover: 'https://picsum.photos/seed/bilip2/520/160' },
]

const rankTabs = ['排行', '娱乐']
const activeRankTab = ref('排行')

const rankList = ref([
  { id: 1, title: '【全程】年度盛典纯享回放', score: '503万' },
  { id: 2, title: '新歌MV · 首发正式版来啦', score: '402万' },
  { id: 3, title: '解说向：三小时剧情梳理', score: '361万' },
  { id: 4, title: '挑战赛：全球玩家集锦', score: '298万' },
  { id: 5, title: '一图流攻略：新手必存', score: '251万' },
  { id: 6, title: '幕后花絮 · 导演剪辑', score: '210万' },
  { id: 7, title: '动画短片 · 入围作品', score: '198万' },
  { id: 8, title: '科技评测：值不值得买', score: '176万' },
  { id: 9, title: '翻唱：经典曲目新编', score: '154万' },
  { id: 10, title: '纪录片精读 笔记整理', score: '132万' },
])

function rankClass(idx) {
  if (idx === 0) return 'n1'
  if (idx === 1) return 'n2'
  if (idx === 2) return 'n3'
  return ''
}
</script>

<style lang="scss" scoped>
.bili-home {
  min-width: 1000px;
  background: #fff;
  color: #18191c;
  padding-bottom: 48px;
}

.channel-strip {
  background: #fff;
  border-bottom: 1px solid #e3e5e7;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  padding-top: 28px;
}

.channel-inner {
  max-width: 1620px;
  margin: 0 auto;
  padding: 10px 24px 18px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.channel-quick {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  padding-top: 2px;
}

.quick-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: #fff;
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &.dynamic {
    background: linear-gradient(145deg, #ff9a3c, #ff7b24);
    box-shadow: 0 4px 12px rgba(255, 145, 50, 0.35);
  }

  &.hot {
    background: linear-gradient(145deg, #ff6b8a, #f03652);
    box-shadow: 0 4px 12px rgba(240, 54, 82, 0.35);

    .hot-ico-wrap {
      color: #fff;
    }
  }

  &.on {
    box-shadow: 0 0 0 3px #fff, 0 0 0 5px #fb7299;
  }

  &:hover {
    transform: translateY(-2px);
  }

  .quick-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    line-height: 1;
    margin-bottom: 2px;
  }

  .quick-label {
    font-size: 12px;
    font-weight: 500;
  }
}

.channel-center {
  flex: 1;
  min-width: 0;
}

.channel-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
}

.channel-chip {
  padding: 0 12px;
  height: 28px;
  line-height: 28px;
  font-size: 13px;
  color: #61666d;
  background: #f1f2f3;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;

  &:hover {
    background: #e3e5e7;
    color: #18191c;
  }

  &.active {
    background: #fb7299;
    color: #fff;
  }
}

.channel-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  .caret {
    font-size: 10px;
    opacity: 0.7;
  }
}

.channel-side-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px 10px;
  flex-shrink: 0;
  width: 200px;
  padding-top: 2px;
}

.side-entry {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #61666d;
  text-decoration: none;
  padding: 4px 2px;
  border-radius: 6px;
  transition: color 0.2s;

  &:hover {
    color: #fb7299;
  }

  :deep(.svg-icon) {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: #9499a0;
  }

  &:hover :deep(.svg-icon) {
    color: #fb7299;
  }

  .side-el-ico {
    color: #9499a0;
    flex-shrink: 0;
  }

  &:hover .side-el-ico {
    color: #fb7299;
  }
}

.home-body {
  padding-top: 14px;
}

.home-inner {
  max-width: 1620px;
  margin: 0 auto;
  padding: 0 24px;
}

.home-main {
  width: 100%;
  min-width: 0;
}

.hero-panel {
  display: flex;
  gap: 16px;
  align-items: stretch;
  margin-bottom: 20px;
}

.hero-carousel {
  flex: 0 0 38%;
  max-width: 520px;
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  align-self: stretch;
  display: flex;
  flex-direction: column;
}

.carousel-viewport {
  position: relative;
  flex: 1;
  min-height: 260px;
}

.carousel-slide {
  position: absolute;
  inset: 0;
  transition: opacity 0.45s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.carousel-mask {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 36px 16px 40px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.72));
}

.carousel-sub {
  margin: 0 0 6px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.88);
}

.carousel-title {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.45);
  line-height: 1.35;
}

.carousel-dots {
  position: absolute;
  left: 12px;
  bottom: 12px;
  z-index: 3;
  display: flex;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  padding: 0;
  background: rgba(255, 255, 255, 0.45);
  cursor: pointer;
  transition:
    width 0.2s,
    border-radius 0.2s;

  &.on {
    background: #fff;
    width: 18px;
    border-radius: 4px;
  }
}

.carousel-nav {
  position: absolute;
  bottom: 10px;
  z-index: 3;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 16px;
  line-height: 28px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.65);
  }

  &.prev {
    right: 44px;
  }

  &.next {
    right: 10px;
  }
}

.hero-video-grid {
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(2, auto);
  gap: 12px 10px;
  align-content: stretch;
}

.feed-block {
  background: #fff;
  border-radius: 10px;
  padding: 18px 18px 22px;
  margin-bottom: 20px;
  border: 1px solid #f1f2f3;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);

  &.secondary {
    padding-bottom: 18px;
  }
}

.feed-lower {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.feed-main-col {
  flex: 1;
  min-width: 0;
}

.home-aside {
  width: 300px;
  flex-shrink: 0;
}

.feed-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  margin-bottom: 16px;
}

.feed-tabs {
  display: flex;
  gap: 18px;
  align-items: center;
}

.feed-tab {
  font-size: 18px;
  font-weight: 400;
  color: #9499a0;
  cursor: pointer;
  position: relative;
  line-height: 1.2;

  &.on {
    color: #18191c;
    font-weight: 600;

    &::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: -8px;
      transform: translateX(-50%);
      width: 28px;
      height: 3px;
      border-radius: 2px;
      background: #fb7299;
    }
  }

  &:hover:not(.on) {
    color: #61666d;
  }
}

.feed-sub {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  margin-left: 8px;

  .sub-link {
    color: #61666d;
    text-decoration: none;

    &:hover {
      color: #fb7299;
    }
  }
}

.feed-meta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #9499a0;
  font-size: 12px;
  margin-left: 8px;

  .feed-meta-ico {
    color: #9499a0;
    flex-shrink: 0;
  }

  &.light {
    margin-left: 0;
  }
}

.refresh-feed {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid #e3e5e7;
  background: #fff;
  font-size: 13px;
  color: #61666d;
  cursor: pointer;
  transition:
    border-color 0.2s,
    color 0.2s;

  &:hover {
    border-color: #fb7299;
    color: #fb7299;
  }
}

.hide-on-wide {
  display: none;
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px 12px;
}

@media (min-width: 1400px) {
  .video-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 1180px) {
  .video-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .home-aside {
    display: none;
  }

  .hide-on-wide {
    display: inline-flex;
  }

  .hero-panel {
    flex-direction: column;
  }

  .hero-carousel {
    max-width: none;
    flex: none;
    width: 100%;
  }

  .carousel-viewport {
    aspect-ratio: 16 / 9;
    min-height: 200px;
  }

  .hero-video-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: auto;
  }
}

.video-card {
  min-width: 0;
}

.card-cover {
  display: block;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #e3e5e7;
  aspect-ratio: 16 / 10;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.35s ease;
  }

  &:hover img {
    transform: scale(1.05);
  }
}

.card-stats-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 18px 8px 6px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: #fff;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.68));
  line-height: 1.2;
}

.stats-left {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.95;
}

.duration {
  flex-shrink: 0;
  padding: 2px 5px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.45);
}

.card-title {
  margin: 10px 0 6px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  max-height: 2.8em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  a {
    color: #18191c;
    text-decoration: none;

    &:hover {
      color: #fb7299;
    }
  }
}

.card-meta {
  font-size: 12px;
  color: #9499a0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;

  .like-tag {
    color: #fa9600;
    background: rgba(250, 150, 0, 0.1);
    padding: 0 5px;
    border-radius: 4px;
    font-size: 11px;
    margin-right: 4px;
  }

  .up {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 42%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    :deep(.svg-icon) {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }
  }

  .dot {
    color: #c9ccd0;
  }
}

.promo-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.promo-card {
  display: block;
  border-radius: 8px;
  overflow: hidden;
  text-decoration: none;
  color: #18191c;
  background: #f4f4f4;

  img {
    width: 100%;
    aspect-ratio: 26 / 8;
    object-fit: cover;
    display: block;
  }

  .promo-title {
    display: block;
    padding: 10px 10px 12px;
    font-size: 13px;
  }

  &:hover .promo-title {
    color: #fb7299;
  }
}

.rank-card {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 14px 12px 12px;
  border: 1px solid #f1f2f3;
  position: sticky;
  top: 108px;
}

.rank-tabs {
  display: flex;
  gap: 20px;
  border-bottom: 1px solid #e3e5e7;
  padding: 0 4px 10px;
  margin-bottom: 8px;
}

.rank-tab {
  font-size: 15px;
  color: #9499a0;
  cursor: pointer;
  padding-bottom: 8px;

  &.on {
    color: #18191c;
    font-weight: 600;
    border-bottom: 3px solid #fb7299;
    margin-bottom: -11px;
  }
}

.rank-list {
  list-style: none;
  margin: 0;
  padding: 8px 0 0;
}

.rank-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 4px;
  border-bottom: 1px solid #f1f2f3;
  font-size: 12px;

  &:last-child {
    border-bottom: none;
  }
}

.rank-num {
  width: 18px;
  flex-shrink: 0;
  font-weight: 700;
  font-style: italic;
  color: #9499a0;
  line-height: 1.4;

  &.n1 {
    color: #f25d8e;
  }

  &.n2 {
    color: #ff7f9f;
  }

  &.n3 {
    color: #ffa0ab;
  }
}

.rank-title {
  flex: 1;
  min-width: 0;
  color: #18191c;
  text-decoration: none;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  &:hover {
    color: #fb7299;
  }
}

.rank-hot {
  flex-shrink: 0;
  color: #9499a0;
}

.rank-more {
  display: block;
  text-align: center;
  padding: 12px 0 4px;
  font-size: 13px;
  color: #9499a0;
  text-decoration: none;

  &:hover {
    color: #fb7299;
  }
}

.float-tools {
  position: fixed;
  right: 20px;
  bottom: 80px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.float-btn {
  width: 44px;
  height: 44px;
  border: 1px solid #e3e5e7;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #61666d;
  transition:
    color 0.2s,
    border-color 0.2s,
    transform 0.15s;

  &:hover {
    color: #fb7299;
    border-color: #fb7299;
  }

  &:active {
    transform: scale(0.96);
  }
}
</style>
