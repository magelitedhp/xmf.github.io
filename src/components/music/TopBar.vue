<template>
  <header class="topbar">
    <label class="search-box">
      <span aria-hidden="true">⌕</span>
      <input
        :value="searchTerm"
        type="search"
        placeholder="搜索歌曲、专辑、艺人"
        @input="$emit('update:searchTerm', ($event.target as HTMLInputElement).value)"
      />
    </label>

    <div class="topbar-actions" aria-label="窗口操作">
      <button class="icon-button" type="button" title="通知">♧</button>
      <button class="icon-button" type="button" title="设置">⚙</button>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  searchTerm: string
}>()

defineEmits<{
  'update:searchTerm': [value: string]
}>()
</script>
