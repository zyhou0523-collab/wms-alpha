<template>
  <main class="page inbound-detail-page" :class="{ 'with-bottom-actions': bottomActions.length }">
    <van-nav-bar title="入库单详情" left-arrow fixed placeholder @click-left="router.back()" />

    <PageState
      v-if="loading || errorMessage || !order"
      :loading="loading"
      :error="errorMessage"
      :empty="!loading && !errorMessage && !order"
      empty-text="未找到预期到货通知单"
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
        <div class="detail-status-row">
          <StatusTag :status="order.sap_post_status" :label="sapStatusLabel(order.sap_post_status)" />
          <span>{{ inboundTypeLabel(order.inbound_type) }}</span>
        </div>
      </van-cell-group>

      <van-collapse v-model="activeSections" class="detail-collapse">
        <van-collapse-item name="header" title="单据表头信息">
          <div class="detail-grid">
            <InfoItem label="预期到货通知单号" :value="order.order_no" />
            <InfoItem label="来源系统" :value="order.source_system" />
            <InfoItem label="来源单号" :value="order.source_order_no" />
            <InfoItem label="订单类型" :value="inboundTypeLabel(order.inbound_type)" />
            <InfoItem label="收货状态" :value="statusLabel(order.status)" />
            <InfoItem label="SAP 回传状态" :value="sapStatusLabel(order.sap_post_status)" />
            <InfoItem label="仓库编码" :value="order.warehouse_code" />
            <InfoItem label="仓库名称" :value="order.warehouse_name" />
            <InfoItem label="供应商" :value="supplierText(order)" />
            <InfoItem label="货主" :value="order.owner_code" />
            <InfoItem label="货主名称" :value="order.owner_name" />
            <InfoItem label="关联单号" :value="order.related_order_no" />
            <InfoItem label="SAP 工厂" :value="order.sap_plant" />
            <InfoItem label="SAP 库存地点" :value="order.sap_storage_location" />
            <InfoItem label="到货日期" :value="order.plan_arrival_date || order.arrival_date" />
            <InfoItem label="产品行数" :value="order.line_count ?? lines.length" />
            <InfoItem label="订单总数量" :value="order.planned_qty" />
            <InfoItem label="已收货数量" :value="order.received_qty" />
            <InfoItem label="创建时间" :value="order.created_at" />
            <InfoItem label="更新时间" :value="order.updated_at" />
          </div>
        </van-collapse-item>

        <van-collapse-item name="lines" :title="`产品行明细（${lines.length}）`">
          <van-collapse v-model="activeLineNames" accordion>
            <van-collapse-item v-for="line in lines" :key="lineKey(line)" :name="String(lineKey(line))">
              <template #title>
                <div class="line-title">
                  <strong>行 {{ line.line_no }}</strong>
                  <span>{{ line.product_code }}</span>
                </div>
              </template>
              <div class="detail-grid">
                <InfoItem label="行号" :value="line.line_no" />
                <InfoItem label="产品 ID" :value="line.product_id" />
                <InfoItem label="产品编码" :value="line.product_code" />
                <InfoItem label="产品名称" :value="line.product_name || line.product_desc" />
                <InfoItem label="产品数量" :value="line.planned_qty ?? line.order_qty" />
                <InfoItem label="是否管理 SN" :value="isSnRequired(line) ? '是' : '否'" />
                <InfoItem label="已采集 SN 数量" :value="line.collected_sn_qty || 0" />
                <InfoItem label="已收货数量" :value="line.received_qty || 0" />
                <InfoItem label="行状态" :value="statusLabel(line.line_status || line.status)" />
                <InfoItem label="SAP 工厂" :value="line.sap_plant" />
                <InfoItem label="SAP 库存地点" :value="line.sap_storage_location" />
                <InfoItem label="批次号" :value="line.batch_no" />
              </div>
              <div class="inline-actions">
                <van-button v-if="isSnRequired(line)" size="small" type="primary" :disabled="!canCollectLine(line)" @click="openSnCollect(line)">SN 采集</van-button>
                <van-button size="small" type="success" :disabled="!canReceiveLine(line)" @click="openReceive(line)">收货</van-button>
              </div>
            </van-collapse-item>
          </van-collapse>
        </van-collapse-item>

        <van-collapse-item name="sns" :title="`SN 明细（${serialNumbers.length}）`">
          <div v-if="!serialNumbers.length" class="empty-inline">暂无 SN 明细</div>
          <van-cell-group v-for="sn in serialNumbers" v-else :key="sn.sn_code" inset class="mini-card">
            <van-cell>
              <template #title>
                <div class="order-title compact-title">{{ sn.sn_code }}</div>
                <div class="order-subtitle">{{ sn.product_code }}</div>
              </template>
              <template #value>
                <StatusTag :status="sn.status" :label="snStatusLabel(sn.status)" />
              </template>
            </van-cell>
            <div class="detail-grid compact">
              <InfoItem label="箱码" :value="sn.box_code" />
              <InfoItem label="托盘码" :value="sn.pallet_code" />
              <InfoItem label="当前库位" :value="sn.location_code" />
            </div>
            <div v-if="sn.status === 'COLLECTED'" class="inline-actions">
              <van-button size="small" type="danger" plain @click="cancelCollectedSn(sn)">取消 SN 采集</van-button>
            </div>
          </van-cell-group>
        </van-collapse-item>

        <van-collapse-item name="receipts" :title="`收货记录（${receiptRecords.length}）`">
          <div v-if="!receiptRecords.length" class="empty-inline">暂无收货记录</div>
          <van-cell-group v-for="receipt in receiptRecords" v-else :key="receipt.receipt_no" inset class="mini-card">
            <van-cell>
              <template #title>
                <div class="order-title compact-title">{{ receipt.receipt_no }}</div>
                <div class="order-subtitle">{{ receipt.receipt_time }}</div>
              </template>
              <template #value>
                <StatusTag :status="receipt.sap_post_status" :label="sapStatusLabel(receipt.sap_post_status)" />
              </template>
            </van-cell>
            <div class="detail-grid compact">
              <InfoItem label="收货人" :value="receipt.receipt_user" />
              <InfoItem label="行号" :value="receipt.line_no" />
              <InfoItem label="产品编码" :value="receipt.product_code" />
              <InfoItem label="本次收货数量" :value="receipt.receive_qty" />
              <InfoItem label="SAP 凭证号" :value="receipt.sap_material_doc_no" />
              <InfoItem label="回传结果" :value="receipt.sap_post_result" />
            </div>
            <div v-if="canCancelReceipt(receipt)" class="inline-actions">
              <van-button size="small" type="danger" plain @click="cancelReceipt(receipt)">取消收货</van-button>
            </div>
          </van-cell-group>
        </van-collapse-item>

        <van-collapse-item name="operations" :title="`操作日志（${operationLogs.length}）`">
          <LogCard
            v-for="log in operationLogs"
            :key="log.id || `${log.action}-${log.created_at}`"
            :title="log.action"
            :sub-title="log.operator"
            :time="log.created_at"
            :message="log.message"
          />
          <div v-if="!operationLogs.length" class="empty-inline">暂无操作日志</div>
        </van-collapse-item>

        <van-collapse-item name="interfaces" :title="`接口日志（${interfaceLogs.length}）`">
          <LogCard
            v-for="log in interfaceLogs"
            :key="log.id || `${log.interface_name}-${log.created_at}`"
            :title="log.interface_name"
            :sub-title="`${log.source_system || '-'} → ${log.target_system || '-'}`"
            :time="log.created_at"
            :message="log.error_message || log.status"
            :status="log.status"
          />
          <div v-if="!interfaceLogs.length" class="empty-inline">暂无接口日志</div>
        </van-collapse-item>
      </van-collapse>
    </template>

    <div v-if="order && bottomActions.length" class="bottom-action-bar">
      <van-button
        v-for="action in bottomActions"
        :key="action.label"
        :type="action.type"
        :plain="action.plain"
        block
        @click="action.handler"
      >
        {{ action.label }}
      </van-button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  cancelInboundOrder,
  cancelInboundReceipt,
  cancelSnCollection,
  getInboundOrder,
  retryInboundSap,
  sapPostInboundOrder,
  type InboundDetail,
  type InboundLine,
  type InboundOrder,
  type InboundReceiptRecord,
  type InboundSerialNumber
} from '../../api/inbound'
import PageState from '../../components/PageState.vue'
import StatusTag from '../../components/StatusTag.vue'
import { confirmAction, success, withLoading } from '../../utils/feedback'

