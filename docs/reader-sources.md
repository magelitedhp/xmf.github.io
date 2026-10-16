# Yumo 阅读书源格式

阅读模块运行在浏览器中，书源用于描述“如何搜索一本书，以及如何从页面中解析目录和正文”。规则结构参考 [so-novel](https://github.com/freeok/so-novel)，当前支持 CSS Selector 和 XPath；出于安全与静态部署考虑，不执行书源中的 JavaScript。

## 导入方式

进入 `/#/read` → **书源管理**：

1. 点击“一键导入”即可载入项目内置的 so-novel 默认书源集；
2. 直接粘贴单个书源对象或书源数组；
3. 输入远程 JSON 地址导入，页面默认填写上游 `main.json` 地址，可用于获取较新的规则。

项目内置的 11 条规则复制自 [freeok/so-novel 的 `bundle/rules/main.json`](https://github.com/freeok/so-novel/blob/main/bundle/rules/main.json)，同步日期为 2026-10-16；原仓库采用 AGPL-3.0 许可证。内置规则让首次导入不依赖 GitHub 网络，但小说站改版后规则仍可能失效，届时可以通过远程地址重新导入上游版本。

## 最小规则

```json
{
  "name": "示例书源",
  "url": "https://example.com/",
  "enabled": true,
  "search": {
    "url": "https://example.com/search?q=%s",
    "method": "GET",
    "result": ".search-item",
    "bookName": "h3 > a",
    "author": ".author"
  },
  "book": {
    "bookName": "h1",
    "author": ".author",
    "intro": ".intro",
    "coverUrl": ".cover img@src"
  },
  "toc": {
    "item": ".chapter-list a"
  },
  "chapter": {
    "title": "h1",
    "content": ".chapter-content",
    "filterTag": "script,.ad",
    "filterTxt": "广告文本|请收藏本站"
  }
}
```

选择器默认返回元素文本。使用 `selector@href`、`selector@src`、`selector@content` 或 `selector@value` 可读取属性。以 `/` 或 `xpath:` 开头的选择器按 XPath 处理。

搜索地址和 POST 请求体支持 `%s`、`{keyword}`、`{{keyword}}` 作为关键词占位符。详情页与目录页不同时，`toc.url` 支持 `%s`，解析器会优先使用 `book.url` 正则的第一个捕获组作为书籍 ID。

## 跨域代理

许多小说站不允许网页跨域读取，或启用了 Cloudflare、验证码、IP 限制和访问频率限制。纯前端项目无法绕过这些限制。可以在书源中添加：

```json
{
  "corsProxy": "https://your-proxy.example/fetch?url={{url}}"
}
```

`{{url}}` 会替换为编码后的目标地址；也可以填写简单前缀。代理服务需由使用者自行部署和信任。请只连接有权访问的内容，并遵守来源站点的条款、robots 规则与请求频率。

## 本地数据

- TXT、EPUB、在线书籍章节与阅读进度保存在 IndexedDB。
- 书源和阅读设置保存在 LocalStorage。
- 在线章节按需获取并缓存，已经读取的内容可离线再次打开。
- 书架内容可导出为 UTF-8 TXT 或 EPUB 3 文件。

