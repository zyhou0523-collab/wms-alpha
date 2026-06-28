<template>
  <main class="page with-tab">
    <van-nav-bar title="我的" fixed placeholder />
    <van-cell-group inset>
      <van-cell title="账号" :value="userStore.user?.username || '-'" />
      <van-cell title="姓名" :value="userStore.user?.display_name || '-'" />
      <van-cell title="角色" :value="userStore.user?.role_name || userStore.user?.role_code || '-'" />
      <van-cell title="当前仓库" :value="userStore.currentWarehouse" />
    </van-cell-group>
    <div class="profile-actions">
      <van-button type="danger" block @click="logout">退出登录</van-button>
    </div>
    <MobileTabbar />
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import MobileTabbar from '../shared/MobileTabbar.vue'

const router = useRouter()
const userStore = useUserStore()

function logout() {
  userStore.logout()
  router.replace('/login')
}
</script>