type ButtonType = 'primary' | 'success' | 'default' | 'warning' | 'danger'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const detail = ref<InboundDetail>({})
const activeSections = ref(['header', 'lines'])
const activeLineNames = ref('')

const order = computed(() => detail.value.order)
const lines = computed(() => detail.value.details || detail.value.lines || order.value?.lines || [])
const serialNumbers = computed(() => detail.value.serialNumbers || [])
const receiptRecords = computed(() => detail.value.receiptRecords || [])
const operationLogs = computed(() => detail.value.operationLogs || [])
const interfaceLogs = computed(() => detail.value.interfaceLogs || [])

const inboundTypeMap: Record<string, string> = {
  PRODUCTION: '生产入库',
  STOCKING: '备货入库',
  RMA: '售后 RMA 入库',
  TRANSFER: '调拨入库',
  SUPPLIER_VMI: '供应商 VMI 入库',
  OTHER: '其他入库',
  STOCK_IN: '备货入库'
}

const statusMap: Record<string, string> = {
  CREATED: '待收货',
  RECEIVING: '部分收货',
  PARTIAL_RECEIVED: '部分收货',
  RECEIVED: '完全收货',
  ON_SHELF: '完全收货',
  CLOSED: '已关闭',
  CANCELED: '已取消'
}

