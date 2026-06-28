<template>
  <div class="empty-state">
    <van-empty :image="image" :description="description">
      <slot>
        <van-button v-if="actionText" type="primary" size="small" @click="$emit('action')">
          {{ actionText }}
        </van-button>
      </slot>
    </van-empty>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  description?: string
  actionText?: string
  image?: string
}>(), {
  description: '暂无数据',
  actionText: '',
  image: 'search'
})

defineEmits<{
  action: []
}>()
</script>
