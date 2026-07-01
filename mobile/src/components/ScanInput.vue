<template>
  <div
    class="scan-box"
    :class="{ 'is-disabled': disabled, 'has-error': Boolean(errorText), 'has-result': Boolean(lastResult) }"
    ref="rootRef"
  >
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
        <van-button class="scan-confirm-btn" type="primary" size="small" :disabled="disabled" @click="confirm">确认</van-button>
      </template>
    </van-field>
    <div v-if="lastResult" class="scan-result">
      <span>{{ typeLabel(lastResult.type) }}</span>
      <strong>{{ lastResult.value }}</strong>
    </div>
    <div v-if="lastResult && nextTip" class="scan-tip">{{ nextTip }}</div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { isAcceptedScanType, isDuplicateScan, parseScanResult, ScanCodeType, ScanResult } from '../utils/scan'

const props = withDefaults(defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
  clearOnScan?: boolean
  minLength?: number
  errorMessage?: string
  acceptedTypes?: ScanCodeType[]
  duplicateList?: string[]
  duplicateMessage?: string
  nextTip?: string
  validator?: (value: string, result: ScanResult) => boolean | string
}>(), {
  modelValue: '',
  label: '扫码',
  placeholder: '扫描或输入条码',
  disabled: false,
  autoFocus: true,
  clearOnScan: true,
  minLength: 1,
  errorMessage: '扫码内容无效',
  acceptedTypes: () => [],
  duplicateList: () => [],
  duplicateMessage: '该条码已扫描',
  nextTip: '已识别，输入框已重新聚焦，可继续扫码或手工录入'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  scan: [value: string]
  scanDetail: [result: ScanResult]
  confirm: [value: string]
  clear: []
  error: [message: string]
}>()

const rootRef = ref<HTMLElement | null>(null)
const innerValue = ref(props.modelValue)
const errorText = ref('')
const lastResult = ref<ScanResult | null>(null)

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
  lastResult.value = null
  emit('clear')
  focus()
}

function confirm() {
  if (props.disabled) return
  const result = parseScanResult(innerValue.value)
  innerValue.value = result.value

  if (result.value.length < props.minLength) {
    fail(props.errorMessage)
    return
  }
  if (!isAcceptedScanType(result.type, props.acceptedTypes)) {
    fail(`不支持的条码类型：${typeLabel(result.type)}`)
    return
  }
  if (isDuplicateScan(result.value, props.duplicateList)) {
    fail(props.duplicateMessage)
    return
  }

  const customResult = props.validator?.(result.value, result)
  if (typeof customResult === 'string') {
    fail(customResult)
    return
  }
  if (customResult === false) {
    fail(props.errorMessage)
    return
  }

  errorText.value = ''
  lastResult.value = result
  emit('scan', result.value)
  emit('scanDetail', result)
  emit('confirm', result.value)
  if (props.clearOnScan) {
    innerValue.value = ''
    emit('update:modelValue', '')
  }
  focus()
}

function typeLabel(type: ScanCodeType) {
  return {
    SN: 'SN',
    BOX: '箱码',
    PALLET: '托盘码',
    LOCATION: '库位码',
    DOCUMENT: '单据号',
    PRODUCT: '产品编码',
    UNKNOWN: '未知'
  }[type]
}
</script>
