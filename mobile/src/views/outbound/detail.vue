<template>
  <main class="page outbound-detail-page" :class="{ 'with-bottom-actions': bottomActions.length }">
    <van-nav-bar title="发运订单详情" left-arrow fixed placeholder @click-left="router.back()" />

    <PageState
      v-if="loading || errorMessage || !order"
      :loading="loading"
      :error="errorMessage"
      :empty="!loading && !errorMessage && !order"
      empty-text="未找到发运订单"
      @retry="load"
    />

    <template v-else>
      <van-cell-group inset class="detail-card">
        <van-cell>
          <template #title>
            <div class="order-title compact-title">{{ order.shipment_order_no || order.order_no }}</div>
            <div class="order-subtitle">{{ customerText(order) }}</div>
          </template>
          <template #value>
            <StatusTag :status="order.status" :label="statusLabel(order.status)" />
          </template>
        </van-cell>
        <div class="detail-status-row">
          <StatusTag :status="order.sap_post_status" :label="sapStatusLabel(order.sap_post_status)" />
          <span>{{ orderTypeLabel(order.order_type || order.outbound_type) }}</span>
        </div>
      </van-cell-group>

      <van-collapse v-model="activeSections" class="detail-collapse">
        <van-collapse-item name="header" title="发运订单表头">
          <div class="detail-grid">
            <InfoItem label="发运订单号" :value="order.shipment_order_no || order.order_no" />
            <InfoItem label="订单类型" :value="orderTypeLabel(order.order_type || order.outbound_type)" />
            <InfoItem label="客户" :value="customerText(order)" />
            <InfoItem label="出库国家" :value="order.ship_from_country || order.shipFromCountry" />
            <InfoItem label="货主" :value="[order.owner_code, order.owner_name].filter(Boolean).join(' / ')" />
            <InfoItem label="仓库" :value="[order.warehouse_code, order.warehouse_name].filter(Boolean).join(' / ')" />
            <InfoItem label="关联单号" :value="order.related_order_no" />
            <InfoItem label="销售单号" :value="order.sales_order_no" />
            <InfoItem label="发运日期" :value="order.expected_ship_time" />
            <InfoItem label="订单总数量" :value="order.planned_qty" />
            <InfoItem label="已分配数量" :value="order.allocated_qty" />
            <InfoItem label="已拣货数量" :value="order.picked_qty" />
            <InfoItem label="已发货数量" :value="order.shipped_qty" />
            <InfoItem label="SAP 回传" :value="sapStatusLabel(order.sap_post_status)" />
            <InfoItem label="回传说明" :value="order.sap_post_result" />
            <InfoItem label="物流单号" :value="order.tracking_no" />
          </div>
        </van-collapse-item>

        <van-collapse-item name="lines" :title="`产品行明细（${lines.length}）`">
          <van-collapse v-model="activeLineNames" accordion>
            <van-collapse-item v-for="line in lines" :key="lineKey(line)" :name="String(lineKey(line))">
              <template #title>
                <div class="line-title">
                  <strong>行 {{ line.line_no }} / {{ line.product_code }}</strong>
                  <span>{{ line.product_name || line.product_description }}</span>
                </div>
              </template>
              <div class="detail-grid">
                <InfoItem label="行号" :value="line.line_no" />
                <InfoItem label="产品 ID" :value="line.product_id" />
                <InfoItem label="产品编码" :value="line.product_code" />
                <InfoItem label="产品名称" :value="line.product_name || line.product_description" />
                <InfoItem label="订单数量" :value="line.order_qty || line.planned_qty" />
                <InfoItem label="已分配数量" :value="line.allocated_qty || 0" />
                <InfoItem label="已拣货数量" :value="line.picked_qty || 0" />
                <InfoItem label="已发货数量" :value="line.shipped_qty || 0" />
                <InfoItem label="是否管理 SN" :value="isSnRequired(line) ? '是' : '否'" />
                <InfoItem label="行状态" :value="statusLabel(line.line_status || line.status)" />
                <InfoItem label="SAP 工厂" :value="line.sap_plant" />
                <InfoItem label="单位" :value="line.unit" />
              </div>
              <div v-if="order && canPick(order, line)" class="inline-actions">
                <van-button size="mini" type="primary" plain @click="openPick(line)">拣货</van-button>
              </div>
              <div v-if="order && canShip(order, line)" class="inline-actions">
                <van-button size="mini" type="success" plain @click="openShip(line)">发货</van-button>
              </div>
            </van-collapse-item>
          </van-collapse>
        </van-collapse-item>

        <van-collapse-item name="allocations" :title="`分配记录（${allocations.length}）`">
          <div v-for="row in allocations" :key="row.id || row.allocation_no" class="record-action-card">
            <RecordCard :title="row.allocation_no" :status="row.allocation_status" :items="recordItems(row, 'allocation')" />
            <div v-if="canCancelAllocationRecord(row)" class="inline-actions">
              <van-button size="mini" type="danger" plain @click="cancelAllocation(row)">取消分配</van-button>
            </div>
          </div>
          <div v-if="!allocations.length" class="empty-inline">暂无分配记录</div>
        </van-collapse-item>

        <van-collapse-item name="picks" :title="`拣货记录（${pickingRecords.length}）`">
          <div v-for="row in pickingRecords" :key="row.id || row.task_no" class="record-action-card">
            <RecordCard :title="row.task_no" :status="row.result" :items="recordItems(row, 'pick')" />
            <div v-if="canCancelPickRecord(row)" class="inline-actions">
              <van-button size="mini" type="danger" plain @click="cancelPick(row)">取消拣货</van-button>
            </div>
          </div>
          <div v-if="!pickingRecords.length" class="empty-inline">暂无拣货记录</div>
        </van-collapse-item>

        <van-collapse-item name="shipments" :title="`发货记录（${shipments.length}）`">
          <div v-for="row in shipments" :key="row.id || row.shipment_no" class="record-action-card">
            <RecordCard :title="row.shipment_no" :status="row.shipment_status" :items="recordItems(row, 'ship')" />
            <div v-if="canCancelShipmentRecord(row)" class="inline-actions">
              <van-button size="mini" type="danger" plain @click="cancelShipment(row)">取消发货</van-button>
            </div>
          </div>
          <div v-if="!shipments.length" class="empty-inline">暂无发货记录</div>
        </van-collapse-item>

        <van-collapse-item name="interfaces" :title="`接口日志（${interfaceLogs.length}）`">
          <LogCard v-for="log in interfaceLogs" :key="log.id || `${log.interface_name}-${log.created_at}`" :title="log.interface_name" :sub-title="`${log.source_system || '-'} -> ${log.target_system || '-'}`" :time="log.created_at" :message="log.error_message || log.status" :status="log.status" />
          <div v-if="!interfaceLogs.length" class="empty-inline">暂无接口日志</div>
        </van-collapse-item>

        <van-collapse-item name="operations" :title="`操作日志（${operationLogs.length}）`">
          <LogCard v-for="log in operationLogs" :key="log.id || `${log.action}-${log.created_at}`" :title="log.action" :sub-title="log.operator" :time="log.created_at" :message="log.message || log.result" />
          <div v-if="!operationLogs.length" class="empty-inline">暂无操作日志</div>
        </van-collapse-item>
      </van-collapse>
    </template>

    <div v-if="order && bottomActions.length" class="bottom-action-bar scroll-actions">
      <van-button v-for="action in bottomActions" :key="action.label" :type="action.type" :plain="action.plain" size="small" @click="action.handler">
        {{ action.label }}
      </van-button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  allocateOutboundAuto,
  cancelOutboundAllocations,
  cancelOutboundPick,
  cancelOutboundShipment,
  getOutboundOrder,
  postOutboundSap,
  releaseOutboundAllocation,
  retryOutboundSap,
  type OutboundDetail,
  type OutboundLine,
  type OutboundLog,
  type OutboundOrder,
  type OutboundRecord
} from '../../api/outbound'
import PageState from '../../components/PageState.vue'
import StatusTag from '../../components/StatusTag.vue'
import { confirmAction, success, withLoading } from '../../utils/feedback'

