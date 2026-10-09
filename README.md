# Nocturne · 夜航书斋

Vue 3 + Vite 个人站。首页为 **prop1 夜航玻璃拟态**；随笔是内容主线，音乐、AI 工具、动画效果、游戏是并列功能模块。

在线预览（GitHub Pages，`docs/` 目录）：

https://magelitedhp.github.io/xmf.github.io/

## 功能

- 首页展示个人简介、最新随笔与项目入口。
- 随笔模块：文章列表、标签筛选、文章详情。
- 顶栏导航：随笔 / 音乐 / AI 工具 / 动画效果 / 游戏。
- 音乐模块：发现、搜索、收藏与播放（独立 `src/modules/music`）。
- AI 工具模块：空白占位页。
- 动画效果：嵌入 [AquaInkGL](https://github.com/WishMelz/AquaInkGL) 的 WebGL 水墨流体演示（拖动产生墨迹）。
- 游戏厅：`/games` 列表展示封面与名称，点击进入 `/games/:slug` 游玩。首款《烬灯行》为 Canvas 像素横版动作肉鸽，十层两首领、三段连击、冲刺无敌、每层三选一强化；支持键盘、鼠标与触屏。玩法风格致敬 [熵刃 ENTROPY BLADE](https://game.inc.re/entropy-blade/)，代码与美术为原创实现。
- 第二款《花园保卫战》为草坪塔防：15 种植物、10 种僵尸、12 关冒险（含坚果保龄球、传送带关）、保龄球挑战与无尽生存，带图鉴与本地存档。源码在 `games-src/garden-guard/`，编译为单个 HTML（约 120 KB，无外部素材），站内以 iframe 嵌入。玩法致敬 PopCap《植物大战僵尸》，美术、代码、音乐均为原创。

## 目录结构

```text
src/
  App.vue / layouts/ / pages/ / components/site/ / config/nav.ts
  modules/blog/                  # 随笔内容、列表与详情
  modules/music/                 # 音乐模块
  modules/effects/               # 动画效果模块说明
  modules/game/                  # 游戏厅：列表页、详情页、GameFrame 外壳、data/games.ts 注册表
  modules/game/games/<slug>/     # 每款游戏独立目录（如 ember-lantern/ 含组件与 engine/）
public/games/<slug>/cover.png    # 游戏封面（16:9）
public/games/garden-guard/index.html  # 花园保卫战单文件构建产物（由 games-src 生成）
games-src/garden-guard/          # 花园保卫战独立源码（TS + esbuild），见其 README
  router/routes/site.ts|music.ts
public/effects/aquaInk/          # AquaInkGL 静态演示（iframe）
styles/                          # 全局 + 站点玻璃拟态 + 音乐样式
```

## 常用命令

```bash
npm install
npm run dev
npm run build
npm run game:garden        # 类型检查并重新编译花园保卫战单文件 HTML
npm run game:garden:watch  # 监听源码自动重编
```

本地打开 `http://localhost:5173/`（Hash 路由）。发版把 `dist/` 同步到 `docs/`。

## 继续开发约定

- 站点壳遵循 `ui/prop1.md` 玻璃拟态；音乐模块可保留独立视觉。
- 新业务优先 `src/modules/<name>/` + `router/routes/<name>.ts`。
- `App.vue` 只做根出口。
- 发版说明追加到 `changelog/`。
- 新增游戏：在 `src/modules/game/games/<slug>/` 写一个根组件（可用 `GameFrame` 包裹画布以获得全屏与工具栏），封面放 `public/games/<slug>/cover.png`，再在 `src/modules/game/data/games.ts` 追加一条记录即可，路由无需改动。
- 独立打包的游戏（如花园保卫战）：源码放 `games-src/<slug>/`，构建产物输出到 `public/games/<slug>/index.html`，站内组件用 `GameFrame` 包一个 iframe 即可。
