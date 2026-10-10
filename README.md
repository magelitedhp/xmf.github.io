# Yumo · 保持好奇

Vue 3 + TypeScript + Vite 个人站，以浅色毛玻璃、彩色品牌海报与卡片布局呈现随笔、音乐、工具、交互实验和游戏厅。

当前版本为 **v0.1.7**。本轮改动见 [v0.1.7 更新日志](changelog/v0.1.7.md)，后续开发见 [未发布更新日志](changelog/unreleased.md)，历史版本见 [更新日志索引](changelog/README.md)。

在线预览（GitHub Pages，`docs/` 目录）：

https://www.xuxy.cloud/

GitHub Pages 默认地址：

https://magelitedhp.github.io/xmf.github.io/

## 功能

- 首页：Yumo 品牌海报、模块入口、最新随笔与个人介绍。
- 随笔：文章列表、标签筛选、文章详情与装饰封面。
- 顶栏导航：随笔 / 音乐 / 工具 / 实验 / 游戏厅。
- Yumo FM：发现、分页搜索、本地收藏、最近播放与唱片机播放界面；支持点击歌词跳转、随机播放、单曲循环和音量调节，主题歌单使用本地 SVG 封面。
- 灵感工作台：JSON 格式化、压缩与语法检查，支持中文和 Emoji 的 Base64 编解码，以及配色切换与复制；输入内容在浏览器内处理。
- 交互实验：嵌入 [AquaInkGL](https://github.com/WishMelz/AquaInkGL) 的 WebGL 流体画布，可拖动绘制、注入色彩、暂停、隐藏介绍与全屏游玩。
- 游戏厅：`/games` 支持全部 / 动作 / 策略 / 物理筛选，`/games/:slug` 提供游戏画面、操作说明、全屏工具栏与其他游戏入口。

## 游戏

| 游戏 | 内容 | 实现 |
| --- | --- | --- |
| 烬灯行 | 像素横版动作肉鸽；十层两首领、三段连击、冲刺无敌、每层三选一强化 | Vue + Canvas，支持键盘、鼠标与触屏；移动端按钮独立位于画面下方，横屏及全屏时也不遮挡画面 |
| 花园保卫战 | 草坪塔防；15 种植物、10 种僵尸、12 关冒险、保龄球挑战、无尽生存、图鉴与本地存档 | 独立 TypeScript 源码编译为单个 HTML，站内以 iframe 嵌入；构建说明见 [游戏 README](games-src/garden-guard/README.md) |
| 瓜体实验室 | 半流体水果合成；果冻 / 半流体 / 果汁三种材质、容器倾斜、能量搅动、十级水果演化与本地最高分 | Canvas 物理模拟，支持鼠标、键盘及触屏；独立 HTML 配合 `studio.css`，站内 iframe 自适应内容高度 |

《烬灯行》玩法风格致敬 [熵刃 ENTROPY BLADE](https://game.inc.re/entropy-blade/)；《花园保卫战》为致敬 PopCap《植物大战僵尸》的非官方同人，角色参考经典版造型，以 Canvas 2D 矢量重新绘制，游戏厅 SVG 封面也由同一套角色函数生成；《瓜体实验室》概念与交互参考 [半流体西瓜游戏](https://melon-game.jack-514.chatgpt.site/)。站内游戏代码独立实现，《花园保卫战》不包含原版图片或音频文件。

## 目录结构

```text
src/
  App.vue                        # 根路由出口
  layouts/ / pages/              # 站点外壳、首页、工具与实验页面
  components/site/               # 导航、背景与 BrandCanvas 品牌海报
  config/nav.ts                  # 站点导航配置
  modules/blog/                  # 随笔内容、列表与详情
  modules/music/                 # Yumo FM、唱片机组件、播放器与曲库接入
  modules/game/                  # 游戏列表、详情、GameFrame 与 data/games.ts 注册表
    games/ember-lantern/          # 烬灯行组件与 engine/
    games/garden-guard/           # 花园保卫战 iframe 组件
    games/melon-fluid/            # 瓜体实验室自适应 iframe 组件
  router/routes/                 # site.ts / music.ts
  styles/                        # 全局、站点、音乐、游戏厅与响应式样式
public/
  games/<slug>/cover.svg          # 游戏 SVG 封面
  games/garden-guard/index.html   # 花园保卫战单文件构建产物
  games/melon-fluid/              # 瓜体实验室 HTML、样式与封面
  music/covers/                  # 主题歌单与精选合集 SVG 封面
  effects/aquaInk/                # AquaInkGL 静态演示（iframe）
games-src/garden-guard/           # 花园保卫战独立源码（TS + esbuild）
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