type ButtonType = 'primary' | 'success' | 'default' | 'warning' | 'danger'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const detail = ref<OutboundDetail>({})
const activeSections = ref(['header', 'lines'])
const activeLineNames = ref('')

const order = computed(() => detail.value.order)
const lines = computed(() => detail.value.details || detail.value.lines || order.value?.lines || [])
const allocations = computed(() => detail.value.allocations || [])
const pickingRecords = computed(() => detail.value.pickingRecords || [])
const shipments = computed(() => detail.value.shipments || [])
const operationLogs = computed(() => detail.value.operationLogs || [])
const interfaceLogs = computed(() => detail.value.interfaceLogs || [])

const bottomActions = computed(() => {
  const current = order.value
  if (!current) return []
  const actions: Array<{ label: string; type: ButtonType; plain?: boolean; handler: () => void }> = []
  if (canAllocate(current)) actions.push({ label: '自动分配', type: 'primary', handler: autoAllocate })
  if (canAllocate(current)) actions.push({ label: '人工分配', type: 'primary', plain: true, handler: openAllocation })
  if (allocations.value.some(canCancelAllocationRecord)) actions.push({ label: '取消分配', type: 'danger', plain: true, handler: releaseAllocation })
  if (canPick(current)) actions.push({ label: '拣货', type: 'primary', handler: () => openPick() })
  if (canPick(current)) actions.push({ label: '扫码拣货', type: 'primary', plain: true, handler: () => openPick() })
  if (pickingRecords.value.some(canCancelPickRecord)) actions.push({ label: '取消拣货', type: 'danger', plain: true, handler: cancelCancelablePicks })
  if (canShip(current)) actions.push({ label: '发货', type: 'success', handler: () => openShip() })
  if (shipments.value.some(canCancelShipmentRecord)) actions.push({ label: '取消发货', type: 'danger', plain: true, handler: cancelCancelableShipment })
  if (canPostSap(current)) actions.push({ label: current.sap_post_status === 'FAILED' ? 'SAP 重传' : 'SAP 回传', type: 'warning', plain: true, handler: postSap })
  if (canClose(current)) actions.push({ label: '关闭', type: 'warning', plain: true, handler: () => prepared('关闭') })
  if (canCancel(current)) actions.push({ label: '取消', type: 'danger', plain: true, handler: () => prepared('取消') })
  return actions
})

