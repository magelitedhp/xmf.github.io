# 花园保卫战 · Garden Guard

致敬 PopCap《植物大战僵尸》的非官方同人塔防。角色参考经典版造型，以 Canvas 2D 矢量重新绘制；代码独立实现，音乐与音效由 WebAudio 合成，游戏不包含原版图片或音频文件。最终产物是一个可离线打开的单文件 HTML。

## 内容

- 15 种植物：豌豆射手、向日葵、樱桃炸弹、坚果墙、土豆地雷、寒冰射手、大嘴花、双发射手、窝瓜、地刺、卷心菜投手、火爆辣椒、火炬树桩、高坚果、三线射手；保龄球另有保龄坚果 / 爆炸坚果 / 巨型坚果。
- 10 种僵尸：普通、旗帜、路障、撑杆、读报、铁桶、铁栅门、橄榄球、巨人、小鬼。护具分段破损、断臂掉头、冰冻减速、烧成灰、压扁、割草机碾过。
- 12 关冒险（1-5 坚果保龄球、1-10 传送带），开场镜头平移到街道预览本关僵尸，植物超过 8 种时出现选卡。
- 小游戏：保龄球挑战（20 波）、无尽生存。
- 图鉴、设置（音乐 / 音效 / 解锁全部 / 重置存档），进度存在 localStorage。
- 操作：鼠标点击或拖拽；`1–8` 选卡，`Q` 铲子，`F` 加速，空格 / `Esc` 暂停。

## 角色美术

- 15 种植物、3 种保龄坚果和 10 种僵尸使用统一的轮廓、描边、配色与明暗。植物的嘴形、叶片、花瓣、果壳、唇边，以及僵尸的驼背、破衣、领带、手指、鞋子与护具均单独绘制。
- 射击回弹、眨眼、摇摆、啃咬、吞咽、撑杆跳、巨人砸击与投掷沿用战斗状态驱动。保留坚果开裂、护具破损、断臂掉头、冰冻、灰烬和压扁效果。
- `art/paths.ts` 缓存 `Path2D` 轮廓；颜色仍逐帧经过 `C()`，因此受击和冰冻着色不会丢失。种子卡、图鉴、战场及掉落部件共用角色绘制函数。
- `tools/build-cover.mjs` 在构建时调用同一套角色函数导出 SVG 封面；封面由原生矢量路径组成，没有内嵌截图，也不请求外部素材。

## 构建

```bash
# 在仓库根目录
npm run game:garden         # tsc 类型检查 + 构建
npm run game:garden:watch   # 监听重编
```

`build.mjs` 使用仓库已有的 esbuild，产物：

| 路径 | 内容 |
| --- | --- |
| `.build/debug/` | 未压缩 bundle + sourcemap（调试用） |
| `.build/min/` | 压缩后的 `main.js` / `main.css`（被内联的中间文件） |
| `.build/meta.json` | esbuild metafile，可用于体积分析 |
| `output/garden-guard.html` | 最终单文件 HTML |
| `../../public/games/garden-guard/index.html` | 同一文件，供站点游戏厅 iframe 嵌入 |
| `../../public/games/garden-guard/cover.svg` | 从角色绘制函数生成的游戏厅封面 |

中间产物刻意保留在仓库中，不要加入 `.gitignore`。

## 调试参数

- `?level=1-7` / `?level=bowling` / `?level=endless`：直接进入关卡
- `?scene=select|almanac|settings`：直接打开对应界面
- `?unlock`：本次会话解锁全部关卡与植物
- `?demo`：摆好的战斗场景（用于检查角色与战斗效果）

## 源码结构

```text
src/
  config.ts            画布 1200×720、草坪 5×9 网格与坐标换算
  util.ts              数学、缓动、着色 C()（冰冻 / 受击 / 灰烬整体变色）、绘图与文字
  audio.ts             WebAudio 合成音效 + 前瞻调度的原创背景音乐
  save.ts              本地存档
  data/                植物、僵尸、关卡数据
  art/                 plants / zombies / items / background 矢量美术
  game/
    battle.ts          战斗状态机：开场平移、选卡、准备、波次、阳光、输入、伤害规则
    behaviors.ts       植物技能、僵尸 AI、豌豆 / 抛物线 / 割草机 / 保龄球
    waves.ts           波次预算与僵尸挑选
    render.ts          分行深度排序绘制、粒子、HUD 与各类浮层
  scenes.ts            标题、选关与小游戏、图鉴、设置、奖励界面
  ui.ts                即时模式按钮 / 点击区域
  app.ts               固定步长循环、DPR 自适应与信箱缩放、指针映射、场景淡入淡出
```
