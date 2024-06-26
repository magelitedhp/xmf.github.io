<template>
  <div></div>
  <img class="bg" src="@as/img/bg.jpg" fit="fill" />
  <div class="banner-container">
    <div class="banner-bar left">
      <div v-for="(item, i) in bannerLeftList" class="banner-item">
        <svg-icon v-if="item.svg" :name="item.svg"></svg-icon>
        <div>{{ item.title }}</div>
      </div>
    </div>
    <el-input v-model="keyword" style="width: 280px" placeholder="jump search link" @keyup.enter.native="search">
      <template #suffix>
        <el-icon class="el-input__icon" @click="search"><IEpSearch /></el-icon>
      </template>
    </el-input>
    <div class="banner-bar right">
      <el-avatar
        @click="jumpTo"
        :src="Avatar"
      />
      <div v-for="(item, i) in bannerRightList" class="banner-item">
        <svg-icon v-if="item.svg" :name="item.svg"></svg-icon>
        <div>{{ item.title }}</div>
      </div>
      <div class="upload">
        <svg-icon name="upload"></svg-icon>投稿
      </div>
    </div>
  </div>
  <el-upload
    ref="uploadRef"
    class="upload-demo"
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    :auto-upload="false"
  >
    <template #trigger>
      <el-button type="primary">select file</el-button>
    </template>

    <el-button class="ml-3" type="success" @click="submitUpload">
      upload to server
    </el-button>

    <template #tip>
      <div class="el-upload__tip">
        jpg/png files with a size less than 500kb
      </div>
    </template>
  </el-upload>
</template>

<script setup>
import Avatar from "@as/img/avatar.jpg";
const keyword = ref(null)
const search = () => {
  let url = `https://www.baidu.com/s?wd=${keyword.value}&tn=15007414_18_dg&ie=utf-8`
  window.open(url, '_blank');
}

const jumpTo = () => {
  let url = `https://space.bilibili.com/52810504?spm_id_from=333.1007.0.0`
  window.open(url, '_blank')
}

const bannerLeftList = ref([
  { title: "首页", svg: 'bilibili'},
  { title: "番剧"},
  { title: "直播"},
  { title: "游戏中心"},
  { title: "会员购"},
  { title: "漫画"},
  { title: "赛事"},
  { title: "欧洲杯"},
  { title: "填志愿"},
  { title: "下载客户端", svg: 'download'},
])
const bannerRightList = ref([
  { title: "大会员", svg: 'super-vip'},
  { title: "消息", svg: 'message'},
  { title: "动态", svg: 'dynamic'},
  { title: "收藏", svg: 'collection'},
  { title: "历史", svg: 'history'},
  { title: "创作中心", svg: 'create'},
])
const uploadRef = ref()

const submitUpload = () => {
  uploadRef.value.submit()
}
</script>
<style lang='scss' scoped>
.bg {
  width: 100%;
  object-fit: fill;
  position: relative;
  z-index: 0;
  display: flex;
  -ms-flex-pack: center;
  justify-content: center;
  margin: 0 auto;
  min-width: 1000px;
  min-height: 155px;
  height: 9.375vw;
  max-height: 240px;
  background-color: #e3e5e7;
  background-position: center 0;
  background-size: cover;
  background-repeat: no-repeat;
}
.banner-container {
  color: #fff;
  position: absolute;
  top: 0;
  z-index: 1002;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  max-width: 2560px;
  width: 100%;
  height: 64px;
  box-sizing: border-box;
  font-size: 14px;
  .banner-bar {
    display: flex;
    .banner-item {
      display: flex;
      align-items: center;
      margin-right: 10px;
      .svg-icon {
        margin-right: 6px;
      }
    }
  }
  .right {
    .el-avatar {
      margin-right: 14px;
      cursor: pointer;
    }
    .banner-item {
      display: flex;
      flex-direction: column;
      .svg-icon {
        margin-right: 0;
        width: 1.4em;
        height: 1.4em;
      }
    }
    .upload {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 16px;
      width: 90px;
      height: 34px;
      border-radius: 8px;
      background: #fb7299;
      color: #fff;
      text-align: center;
      font-size: 14px;
      line-height: 20px;
      cursor: pointer;
      transition: background-color .3s;
    }
  }
  .el-input__icon {
    cursor: pointer;
  }
}
</style>