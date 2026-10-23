# Yumo · 保持好奇

Vue 3 + TypeScript + Vite 个人站，以浅色毛玻璃、彩色品牌海报与卡片布局呈现随笔、音乐、阅读、工具、交互实验和游戏厅。

当前版本为 **v0.1.10**。本轮改动见 [v0.1.10 更新日志](changelog/v0.1.10.md)，后续开发见 [未发布更新日志](changelog/unreleased.md)，历史版本见 [更新日志索引](changelog/README.md)。

在线预览（GitHub Pages，`docs/` 目录）：

https://www.xuxy.cloud/

GitHub Pages 默认地址：

https://magelitedhp.github.io/xmf.github.io/

## 功能

- 首页：Yumo 品牌海报、模块入口、最新随笔与个人介绍。
- 随笔：文章列表、标签筛选、文章详情与装饰封面。
- 顶栏导航：随笔 / 音乐 / 阅读 / 工具 / 实验 / 游戏厅；音乐入口悬停可在两个独立版本之间选择。
- Yumo FM：发现、分页搜索、本地收藏、最近播放与唱片机播放界面；支持点击歌词跳转、随机播放、单曲循环和音量调节，主题歌单使用本地 SVG 封面。
- Yumo Music：独立的沉浸音乐体验，包含多音源搜索、歌单、排行榜、试听/收藏/稍后播放/自定义列表、导入导出、下载队列、当前播放队列、桌面歌词、快捷键与完整设置面板；沉浸播放页提供封面取色、逐字歌词、翻译字幕、经典波形、几何动效与静谧背景。静态站接口通过 JSONP 访问，不依赖既有音乐模块或站点后端。
- Yumo 阅读：本地书架、MD/TXT/EPUB 导入解析、默认目录自动书单、Markdown 图文阅读、内置 11 条 so-novel 书源的一键导入与聚合搜索、书籍详情及分层章节目录；阅读器支持进度保存、目录侧栏、字号/行距/版心/主题设置，并可导出 TXT 或 EPUB。默认目录见 [默认阅读内容说明](docs/reader-default-books.md)，书源格式见 [阅读书源文档](docs/reader-sources.md)。
- 灵感工作台：包含 JSON、Base64、配色、URL、时间戳、文本处理、图片压缩转换、二维码生成与文本差异对比；输入内容和文件均在浏览器内处理。
- 交互实验：嵌入 [AquaInkGL](https://github.com/WishMelz/AquaInkGL) 的 WebGL 流体画布，可拖动绘制、注入色彩、暂停、隐藏介绍与全屏游玩。
- 游戏厅：`/games` 支持全部 / 动作 / 策略 / 物理 / 益智筛选，`/games/:slug` 提供游戏画面、操作说明、全屏工具栏与其他游戏入口。

## 游戏

| 游戏 | 内容 | 实现 |
| --- | --- | --- |
| 植物大战僵尸幼儿园版 | V0.9.5 原始标题、主菜单、植物 / 僵尸动画与原始布局移植验证；本地直接启动 | 独立 WASM 引擎与原始资源，源码见 [移植说明](games-src/pvz-kindergarten/README.md)；完整数据包当前仅在本机，公开静态发布待处理 |
| 星穹扫雷 | 星际逻辑勘探；三档星区、每日星图、首触安全、连锁开格、扫描脉冲与断点续玩 | Vue + TypeScript + Canvas；三种光谱、星云流星、粒子与合成音效，支持键盘、触屏长按及全屏 |
| 数独 | 经典逻辑解谜；五档难度、唯一解生成、候选笔记、撤销、提示、计时、最佳成绩与断点续玩 | Vue + TypeScript；桌面键盘 / 手机触屏 / 全屏，题目与求解验证均在浏览器本地完成 |
| 超级玛丽 | 像素平台冒险；四个世界、十二枚星章、变身道具、隐藏金币房、检查点与城堡首领 | TypeScript + Canvas + WebAudio，编译为可离线打开的单 HTML；键盘 / 多指触屏 / 全屏，保留全部构建中间文件；见 [游戏 README](games-src/super-mario/README.md) |
| 烬灯行 | 像素横版动作肉鸽；十层两首领、三段连击、冲刺无敌、每层三选一强化 | Vue + Canvas，支持键盘、鼠标与触屏；移动端按钮独立位于画面下方，横屏及全屏时也不遮挡画面 |
| 瓜体实验室 | 半流体水果合成；果冻 / 半流体 / 果汁三种材质、容器倾斜、能量搅动、十级水果演化与本地最高分 | Canvas 物理模拟，支持鼠标、键盘及触屏；独立 HTML 配合 `studio.css`，站内 iframe 自适应内容高度 |

除明确标注的移植游戏外，其余游戏在项目内独立实现。《烬灯行》使用 Canvas 实时绘制像素画面；《瓜体实验室》围绕可变物性与流体变形展开；《超级玛丽》的像素画面、关卡与合成配乐均在项目内完成。幼儿园版采用独立开源引擎，原始资源与引擎许可证分别处理。

## 目录结构

```text
src/
  App.vue                        # 根路由出口
  layouts/ / pages/              # 站点外壳、首页、工具与实验页面
  components/site/               # 导航、背景与 BrandCanvas 品牌海报
  config/nav.ts                  # 站点导航配置
  modules/blog/                  # 随笔内容、列表与详情
  modules/music/                 # Yumo FM、唱片机组件、播放器与曲库接入
  modules/lxmusic/               # 独立 Yumo Music、沉浸舞台、列表/下载/设置内核
  modules/reader/                # 书架、默认书单、MD/TXT/EPUB 解析、书源与阅读器
  modules/game/                  # 游戏列表、详情、GameFrame 与 data/games.ts 注册表
    games/ember-lantern/          # 烬灯行组件与 engine/
    games/melon-fluid/            # 瓜体实验室自适应 iframe 组件
    games/sudoku/                 # 数独唯一解生成器、棋盘与本地存档
    games/minesweeper/            # 星穹扫雷规则、星空特效、仪表盘与本地续玩
    games/super-mario/            # 超级玛丽自适应 iframe 与单文件下载入口
  router/routes/                 # site.ts / music.ts / lxmusic.ts
  styles/                        # 全局、站点、音乐、游戏厅与响应式样式
public/
  default-read/                 # 自动加入书架的文本、EPUB 与相对图片附件
  games/<slug>/cover.svg          # 游戏 SVG 封面
  games/melon-fluid/              # 瓜体实验室 HTML、样式与封面
  games/super-mario/              # 超级玛丽单文件 HTML 与生成的 SVG 封面
  music/covers/                  # 主题歌单与精选合集 SVG 封面
  effects/aquaInk/                # AquaInkGL 静态演示（iframe）
games-src/super-mario/            # 超级玛丽源码、调试产物、测试材料与离线 HTML
changelog/                       # 未发布改动与历史发版说明
docs/                            # GitHub Pages 发布目录
```

## 常用命令

```bash
npm install
npm run dev
npm run build
npm run build:pages        # 生成游戏加载器、构建并同步 docs，保留域名与说明文档
node --test tests/*.test.mjs # 扫雷规则、播放 / 路由分包恢复与默认阅读回归测试
npm run game:mario         # 类型检查并生成超级玛丽单 HTML 与 SVG 封面
npm run game:mario:watch   # 监听超级玛丽源码自动重编
npm run game:pvz           # 生成幼儿园版原始界面加载器
```

本地打开 `http://localhost:5173/`（Hash 路由，例如 `/#/games/ember-lantern`）。`npm run build` 输出到 `dist/`；发版时再同步到 `docs/`，保留其中的 `CNAME` 域名配置、`.nojekyll`（关闭 Jekyll，避免下划线开头的构建分块被过滤）与 `music-api.md` 文档，提交并推送以触发 GitHub Pages 更新。

## 继续开发约定

默认阅读内容放在 `public/default-read/`：自动递归发现 MD、TXT、EPUB 并加入书架，Markdown 可使用同目录的相对图片；详见[默认书籍说明](docs/reader-default-books.md)。新增文件会在开发时自动刷新，并随下一次站点发布上线。

- 站点沿用当前 Yumo 视觉与响应式样式；音乐和游戏通过各自组件与样式保留独立视觉。`ui/` 中保留早期设计参考。
- 新业务优先 `src/modules/<name>/` + `router/routes/<name>.ts`。
- `App.vue` 只做根出口。
- 开发中的改动记录到 `changelog/unreleased.md`；正式发版时整理为版本文档并更新索引。
- 新增游戏：在 `src/modules/game/games/<slug>/` 写一个根组件，封面放 `public/games/<slug>/`，再在 `src/modules/game/data/games.ts` 注册封面路径与游戏信息，路由无需改动。
- `GameFrame` 默认插槽放画布或 iframe，`controls` 插槽放画面下方的触屏按钮，`toolbar` 插槽放工具栏操作；全屏覆盖整个游戏外壳。
- 独立打包的游戏（如超级玛丽）：源码放 `games-src/<slug>/`，构建产物输出到 `public/games/<slug>/index.html`，站内组件用 `GameFrame` 包一个 iframe 即可。
