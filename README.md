# Nocturne · 夜航播放器

Vue 3 + Vite 的在线音乐播放器。当前版本已接入 GD音乐台曲库，界面为 Nocturne 夜航玻璃拟态。

在线预览（GitHub Pages，`docs/` 目录）：

https://magelitedhp.github.io/xmf.github.io/

## 功能

- 发现、搜索、收藏、正在播放四个主视图，底部固定播放栏。
- 搜索歌曲、专辑、艺人；播放 / 暂停、上一首 / 下一首、进度拖动、音量、随机与单曲循环。
- 真实音频播放，封面与 LRC 歌词随当前曲目加载；正在播放页会高亮当前句。
- 喜欢的歌曲与最近播放保存在浏览器本地。
- 深墨夜景 + 无色玻璃面板，香槟金只用于主操作和高亮数字。

曲库来源：[GD音乐台 (music.gdstudio.xyz)](https://music.gdstudio.xyz)。接口文档见 `docs/music-api.md`。仅供学习参考，请勿商用。接口限制为 5 分钟内不超过 50 次请求，部分曲目可能因版权无法播放。

## 目录结构

```text
src/
  App.vue                         # 页面组装层
  api/                            # GD音乐台搜索、播放地址、封面、歌词
  composables/usePlayer.ts         # 播放队列、真实音频与本地收藏
  data/music.ts                    # 导航、电台分类与类型
  components/music/                # 播放器组件
    views/                        # 发现 / 搜索 / 收藏 / 正在播放
  styles/                         # 夜航玻璃拟态 token 与布局
changelog/                        # 更新日志
docs/                             # GitHub Pages 发版目录
```

## 常用命令

需要 Node.js 18+。

```bash
npm install
npm run dev
npm run build
```

本地开发打开 `http://localhost:5173/`。开发时搜索和播放会走 Vite 代理；构建后的页面直连官方 API。

发版会执行 `npm run build`，再把产物同步到 `docs/`。更新说明写在 [`changelog/`](./changelog/README.md)。

## 继续开发约定

- 不要把新逻辑和通用样式重新堆回 `App.vue`。
- 播放与曲库请求优先维护在 `src/composables/usePlayer.ts` 和 `src/api`。
- 电台分类、导航和类型放在 `src/data/music.ts`。
- 通用 UI 放在 `src/components/music`，页面级内容放在 `src/components/music/views`。
- 设计变量和布局规则放在 `src/styles`。
- 发版说明追加到 `changelog/`，不要直接改历史版本文件。
