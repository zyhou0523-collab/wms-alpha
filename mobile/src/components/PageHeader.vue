<template>
  <van-nav-bar
    class="page-header"
    fixed
    placeholder
    safe-area-inset-top
    :title="title"
    :left-arrow="back"
    :left-text="backText"
    @click-left="handleBack"
  >
    <template v-if="$slots.right || rightText" #right>
      <slot name="right">
        <button class="page-header-action" type="button" @click="$emit('right')">{{ rightText }}</button>
      </slot>
    </template>
  </van-nav-bar>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { confirmLeaveIfDirty } from '../utils/feedback'

const props = withDefaults(defineProps<{
  title: string
  back?: boolean
  backText?: string
  rightText?: string
  dirty?: boolean
  dirtyMessage?: string
}>(), {
  back: false,
  backText: '',
  rightText: '',
  dirty: false,
  dirtyMessage: '当前页面有未保存内容，确认返回吗？'
})

const emit = defineEmits<{
  back: []
  right: []
}>()

const router = useRouter()

async function handleBack() {
  emit('back')
  const canLeave = await confirmLeaveIfDirty(props.dirty, props.dirtyMessage)
  if (!canLeave) return
  if (props.back) router.back()
}
</script>
