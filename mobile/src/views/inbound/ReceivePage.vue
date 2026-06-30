<template>
  <main class="page receive-page with-bottom-actions">
    <van-nav-bar title="入库收货" left-arrow fixed placeholder @click-left="goBack" />

    <PageState
      v-if="loading || errorMessage || !order"
      :loading="loading"
      :error="errorMessage"
      :empty="!loading && !errorMessage && !order"
      empty-text="未找到收货上下文"
      @retry="load"
    />

    <template v-else>
      <van-cell-group inset class="detail-card">
        <van-cell>
          <template #title>
            <div class="order-title compact-title">{{ order.order_no }}</div>
            <div class="order-subtitle">{{ supplierText(order) }}</div>
          </template>
          <template #value>
            <StatusTag :status="order.status" :label="statusLabel(order.status)" />
          </template>
        </van-cell>
        <div class="detail-grid compact">
          <InfoItem label="SAP 工厂" :value="order.sap_plant" />
          <InfoItem label="SAP 库存地点" :value="order.sap_storage_location" />
          <InfoItem label="订单类型" :value="inboundTypeLabel(order.inbound_type)" />
          <InfoItem label="SAP 回传状态" :value="sapStatusLabel(order.sap_post_status)" />
        </div>
      </van-cell-group>

      <section class="section-title">目标库位</section>
      <ScanInput
        v-model="locationCode"
        label="库位码"
        placeholder="扫描或输入目标库位"
        :accepted-types="['LOCATION', 'UNKNOWN']"
        :clear-on-scan="false"
        @scan-detail="handleLocationScan"
      />

      <section class="section-title">产品行收货</section>
      <div v-if="!receiveRows.length" class="empty-inline">当前没有可展示的收货行</div>
      <van-cell-group v-for="row in receiveRows" v-else :key="lineKey(row)" inset class="mini-card receive-line-card">
        <van-cell>
          <template #title>
            <div class="line-title">
              <strong>行 {{ row.line_no }} / {{ row.product_code }}</strong>
              <span>{{ row.product_name || row.product_desc }}</span>
            </div>
          </template>
          <template #value>
            <StatusTag :status="row.line_status || row.status" :label="statusLabel(row.line_status || row.status)" />
          </template>
        </van-cell>

        <div class="detail-grid compact">
          <InfoItem label="产品 ID" :value="row.product_id" />
          <InfoItem label="产品数量" :value="row.planned_qty ?? row.order_qty" />
          <InfoItem label="已收货数量" :value="row.received_qty || 0" />
          <InfoItem label="剩余待收货" :value="row.remainingQty" />
          <InfoItem label="是否管理 SN" :value="row.snRequired ? '是' : '否'" />
          <InfoItem label="已采集待收货" :value="row.pendingSerials.length" />
          <InfoItem label="SAP 工厂" :value="row.sap_plant" />
          <InfoItem label="SAP 库存地点" :value="row.sap_storage_location" />
        </div>

        <van-checkbox v-model="row.selected" class="receive-check" :disabled="!row.canReceive">
          本次收货该行
        </van-checkbox>

        <div v-if="row.snRequired" class="receive-tip" :class="{ warning: !row.pendingSerials.length }">
          {{ row.pendingSerials.length ? `本次将按已采集待收货 SN 自动收货 ${row.pendingSerials.length} 件` : 'SN 管理产品需先完成 SN 采集' }}
        </div>
        <van-field
          v-else
          :model-value="String(row.receiveQty)"
          type="number"
          label="本次收货数量"
          placeholder="请输入本次收货数量"
          :disabled="!row.canReceive || !row.selected"
          @update:model-value="(value) => updateReceiveQty(row, value)"
        />

        <van-collapse v-if="row.snRequired && row.pendingSerials.length" v-model="activeSnBlocks">
          <van-collapse-item :name="String(lineKey(row))" :title="`待收货 SN（${row.pendingSerials.length}）`">
            <van-cell v-for="sn in row.pendingSerials" :key="sn.sn_code" :title="sn.sn_code" :label="`${sn.pallet_code || '-'} / ${sn.box_code || '-'}`" />
          </van-collapse-item>
        </van-collapse>
      </van-cell-group>

      <van-cell-group inset class="mini-card">
        <van-cell title="本次收货汇总" :value="`${selectedTotal} 件`" />
        <div class="detail-grid compact">
          <InfoItem label="已选产品行" :value="selectedRows.length" />
          <InfoItem label="目标库位" :value="locationCode" />
        </div>
      </van-cell-group>

      <van-cell-group inset class="mini-card">
        <van-cell title="收货记录" :value="`${receiptRecords.length} 条`" />
        <div v-if="!receiptRecords.length" class="empty-inline">暂无收货记录</div>
        <van-cell v-for="receipt in receiptRecords" v-else :key="receipt.receipt_id || receipt.id">
          <template #title>
            <div class="order-title compact-title">{{ receipt.receipt_no }}</div>
            <div class="order-subtitle">行 {{ receipt.line_no }} / {{ receipt.product_code }}</div>
          </template>
          <template #label>
            <span>本次收货 {{ receipt.receive_qty }} / {{ receipt.receipt_time }}</span>
          </template>
          <template #value>
            <StatusTag :status="receipt.sap_post_status" :label="sapStatusLabel(receipt.sap_post_status)" />
          </template>
          <template #right-icon>
            <van-button
              v-if="canCancelReceipt(receipt)"
              size="mini"
              type="danger"
              plain
              @click.stop="cancelReceipt(receipt)"
            >
              取消
            </van-button>
          </template>
        </van-cell>
      </van-cell-group>
    </template>

    <div class="bottom-action-bar">
      <van-button block plain @click="goBack">返回详情</van-button>
      <van-button block type="success" :loading="submitting" @click="submit">确认收货</van-button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  cancelInboundReceipt,
  getInboundOrder,
  receiveInboundOrder,
  type InboundDetail,
  type InboundLine,
  type InboundOrder,
  type InboundReceiptRecord,
  type InboundSerialNumber
} from '../../api/inbound'
import PageState from '../../components/PageState.vue'
import ScanInput from '../../components/ScanInput.vue'
import StatusTag from '../../components/StatusTag.vue'
import { confirmAction, fail, success, withLoading } from '../../utils/feedback'
import type { ScanResult } from '../../utils/scan'

