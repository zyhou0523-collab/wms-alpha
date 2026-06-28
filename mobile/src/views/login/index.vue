<template>
  <main class="login-page">
    <section class="login-panel">
      <div class="brand-mark">WMS</div>
      <h1>WMS Alpha PDA</h1>
      <p>手持扫码作业终端</p>
      <van-form class="login-form" @submit="submit">
        <van-field
          v-model="form.username"
          name="username"
          label="账号"
          placeholder="请输入账号"
          autocomplete="username"
          :rules="[{ required: true, message: '请输入账号' }]"
        />
        <van-field
          v-model="form.password"
          name="password"
          label="密码"
          type="password"
          placeholder="请输入密码"
          autocomplete="current-password"
          :rules="[{ required: true, message: '请输入密码' }]"
        />
        <van-button class="login-button" type="primary" native-type="submit" :loading="loading" block>
          登录
        </van-button>
      </van-form>
      <div class="login-hint">默认账号：admin/admin123，wh_admin/123456</div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const form = reactive({ username: 'admin', password: 'admin123' })

async function submit() {
  loading.value = true
  try {
    await userStore.login(form.username, form.password)
    router.replace('/home')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(160deg, #0b5cad 0%, #1677ff 48%, #18a058 100%);
}

.login-panel {
  width: 100%;
  max-width: 420px;
  padding: 28px 18px 22px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 16px 40px rgba(5, 39, 82, 0.24);
}

.brand-mark {
  width: 62px;
  height: 62px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  margin: 0 auto 16px;
  color: #fff;
  background: #1677ff;
  font-weight: 800;
  letter-spacing: 0;
}

h1 {
  margin: 0;
  text-align: center;
  font-size: 24px;
  line-height: 1.2;
}

p {
  margin: 8px 0 22px;
  text-align: center;
  color: #64748b;
}

.login-form {
  display: grid;
  gap: 14px;
}

.login-button {
  height: 48px;
  font-size: 17px;
  font-weight: 700;
}

.login-hint {
  margin-top: 16px;
  color: #64748b;
  font-size: 13px;
  text-align: center;
}
</style>
