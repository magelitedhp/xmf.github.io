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

    <p class="status-line" :class="{ busy }">{{ status }}</p>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  searchTerm: string
  status: string
  busy?: boolean
}>()

defineEmits<{
  'update:searchTerm': [value: string]
}>()
</script>