onMounted(load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    detail.value = await getOutboundOrder(Number(route.params.id))
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '发运订单详情加载失败'
  } finally {
    loading.value = false
  }
}

async function autoAllocate() {
  await confirmAction(`确认对发运订单 ${order.value?.shipment_order_no || order.value?.order_no} 执行系统自动分配？`, '自动分配确认')
  detail.value = await withLoading('自动分配中', () => allocateOutboundAuto(Number(route.params.id)))
  success('自动分配完成，库存已锁定但未扣减')
}

function openAllocation() {
  router.push(`/outbound/${route.params.id}/allocation`)
}

function openPick(line?: OutboundLine) {
  const lineId = line ? lineKey(line) : ''
  router.push(lineId ? `/outbound/${route.params.id}/pick/${lineId}` : `/outbound/${route.params.id}/pick`)
}

function openShip(line?: OutboundLine) {
  const lineId = line ? lineKey(line) : ''
  router.push(lineId ? `/outbound/${route.params.id}/ship/${lineId}` : `/outbound/${route.params.id}/ship`)
}

async function releaseAllocation() {
  await confirmAction('确认取消当前订单全部未拣货分配？已拣货记录将按 PC 端规则拦截。', '取消分配确认')
  detail.value = await withLoading('取消分配中', () => releaseOutboundAllocation(Number(route.params.id)))
  success('已取消未拣货分配')
}

async function cancelAllocation(row: OutboundRecord) {
  const allocationId = Number(row.id)
  if (!allocationId) return
  await confirmAction(`确认取消分配记录 ${row.allocation_no}？`, '取消分配确认')
  detail.value = await withLoading('取消分配中', () => cancelOutboundAllocations(Number(route.params.id), [allocationId]))
  success('分配记录已取消')
}

