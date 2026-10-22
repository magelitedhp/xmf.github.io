import type { AsyncComponentLoader } from 'vue'

export interface GameControl {
  keys: string[]
  label: string
}

export interface GameEntry {
  slug: string
  name: string
  enName: string
  genre: string
  /** One line for the list card. */
  summary: string
  /** Paragraph for the detail page header. */
  description: string
  /** Path under `public/`, resolved against the Vite base. */
  cover: string
  tags: string[]
  released: string
  controls: GameControl[]
  notes: string[]
  /** Lazily loaded game component; each game ships as its own chunk. */
  load: AsyncComponentLoader
}

export const games: GameEntry[] = [
  {
    slug: 'minesweeper',
    name: '星穹扫雷',
    enName: 'Nebula · A Field of Possibilities',
    genre: '星际扫雷 · 逻辑勘探',
    summary: '在未知里，点亮一片星空。三档星区、每日星图与扫描脉冲，把每次小心翼翼变成一场宇宙探索。',
    description: '一台藏在浏览器里的深空勘探仪。沿数字线索避开引力地雷，用旗帜标记异常，点亮所有安全区域。星云流动、流星掠过，空白区域如星潮般展开；首次点击及周围八格安全，还可以发射三次辅助扫描。',
    cover: 'games/minesweeper/cover.svg',
    tags: ['益智', '逻辑', '扫雷', '星空'],
    released: '2026-10-22',
    controls: [
      { keys: ['鼠标', '触屏'], label: '点击探索星区；数字代表周围八格中的地雷数量' },
      { keys: ['右键', '长按'], label: '循环切换旗帜、问号与清空；也可使用下方标记模式' },
      { keys: ['点击数字'], label: '周围旗帜数量吻合后连锁开格；错误标记仍可能触雷' },
      { keys: ['方向键'], label: '在星图中移动焦点，空格或回车探索，F 标记' },
      { keys: ['H'], label: '安全扫描，每局三次；使用后计为辅助通关' },
      { keys: ['P', 'Esc'], label: '暂停 / 继续；R 重新起航，? 查看玩法' },
    ],
    notes: [
      '近地轨道 9×9 / 10 雷、星云深处 12×12 / 26 雷、事件视界 16×16 / 52 雷。每日星图从中央安全区起航，相同日期和难度使用同一张地图。',
      '三种光谱、动态星云、流星、开格光波、扫描雷达、胜负粒子与 WebAudio 合成音效。支持减少动态效果设置、键盘、触屏和全屏；窄屏上的大型星图可横向滚动。',
      '星图与航行计时自动保存在当前浏览器；离开页面后可续玩。最佳航线仅记录没有使用扫描的通关，胜场和连胜也会保留。',
    ],
    load: () => import('../games/minesweeper/Minesweeper.vue'),
  },
  {
    slug: 'sudoku',
    name: '数独',
    enName: 'Sudoku · A Quiet Logic Ritual',
    genre: '经典逻辑解谜',
    summary: '让 1–9 各归其位。五档难度、候选笔记与唯一解题目，随时开始一场安静的推理。',
    description:
      '一款完整的经典数独。每局实时生成唯一解题目，提供五档难度、候选笔记、错误提示、撤销、擦除与智能提示；计时、最佳成绩和未完成进度会自动保存在本地。',
    cover: 'games/sudoku/cover.svg',
    tags: ['益智', '逻辑', '经典'],
    released: '2026-10-14',
    controls: [
      { keys: ['鼠标', '触屏'], label: '选择格子，再使用数字面板填写；再次点击笔记数字可取消' },
      { keys: ['1', '…', '9'], label: '填写数字或候选笔记' },
      { keys: ['方向键'], label: '在九宫格中移动选中位置' },
      { keys: ['N'], label: '开启 / 关闭笔记模式' },
      { keys: ['Backspace', 'Delete'], label: '擦除当前格内容' },
      { keys: ['Ctrl', 'Z'], label: '撤销上一步' },
      { keys: ['H'], label: '提示当前格；未选择可填写格时自动寻找下一格' },
      { keys: ['Esc', 'P'], label: '暂停 / 继续' },
    ],
    notes: [
      '简单、中等、较难、专家与极限五档题目均在浏览器内即时生成，并通过回溯求解器验证唯一解；题面使用中心对称挖空，兼顾逻辑性与视觉平衡。',
      '支持同行、同列、同宫及相同数字高亮，正确填写会自动清理相关候选笔记。游戏进度每五秒及每次操作后保存在本地，切换页面后也可继续。',
      '桌面端支持完整键盘操作，手机端提供紧凑数字键盘与工具栏；棋盘包含可访问性标签，并适配全屏游玩。',
    ],
    load: () => import('../games/sudoku/Sudoku.vue'),
  },
  {
    slug: 'super-mario',
    name: '超级玛丽',
    enName: 'Super Mario · Mushroom Kingdom',
    genre: '像素平台冒险',
    summary: '顶起一块砖，跃过一片云。四个世界、隐藏密室与十二枚星章，重温跳跃的快乐。',
    description: '蘑菇王国的新冒险。从青风草原出发，穿过萤石地底与云上群岛，闯入余烬城堡。收集金币、顶砖变身、踩怪踢龟壳，寻找隐藏房间与十二枚星章，击败城堡守卫，救出公主。',
    cover: 'games/super-mario/cover.svg',
    tags: ['动作', '平台', '像素', '单文件'],
    released: '2026-10-10',
    controls: [
      { keys: ['←', '→', 'A', 'D'], label: '左右移动' },
      { keys: ['空格', 'Z', 'K'], label: '跳跃；长按跳得更高，踩怪时按住可弹得更高' },
      { keys: ['Shift', 'J'], label: '冲刺；火焰形态下持续发射火球' },
      { keys: ['X'], label: '火焰形态下发射火球' },
      { keys: ['↓', 'S'], label: '蹲下；站在带箭头的水管上进入隐藏房间' },
      { keys: ['Esc', 'P'], label: '暂停 / 继续' },
    ],
    notes: [
      '四个手工设计的世界、移动平台、隐藏金币房、检查点与城堡首领。蘑菇成长、火焰花和无敌星星带来不同玩法，100 枚金币奖励额外生命。',
      '画面由 Canvas 与手绘像素矩阵生成，音乐与音效由 WebAudio 合成；整款游戏编译为一个可离线打开的 HTML，源码、调试文件和压缩中间产物全部保留。',
      '手机提供独立于画面的多点触控按钮。已解锁世界、通关星章与最高得分保存在本地浏览器。',
    ],
    load: () => import('../games/super-mario/SuperMario.vue'),
  },
  {
    slug: 'ember-lantern',
    name: '烬灯行',
    enName: 'Ember Lantern',
    genre: '像素横版动作肉鸽',
    summary: '十层长夜，一盏孤灯。三段连击、冲刺闪避，每层择一强化。',
    description:
      '像素横版动作肉鸽。十层长夜，三段连击、冲刺闪避，每层肃清后从三盏灯火中择一强化，第五层与第十层各有首领镇守。',
    cover: 'games/ember-lantern/cover.svg',
    tags: ['动作', '肉鸽', '像素'],
    released: '2026-10-09',
    controls: [
      { keys: ['A', 'D'], label: '/ 方向键 移动' },
      { keys: ['K', '空格'], label: '跳跃，空中可再跳一次' },
      { keys: ['J'], label: '攻击，连按打出三段连击' },
      { keys: ['L', 'Shift'], label: '冲刺，冲刺期间无敌' },
      { keys: ['↓'], label: '+ 跳跃 落下平台' },
      { keys: ['Esc'], label: '暂停' },
    ],
    notes: ['全部画面由 Canvas 实时绘制，音效由 WebAudio 合成，无外部素材。', '最佳纪录保存在本地浏览器。手机端会显示触屏按键。'],
    load: () => import('../games/ember-lantern/EmberLantern.vue'),
  },
  {
    slug: 'melon-fluid',
    name: '瓜体实验室',
    enName: 'Fluid Melon Lab',
    genre: '半流体物理解谜',
    summary: '让果实流动起来。改变材质、倾斜容器，在压力与黏性中完成融合。',
    description:
      '一款围绕“可变物性”设计的合成游戏。果实不再是坚硬圆球：它们会受压变形、黏滞流动并填入缝隙。切换果冻、半流体与果汁三种材质，利用倾斜和能量涡旋控制果池，合成最终的西瓜。',
    cover: 'games/melon-fluid/cover.svg',
    tags: ['物理', '合成', '半流体'],
    released: '2026-10-09',
    controls: [
      { keys: ['鼠标', '触屏'], label: '移动瞄准，点击投放果实' },
      { keys: ['A', 'D'], label: '向左 / 向右倾斜容器' },
      { keys: ['←', '→'], label: '键盘微调投放位置' },
      { keys: ['Enter'], label: '投放果实' },
      { keys: ['空格'], label: '消耗 30 能量搅动果池' },
    ],
    notes: [
      '三种材质拥有不同的重力、弹性、黏性与变形幅度；24 点弹性轮廓模拟局部受压，保持面积近似不变。融合会恢复能量。',
      '全部画面由 Canvas 实时绘制，声音由 WebAudio 合成，最佳分数保存在本地浏览器。',
    ],
    load: () => import('../games/melon-fluid/MelonFluid.vue'),
  },
]

export const findGame = (slug: string) => games.find((g) => g.slug === slug)

export const coverUrl = (game: GameEntry) => `${import.meta.env.BASE_URL || './'}${game.cover}`
