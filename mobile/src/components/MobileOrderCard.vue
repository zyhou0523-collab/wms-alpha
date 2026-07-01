<template>
  <van-cell-group inset class="order-card">
    <van-cell>
      <template #title>
        <div class="order-title">{{ displayOrderNo }}</div>
        <div v-if="displayOrderType" class="order-subtitle">{{ displayOrderType }}</div>
      </template>
      <template #value>
        <StatusTag :status="status" :label="statusLabel" />
      </template>
    </van-cell>
    <div class="order-meta">
      <div v-for="item in displayMeta" :key="item.label" class="order-meta-item">
        <span>{{ item.label }}</span>
        <strong>{{ item.value || '-' }}</strong>
      </div>
    </div>
    <div v-if="$slots.actions" class="order-actions">
      <slot name="actions" />
    </div>
  </van-cell-group>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import StatusTag from './StatusTag.vue'

const props = withDefaults(defineProps<{
  title?: string
  orderNo?: string
  orderType?: string
  status?: string
  statusLabel?: string
  warehouse?: string
  owner?: string
  quantity?: string | number
  time?: string
  meta?: Array<{ label: string; value?: string | number }>
}>(), {
  title: '',
  orderNo: '',
  orderType: '',
  warehouse: '',
  owner: '',
  quantity: '',
  time: '',
  meta: () => []
})

const displayOrderNo = computed(() => props.orderNo || props.title || '-')
const displayOrderType = computed(() => props.orderType)
const displayMeta = computed(() => {
  if (props.meta.length) return props.meta
  return [
    { label: '仓库', value: props.warehouse },
    { label: '货主', value: props.owner },
    { label: '数量', value: props.quantity },
    { label: '时间', value: props.time }
  ]
})
</script>
