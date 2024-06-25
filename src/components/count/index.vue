
<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
  </div>
  <el-badge :value="count">
    <el-input v-model="plusValue" style="width: 120px" placeholder="increment">
      <template #prefix>
       <el-icon><IEpUser/></el-icon>
      </template>
      <template #suffix>
        <el-icon @click="incrementBtn"><IEpPlus /></el-icon>
      </template>
    </el-input>
  </el-badge>
  <el-badge :value="count">
    <el-input v-model="minusValue" style="width: 120px" placeholder="minus">
      <template #suffix>
        <el-icon @click="minusBtn"><IEpMinus /></el-icon>
      </template>
    </el-input>
  </el-badge>
  <el-badge :value="count">
    <el-button @click="clearBtn">clear</el-button>
  </el-badge>

</template>
<script setup>

import { useStore } from '@/stores/'
defineProps({
  msg: String,
})
const counterStore = useStore()

const count = computed(() => {
  return counterStore.count
})
watch(() => counterStore.count, (val, oldVal) => {
  console.log(val, oldVal ,'?????????????');
})

const plusValue = ref(null)
const minusValue = ref(null)
const incrementBtn = () => {
  counterStore.increment(plusValue.value)
}
const minusBtn = () => {
  counterStore.minus(minusValue.value)
}
const clearBtn = () => {
  counterStore.clear()
}

</script>


<style scoped>
.el-badge {
  margin: 0 20px;
  .el-icon {
    cursor: pointer;
  }
}
</style>
