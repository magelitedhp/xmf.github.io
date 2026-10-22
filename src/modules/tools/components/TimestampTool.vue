<template>
  <section class="utility-tool" aria-label="时间戳转换">
    <div class="timestamp-input-row">
      <label class="utility-field">
        <span><b>TIMESTAMP / 日期时间</b><small>自动识别秒、毫秒或日期文本</small></span>
        <input v-model.trim="input" type="text" placeholder="例如 1720000000 或 2026-10-16 12:00" @keyup.enter="convert" />
      </label>
      <button class="glass-button" type="button" @click="useNow">使用当前时间</button>
      <button class="champagne-button" type="button" @click="convert">转换 ↗</button>
    </div>

    <div v-if="result" class="timestamp-results">
      <button v-for="row in result" :key="row.label" type="button" @click="copy(row.value)">
        <span>{{ row.label }}</span><strong>{{ row.value }}</strong><small>点击复制</small>
      </button>
    </div>
    <div v-else class="utility-empty">输入时间戳或日期文本，然后点击转换。</div>
    <p class="utility-status" :class="{ error }" role="status">{{ notice }}</p>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface TimeRow { label: string; value: string }

const input = ref(String(Math.floor(Date.now() / 1000)))
const result = ref<TimeRow[] | null>(null)
const notice = ref('')
const error = ref(false)
const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '本地时区'

function parseInput() {
  const value = input.value.trim()
  if (!value) return null
  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return null
    return new Date(Math.abs(numeric) < 100_000_000_000 ? numeric * 1000 : numeric)
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function convert() {
  const date = parseInput()
  if (!date || Number.isNaN(date.getTime())) {
    result.value = null
    error.value = true
    notice.value = '无法识别这个时间，请检查输入。'
    return
  }
  const milliseconds = date.getTime()
  result.value = [
    { label: `本地时间 · ${localZone}`, value: date.toLocaleString('zh-CN', { hour12: false }) },
    { label: 'UTC 时间', value: date.toUTCString() },
    { label: 'ISO 8601', value: date.toISOString() },
    { label: 'Unix 秒', value: String(Math.floor(milliseconds / 1000)) },
    { label: 'Unix 毫秒', value: String(milliseconds) },
  ]
  error.value = false
  notice.value = '已完成。点击任一结果即可复制。'
}

function useNow() {
  input.value = String(Math.floor(Date.now() / 1000))
  convert()
}

async function copy(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    error.value = false
    notice.value = '已复制到剪贴板。'
  } catch {
    error.value = true
    notice.value = '剪贴板暂不可用。'
  }
}

convert()
</script>

<style scoped>
.timestamp-input-row{display:grid;grid-template-columns:minmax(260px,1fr) auto auto;align-items:end;gap:12px}.timestamp-results{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:20px}.timestamp-results button{display:grid;gap:7px;padding:18px;text-align:left;border:1px solid #d5dfe9;border-radius:12px;background:#f8fbfd;color:#263d52}.timestamp-results button:hover{border-color:#3155e7;background:#f3f6ff}.timestamp-results span{color:#7b8ea1;font:11px var(--font-mono);letter-spacing:.6px}.timestamp-results strong{font:13px/1.7 var(--font-mono);overflow-wrap:anywhere}.timestamp-results small{color:#8495a5;font-size:11px}@media(max-width:760px){.timestamp-input-row{grid-template-columns:1fr 1fr}.timestamp-input-row .utility-field{grid-column:1/-1}.timestamp-results{grid-template-columns:1fr}}
</style>