type ReceiveRow = InboundLine & {
  snRequired: boolean
  pendingSerials: InboundSerialNumber[]
  remainingQty: number
  receiveQty: number
  canReceive: boolean
  selected: boolean
}

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const detail = ref<InboundDetail>({})
const receiveRows = ref<ReceiveRow[]>([])
const locationCode = ref('A01-01-01')
const activeSnBlocks = ref<string[]>([])

const orderId = computed(() => Number(route.params.orderId))
const routeLineId = computed(() => route.params.lineId ? Number(route.params.lineId) : 0)
const order = computed(() => detail.value.order)
const lines = computed(() => detail.value.details || detail.value.lines || order.value?.lines || [])
const serialNumbers = computed(() => detail.value.serialNumbers || [])
const receiptRecords = computed(() => detail.value.receiptRecords || [])
const selectedRows = computed(() => receiveRows.value.filter((row) => row.selected && row.canReceive && selectedReceiveQty(row) > 0))
const selectedTotal = computed(() => selectedRows.value.reduce((sum, row) => sum + selectedReceiveQty(row), 0))

onMounted(load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    if (!orderId.value) throw new Error('orderId 不能为空')
    detail.value = await getInboundOrder(orderId.value)
    buildReceiveRows()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '入库收货上下文加载失败'
  } finally {
    loading.value = false
  }
}

function buildReceiveRows() {
  receiveRows.value = lines.value
    .filter((line) => !routeLineId.value || Number(lineKey(line)) === routeLineId.value)
    .map((line) => {
      const snRequired = isSnRequired(line)
      const pendingSerials = serialNumbers.value.filter((sn) =>
        Number(sn.inbound_order_line_id) === Number(lineKey(line)) && sn.status === 'COLLECTED'
      )
      const remainingQty = receiveRemainingQty(line)
      const canReceive = canReceiveLine(line, pendingSerials)
      return {
        ...line,
        snRequired,
        pendingSerials,
        remainingQty,
        receiveQty: snRequired ? pendingSerials.length : remainingQty,
        canReceive,
        selected: canReceive
      }
    })
  activeSnBlocks.value = receiveRows.value.filter((row) => row.snRequired && row.pendingSerials.length).map((row) => String(lineKey(row)))
}

function handleLocationScan(result: ScanResult) {
  locationCode.value = result.value
}

function updateReceiveQty(row: ReceiveRow, value: string | number) {
  const qty = Number(value || 0)
  row.receiveQty = Number.isFinite(qty) ? qty : 0
}

async function submit() {
  const message = validateSubmit()
  if (message) {
    fail(message)
    return
  }
  await confirmAction(`确认收货 ${selectedTotal.value} 件到库位 ${locationCode.value}？`, '确认收货')
  submitting.value = true
  try {
    await withLoading('收货提交中', async () => {
      detail.value = await receiveInboundOrder(orderId.value, {
        locationCode: locationCode.value,
        operator: 'mobile',
        lines: selectedRows.value.map((row) => ({
          lineId: Number(lineKey(row)),
          productId: normalizedProductId(row),
          receiveQty: row.snRequired ? undefined : selectedReceiveQty(row),
          receiveSnList: row.snRequired ? row.pendingSerials.map((sn) => String(sn.sn_code || '')).filter(Boolean) : []
        }))
      })
      buildReceiveRows()
    })
    success('收货成功，单据状态已刷新')
  } finally {
    submitting.value = false
  }
}

