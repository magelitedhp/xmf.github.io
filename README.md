# Lumina Sonic Music Player

基于 Vue 3 + Vite 构建的 PC 端音乐播放器原型项目，视觉参考来自：

`C:\Users\19568\Desktop\stitch_macos_style_music_web\stitch_macos_style_music_web`

## 功能范围

- macOS light mode 风格固定侧栏、顶部搜索栏和玻璃质感底部播放栏。
- Discover、Search、Library、Playing 四个主视图。
- 歌曲搜索、播放/暂停、上一首/下一首、进度拖动、音量调节、收藏状态切换。
- 播放状态会用定时器推进进度，当前没有接入真实音频文件。
- 使用原型 HTML 中的视觉素材 URL 作为封面和主视觉；离线环境下图片可能无法加载，但构建不受影响。

## 目录结构

```text
src/
  App.vue                         # 页面组装层，不承载大量业务/样式
  composables/usePlayer.ts         # 播放器状态与播放控制逻辑
  data/music.ts                    # 导航、曲目、歌单、专辑、精选辑数据
  components/music/                # 通用音乐播放器组件
    AppSidebar.vue
    TopBar.vue
    PlayerBar.vue
    TrackList.vue
    TrackTable.vue
    PlaylistCard.vue
    views/                         # 页面视图组件
  styles/                          # 拆分后的全局样式
    tokens.css
    base.css
    layout.css
    music.css
    responsive.css
```

## 常用命令

需要 Node.js 18+。当前机器可用 `D:\nvm\v18.20.8`，如果默认 `node -v` 仍是 14.x，先切到 Node 18。

```bash
npm install
npm run dev
npm run build
```

PowerShell 临时使用本机 Node 18：

```powershell
$env:Path='D:\nvm\v18.20.8;' + $env:Path
npm run dev
```

## 继续开发约定

- 不要把新逻辑和通用样式重新堆回 `App.vue`。
- 播放相关状态优先维护在 `src/composables/usePlayer.ts`。
- 静态曲目、歌单和视觉素材优先维护在 `src/data/music.ts`。
- 通用 UI 控件放在 `src/components/music`，页面级内容放在 `src/components/music/views`。
- 设计变量和布局规则放在 `src/styles`，按职责拆分。
- 本项目补充了本地 Codex skill：`.codex/skills/lumina-sonic-player/SKILL.md`，下次继续开发前可先读取该文件恢复上下文。
