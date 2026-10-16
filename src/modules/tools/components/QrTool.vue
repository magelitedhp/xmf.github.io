<template>
  <section class="utility-tool qr-layout" aria-label="二维码生成器">
    <div class="qr-controls">
      <label class="utility-field">
        <span><b>CONTENT / 二维码内容</b><small>{{ content.length }} 字符</small></span>
        <textarea v-model="content" maxlength="2000" placeholder="输入链接、文字、联系方式…" spellcheck="false"></textarea>
      </label>
      <div class="qr-options">
        <label class="utility-field"><span><b>尺寸</b><small>{{ size }} px</small></span><input v-model.number="size" type="range" min="192" max="768" step="32" /></label>
        <label class="utility-field"><span><b>前景色</b></span><input v-model="dark" type="color" /></label>
        <label class="utility-field"><span><b>背景色</b></span><input v-model="light" type="color" /></label>
      </div>
      <div class="utility-actions">
        <button class="champagne-button" type="button" :disabled="!content.trim()" @click="generate">生成二维码 ↗</button>
        <button class="glass-button" type="button" :disabled="!dataUrl" @click="download">下载 PNG</button>
      </div>
      <p class="utility-status" :class="{ error }" role="status">{{ notice }}</p>
    </div>
    <div class="qr-preview">
      <img v-if="dataUrl" :src="dataUrl" alt="生成的二维码" />
      <div v-else class="utility-empty">二维码预览</div>
      <small>内容只在当前浏览器中生成</small>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import QRCode from 'qrcode'

const content = ref('https://www.xuxy.cloud/')
const size = ref(320)
const dark = ref('#192822')
const light = ref('#ffffff')
const dataUrl = ref('')
const notice = ref('')
const error = ref(false)

async function generate() {
  if (!content.value.trim()) return
  try {
    dataUrl.value = await QRCode.toDataURL(content.value, {
      width: size.value,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: dark.value, light: light.value },
    })
    error.value = false
    notice.value = '二维码已生成。'
  } catch {
    dataUrl.value = ''
    error.value = true
    notice.value = '内容过长或二维码生成失败。'
  }
}

function download() {
  if (!dataUrl.value) return
  const anchor = document.createElement('a')
  anchor.href = dataUrl.value
  anchor.download = 'yumo-qrcode.png'
  anchor.click()
}

onMounted(generate)
</script>

<style scoped>
.qr-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(240px,.48fr);gap:24px}.qr-controls{min-width:0}.qr-controls textarea{min-height:190px}.qr-options{display:grid;grid-template-columns:1fr 80px 80px;gap:12px;margin-top:14px}.qr-options input[type=color]{width:100%;height:46px;padding:4px;border:1px solid #d4dfe9;border-radius:10px;background:#fff}.qr-options input[type=range]{height:46px;margin:0}.qr-preview{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;min-height:330px;padding:20px;border:1px solid #d5dfe8;border-radius:14px;background:linear-gradient(145deg,#f8fbfd,#edf2f7)}.qr-preview img{width:min(100%,320px);aspect-ratio:1;object-fit:contain;border-radius:8px;box-shadow:0 12px 35px #4058731a}.qr-preview small{color:#8998a8;font-size:9px}@media(max-width:760px){.qr-layout{grid-template-columns:1fr}.qr-preview{min-height:280px}.qr-options{grid-template-columns:1fr 70px 70px}}
</style>
