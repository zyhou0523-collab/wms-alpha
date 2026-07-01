<template>
  <div v-if="loading" class="page-state">
    <van-loading type="spinner" color="#1677ff">{{ loadingText }}</van-loading>
  </div>
  <div v-else-if="error" class="page-state">
    <van-empty image="error" :description="error">
      <van-button v-if="retryText" type="primary" size="small" @click="$emit('retry')">
        {{ retryText }}
      </van-button>
    </van-empty>
  </div>
  <EmptyState v-else-if="empty" :description="emptyText" :action-text="actionText" @action="$emit('action')" />
</template>

<script setup lang="ts">
import EmptyState from './EmptyState.vue'

withDefaults(defineProps<{
  loading?: boolean
  loadingText?: string
  error?: string
  empty?: boolean
  emptyText?: string
  retryText?: string
  actionText?: string
}>(), {
  loading: false,
  loadingText: '加载中...',
  error: '',
  empty: false,
  emptyText: '暂无数据',
  retryText: '重试',
  actionText: ''
})

defineEmits<{
  retry: []
  action: []
}>()
</script>