const bottomActions = computed(() => {
  const current = order.value
  if (!current) return []
  const actions: Array<{ label: string; type: ButtonType; plain?: boolean; handler: () => void }> = []
  const collectableLine = lines.value.find((line) => isSnRequired(line) && canCollectLine(line))
  if (collectableLine) actions.push({ label: 'SN 采集', type: 'primary', handler: () => openSnCollect(collectableLine) })
  if (canReceiveOrder()) actions.push({ label: '收货', type: 'success', handler: () => openReceive() })
  if (canSapPost(current)) actions.push({ label: current.sap_post_status === 'FAILED' ? 'SAP 重传' : 'SAP 回传', type: 'warning', handler: () => sapPost() })
  else if (canRetrySap(current)) actions.push({ label: 'SAP 重传', type: 'warning', plain: true, handler: () => retrySap() })
  if (canCancelOrder(current)) actions.push({ label: '取消单据', type: 'danger', plain: true, handler: () => cancelOrder() })
  return actions
})

onMounted(load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    detail.value = await getInboundOrder(Number(route.params.id))
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '入库单详情加载失败'
  } finally {
    loading.value = false
  }
}

function openSnCollect(line: InboundLine) {
  const targetLineId = line.id || line.line_id || line.inbound_order_line_id
  if (!targetLineId) {
    success(`SN 采集入口已按 PC 规则开放：行 ${line.line_no}`)
    return
  }
  router.push(`/inbound/${route.params.id}/sn-collect/${targetLineId}`)
}

function openReceive(line?: InboundLine) {
  const targetLineId = line ? line.id || line.line_id || line.inbound_order_line_id : ''
  router.push(targetLineId ? `/inbound/${route.params.id}/receive/${targetLineId}` : `/inbound/${route.params.id}/receive`)
}

async function sapPost() {
  if (!order.value) return
  const isRetry = order.value.sap_post_status === 'FAILED'
  await confirmAction(
    `确认对入库单 ${order.value.order_no} 发起 SAP 入库回传？待回传批次数：${order.value.pending_sap_receipt_count || 0}`,
    isRetry ? 'SAP 重传确认' : 'SAP 回传确认'
  )
  await withLoading('SAP 回传中', async () => {
    detail.value = await sapPostInboundOrder(Number(route.params.id))
  })
  success(isRetry ? 'SAP 重传已触发' : 'SAP 入库回传已触发')
}

async function retrySap() {
  if (!order.value) return
  await confirmAction(`确认重传入库单 ${order.value.order_no} 的 SAP 失败记录？`, 'SAP 重传确认')
  await withLoading('SAP 重传中', async () => {
    await retryInboundSap([Number(route.params.id)])
    detail.value = await getInboundOrder(Number(route.params.id))
  })
  success('SAP 重传已触发')
}

async function cancelOrder() {
  if (!order.value) return
  await confirmAction(`确认取消预期到货通知单 ${order.value.order_no}？取消后单据进入终态。`, '取消预期到货通知单')
  await withLoading('取消单据中', async () => {
    detail.value = await cancelInboundOrder(Number(route.params.id))
  })
  success('预期到货通知单已取消')
}

async function cancelCollectedSn(sn: InboundSerialNumber) {
  if (!sn.inbound_order_line_id || !sn.sn_code) return
  await confirmAction(`确认取消 SN ${sn.sn_code} 的采集关系？`, '取消 SN 采集')
  await withLoading('取消 SN 采集中', async () => {
    await cancelSnCollection(Number(route.params.id), Number(sn.inbound_order_line_id), [sn.sn_code || ''])
    detail.value = await getInboundOrder(Number(route.params.id))
  })
  success('已取消 SN 采集')
}

