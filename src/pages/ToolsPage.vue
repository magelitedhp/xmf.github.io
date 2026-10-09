<template>
  <main class="site-main tools-main">
    <header class="tools-header"><div><p class="effects-kicker">02 / SMALL TOOLS, BIG POSSIBILITIES</p><h1>灵感工作台<span class="heading-dot">.</span></h1><p>把繁琐的小事放在这里，给更好的想法腾出空间。</p></div><span class="tools-logo" aria-hidden="true">✳</span></header>
    <section class="workbench" aria-label="本地工具">
      <div class="workbench-top"><span>Yumo / UTILITY DESK</span><span><span class="status-dot"></span> 内容仅在当前浏览器处理</span></div>
      <div class="workbench-tabs" role="group" aria-label="选择工具"><button v-for="tool in tools" :key="tool.id" :class="{ active: active === tool.id }" :aria-pressed="active === tool.id" @click="select(tool.id)">{{ tool.label }}</button></div>
      <div class="workbench-body">
        <p class="workbench-hint">{{ hints[active] }}</p>
        <div v-if="active !== 'palette'" class="workbench-editors">
          <label><span class="editor-label"><span>INPUT / 输入</span><span>{{ input.length }} 字符</span></span><textarea v-model="input" :placeholder="active === 'json' ? '粘贴 JSON…' : '输入文字或 Base64…'" spellcheck="false"></textarea></label>
          <label><span class="editor-label"><span>OUTPUT / 输出</span><span>{{ output.length }} 字符</span></span><textarea :value="output" readonly placeholder="结果会出现在这里。" spellcheck="false"></textarea></label>
        </div>
        <div v-else class="palette-strips"><button v-for="color in palette" :key="color" :style="{ background: color, color: contrast(color) }" :aria-label="'复制颜色 ' + color" @click="copy(color)">{{ color }}</button></div>
        <div class="workbench-actions">
          <template v-if="active === 'json'"><button class="champagne-button" @click="process(false)">整理格式 ↗</button><button class="glass-button" @click="process(true)">压缩</button></template>
          <template v-else-if="active === 'base64'"><button class="champagne-button" @click="process(false)">编码 ↗</button><button class="glass-button" @click="process(true)">解码</button></template>
          <button v-else class="champagne-button" @click="paletteIndex = (paletteIndex + 1) % palettes.length">换一组灵感 ↗</button>
          <button class="glass-button" :disabled="active !== 'palette' && !output" @click="copy(active === 'palette' ? palette.join(', ') : output)">复制{{ active === 'palette' ? '配色' : '结果' }}</button>
          <span class="tool-result" :class="{ error }" role="status">{{ notice }}</span>
        </div>
      </div>
    </section>
    <p class="tool-footnote">轻量、即时、无需登录。文字不会被发送到服务器。</p>
  </main>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
type Tool = 'json' | 'base64' | 'palette'
const tools: {id: Tool; label: string}[] = [{id:'json',label:'01 / JSON 整理'},{id:'base64',label:'02 / 文字编码'},{id:'palette',label:'03 / 色彩灵感'}]
const active=ref<Tool>('json'), input=ref(JSON.stringify({hello:'Yumo',ideas:['记录','聆听','玩耍']},null,2)), output=ref(''), notice=ref(''), error=ref(false)
const hints={json:'把杂乱的数据整理成清楚的结构。支持格式化、压缩与语法检查。',base64:'在文字和 Base64 之间转换，支持中文和 Emoji。',palette:'五种颜色，一种新的可能。点击任意色块即可复制色值。'}
const palettes=[['#192822','#D5FA65','#F4F3EB','#3155E7','#FF9974'],['#183B4E','#27548A','#F5EEDC','#DDA853','#A2C8CB'],['#3B4A3F','#9DB49A','#F5F0DA','#E6A492','#C75B49'],['#222831','#393E46','#00ADB5','#EEEEEE','#C8F271'],['#3D365C','#7C4585','#C95792','#F8B55F','#F9F1DD']]
const paletteIndex=ref(0), palette=computed(()=>palettes[paletteIndex.value])
function select(value: Tool) {active.value=value;input.value=value==='json'?JSON.stringify({hello:'Yumo',ideas:['记录','聆听','玩耍']},null,2):'保持好奇。Stay curious. ✳';output.value='';notice.value='';error.value=false}
function process(alternate: boolean) {
  error.value=false;notice.value=''
  try {
    if(input.value.length>500000)throw new Error('内容较长，请控制在 50 万字符以内。')
    if(active.value==='json') output.value=JSON.stringify(JSON.parse(input.value),null,alternate?undefined:2)
    else if(alternate) output.value=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(input.value.trim()),c=>c.charCodeAt(0)))
    else output.value=btoa(Array.from(new TextEncoder().encode(input.value),byte=>String.fromCharCode(byte)).join(''))
    notice.value='已完成。'
  } catch(cause) {error.value=true;notice.value=active.value==='json'?'JSON 格式有误，请检查引号、逗号和括号。':(cause instanceof Error&&cause.message.includes('50 万')?cause.message:'无法解码，请输入有效的 UTF-8 Base64 文本。');output.value=''}
}
async function copy(value: string) {try {await navigator.clipboard.writeText(value);error.value=false;notice.value='已复制到剪贴板。'}catch{error.value=true;notice.value='剪贴板暂不可用，请选中结果手动复制。'}}
function contrast(hex: string) {const rgb=hex.slice(1).match(/../g)!.map(v=>parseInt(v,16));return rgb[0]*.299+rgb[1]*.587+rgb[2]*.114>155?'#192822':'#fffef6'}
</script>