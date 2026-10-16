<template>
  <section class="utility-tool" aria-label="文本处理工具箱">
    <div class="text-stats" aria-label="文本统计">
      <span><b>{{ stats.characters }}</b>字符</span>
      <span><b>{{ stats.noSpaces }}</b>不含空格</span>
      <span><b>{{ stats.words }}</b>词</span>
      <span><b>{{ stats.lines }}</b>行</span>
      <span><b>{{ stats.bytes }}</b>字节</span>
    </div>
    <div class="utility-two-column">
      <label class="utility-field">
        <span><b>INPUT / 输入</b><small>{{ input.length }} 字符</small></span>
        <textarea v-model="input" placeholder="粘贴需要整理的文字…" spellcheck="false"></textarea>
      </label>
      <label class="utility-field">
        <span><b>OUTPUT / 输出</b><small>{{ output.length }} 字符</small></span>
        <textarea :value="output" readonly placeholder="选择下方操作。" spellcheck="false"></textarea>
      </label>
    </div>
    <div class="text-operations" role="group" aria-label="文本处理操作">
      <button v-for="operation in operations" :key="operation.id" type="button" @click="run(operation.id)">{{ operation.label }}</button>
    </div>
    <div class="utility-actions">
      <button class="champagne-button" type="button" :disabled="!output" @click="applyOutput">用结果继续处理 ↗</button>
      <button class="glass-button" type="button" :disabled="!output" @click="copyOutput">复制结果</button>
      <span class="utility-status" :class="{ error }" role="status">{{ notice }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type Operation = 'trim' | 'blank' | 'dedupe' | 'sortAsc' | 'sortDesc' | 'upper' | 'lower'

const operations: Array<{ id: Operation; label: string }> = [
  { id: 'trim', label: '清理行首尾空格' },
  { id: 'blank', label: '移除空行' },
  { id: 'dedupe', label: '按行去重' },
  { id: 'sortAsc', label: '升序排列' },
  { id: 'sortDesc', label: '降序排列' },
  { id: 'upper', label: '转大写' },
  { id: 'lower', label: '转小写' },
]

const input = ref('保持好奇。\nStay curious.\n\n保持好奇。')
const output = ref('')
const notice = ref('')
const error = ref(false)
const stats = computed(() => ({
  characters: input.value.length,
  noSpaces: input.value.replace(/\s/g, '').length,
  words: (input.value.trim().match(/[\p{L}\p{N}]+/gu) ?? []).length,
  lines: input.value ? input.value.split(/\r?\n/).length : 0,
  bytes: new TextEncoder().encode(input.value).length,
}))

function run(operation: Operation) {
  const lines = input.value.replace(/\r\n/g, '\n').split('\n')
  if (operation === 'trim') output.value = lines.map((line) => line.trim()).join('\n')
  if (operation === 'blank') output.value = lines.filter((line) => line.trim()).join('\n')
  if (operation === 'dedupe') output.value = [...new Set(lines)].join('\n')
  if (operation === 'sortAsc') output.value = [...lines].sort((a, b) => a.localeCompare(b, 'zh-CN')).join('\n')
  if (operation === 'sortDesc') output.value = [...lines].sort((a, b) => b.localeCompare(a, 'zh-CN')).join('\n')
  if (operation === 'upper') output.value = input.value.toLocaleUpperCase()
  if (operation === 'lower') output.value = input.value.toLocaleLowerCase()
  error.value = false
  notice.value = '已完成。'
}

function applyOutput() {
  input.value = output.value
  output.value = ''
  notice.value = '结果已移到输入区。'
}

async function copyOutput() {
  try {
    await navigator.clipboard.writeText(output.value)
    error.value = false
    notice.value = '已复制到剪贴板。'
  } catch {
    error.value = true
    notice.value = '剪贴板暂不可用。'
  }
}
</script>

<style scoped>
.text-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:16px}.text-stats span{display:grid;gap:3px;padding:12px;border:1px solid #d9e2eb;border-radius:10px;color:#8190a0;font-size:8px;text-align:center;background:#f8fafc}.text-stats b{color:#3155e7;font:17px var(--font-mono)}.text-operations{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.text-operations button{padding:9px 13px;border:1px solid #d1dce6;border-radius:100px;background:#f7fafc;color:#526a7f;font-size:10px}.text-operations button:hover{border-color:#3155e7;color:#3155e7}@media(max-width:620px){.text-stats{grid-template-columns:repeat(3,1fr)}}
</style>
