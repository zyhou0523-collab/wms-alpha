<template>
  <div class="scan-box" :class="{ 'is-disabled': disabled, 'has-error': Boolean(errorText) }" ref="rootRef">
    <van-field
      v-model="innerValue"
      class="scan-field"
      clearable
      :label="label"
      :placeholder="placeholder"
      :disabled="disabled"
      :error="Boolean(errorText)"
      :error-message="errorText"
      @clear="handleClear"
      @keyup.enter="confirm"
    >
      <template #button>
        <van-button type="primary" size="small" :disabled="disabled" @click="confirm">确认</van-button>
      </template>
    </van-field>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { parseScanText } from '../utils/scan'

const props = withDefaults(defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
  clearOnScan?: boolean
  minLength?: number
  errorMessage?: string
  validator?: (value: string) => boolean | string
}>(), {
  modelValue: '',
  label: '扫码',
  placeholder: '扫描或输入条码',
  disabled: false,
  autoFocus: true,
  clearOnScan: true,
  minLength: 1,
  errorMessage: '扫码内容无效'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  scan: [value: string]
  confirm: [value: string]
  clear: []
  error: [message: string]
}>()

const rootRef = ref<HTMLElement | null>(null)
const innerValue = ref(props.modelValue)
const errorText = ref('')

watch(() => props.modelValue, (value) => {
  innerValue.value = value
})

watch(innerValue, (value) => {
  if (errorText.value) errorText.value = ''
  emit('update:modelValue', value)
})

onMounted(() => {
  if (props.autoFocus) focus()
})

function focus() {
  nextTick(() => {
    const input = rootRef.value?.querySelector('input')
    input?.focus()
  })
}

function fail(message: string) {
  errorText.value = message
  emit('error', message)
  focus()
}

function handleClear() {
  errorText.value = ''
  emit('clear')
  focus()
}

function confirm() {
  if (props.disabled) return
  const value = parseScanText(innerValue.value)
  innerValue.value = value

  if (value.length < props.minLength) {
    fail(props.errorMessage)
    return
  }

  const result = props.validator?.(value)
  if (typeof result === 'string') {
    fail(result)
    return
  }
  if (result === false) {
    fail(props.errorMessage)
    return
  }

  errorText.value = ''
  emit('scan', value)
  emit('confirm', value)
  if (props.clearOnScan) {
    innerValue.value = ''
    emit('update:modelValue', '')
  }
  focus()
}
</script>
