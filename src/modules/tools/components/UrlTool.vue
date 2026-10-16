<template>
  <section class="utility-tool" aria-label="URL 编解码与参数解析">
    <div class="utility-two-column">
      <label class="utility-field">
        <span><b>INPUT / 输入</b><small>{{ input.length }} 字符</small></span>
        <textarea v-model="input" placeholder="粘贴 URL、查询参数或普通文字…" spellcheck="false"></textarea>
      </label>
      <label class="utility-field">
        <span><b>OUTPUT / 输出</b><small>{{ output.length }} 字符</small></span>
        <textarea :value="output" readonly placeholder="处理结果会出现在这里。" spellcheck="false"></textarea>
      </label>
    </div>
    <div class="utility-actions">
      <button class="champagne-button" type="button" @click="encode">URL 编码 ↗</button>
      <button class="glass-button" type="button" @click="decode">URL 解码</button>
      <button class="glass-button" type="button" @click="parseQuery">解析参数</button>
      <button class="glass-button" type="button" :disabled="!output" @click="copyOutput">复制结果</button>
      <span class="utility-status" :class="{ error }" role="status">{{ notice }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const input = ref('https://www.xuxy.cloud/?from=tools&tag=curious&tag=local')
const output = ref('')
const notice = ref('')
const error = ref(false)

function complete(value: string) {
  output.value = value
  error.value = false
  notice.value = '已完成。'
}

function encode() {
  complete(encodeURIComponent(input.value))
}

function decode() {
  try {
    complete(decodeURIComponent(input.value.replace(/\+/g, ' ')))
  } catch {
    output.value = ''
    error.value = true
    notice.value = '无法解码，请检查百分号编码是否完整。'
  }
}

function parseQuery() {
  try {
    const raw = input.value.trim()
    const query = raw.includes('://') ? new URL(raw).search : raw.replace(/^[^?]*\?/, '')
    const params = new URLSearchParams(query.replace(/^\?/, ''))
    const result: Record<string, string | string[]> = {}
    params.forEach((value, key) => {
      const existing = result[key]
      if (existing === undefined) result[key] = value
      else result[key] = Array.isArray(existing) ? [...existing, value] : [existing, value]
    })
    complete(JSON.stringify(result, null, 2))
  } catch {
    output.value = ''
    error.value = true
    notice.value = '无法解析，请输入有效 URL 或查询参数。'
  }
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
