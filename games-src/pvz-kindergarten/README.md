# 植物大战僵尸幼儿园版 V0.9.5 · 浏览器移植

目标是保留用户提供版本的原始界面、植物、僵尸、动画与关卡流程。游戏内部独立于 Yumo 站点样式，以 800×600 的原始比例渲染。

## 当前实现

- 采用 [PvZ-Portable](https://github.com/wszqkzqk/PvZ-Portable) WebAssembly 引擎，自动加载随站点部署的原始资源。
- 从标题画面、原始菜单、用户名弹窗进入冒险，界面由原始图片和 compiled 动画直接呈现，不重新设计游戏菜单。
- 无游戏资源上传、文件选择或用户导入步骤。入口 `/#/games/pvz-kindergarten`；也可直接打开 `/games/pvz-kindergarten/index.html`。
- 浏览器加载同源分块资源包，校验 SHA-256，装载到 WASM 虚拟文件系统；实时显示下载进度，失败最多尝试三次。资源使用 Cache Storage 持久缓存，缓存受限时回退到网络；存档单独使用 IndexedDB，可备份/恢复 ZIP。
- PNG/GIF 透明遮罩通过大小写不敏感 PAK 索引处理；保留原始 compiled 关键帧，兼容原资源与新引擎之间的清单 ID 别名。

## 本地运行

```sh
npm run game:pvz
npm run dev
npm run build:pages
```

资源包和清单位于 `public/games/pvz-kindergarten/native/`，开发、预览及静态部署均使用这些文件。无需本机原游戏目录、临时文件或额外服务器插件。首次下载约 170 MiB；缓存可用且资源未变化时，后续启动不再重新下载分包，但仍需解压并初始化引擎。

重新生成本地包需要 Python 3，将 `--source` 指向原始游戏目录：

```powershell
python games-src/pvz-kindergarten/tools/package_native.py --source "C:\path\to\game" --output public/games/pvz-kindergarten/native
npm run build:pages
```

生成包包含 3,431 个资源文件，约 207 MiB 展开数据，分为 10 块；EXE、DLL、辅助修改器、崩溃日志和用户无关文档不进入网页资源。

## 发布状态与一致性边界

用户于 2026-10-23 明确确认允许分发，现将 10 个资源分包及校验清单纳入版本控制并同步到 `docs/`。整个发布站点约 216 MiB，最大分包约 30 MiB；无需 Git LFS。构建产物提交并推送后，GitHub Pages 才会更新；不能将本地构建成功等同于线上发布完成。

`npm run game:pvz` 校验所有分包的名称、存在性、字节数和 SHA-256 后，生成 `native/availability.json`。缺包或损坏会阻止构建；没有清单时才回退为不可游玩的预览状态，不启动引擎。

引擎基于 GOTY 规则，不自动包含幼儿园版 EXE 的所有定制逻辑。已验证标题、动态菜单及进入冒险第一关；中文字体、部分动画轨道、自定义 MP3 配乐、全部关卡与手机操作仍待对照，不能称为一比一完整复刻。

## 文件

- `native.html`：独立游戏画布及加载状态，仅画布外有存档备份工具。
- `native-loader.mjs`：自动加载、哈希校验、WASM 启动、存档与 iframe 通信。
- `native-download.mjs`：流式进度、重试和按资源哈希区分的持久缓存；仅淘汰同一分包的旧缓存，不触碰存档。
- `native-manifest.mjs`：构建前校验资源包完整性。
- `native-compat.mjs`：原始 compiled / alpha 遮罩 PAK 和资源别名。
- `tools/package_native.py`：原始资源分块打包，可通过 `--output` 选择输出目录。
- `tools/prepare_native_compat.py`：指定 `--source` 原版目录和 `--engine-root` 解压后的引擎源码目录生成兼容表；未匹配资源直接报错。
- `build.mjs`：生成 `public/games/pvz-kindergarten/index.html`。
- `public/games/pvz-kindergarten/native/`：上游 WASM 及 JS、JSZip、源码、许可证和兼容表。

上游引擎版本、对应源码和许可证见 `public/games/pvz-kindergarten/native/THIRD-PARTY-NOTICES.md`。引擎的开源许可不代表原始游戏素材的再分发授权。
