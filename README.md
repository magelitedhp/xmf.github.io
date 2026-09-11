# Nocturne · 夜航书斋

Vue 3 + Vite 个人站。首页为 **prop1 夜航玻璃拟态**；随笔是内容主线，音乐、AI 工具、动画效果是并列功能模块。

在线预览（GitHub Pages，`docs/` 目录）：

https://magelitedhp.github.io/xmf.github.io/

## 功能

- 首页展示个人简介、最新随笔与项目入口。
- 随笔模块：文章列表、标签筛选、文章详情。
- 顶栏导航：随笔 / 音乐 / AI 工具 / 动画效果。
- 音乐模块：发现、搜索、收藏与播放（独立 `src/modules/music`）。
- AI 工具模块：空白占位页。
- 动画效果：嵌入 [AquaInkGL](https://github.com/WishMelz/AquaInkGL) 的 WebGL 水墨流体演示（拖动产生墨迹）。

## 目录结构

```text
src/
  App.vue / layouts/ / pages/ / components/site/ / config/nav.ts
  modules/blog/                  # 随笔内容、列表与详情
  modules/music/                 # 音乐模块
  modules/effects/               # 动画效果模块说明
  router/routes/site.ts|music.ts
public/effects/aquaInk/          # AquaInkGL 静态演示（iframe）
styles/                          # 全局 + 站点玻璃拟态 + 音乐样式
```

## 常用命令

```bash
npm install
npm run dev
npm run build
```

本地打开 `http://localhost:5173/`（Hash 路由）。发版把 `dist/` 同步到 `docs/`。

## 继续开发约定

- 站点壳遵循 `ui/prop1.md` 玻璃拟态；音乐模块可保留独立视觉。
- 新业务优先 `src/modules/<name>/` + `router/routes/<name>.ts`。
- `App.vue` 只做根出口。
- 发版说明追加到 `changelog/`。
