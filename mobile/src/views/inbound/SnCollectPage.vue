<template>
  <main class="page sn-collect-page with-bottom-actions">
    <van-nav-bar title="入库 SN 采集" left-arrow fixed placeholder @click-left="goBack" />

    <PageState
      v-if="loading || errorMessage || !context"
      :loading="loading"
      :error="errorMessage"
      :empty="!loading && !errorMessage && !context"
      empty-text="未找到 SN 采集上下文"
      @retry="load"
    />

    <template v-else>
      <van-cell-group inset class="detail-card">
        <van-cell>
          <template #title>
            <div class="order-title compact-title">{{ context.inboundOrderNo }}</div>
            <div class="order-subtitle">行 {{ context.lineNo }} / {{ context.productCode }}</div>
          </template>
          <template #value>
            <StatusTag :status="context.lineStatus" :label="statusLabel(context.lineStatus)" />
          </template>
        </van-cell>
        <div class="detail-grid compact">
          <InfoItem label="产品 ID" :value="context.productId" />
          <InfoItem label="产品编码" :value="context.productCode" />
          <InfoItem label="产品名称" :value="context.productName" />
          <InfoItem label="产品数量" :value="context.planQty" />
          <InfoItem label="是否管理 SN" :value="context.snRequired ? '是' : '否'" />
          <InfoItem label="已采集数量" :value="context.pendingReceiveQty || 0" />
          <InfoItem label="已收货数量" :value="context.receivedQty || 0" />
          <InfoItem label="剩余待采集数量" :value="remainingAfterDraft" />
          <InfoItem label="箱码要求" :value="context.boxRequired ? '必填' : '非必填'" />
          <InfoItem label="SAP 工厂" :value="context.sapPlant" />
        </div>
      </van-cell-group>

      <section class="section-title">托盘 / 箱码</section>
      <ScanInput
        v-model="palletCode"
        label="托盘码"
        placeholder="扫描或输入托盘码"
        :accepted-types="['PALLET', 'UNKNOWN']"
        :clear-on-scan="false"
        @scan-detail="handlePalletScan"
      />
      <ScanInput
        v-model="boxCode"
        label="箱码"
        placeholder="扫描或输入箱码（非必填）"
        :accepted-types="['BOX', 'UNKNOWN']"
        :clear-on-scan="false"
        @scan-detail="handleBoxScan"
      />

      <section class="section-title">扫描 SN</section>
      <ScanInput
        v-model="snInput"
        label="SN"
        placeholder="连续扫描或手工输入 SN"
        :accepted-types="['SN', 'UNKNOWN']"
        :duplicate-list="draftSns"
        duplicate-message="本次待提交列表中已存在该 SN"
        @scan-detail="handleSnScan"
      />

      <van-cell-group inset class="mini-card">
        <van-cell title="本次待提交 SN" :value="`${draftSns.length} 个`" />
        <div v-if="!draftSns.length" class="empty-inline">请扫描或输入 SN</div>
        <van-swipe-cell v-for="sn in draftSns" :key="sn">
          <van-cell :title="sn" />
          <template #right>
            <van-button square type="danger" text="删除" @click="removeDraftSn(sn)" />
          </template>
        </van-swipe-cell>
      </van-cell-group>

      <van-cell-group inset class="mini-card">
        <van-cell title="历史已采集 SN" :value="`${historySns.length} 个`" />
        <div v-if="!historySns.length" class="empty-inline">当前产品行暂无历史采集 SN</div>
        <van-cell v-for="sn in historySns" :key="sn.snCode" class="history-sn-cell">
          <template #title>
            <div class="order-title compact-title">{{ sn.snCode }}</div>
            <div class="order-subtitle">{{ sn.palletCode || '-' }} / {{ sn.boxCode || '-' }}</div>
          </template>
          <template #label>
            <span>{{ sn.collectedAt || '-' }}</span>
          </template>
          <template #value>
            <StatusTag :status="sn.snStatus" :label="snStatusLabel(sn.snStatus)" />
          </template>
          <template #right-icon>
            <van-button
              v-if="sn.snStatus === 'COLLECTED'"
              size="mini"
              type="danger"
              plain
              @click.stop="cancelCollected(sn)"
            >
              取消
            </van-button>
          </template>
        </van-cell>
      </van-cell-group>

      <van-cell-group v-if="validationRows.length" inset class="mini-card">
        <van-cell title="校验结果" :value="`${validationRows.length} 条`" />
        <van-cell v-for="row in validationRows" :key="row.snCode">
          <template #title>
            <div class="order-title compact-title">{{ row.snCode }}</div>
            <div class="order-subtitle">{{ row.message }}</div>
          </template>
          <template #value>
            <StatusTag :status="row.status" :label="row.status === 'PASS' ? '通过' : '失败'" />
          </template>
        </van-cell>
      </van-cell-group>
    </template>

    <div class="bottom-action-bar">
      <van-button block plain @click="clearDraft">清空</van-button>
      <van-button block type="primary" :loading="submitting" @click="submit">确认采集</van-button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  cancelSnCollection,
  confirmSnCollection,
  getSnCollectContext,
  listCollectedSns,
  validateSnCollection,
  type CollectedSn,
  type SnCollectContext,
  type SnValidationResult
} from '../../api/inbound'
import PageState from '../../components/PageState.vue'
import ScanInput from '../../components/ScanInput.vue'
import StatusTag from '../../components/StatusTag.vue'
import { confirmAction, fail, success, withLoading } from '../../utils/feedback'
import type { ScanResult } from '../../utils/scan'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const context = ref<SnCollectContext | null>(null)
const historySns = ref<CollectedSn[]>([])
const palletCode = ref('')
const boxCode = ref('')
const snInput = ref('')
const draftSns = ref<string[]>([])
const validationRows = ref<NonNullable<SnValidationResult['items']>>([])

