<template>
  <van-tabbar v-model="active" route fixed placeholder safe-area-inset-bottom>
    <van-tabbar-item to="/home" icon="wap-home-o">首页</van-tabbar-item>
    <van-tabbar-item to="/inbound" icon="down">入库</van-tabbar-item>
    <van-tabbar-item to="/outbound" icon="upgrade">出库</van-tabbar-item>
    <van-tabbar-item to="/inventory" icon="orders-o">库存</van-tabbar-item>
    <van-tabbar-item to="/profile" icon="user-o">我的</van-tabbar-item>
  </van-tabbar>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const active = ref(0)
</script>
