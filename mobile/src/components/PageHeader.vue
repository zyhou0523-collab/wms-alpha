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

const props = withDefaults(defineProps<{
  title: string
  back?: boolean
  backText?: string
  rightText?: string
}>(), {
  back: false,
  backText: '',
  rightText: ''
})

const emit = defineEmits<{
  back: []
  right: []
}>()

const router = useRouter()

function handleBack() {
  emit('back')
  if (props.back) router.back()
}
</script>
