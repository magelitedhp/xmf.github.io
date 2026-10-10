# 超级玛丽 · 蘑菇王国冒险

致敬 Nintendo《超级马力欧兄弟》的非官方同人平台游戏。角色参考经典造型，像素矩阵、代码、四个世界的关卡及合成配乐独立实现，不使用原版 ROM、图片、字体或音频。最终游戏是一个可离线打开的单 HTML，游戏厅以 iframe 嵌入。

## 开始游玩

- 游戏厅：`http://localhost:5173/#/games/super-mario`。
- 独立页面：`http://localhost:5173/games/super-mario/index.html`。
- 离线版本：直接打开 `output/super-mario.html`。站点工具栏也提供「下载单文件」。
- `npm run game:mario` 重新构建；`npm run game:mario:watch` 监听源码；根目录 `npm run build` 构建完整站点。

## 冒险内容

| 世界 | 内容 |
| --- | --- |
| 1—1 青风草原 | 问号砖、成长蘑菇、水管、隐藏金币密室和龟壳 |
| 1—2 萤石地底 | 洞窟、分层砖台、移动平台、食人花及第二处密室入口 |
| 1—3 云上群岛 | 高低岛屿、横移 / 升降平台，以及空中的金币与星章 |
| 1—4 余烬城堡 | 熔岩深坑、城堡守卫、火焰攻击和公主救援 |

- 四个世界共十二枚星章，通关解锁下一世界；通关收集的星章、最高分和声音偏好保存在 `yumo.super-mario.v1`。
- 成长蘑菇、火焰花、无敌星星与绿蘑菇；累计每 100 枚金币增加一条生命。
- 踩扁栗宝宝、把乌龟踩成龟壳再踢向敌人；变大后能顶碎砖块，火焰形态可发射弹跳火球。
- 检查点复活、隐藏房间往返、暂停、失败重试、时间奖励、世界选择与通关结尾。
- 960×540 逻辑画面，视差山丘 / 云层、像素草地 / 洞窟 / 城堡、粒子、动态金币、角色动画和合成背景音乐。

## 操作

| 按键 | 操作 |
| --- | --- |
| `←` / `→`、`A` / `D` | 左右移动 |
| `空格` / `Z` / `K` / `↑` / `W` | 跳跃；长按跳得更高，踩怪时长按弹得更高 |
| `Shift` / `J` | 冲刺；火焰形态持续发射火球 |
| `X` | 发射一枚火球 |
| `↓` / `S` | 蹲下；站在标有箭头的水管上进入 / 离开密室 |
| `Esc` / `P` | 暂停 / 继续 |

移动采用固定步长物理、加速与制动、可变跳高、离地宽容及落地输入缓冲。手机下方提供独立的多指触控按钮；竖屏、横屏与全屏都保留完整控制区。失去窗口焦点或切到后台时自动暂停。

## 源码与中间产物

```text
games-src/super-mario/
  index.html                  单文件 HTML 模板与无障碍控件
  tsconfig.json               独立严格 TypeScript 检查
  build.mjs                   esbuild 打包、内联脚本和样式
  src/
    main.ts                   页面、HUD、菜单、循环与 iframe 尺寸通知
    game.ts                   碰撞、跳跃、战斗、道具、通关与密室状态
    levels.ts                 四个世界与密室的可编辑关卡数据
    types.ts                  数据类型、尺寸、矩形碰撞辅助函数
    render.ts                 场景绘制顺序、标题场景与战场渲染
    art.ts                    像素绘画、地图纹理、背景、角色与首领
    sprites.ts                可编辑像素矩阵和调色板
    input.ts                  键盘和 Pointer Events 多点触控
    audio.ts                  WebAudio 音效与原创短循环配乐
    save.ts                   校验并保存浏览器本地进度
    style.css                 标题、HUD、菜单与响应式控制区
  tools/                      封面生成、浏览器测试及截图工具
  .build/
    debug/main.js(.map)       未压缩 JavaScript 与 sourcemap
    debug/main.css(.map)      未压缩 CSS 与 sourcemap
    min/main.js / main.css    内联前的压缩文件
    sprites.cjs               封面生成使用的角色数据中间文件
    meta.json                esbuild 构建元数据
    verification/            浏览器截图、测试报告及通路输入序列
  output/
    super-mario.html          最终离线单文件
    cover.svg                生成的矢量封面
public/games/super-mario/
  index.html / cover.svg      游戏厅使用的相同产物
```

源码、封面源数据、调试 bundle、sourcemap、压缩文件、构建元数据和验证材料均保留，不加入 `.gitignore`。单 HTML 中已经内联所有运行必需的脚本、样式和像素数据，不需要同目录的附属文件。

## 验证与调试

`?debug` 显式启用 `window.__mario` 和 `window.__renderer`，用于检查状态与重现问题；普通入口不暴露调试对象。

浏览器检查使用已有的 Chrome / Edge 调试端口（默认 `9227`）和 Vite 地址（默认 `http://127.0.0.1:5173/`），可用 `MARIO_CDP_PORT` / `MARIO_BASE_URL` 覆盖。运行以下脚本前先构建游戏、启动 Vite 和开启浏览器调试端口：

```bash
node games-src/super-mario/tools/verify.mjs
node games-src/super-mario/tools/traversal.mjs
node games-src/super-mario/tools/layout-check.mjs
node games-src/super-mario/tools/capture.mjs
node games-src/super-mario/tools/release-check.mjs
```

已经验证：长短跳、冲刺、顶砖、成长、碎砖、离地宽容、输入缓冲、踩怪、龟壳、火球、受击保护、检查点、密室往返、星章、额外生命、首领状态与结尾；320 / 390 / 844 / 1024 像素触屏视口、真实键盘和三指触屏输入，以及游戏厅嵌入与桌面全屏。

地形通路检查通过实际游戏物理更新寻找连续输入序列，并关闭敌人以单独验证关卡地形。它证明四个世界的出口可达，不等同于对所有敌人组合和全部十二枚星章收集路线的穷举验证。

离线检查通过 `file://` 直接打开最终 HTML，进入游戏后外部网络请求为零。移动端站内嵌入高度稳定，横屏全屏时触屏按钮完整可见。浏览器检查产生的截图和 JSON 报告保存在 `.build/verification/`。
