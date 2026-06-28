<template>
  <van-tag :type="tagType" :color="tagColor" :text-color="textColor" size="medium" round>
    {{ label || statusLabel }}
  </van-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status?: string
  label?: string
}>()

const statusMap: Record<string, { label: string; type?: 'primary' | 'success' | 'danger' | 'warning'; color?: string; textColor?: string }> = {
  CREATED: { label: '已创建', type: 'primary' },
  COLLECTED: { label: '已采集', color: '#7c3aed', textColor: '#fff' },
  RECEIVED: { label: '已收货', type: 'success' },
  ON_SHELF: { label: '在库', type: 'success' },
  ALLOCATED: { label: '已分配', type: 'warning' },
  PICKED: { label: '已拣货', color: '#0ea5e9', textColor: '#fff' },
  SHIPPED: { label: '已发货', type: 'success' },
  CANCELED: { label: '已取消', type: 'danger' },
  CANCELLED: { label: '已取消', type: 'danger' },
  CLOSED: { label: '已关闭', color: '#475569', textColor: '#fff' },
  FAILED: { label: '失败', type: 'danger' },
  SUCCESS: { label: '成功', type: 'success' },
  POSTED: { label: '已回传', type: 'success' },
  NOT_POSTED: { label: '未回传', type: 'warning' },
  PARTIAL_RECEIVED: { label: '部分收货', type: 'warning' },
  PARTIAL_SHIPPED: { label: '部分发货', type: 'warning' },
  PENDING_ALLOC: { label: '待分配', type: 'warning' },
  PICKING: { label: '拣货中', type: 'warning' },
  REVIEWED: { label: '已复核', color: '#0ea5e9', textColor: '#fff' },
  QUALIFIED: { label: '良品', type: 'success' },
  UNQUALIFIED: { label: '不良品', type: 'danger' },
  FROZEN: { label: '冻结', color: '#334155', textColor: '#fff' },
  ISSUED: { label: '已下发', type: 'primary' }
}

const statusKey = computed(() => String(props.status || '').toUpperCase())
const statusConfig = computed(() => statusMap[statusKey.value])
const statusLabel = computed(() => statusConfig.value?.label || props.status || '-')
const tagType = computed(() => {
  return statusConfig.value?.type || 'primary'
})
const tagColor = computed(() => statusConfig.value?.color)
const textColor = computed(() => statusConfig.value?.textColor)
</script>
