<template>
  <div class="login-page">
    <div class="login-panel">
      <div class="login-title">新能源 WMS Alpha</div>
      <div class="login-subtitle">核心业务原型验证系统</div>
      <el-form :model="form" label-position="top" @keyup.enter="submit">
        <el-form-item label="账号">
          <el-input v-model="form.username" size="large" placeholder="admin" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" size="large" show-password placeholder="admin123" />
        </el-form-item>
        <el-button class="login-button" type="primary" size="large" :loading="loading" @click="submit">
          登录
        </el-button>
      </el-form>
      <div class="account-list">
        默认账号：admin/admin123，wh_admin/123456，manager/123456
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const form = reactive({ username: 'admin', password: 'admin123' })

async function submit() {
  loading.value = true
  try {
    await auth.login(form.username, form.password)
    router.push('/dashboard')
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
  background:
    linear-gradient(140deg, rgba(22, 119, 255, 0.88), rgba(0, 79, 148, 0.72)),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='600' viewBox='0 0 900 600'%3E%3Crect width='900' height='600' fill='%230f2747'/%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.12'%3E%3Cpath d='M0 80h900M0 180h900M0 280h900M0 380h900M0 480h900M100 0v600M250 0v600M400 0v600M550 0v600M700 0v600M850 0v600'/%3E%3C/g%3E%3C/svg%3E");
  background-size: cover;
}

.login-panel {
  width: 420px;
  padding: 34px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.18);
}

.login-title {
  font-size: 26px;
  font-weight: 800;
}

.login-subtitle {
  margin: 8px 0 28px;
  color: #6b7280;
}

.login-button {
  width: 100%;
}

.account-list {
  margin-top: 18px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.7;
}
</style>

