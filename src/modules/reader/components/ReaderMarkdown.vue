<script lang="ts">
import { defineComponent, h, type VNodeChild } from 'vue'
import { parseMarkdownBlocks, resolveMarkdownUrl } from '../services/markdown'

export default defineComponent({
  props: {
    content: { type: String, required: true },
    baseUrl: { type: String, default: undefined },
  },
  setup(props) {
    function inline(text: string, depth = 0): VNodeChild[] {
      if (depth > 6) return [text]
      const pattern = /(!?)\[([^\]]*)\]\((<[^>\n]+>|[^)\n]+)\)|(`+)(.+?)\4|\*\*(.+?)\*\*|__(.+?)__|\*([^*\n]+)\*|_([^_\n]+)_/g
      const nodes: VNodeChild[] = []
      let cursor = 0
      for (const match of text.matchAll(pattern)) {
        const index = match.index ?? 0
        nodes.push(text.slice(cursor, index))
        if (match[3]) {
          const destination = match[3].match(/^(?:<([^>]+)>|(.+?))(?:\s+["']([^"']*)["'])?$/)
          const url = resolveMarkdownUrl(destination?.[1] ?? destination?.[2] ?? '', props.baseUrl, Boolean(match[1]))
          if (match[1]) nodes.push(url ? h('img', { src: url, alt: match[2], title: destination?.[3], loading: 'lazy', decoding: 'async' }) : `[图片：${match[2] || '本地图片'}]`)
          else nodes.push(url ? h('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, inline(match[2], depth + 1)) : match[2])
        } else if (match[4]) nodes.push(h('code', match[5]))
        else if (match[6] || match[7]) nodes.push(h('strong', inline(match[6] || match[7], depth + 1)))
        else nodes.push(h('em', inline(match[8] || match[9], depth + 1)))
        cursor = index + match[0].length
      }
      nodes.push(text.slice(cursor))
      return nodes
    }

    return () => h('div', { class: 'reading-content reading-markdown' }, parseMarkdownBlocks(props.content).map((block) => {
      if (block.kind === 'heading') return h(`h${Math.max(2, block.level ?? 2)}`, inline(block.text))
      if (block.kind === 'code') return h('pre', [h('code', block.text)])
      if (block.kind === 'quote') return h('blockquote', inline(block.text))
      if (block.kind === 'rule') return h('hr')
      if (block.kind === 'list') return h(block.ordered ? 'ol' : 'ul', block.items?.map((item) => h('li', inline(item))))
      return h('p', inline(block.text))
    }))
  },
})
</script>

<style>
.reading-markdown h2,
.reading-markdown h3,
.reading-markdown h4,
.reading-markdown h5,
.reading-markdown h6 {
  margin: 1.8em 0 .8em;
  font-family: inherit;
  font-size: 1.25em;
  line-height: 1.5;
  letter-spacing: 0;
}

.reading-markdown img {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 75vh;
  margin: 1em auto;
  border-radius: 6px;
  object-fit: contain;
}

.reading-markdown a {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: .2em;
  overflow-wrap: anywhere;
}

.reading-markdown blockquote {
  margin: 1em 0 1.5em;
  padding: .4em 1em;
  border-left: 3px solid currentColor;
  opacity: .75;
  white-space: pre-line;
}

.reading-markdown ul,
.reading-markdown ol {
  margin: 1em 0;
  padding-left: 1.8em;
}

.reading-markdown li { margin-bottom: .4em; }
.reading-markdown code { font-size: .85em; overflow-wrap: anywhere; }
.reading-markdown pre {
  overflow-x: auto;
  margin: 1.2em 0;
  padding: 1em;
  border: 1px solid currentColor;
  border-radius: 8px;
  white-space: pre;
}
.reading-markdown hr { margin: 2em 0; border: 0; border-top: 1px solid currentColor; opacity: .25; }
</style>