const orderId = computed(() => Number(route.params.orderId))
const lineId = computed(() => Number(route.params.lineId))
const activeHistoryCodes = computed(() => new Set(historySns.value
  .filter((row) => row.snStatus !== 'CANCELED' && row.snStatus !== 'CANCELED_COLLECT')
  .map((row) => String(row.snCode || '').trim())
  .filter(Boolean)))
const remainingAfterDraft = computed(() => Math.max(Number(context.value?.remainingQty || 0) - draftSns.value.length, 0))

onMounted(load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    validateRouteParams()
    context.value = await getSnCollectContext(orderId.value, lineId.value)
    historySns.value = await listCollectedSns(orderId.value, lineId.value)
    palletCode.value ||= `PLT${Date.now()}`
    validationRows.value = []
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'SN 采集上下文加载失败'
  } finally {
    loading.value = false
  }
}

function handlePalletScan(result: ScanResult) {
  palletCode.value = result.value
}

function handleBoxScan(result: ScanResult) {
  boxCode.value = result.value
}

function handleSnScan(result: ScanResult) {
  const sn = result.value.trim()
  const message = validateDraftSn(sn)
  if (message) {
    fail(message)
    return
  }
  draftSns.value.push(sn)
  validationRows.value = []
  success('SN 已加入本次待提交列表')
}

function validateDraftSn(sn: string) {
  if (!orderId.value) return 'orderId 不能为空'
  if (!lineId.value) return 'lineId 不能为空'
  if (!context.value?.productId) return 'productId 不能为空'
  if (!context.value?.snRequired) return '当前产品不管理 SN，不允许采集'
  if (!sn) return 'SN 不能为空'
  if (draftSns.value.includes(sn)) return 'SN 不能重复'
  if (activeHistoryCodes.value.has(sn)) return '该 SN 已历史采集，不能重复采集'
  if (draftSns.value.length + 1 > Number(context.value.remainingQty || 0)) return '本次 SN 数量 + 历史已采集数量不能超过产品数量'
  if (!palletCode.value) return '托盘码不能为空'
  if (context.value.boxRequired && !boxCode.value) return '箱码不能为空'
  if (['RECEIVED', 'ON_SHELF', 'CLOSED', 'CANCELED'].includes(String(context.value.lineStatus || ''))) return '当前行状态不允许采集 SN'
  return ''
}

function removeDraftSn(sn: string) {
  draftSns.value = draftSns.value.filter((item) => item !== sn)
  validationRows.value = []
}

function clearDraft() {
  draftSns.value = []
  validationRows.value = []
}

