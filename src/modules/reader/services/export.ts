import JSZip from 'jszip'
import type { LibraryBook } from '../types'

function safeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, '_').trim() || 'book'
}

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportTxt(book: LibraryBook) {
  const content = [book.title, `作者：${book.author}`, '', ...book.chapters.flatMap((chapter) => [chapter.title, '', chapter.content, '', ''])].join('\n')
  download(new Blob(['\uFEFF', content], { type: 'text/plain;charset=utf-8' }), `${safeFileName(book.title)}.txt`)
}

export async function exportEpub(book: LibraryBook) {
  const zip = new JSZip()
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })
  zip.file('META-INF/container.xml', '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>')
  zip.file('OEBPS/style.css', 'body{font-family:serif;line-height:1.9;margin:6%;}h1{font-size:1.6em;margin-bottom:2em;}p{text-indent:2em;margin:.8em 0;}')

  const manifest: string[] = []
  const spine: string[] = []
  const nav: string[] = []
  book.chapters.forEach((chapter, index) => {
    const id = `chapter-${index + 1}`
    const file = `${id}.xhtml`
    const paragraphs = chapter.content.split(/\n+/).filter(Boolean).map((paragraph) => `<p>${escapeXml(paragraph)}</p>`).join('')
    zip.file(`OEBPS/${file}`, `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" lang="zh-CN"><head><title>${escapeXml(chapter.title)}</title><link rel="stylesheet" href="style.css"/></head><body><h1>${escapeXml(chapter.title)}</h1>${paragraphs}</body></html>`)
    manifest.push(`<item id="${id}" href="${file}" media-type="application/xhtml+xml"/>`)
    spine.push(`<itemref idref="${id}"/>`)
    nav.push(`<li><a href="${file}">${escapeXml(chapter.title)}</a></li>`)
  })
  zip.file('OEBPS/nav.xhtml', `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>目录</title></head><body><nav epub:type="toc"><h1>目录</h1><ol>${nav.join('')}</ol></nav></body></html>`)
  zip.file('OEBPS/content.opf', `<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">${escapeXml(book.id)}</dc:identifier><dc:title>${escapeXml(book.title)}</dc:title><dc:creator>${escapeXml(book.author)}</dc:creator><dc:language>zh-CN</dc:language><meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="style" href="style.css" media-type="text/css"/>${manifest.join('')}</manifest><spine>${spine.join('')}</spine></package>`)
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip', compression: 'DEFLATE' })
  download(blob, `${safeFileName(book.title)}.epub`)
}

