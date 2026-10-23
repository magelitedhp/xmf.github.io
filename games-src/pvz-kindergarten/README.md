# 植物大战僵尸幼儿园版 V0.9.5 · 浏览器移植

目标是保留用户提供版本的原始界面、植物、僵尸、动画与关卡流程。游戏内部独立于 Yumo 站点样式，以 800×600 的原始比例渲染。

## 当前实现

- 采用 [PvZ-Portable](https://github.com/wszqkzqk/PvZ-Portable) WebAssembly 引擎，自动加载本机原始资源。
- 从标题画面、原始菜单、用户名弹窗进入冒险，界面由原始图片和 compiled 动画直接呈现，不重新设计游戏菜单。
- 无游戏资源上传、文件选择或用户导入步骤。入口 `/#/games/pvz-kindergarten`；也可直接打开 `/games/pvz-kindergarten/index.html`。
- 浏览器加载同源分块资源包，校验 SHA-256，装载到 WASM 的本机虚拟文件系统。存档使用 IndexedDB，可单独备份/恢复存档 ZIP。
- PNG/GIF 透明遮罩通过大小写不敏感 PAK 索引处理；保留原始 compiled 关键帧，兼容原资源与新引擎之间的清单 ID 别名。

## 本地运行

```sh
npm run game:pvz
npm run dev
```

当前本机资源已打包在 Git 忽略的 `.tmp-pvz-portable/local-resources/`。Vite 的 `pvzLocalResources` 插件仅向回环地址提供这些分块，不复制到 `public`、`dist` 或 `docs`。
它使本机可以直接点击运行，无需用户上传或再次选择目录。`vite preview` 使用同一回环资源服务。

重新生成本地包需要 Python 3，将 `--source` 指向原始游戏目录：

```powershell
python games-src/pvz-kindergarten/tools/package_native.py --source "C:\path\to\game"
```

生成包包含 3,431 个资源文件，约 207 MiB 展开数据，分为 10 块；EXE、DLL、辅助修改器、崩溃日志和用户无关文档不进入网页资源。

## 发布状态与一致性边界

完整数据包尚未纳入静态发布目录，公开再分发许可仍待确认。当前本机开发 / 预览服务器可以直接运行；静态发布的游戏厅保留移植预览入口，但明确提示暂不可在线游玩，不请求缺失资源包或加载引擎。构建产物同步到 `docs/` 后，需要提交并推送才会更新网站。

`npm run game:pvz` 同时生成 `native/availability.json`，指明公开目录是否带有完整资源清单。本机 Vite 插件按本地资源包状态响应同一地址，保留无需上传的直接启动流程。

引擎基于 GOTY 规则，不自动包含幼儿园版 EXE 的所有定制逻辑。已验证标题、动态菜单及进入冒险第一关；中文字体、部分动画轨道、自定义 MP3 配乐、全部关卡与手机操作仍待对照，不能称为一比一完整复刻。

## 文件

- `native.html`：独立游戏画布及加载状态，仅画布外有存档备份工具。
- `native-loader.mjs`：自动加载、哈希校验、WASM 启动、存档与 iframe 通信。
- `native-compat.mjs`：原始 compiled / alpha 遮罩 PAK 和资源别名。
- `tools/package_native.py`：本地原资源分块打包，不公开发布。
- `tools/prepare_native_compat.py`：指定 `--source` 原版目录和 `--engine-root` 解压后的引擎源码目录生成兼容表；未匹配资源直接报错。
- `build.mjs`：生成 `public/games/pvz-kindergarten/index.html`。
- `public/games/pvz-kindergarten/native/`：上游 WASM 及 JS、JSZip、源码、许可证和兼容表。

上游引擎版本、对应源码和许可证见 `public/games/pvz-kindergarten/native/THIRD-PARTY-NOTICES.md`。引擎的开源许可不代表原始游戏素材的再分发授权。
