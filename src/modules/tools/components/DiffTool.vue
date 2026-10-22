<template>
  <section class="utility-tool" aria-label="文本差异对比">
    <div class="utility-two-column diff-inputs">
      <label class="utility-field"><span><b>ORIGINAL / 原文本</b><small>{{ leftLines }} 行</small></span><textarea v-model="left" spellcheck="false"></textarea></label>
      <label class="utility-field"><span><b>CHANGED / 新文本</b><small>{{ rightLines }} 行</small></span><textarea v-model="right" spellcheck="false"></textarea></label>
    </div>
    <div class="diff-toolbar">
      <label><input v-model="ignoreWhitespace" type="checkbox" /> 忽略空白差异</label>
      <label><input v-model="ignoreCase" type="checkbox" /> 忽略大小写</label>
      <button class="champagne-button" type="button" @click="compare">开始对比 ↗</button>
      <span v-if="hasCompared" class="diff-summary">+{{ additions }} / −{{ removals }}</span>
    </div>

    <div v-if="hasCompared" class="diff-output" role="region" aria-label="差异结果">
      <div v-for="(line, index) in result" :key="`${index}-${line.kind}`" :class="`is-${line.kind}`">
        <span class="diff-number">{{ line.leftLine ?? '' }}</span>
        <span class="diff-number">{{ line.rightLine ?? '' }}</span>
        <b>{{ line.kind === 'add' ? '+' : line.kind === 'remove' ? '−' : ' ' }}</b>
        <code>{{ line.text || ' ' }}</code>
      </div>
    </div>
    <div v-else class="utility-empty">对比结果会逐行显示在这里。</div>
    <p class="utility-status" role="status">{{ notice }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { diffLines, type DiffLine } from '../utils/diff'

const left = ref('保持好奇。\n给灵感一张工作台。\n内容只在浏览器处理。')
const right = ref('保持好奇。\n给想法一张工作台。\n内容只在当前浏览器处理。')
const ignoreWhitespace = ref(false)
const ignoreCase = ref(false)
const result = ref<DiffLine[]>([])
const hasCompared = ref(false)
const notice = ref('')
const leftLines = computed(() => left.value ? left.value.split(/\r?\n/).length : 0)
const rightLines = computed(() => right.value ? right.value.split(/\r?\n/).length : 0)
const additions = computed(() => result.value.filter((line) => line.kind === 'add').length)
const removals = computed(() => result.value.filter((line) => line.kind === 'remove').length)

function compare() {
  result.value = diffLines(left.value, right.value, {
    ignoreCase: ignoreCase.value,
    ignoreWhitespace: ignoreWhitespace.value,
  })
  hasCompared.value = true
  const largeInput = leftLines.value * rightLines.value > 400_000
  notice.value = largeInput ? '文本较长，已使用快速块级对比。' : '对比完成。'
}
</script>

<style scoped>
.diff-inputs textarea{min-height:210px}.diff-toolbar{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin:16px 0}.diff-toolbar label{display:flex;align-items:center;gap:7px;color:#5d7286;font-size:12px}.diff-toolbar input{accent-color:#3155e7}.diff-toolbar .champagne-button{margin-left:auto}.diff-summary{padding:8px 12px;border-radius:100px;background:#edf2f7;color:#526b82;font:11px var(--font-mono)}.diff-output{max-height:520px;overflow:auto;border:1px solid #d4dfe9;border-radius:12px;background:#fbfcfd}.diff-output>div{display:grid;grid-template-columns:42px 42px 24px minmax(0,1fr);min-height:31px;border-bottom:1px solid #e7edf2}.diff-output>div:last-child{border-bottom:0}.diff-number{display:grid;place-items:center;border-right:1px solid #e0e7ed;color:#8393a2;font:11px var(--font-mono)}.diff-output b{display:grid;place-items:center;font:12px var(--font-mono)}.diff-output code{padding:6px 10px;color:#344c62;font:12px/1.6 var(--font-mono);white-space:pre-wrap;overflow-wrap:anywhere}.diff-output .is-add{background:#edf9f1}.diff-output .is-add b{color:#23824b}.diff-output .is-remove{background:#fff0ed}.diff-output .is-remove b{color:#bd4a36}.diff-output .is-equal{opacity:.7}@media(max-width:600px){.diff-toolbar .champagne-button{width:100%;margin-left:0}.diff-output>div{grid-template-columns:30px 30px 20px minmax(0,1fr)}}
</style>