async function cancelPick(row: OutboundRecord) {
  const pickId = Number(row.id)
  if (!pickId) return
  await confirmAction(`确认取消拣货记录 ${row.task_no}？`, '取消拣货确认')
  detail.value = await withLoading('取消拣货中', () => cancelOutboundPick(Number(route.params.id), pickId))
  success('拣货记录已取消')
}

async function cancelCancelablePicks() {
  const first = pickingRecords.value.find(canCancelPickRecord)
  if (!first) return
  await cancelPick(first)
}

async function cancelShipment(row: OutboundRecord) {
  const shipmentId = Number(row.id)
  if (!shipmentId) return
  await confirmAction(`确认取消发货批次 ${row.shipment_no}？取消后会回退库存与 SN 状态。`, '取消发货确认')
  detail.value = await withLoading('取消发货中', () => cancelOutboundShipment(Number(route.params.id), shipmentId))
  success('发货批次已取消')
}

async function cancelCancelableShipment() {
  const first = shipments.value.find(canCancelShipmentRecord)
  if (!first) return
  await cancelShipment(first)
}

async function postSap() {
  const current = order.value
  if (!current) return
  const isRetry = current.sap_post_status === 'FAILED'
  await confirmAction(`确认${isRetry ? '重传' : '回传'}发运订单 ${current.shipment_order_no || current.order_no} 的 SAP 出库扣减？`, isRetry ? 'SAP 重传确认' : 'SAP 回传确认')
  detail.value = await withLoading(isRetry ? 'SAP 重传中' : 'SAP 回传中', () =>
    isRetry ? retryOutboundSap(Number(route.params.id)) : postOutboundSap(Number(route.params.id))
  )
  success(isRetry ? 'SAP 重传已触发' : 'SAP 出库回传已触发')
}

function prepared(action: string) {
  success(`${action}入口已按 PC 规则显示，本轮未调整该业务动作`)
}

function canAllocate(row: OutboundOrder) {
  return ['CREATED', 'PARTIAL_ALLOCATED', 'PENDING_ALLOC', 'ALLOCATION_EXCEPTION'].includes(String(row.status || ''))
}

function canPick(row: OutboundOrder, line?: OutboundLine) {
  const source = line || row
  return !['CANCELED', 'CLOSED', 'SHIPPED', 'CALLBACK_SUCCESS'].includes(String(row.status || ''))
    && numberOf(source.picked_qty) < numberOf(line ? (line.order_qty || line.planned_qty) : row.planned_qty)
}

function canShip(row: OutboundOrder, line?: OutboundLine) {
  const source = line || row
  return numberOf(source.picked_qty) > numberOf(source.shipped_qty) && !['CANCELED', 'CLOSED'].includes(String(row.status || ''))
}

function canPostSap(row: OutboundOrder) {
  return numberOf(row.shipped_qty) > 0 && ['FAILED', 'NOT_POSTED', ''].includes(String(row.sap_post_status || ''))
}

function canClose(row: OutboundOrder) {
  return numberOf(row.shipped_qty) > 0 && !['CLOSED', 'CANCELED'].includes(String(row.status || ''))
}

function canCancel(row: OutboundOrder) {
  return ['CREATED', 'PENDING_ALLOC'].includes(String(row.status || ''))
}

function canCancelAllocationRecord(row: OutboundRecord) {
  return row.allocation_status === 'ALLOCATED'
}

function canCancelPickRecord(row: OutboundRecord) {
  return !['CANCELED', 'SHIPPED'].includes(String(row.result || row.status || ''))
    && !['SHIPPED'].includes(String(row.allocation_status || ''))
    && !row.shipment_no
}

function canCancelShipmentRecord(row: OutboundRecord) {
  return !['CANCELED'].includes(String(row.shipment_status || row.status || ''))
    && !['SUCCESS', 'POSTED'].includes(String(row.sap_post_status || ''))
}