async function cancelReceipt(receipt: InboundReceiptRecord) {
  const receiptId = Number(receipt.receipt_id || receipt.id)
  if (!receiptId) return
  await confirmAction(`确认取消收货批次 ${receipt.receipt_no}？取消后对应数量将回退。`, '取消收货')
  await withLoading('取消收货中', async () => {
    detail.value = await cancelInboundReceipt(orderId.value, receiptId)
    buildReceiveRows()
  })
  success('收货批次已取消')
}

function validateSubmit() {
  if (!['CREATED', 'PARTIAL_RECEIVED', 'RECEIVING'].includes(String(order.value?.status || ''))) return '当前单据状态不允许收货'
  if (!locationCode.value) return '目标库位不能为空'
  if (!selectedRows.value.length) return '请至少选择一条可收货产品行'
  const invalid = selectedRows.value.find((row) => {
    const qty = selectedReceiveQty(row)
    return qty <= 0 || qty > row.remainingQty || (row.snRequired && !row.pendingSerials.length)
  })
  if (invalid) return `行 ${invalid.line_no} 本次收货数量不合法`
  return ''
}

function canReceiveLine(line: InboundLine, pendingSerials: InboundSerialNumber[]) {
  const status = order.value?.status
  if (!['CREATED', 'PARTIAL_RECEIVED', 'RECEIVING'].includes(String(status || ''))) return false
  if (isSnRequired(line)) return pendingSerials.length > 0
  return receiveRemainingQty(line) > 0
}

function canCancelReceipt(receipt: InboundReceiptRecord) {
  return !['CANCELED'].includes(String(receipt.status || ''))
    && !['SUCCESS', 'POSTED'].includes(String(receipt.sap_post_status || ''))
    && numberOf(receipt.receive_qty) > 0
}

function selectedReceiveQty(row: ReceiveRow) {
  if (!row.selected || !row.canReceive) return 0
  if (row.snRequired) return row.pendingSerials.length
  return Math.min(Math.max(Number(row.receiveQty || 0), 0), row.remainingQty)
}

function isSnRequired(line: InboundLine) {
  return line.snRequired === true || Number(line.sn_required ?? 0) === 1
}

function receiveRemainingQty(line: InboundLine) {
  return Math.max(numberOf(line.planned_qty ?? line.order_qty) - numberOf(line.received_qty), 0)
}

function lineKey(line: InboundLine) {
  return line.id || line.line_id || line.inbound_order_line_id || line.line_no || line.product_code
}

function normalizedProductId(line: InboundLine) {
  return Number(String(line.product_id || '').replace(/\D/g, '')) || Number(lineKey(line))
}

function goBack() {
  router.push(`/inbound/${orderId.value}`)
}

function supplierText(row: InboundOrder) {
  return row.supplier_name || row.supplier_code || row.owner_name || '-'
}

function inboundTypeLabel(value?: string) {
  const map: Record<string, string> = {
    PRODUCTION: '生产入库',
    STOCKING: '备货入库',
    RMA: '售后 RMA 入库',
    TRANSFER: '调拨入库',
    SUPPLIER_VMI: '供应商 VMI 入库',
    OTHER: '其他入库',
    STOCK_IN: '备货入库'
  }
  return map[String(value || '')] || value || '-'
}

function statusLabel(value?: string) {
  const map: Record<string, string> = {
    CREATED: '未收货',
    RECEIVING: '部分收货',
    PARTIAL_RECEIVED: '部分收货',
    RECEIVED: '完全收货',
    ON_SHELF: '完全收货',
    CLOSED: '关闭',
    CANCELED: '取消'
  }
  return map[String(value || '')] || value || '-'
}

function sapStatusLabel(value?: string) {
  if (!value || value === 'NOT_POSTED') return '未回传'
  if (['SUCCESS', 'POSTED'].includes(value)) return '已回传'
  if (value === 'FAILED') return '回传失败'
  return value
}

function numberOf(value: unknown) {
  const result = Number(value || 0)
  return Number.isFinite(result) ? result : 0
}

const InfoItem = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number, Boolean], default: '-' }
  },
  setup(props) {
    return () => h('div', { class: 'info-item' }, [
      h('span', props.label),
      h('strong', String(props.value === 0 ? 0 : (props.value || '-')))
    ])
  }
})
</script>
