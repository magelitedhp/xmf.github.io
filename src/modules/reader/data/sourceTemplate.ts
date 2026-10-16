export const sourceTemplate = `[
  {
    "name": "示例书源",
    "url": "https://example.com/",
    "enabled": true,
    "corsProxy": "",
    "search": {
      "url": "https://example.com/search?q=%s",
      "method": "GET",
      "result": ".search-item",
      "bookName": "h3 > a",
      "author": ".author",
      "latestChapter": ".latest"
    },
    "book": {
      "bookName": "h1",
      "author": ".author",
      "intro": ".intro",
      "coverUrl": ".cover img@src"
    },
    "toc": { "item": ".chapter-list a" },
    "chapter": { "title": "h1", "content": ".chapter-content", "filterTag": "script,.ad" }
  }
]`