function recordItems(row: OutboundRecord, type: 'allocation' | 'pick' | 'ship') {
  const base = [
    { label: '行号', value: row.line_no },
    { label: '产品编码', value: row.product_code },
    { label: '产品名称', value: row.product_name },
    { label: '货主', value: row.owner_code },
    { label: '库位', value: row.location_code },
    { label: 'SN', value: row.sn_code }
  ]
  if (type === 'allocation') return [...base, { label: '数量', value: row.allocated_qty }, { label: '模式', value: allocationModeLabel(row.allocation_mode) }]
  if (type === 'pick') return [...base, { label: '拣货数量', value: row.picked_qty || 1 }, { label: '拣货人', value: row.picker }]
  return [...base, { label: '发货数量', value: row.shipped_qty }, { label: '物流商', value: row.carrier }, { label: '物流单号', value: row.tracking_no }]
}

function lineKey(line: OutboundLine) {
  return line.id || line.line_id || line.outbound_detail_id || line.line_no || line.product_code
}

function isSnRequired(line: OutboundLine) {
  return line.snRequired === true || Number(line.sn_required ?? 0) === 1
}

function customerText(row: OutboundOrder) {
  return row.customer_name || row.consignee_name || row.customer_code || row.consignee_code || '-'
}

function orderTypeLabel(value?: string) {
  const map: Record<string, string> = {
    SALES_OUTBOUND: '销售出库',
    AFTERSALE_OUTBOUND: '售后出库',
    WAREHOUSE_TRANSFER: '仓库调拨',
    STO_OUTBOUND: 'STO 出库',
    WORK_ORDER_ISSUE: '工单领料出库',
    MATERIAL_REQUISITION: '领料单出库',
    REWORK_OUTBOUND: '返工出库',
    RETURN_OUTBOUND: '退货出库',
    OTHER_OUTBOUND: '其他出库',
    SALES: '销售出库',
    TRANSFER: '仓库调拨',
    AFTERSALE: '售后出库'
  }
  return map[String(value || '')] || value || '-'
}

function statusLabel(value?: string) {
  const map: Record<string, string> = {
    CREATED: '创建',
    PENDING_ALLOC: '创建',
    ALLOCATION_EXCEPTION: '分配异常',
    PARTIAL_ALLOCATED: '部分分配',
    ALLOCATED: '完全分配',
    PARTIAL_PICKED: '部分拣货',
    PICKED: '完全拣货',
    PARTIAL_SHIPPED: '部分发运',
    SHIPPED: '完全发运',
    CLOSED: '订单关闭',
    CANCELED: '订单取消',
    CALLBACK_SUCCESS: '回传成功',
    CALLBACK_FAILED: '回传失败'
  }
  return map[String(value || '')] || value || '-'
}

function sapStatusLabel(value?: string) {
  if (!value || value === 'NOT_POSTED') return '未回传'
  if (['SUCCESS', 'POSTED'].includes(value)) return '成功'
  if (value === 'FAILED') return '失败'
  return value
}

function allocationModeLabel(value?: string) {
  if (value === 'DIRECT_PICK') return '不分配直接拣货'
  if (value === 'MANUAL') return '人工指定'
  if (['AUTO_FIFO', 'AUTO', 'ALLOCATED'].includes(String(value || ''))) return '系统自动'
  return value || '-'
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

const RecordCard = defineComponent({
  props: {
    title: { type: String, default: '-' },
    status: { type: String, default: '' },
    items: { type: Array as () => Array<{ label: string; value?: string | number }>, default: () => [] }
  },
  setup(props) {
    return () => h('div', { class: 'log-card' }, [
      h('div', { class: 'log-head' }, [
        h('strong', props.title || '-'),
        h(StatusTag, { status: props.status })
      ]),
      h('div', { class: 'detail-grid compact record-grid' }, props.items.map((item) =>
        h('div', { class: 'info-item' }, [
          h('span', item.label),
          h('strong', String(item.value === 0 ? 0 : (item.value || '-')))
        ])
      ))
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
        h('strong', props.title || '-'),
        props.status ? h(StatusTag, { status: props.status }) : null
      ]),
      h('p', `${props.subTitle || '-'} / ${props.time || '-'}`),
      h('div', { class: 'log-message' }, props.message || '-')
    ])
  }
})
</script>