async function submit() {
  const localMessage = validateBeforeSubmit()
  if (localMessage) {
    fail(localMessage)
    return
  }
  submitting.value = true
  try {
    const payload = buildPayload()
    const validation = await withLoading('SN 校验中', () => validateSnCollection(orderId.value, lineId.value, payload))
    validationRows.value = validation.items || []
    if (!validation.valid) {
      fail(validation.items?.find((row) => row.status !== 'PASS')?.message || validation.message || 'SN 校验未通过')
      return
    }
    await withLoading('SN 采集中', () => confirmSnCollection(orderId.value, lineId.value, payload))
    success('SN 采集成功，已进入待收货')
    clearDraft()
    await refreshAfterAction()
  } finally {
    submitting.value = false
  }
}

async function cancelCollected(sn: CollectedSn) {
  if (sn.snStatus !== 'COLLECTED') {
    fail('仅已采集且未收货的 SN 允许取消')
    return
  }
  if (!sn.snCode) return
  await confirmAction(`确认取消 SN ${sn.snCode} 的采集关系？`, '取消 SN 采集')
  await withLoading('取消采集中', () => cancelSnCollection(orderId.value, lineId.value, [sn.snCode || '']))
  success('SN 采集关系已取消')
  await refreshAfterAction()
}

async function refreshAfterAction() {
  context.value = await getSnCollectContext(orderId.value, lineId.value)
  historySns.value = await listCollectedSns(orderId.value, lineId.value)
}

function validateBeforeSubmit() {
  if (!orderId.value) return 'orderId 不能为空'
  if (!lineId.value) return 'lineId 不能为空'
  if (!context.value?.productId) return 'productId 不能为空'
  if (!context.value?.snRequired) return '当前产品不管理 SN，不允许采集'
  if (!palletCode.value) return '托盘码不能为空'
  if (context.value.boxRequired && !boxCode.value) return '箱码不能为空'
  if (!draftSns.value.length) return '请先扫描或输入 SN'
  const duplicated = draftSns.value.find((sn, index) => draftSns.value.indexOf(sn) !== index)
  if (duplicated) return `SN ${duplicated} 重复`
  const existing = draftSns.value.find((sn) => activeHistoryCodes.value.has(sn))
  if (existing) return `SN ${existing} 已历史采集`
  if (draftSns.value.length > Number(context.value.remainingQty || 0)) return '本次 SN 数量 + 历史已采集数量不能超过产品数量'
  if (['RECEIVED', 'ON_SHELF', 'CLOSED', 'CANCELED'].includes(String(context.value.lineStatus || ''))) return '当前行状态不允许采集 SN'
  return ''
}

function buildPayload() {
  return {
    orderId: orderId.value,
    lineId: lineId.value,
    productId: Number(context.value?.productId),
    palletCode: palletCode.value,
    boxCode: boxCode.value,
    serialNumbers: draftSns.value,
    operator: 'mobile'
  }
}

function validateRouteParams() {
  if (!orderId.value) throw new Error('orderId 不能为空')
  if (!lineId.value) throw new Error('lineId 不能为空')
}

async function goBack() {
  router.push(`/inbound/${orderId.value}`)
}

function statusLabel(value?: string) {
  const map: Record<string, string> = {
    CREATED: '待收货',
    RECEIVING: '部分收货',
    PARTIAL_RECEIVED: '部分收货',
    RECEIVED: '完全收货',
    ON_SHELF: '完全收货',
    CLOSED: '已关闭',
    CANCELED: '已取消'
  }
  return map[String(value || '')] || value || '-'
}

function snStatusLabel(value?: string) {
  const map: Record<string, string> = {
    COLLECTED: '已采集/待收货',
    RECEIVED: '已收货',
    ON_SHELF: '在库',
    CANCELED: '已取消',
    CANCELED_COLLECT: '已取消'
  }
  return map[String(value || '')] || value || '-'
}

const InfoItem = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number, Boolean], default: '-' }
  },
  setup(props) {
    return () => h('div', { class: 'info-item' }, [
      h('span', props.label),
      h('strong', String(props.value ?? props.value === 0 ? props.value : '-'))
    ])
  }
})
</script>