async function cancelReceipt(receipt: InboundReceiptRecord) {
  const receiptId = Number(receipt.receipt_id || receipt.id)
  if (!receiptId) return
  await confirmAction(`确认取消收货批次 ${receipt.receipt_no}？`, '取消收货')
  await withLoading('取消收货中', async () => {
    detail.value = await cancelInboundReceipt(Number(route.params.id), receiptId)
  })
  success('收货批次已取消')
}

function canReceiveOrder() {
  const status = order.value?.status
  return ['CREATED', 'PARTIAL_RECEIVED', 'RECEIVING'].includes(String(status || ''))
    && lines.value.some((line) => canReceiveLine(line))
}

function canReceiveLine(line: InboundLine) {
  const status = order.value?.status
  if (!['CREATED', 'PARTIAL_RECEIVED', 'RECEIVING'].includes(String(status || ''))) return false
  if (isSnRequired(line)) return numberOf(line.pending_receive_qty) > 0
  return receiveRemainingQty(line) > 0
}

function canCollectLine(line: InboundLine) {
  const status = order.value?.status
  return isSnRequired(line)
    && !['RECEIVED', 'ON_SHELF', 'CLOSED', 'CANCELED'].includes(String(status || ''))
    && remainingCollectQty(line) > 0
}

function canSapPost(row: InboundOrder) {
  return numberOf(row.pending_sap_receipt_count) > 0
}

function canRetrySap(row: InboundOrder) {
  return canSapPost(row) || ['FAILED', 'NOT_POSTED'].includes(String(row.sap_post_status || ''))
}

function canCancelOrder(row: InboundOrder) {
  return row.status === 'CREATED'
    && numberOf(row.collected_qty) === 0
    && numberOf(row.pending_receive_qty) === 0
    && numberOf(row.received_qty) === 0
    && !['SUCCESS', 'POSTED'].includes(String(row.sap_post_status || ''))
}

function canCancelReceipt(receipt: InboundReceiptRecord) {
  return !['CANCELED'].includes(String(receipt.status || ''))
    && !['SUCCESS', 'POSTED'].includes(String(receipt.sap_post_status || ''))
    && numberOf(receipt.receive_qty) > 0
}

function isSnRequired(line: InboundLine) {
  return line.snRequired === true || Number(line.sn_required ?? 0) === 1
}

function remainingCollectQty(line: InboundLine) {
  return Math.max(numberOf(line.planned_qty ?? line.order_qty) - numberOf(line.received_qty) - numberOf(line.pending_receive_qty), 0)
}

function receiveRemainingQty(line: InboundLine) {
  return Math.max(numberOf(line.planned_qty ?? line.order_qty) - numberOf(line.received_qty), 0)
}

function lineKey(line: InboundLine) {
  return line.id || line.line_id || line.inbound_order_line_id || line.line_no || line.product_code
}

function supplierText(row: InboundOrder) {
  return row.supplier_name || row.supplier_code || row.owner_name || '-'
}

function inboundTypeLabel(value?: string) {
  return inboundTypeMap[String(value || '')] || value || '-'
}

function statusLabel(value?: string) {
  return statusMap[String(value || '')] || value || '-'
}

function sapStatusLabel(value?: string) {
  if (!value || value === 'NOT_POSTED') return '未回传'
  if (['SUCCESS', 'POSTED'].includes(value)) return '已回传'
  if (value === 'FAILED') return '回传失败'
  return value
}

function snStatusLabel(value?: string) {
  const map: Record<string, string> = {
    ISSUED: '已下发',
    COLLECTED: '已采集/待收货',
    RECEIVED: '已收货',
    ON_SHELF: '在库',
    ALLOCATED: '已分配',
    SHIPPED: '已出库',
    CANCELED: '已取消'
  }
  return map[String(value || '')] || value || '-'
}

function numberOf(value: unknown) {
  return Number(value || 0)
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

const LogCard = defineComponent({
  props: {
    title: { type: String, default: '-' },
    subTitle: { type: String, default: '-' },
    time: { type: String, default: '-' },
    message: { type: String, default: '-' },
    status: { type: String, default: '' }
  },
  setup(props) {
    return () => h('div', { class: 'log-card' }, [
      h('div', { class: 'log-head' }, [
        h('strong', props.title),
        props.status ? h(StatusTag, { status: props.status, label: props.status }) : null
      ]),
      h('p', props.subTitle),
      h('p', props.time),
      h('div', { class: 'log-message' }, props.message || '-')
    ])
  }
})
</script>
