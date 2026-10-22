import type { LibraryBook } from '../types'

export const guideBook: LibraryBook = {
  id: 'yumo-reader-guide',
  title: 'Yumo 阅读指南',
  author: 'Yumo',
  description: '一本留在书架上的简短说明：导入书籍、配置书源，并在浏览器里安静阅读。',
  sourceName: '内置指南',
  format: 'guide',
  createdAt: 1,
  updatedAt: 1,
  currentChapter: 0,
  currentOffset: 0,
  chapters: [
    { id: 'guide-1', title: '第一章 · 把书带进来', content: '默认书籍会自动显示在书架中，可以直接打开阅读。点击书架右上角的「导入书籍」，还可以选择 MD、TXT 或 EPUB 文件。\n\nMarkdown 支持标题、图文、链接和分节阅读，默认书籍中的相对图片会随正文显示；TXT 会识别常见的“第×章”标题；EPUB 会读取书名、作者、封面与阅读顺序。导入的书籍与阅读进度保存在当前浏览器。' },
    { id: 'guide-2', title: '第二章 · 添加书源', content: '进入「书源」页面，粘贴 JSON 规则即可导入。规则沿用常见的搜索、详情、目录、正文四段结构，并兼容 so-novel 的主要 CSS 选择器字段。\n\n纯前端页面受到 CORS 限制。如果源站不允许浏览器直连，可以在书源中配置 corsProxy。' },
    { id: 'guide-3', title: '第三章 · 留住阅读进度', content: '阅读器会保存当前章节、页面位置、字号、行距、版心宽度与主题。关闭页面后再次回来，仍然可以从上次停下的地方继续。\n\n你还可以把书架中的内容导出为 TXT 或 EPUB，作为自己的离线备份。' },
  ],
}

