<template>
  <section class="utility-tool" aria-label="图片压缩与格式转换">
    <label class="image-drop" :class="{ ready: originalUrl }" @dragover.prevent @drop.prevent="handleDrop">
      <input type="file" accept="image/*" @change="handleFileInput" />
      <template v-if="originalUrl">
        <img :src="originalUrl" alt="原图预览" />
        <span><b>{{ file?.name }}</b><small>{{ originalMeta }}</small></span>
      </template>
      <template v-else>
        <strong>把图片拖到这里</strong>
        <span>或点击选择 PNG、JPEG、WebP 等图片</span>
      </template>
    </label>

    <div class="image-settings">
      <label class="utility-field"><span><b>输出宽度</b><small>像素</small></span><input v-model.number="targetWidth" type="number" min="1" max="12000" /></label>
      <label class="utility-field"><span><b>输出格式</b></span><select v-model="format"><option value="image/webp">WebP</option><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option></select></label>
      <label class="utility-field quality-field"><span><b>质量</b><small>{{ Math.round(quality * 100) }}%</small></span><input v-model.number="quality" type="range" min="0.1" max="1" step="0.05" :disabled="format === 'image/png'" /></label>
      <button class="champagne-button" type="button" :disabled="!file || processing" @click="processImage">{{ processing ? '处理中…' : '生成图片 ↗' }}</button>
    </div>

    <div v-if="resultUrl" class="image-result">
      <img :src="resultUrl" alt="处理后的图片预览" />
      <div><span>OUTPUT / 输出图片</span><strong>{{ resultMeta }}</strong><small>{{ savingText }}</small></div>
      <button class="glass-button" type="button" @click="download">下载图片</button>
    </div>
    <p class="utility-status" :class="{ error }" role="status">{{ notice }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

const file = ref<File | null>(null)
const originalUrl = ref('')
const resultUrl = ref('')
const originalWidth = ref(0)
const originalHeight = ref(0)
const targetWidth = ref(0)
const format = ref<'image/webp' | 'image/jpeg' | 'image/png'>('image/webp')
const quality = ref(0.82)
const resultBlob = ref<Blob | null>(null)
const resultWidth = ref(0)
const resultHeight = ref(0)
const processing = ref(false)
const notice = ref('')
const error = ref(false)

const originalMeta = computed(() => file.value
  ? `${originalWidth.value} × ${originalHeight.value} · ${formatBytes(file.value.size)}`
  : '')
const resultMeta = computed(() => resultBlob.value
  ? `${resultWidth.value} × ${resultHeight.value} · ${formatBytes(resultBlob.value.size)}`
  : '')
const savingText = computed(() => {
  if (!file.value || !resultBlob.value) return ''
  const difference = 1 - resultBlob.value.size / file.value.size
  return difference > 0 ? `体积减少 ${Math.round(difference * 100)}%` : `体积增加 ${Math.round(Math.abs(difference) * 100)}%`
})

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片读取失败'))
    image.src = url
  })
}

async function selectFile(nextFile?: File) {
  if (!nextFile || !nextFile.type.startsWith('image/')) {
    error.value = true
    notice.value = '请选择有效的图片文件。'
    return
  }
  if (nextFile.size > 30 * 1024 * 1024) {
    error.value = true
    notice.value = '图片请控制在 30 MB 以内。'
    return
  }
  clearUrls()
  file.value = nextFile
  originalUrl.value = URL.createObjectURL(nextFile)
  try {
    const image = await loadImage(originalUrl.value)
    originalWidth.value = image.naturalWidth
    originalHeight.value = image.naturalHeight
    targetWidth.value = image.naturalWidth
    error.value = false
    notice.value = '图片已载入，可调整参数后生成。'
  } catch {
    error.value = true
    notice.value = '无法读取这张图片。'
  }
}

function handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement
  selectFile(input.files?.[0])
  input.value = ''
}

function handleDrop(event: DragEvent) {
  selectFile(event.dataTransfer?.files[0])
}

async function processImage() {
  if (!file.value || !originalUrl.value) return
  const width = Math.max(1, Math.min(12_000, Math.round(targetWidth.value || originalWidth.value)))
  const height = Math.max(1, Math.round(width * originalHeight.value / originalWidth.value))
  if (width * height > 40_000_000) {
    error.value = true
    notice.value = '输出尺寸过大，请控制在 4000 万像素以内。'
    return
  }
  processing.value = true
  try {
    const image = await loadImage(originalUrl.value)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('浏览器不支持 Canvas')
    if (format.value === 'image/jpeg') {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, width, height)
    }
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, format.value, quality.value))
    if (!blob) throw new Error('无法生成目标格式')
    if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
    resultBlob.value = blob
    resultUrl.value = URL.createObjectURL(blob)
    resultWidth.value = width
    resultHeight.value = height
    error.value = false
    notice.value = '处理完成。'
  } catch (cause) {
    error.value = true
    notice.value = cause instanceof Error ? cause.message : '图片处理失败。'
  } finally {
    processing.value = false
  }
}

function download() {
  if (!resultUrl.value || !file.value) return
  const extension = format.value.split('/')[1].replace('jpeg', 'jpg')
  const baseName = file.value.name.replace(/\.[^.]+$/, '')
  const anchor = document.createElement('a')
  anchor.href = resultUrl.value
  anchor.download = `${baseName}-${resultWidth.value}w.${extension}`
  anchor.click()
}

function clearUrls() {
  if (originalUrl.value) URL.revokeObjectURL(originalUrl.value)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  originalUrl.value = ''
  resultUrl.value = ''
  resultBlob.value = null
}

onBeforeUnmount(clearUrls)
</script>

<style scoped>
.image-drop{position:relative;display:flex;min-height:210px;align-items:center;justify-content:center;flex-direction:column;gap:9px;padding:24px;border:1px dashed #adbed1;border-radius:14px;background:#f6f9fc;color:#61778d;text-align:center;cursor:pointer;overflow:hidden}.image-drop:hover{border-color:#3155e7}.image-drop input{position:absolute;inset:0;opacity:0;cursor:pointer}.image-drop strong{font-size:17px}.image-drop span{display:grid;gap:5px;font-size:10px}.image-drop.ready{display:grid;grid-template-columns:minmax(0,1fr) auto;text-align:left}.image-drop img{width:100%;height:230px;object-fit:contain;border-radius:9px;background:#e9eef4}.image-settings{display:grid;grid-template-columns:150px 140px minmax(180px,1fr) auto;align-items:end;gap:12px;margin-top:16px}.image-settings select{min-height:46px}.quality-field input{height:46px;margin:0}.image-result{display:grid;grid-template-columns:150px 1fr auto;align-items:center;gap:18px;margin-top:20px;padding:14px;border:1px solid #d3dee8;border-radius:14px;background:#f8fafc}.image-result img{width:150px;height:110px;object-fit:contain;border-radius:8px;background:#edf1f5}.image-result div{display:grid;gap:6px}.image-result span{color:#8091a3;font:8px var(--font-mono);letter-spacing:1px}.image-result strong{font:12px var(--font-mono)}.image-result small{color:#3155e7}@media(max-width:850px){.image-settings{grid-template-columns:1fr 1fr}.quality-field{grid-column:1/-1}.image-result{grid-template-columns:110px 1fr}.image-result img{width:110px}.image-result button{grid-column:1/-1}}@media(max-width:520px){.image-drop.ready{grid-template-columns:1fr}.image-settings{grid-template-columns:1fr}.quality-field{grid-column:auto}.image-result{grid-template-columns:1fr}.image-result img{width:100%}}
</style>
