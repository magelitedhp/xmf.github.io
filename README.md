# Yumo · 保持好奇

Vue 3 + TypeScript + Vite 个人站，以浅色毛玻璃、彩色品牌海报与卡片布局呈现随笔、音乐、阅读、工具、交互实验和游戏厅。

当前版本为 **v0.2.0**。本轮改动见 [v0.2.0 更新日志](changelog/v0.2.0.md)，后续开发见 [未发布更新日志](changelog/unreleased.md)，历史版本见 [更新日志索引](changelog/README.md)。

在线预览（GitHub Pages，`docs/` 目录）：

https://www.xuxy.cloud/

GitHub Pages 默认地址：

https://magelitedhp.github.io/xmf.github.io/

## 功能

- 首页：Yumo 品牌海报、模块入口、最新随笔与个人介绍。
- 随笔：文章列表、标签筛选、文章详情与装饰封面。
- 顶栏导航：随笔 / 音乐 / 阅读 / 工具 / 实验 / 游戏厅。
- Yumo FM：发现、分页搜索、本地收藏、最近播放与唱片机播放界面；支持点击歌词跳转、随机播放、单曲循环和音量调节，主题歌单使用本地 SVG 封面。
- Yumo 阅读：本地书架、TXT/EPUB 导入解析、内置 11 条 so-novel 书源的一键导入与聚合搜索、书籍详情及分层章节目录；阅读器支持进度保存、目录侧栏、字号/行距/版心/主题设置，并可导出 TXT 或 EPUB。书源格式见 [阅读书源文档](docs/reader-sources.md)。
- 灵感工作台：包含 JSON、Base64、配色、URL、时间戳、文本处理、图片压缩转换、二维码生成与文本差异对比；输入内容和文件均在浏览器内处理。
- 交互实验：嵌入 [AquaInkGL](https://github.com/WishMelz/AquaInkGL) 的 WebGL 流体画布，可拖动绘制、注入色彩、暂停、隐藏介绍与全屏游玩。
- 游戏厅：`/games` 支持全部 / 动作 / 策略 / 物理 / 益智筛选，`/games/:slug` 提供游戏画面、操作说明、全屏工具栏与其他游戏入口。

## 游戏

| 游戏 | 内容 | 实现 |
| --- | --- | --- |
| 数独 | 经典逻辑解谜；五档难度、唯一解生成、候选笔记、撤销、提示、计时、最佳成绩与断点续玩 | Vue + TypeScript；桌面键盘 / 手机触屏 / 全屏，题目与求解验证均在浏览器本地完成 |
| 超级玛丽 | 像素平台冒险；四个世界、十二枚星章、变身道具、隐藏金币房、检查点与城堡首领 | TypeScript + Canvas + WebAudio，编译为可离线打开的单 HTML；键盘 / 多指触屏 / 全屏，保留全部构建中间文件；见 [游戏 README](games-src/super-mario/README.md) |
| 烬灯行 | 像素横版动作肉鸽；十层两首领、三段连击、冲刺无敌、每层三选一强化 | Vue + Canvas，支持键盘、鼠标与触屏；移动端按钮独立位于画面下方，横屏及全屏时也不遮挡画面 |
| 花园保卫战 | 草坪塔防；15 种植物、10 种僵尸、12 关冒险、保龄球挑战、无尽生存、图鉴与本地存档 | 独立 TypeScript 源码编译为单个 HTML，站内以 iframe 嵌入；构建说明见 [游戏 README](games-src/garden-guard/README.md) |
| 瓜体实验室 | 半流体水果合成；果冻 / 半流体 / 果汁三种材质、容器倾斜、能量搅动、十级水果演化与本地最高分 | Canvas 物理模拟，支持鼠标、键盘及触屏；独立 HTML 配合 `studio.css`，站内 iframe 自适应内容高度 |

《烬灯行》玩法风格致敬 [熵刃 ENTROPY BLADE](https://game.inc.re/entropy-blade/)；《花园保卫战》为致敬 PopCap《植物大战僵尸》的非官方同人，角色参考经典版造型，以 Canvas 2D 矢量重新绘制，游戏厅 SVG 封面也由同一套角色函数生成；《瓜体实验室》概念与交互参考 [半流体西瓜游戏](https://melon-game.jack-514.chatgpt.site/)。站内游戏代码独立实现，《花园保卫战》不包含原版图片或音频文件。

《超级玛丽》为致敬 Nintendo《超级马力欧兄弟》的非官方同人，像素画面、代码、关卡与合成配乐独立实现。

## 目录结构

```text
src/
  App.vue                        # 根路由出口
  layouts/ / pages/              # 站点外壳、首页、工具与实验页面
  components/site/               # 导航、背景与 BrandCanvas 品牌海报
  config/nav.ts                  # 站点导航配置
  modules/blog/                  # 随笔内容、列表与详情
  modules/music/                 # Yumo FM、唱片机组件、播放器与曲库接入
  modules/reader/                # 书架、书源引擎、TXT/EPUB 解析、导出与阅读器
  modules/game/                  # 游戏列表、详情、GameFrame 与 data/games.ts 注册表
    games/ember-lantern/          # 烬灯行组件与 engine/
    games/garden-guard/           # 花园保卫战 iframe 组件
    games/melon-fluid/            # 瓜体实验室自适应 iframe 组件
    games/sudoku/                 # 数独唯一解生成器、棋盘与本地存档
    games/super-mario/            # 超级玛丽自适应 iframe 与单文件下载入口
  router/routes/                 # site.ts / music.ts
  styles/                        # 全局、站点、音乐、游戏厅与响应式样式
public/
  games/<slug>/cover.svg          # 游戏 SVG 封面
  games/garden-guard/index.html   # 花园保卫战单文件构建产物
  games/melon-fluid/              # 瓜体实验室 HTML、样式与封面
  games/super-mario/              # 超级玛丽单文件 HTML 与生成的 SVG 封面
  music/covers/                  # 主题歌单与精选合集 SVG 封面
  effects/aquaInk/                # AquaInkGL 静态演示（iframe）
games-src/garden-guard/           # 花园保卫战独立源码（TS + esbuild）
games-src/super-mario/            # 超级玛丽源码、调试产物、测试材料与离线 HTML
changelog/                       # 未发布改动与历史发版说明
docs/                            # GitHub Pages 发布目录
```

## 常用命令

```bash
npm install
npm run dev
npm run build
npm run game:garden        # 类型检查并生成花园保卫战单文件 HTML 与 SVG 封面
npm run game:garden:watch  # 监听源码自动重编
npm run game:mario         # 类型检查并生成超级玛丽单 HTML 与 SVG 封面
npm run game:mario:watch   # 监听超级玛丽源码自动重编
```

本地打开 `http://localhost:5173/`（Hash 路由，例如 `/#/games/ember-lantern`）。`npm run build` 输出到 `dist/`；发版时再同步到 `docs/`，保留其中的 `CNAME` 域名配置与 `music-api.md` 文档，提交并推送以触发 GitHub Pages 更新。

## 继续开发约定

- 站点沿用当前 Yumo 视觉与响应式样式；音乐和游戏通过各自组件与样式保留独立视觉。`ui/` 中保留早期设计参考。
- 新业务优先 `src/modules/<name>/` + `router/routes/<name>.ts`。
- `App.vue` 只做根出口。
- 开发中的改动记录到 `changelog/unreleased.md`；正式发版时整理为版本文档并更新索引。
- 新增游戏：在 `src/modules/game/games/<slug>/` 写一个根组件，封面放 `public/games/<slug>/`，再在 `src/modules/game/data/games.ts` 注册封面路径与游戏信息，路由无需改动。
- `GameFrame` 默认插槽放画布或 iframe，`controls` 插槽放画面下方的触屏按钮，`toolbar` 插槽放工具栏操作；全屏覆盖整个游戏外壳。
- 独立打包的游戏（如花园保卫战）：源码放 `games-src/<slug>/`，构建产物输出到 `public/games/<slug>/index.html`，站内组件用 `GameFrame` 包一个 iframe 即可。
