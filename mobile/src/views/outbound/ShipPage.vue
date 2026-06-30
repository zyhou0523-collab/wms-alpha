<template>
  <main class="page outbound-ship-page with-bottom-actions">
    <van-nav-bar title="发货确认" left-arrow fixed placeholder @click-left="goBack" />

    <PageState
      v-if="loading || errorMessage || !order"
      :loading="loading"
      :error="errorMessage"
      :empty="!loading && !errorMessage && !order"
      empty-text="未找到发货上下文"
      @retry="load"
    />

    <template v-else>
      <van-cell-group inset class="detail-card">
        <van-cell>
          <template #title>
            <div class="order-title compact-title">{{ order.shipment_order_no || order.order_no }}</div>
            <div class="order-subtitle">{{ order.customer_name || order.consignee_name || '-' }} / {{ order.ship_from_country || '-' }}</div>
          </template>
          <template #value>
            <StatusTag :status="order.status" :label="statusLabel(order.status)" />
          </template>
        </van-cell>
        <div class="detail-grid compact">
          <InfoItem label="订单数量" :value="order.planned_qty" />
          <InfoItem label="已分配数量" :value="order.allocated_qty || 0" />
          <InfoItem label="已拣货数量" :value="order.picked_qty || 0" />
          <InfoItem label="已发货数量" :value="order.shipped_qty || 0" />
          <InfoItem label="SAP 回传" :value="sapStatusLabel(order.sap_post_status)" />
        </div>
      </van-cell-group>

      <section class="section-title">本次发货明细</section>
      <van-cell-group v-for="line in shippableLines" :key="lineKey(line)" inset class="mini-card">
        <van-cell is-link :class="{ selected: Number(selectedLineId) === Number(lineKey(line)) }" @click="selectLine(line)">
          <template #title>
            <div class="line-title">
              <strong>行 {{ line.line_no }} / {{ line.product_code }}</strong>
              <span>{{ line.product_name || line.product_description }}</span>
            </div>
          </template>
          <template #label>
            <span>订单 {{ line.order_qty || line.planned_qty }} / 已拣 {{ line.picked_qty || 0 }} / 已发 {{ line.shipped_qty || 0 }} / 待发 {{ remainingShipQty(line) }}</span>
          </template>
          <template #value>
            <StatusTag :status="line.line_status || line.status" :label="statusLabel(line.line_status || line.status)" />
          </template>
        </van-cell>
      </van-cell-group>
      <div v-if="!shippableLines.length" class="empty-inline">暂无已拣货未发货产品行</div>

      <van-cell-group inset class="mini-card">
        <van-cell title="发货范围" :value="selectedLine ? `行 ${selectedLine.line_no}` : '整单发货'" />
        <van-field v-model="shipQty" type="number" label="本次发货数量" placeholder="0 表示按当前可发数量全部发货" />
        <van-field v-model="carrierName" label="物流商" placeholder="请输入物流商" />
        <van-field v-model="trackingNo" label="物流单号" placeholder="请输入物流单号" />
        <van-field v-model="shipper" label="发货人" placeholder="请输入发货人" />
        <van-field v-model="remark" label="备注" placeholder="可选" />
        <van-cell title="模拟 SAP 失败">
          <template #right-icon>
            <van-switch v-model="forceSapFail" size="20px" />
          </template>
        </van-cell>
        <van-cell title="模拟追溯失败">
          <template #right-icon>
            <van-switch v-model="forceTraceFail" size="20px" />
          </template>
        </van-cell>
      </van-cell-group>

      <section class="section-title">已拣货待发记录</section>
      <div v-if="!pendingShipAllocations.length" class="empty-inline">暂无已拣货未发货分配记录</div>
      <van-cell-group v-for="row in pendingShipAllocations" :key="row.id || row.allocation_no" inset class="mini-card">
        <van-cell>
          <template #title>
            <div class="order-title compact-title">{{ row.sn_code || row.allocation_no }}</div>
            <div class="order-subtitle">行 {{ row.line_no }} / {{ row.product_code }}</div>
          </template>
          <template #label>
            <span>{{ row.location_code || '-' }} / {{ row.pallet_code || '-' }} / 数量 {{ row.allocated_qty || 0 }}</span>
          </template>
          <template #value>
            <StatusTag :status="row.allocation_status" />
          </template>
        </van-cell>
      </van-cell-group>

      <section class="section-title">发货记录</section>
      <div v-if="!shipments.length" class="empty-inline">暂无发货记录</div>
      <van-cell-group v-for="row in shipments" :key="row.id || row.shipment_no" inset class="mini-card">
        <van-cell>
          <template #title>
            <div class="order-title compact-title">{{ row.shipment_no }}</div>
            <div class="order-subtitle">{{ row.carrier || '-' }} / {{ row.tracking_no || '-' }}</div>
          </template>
          <template #label>
            <span>发货 {{ row.shipped_qty || 0 }} / {{ row.ship_time || '-' }}</span>
          </template>
          <template #value>
            <StatusTag :status="row.sap_post_status || row.shipment_status" :label="sapStatusLabel(row.sap_post_status || row.shipment_status)" />
          </template>
          <template #right-icon>
            <van-button v-if="canCancelShipmentRecord(row)" size="mini" type="danger" plain @click.stop="cancelShipment(row)">
              取消
            </van-button>
          </template>
        </van-cell>
      </van-cell-group>
    </template>

    <div class="bottom-action-bar">
      <van-button block plain @click="goBack">返回详情</van-button>
      <van-button block type="success" :loading="submitting" @click="submitShip">确认发货</van-button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  cancelOutboundShipment,
  getOutboundOrder,
  shipOutboundOrder,
  type OutboundDetail,
  type OutboundLine,
  type OutboundRecord
} from '../../api/outbound'
import PageState from '../../components/PageState.vue'
import StatusTag from '../../components/StatusTag.vue'
import { confirmAction, fail, success, withLoading } from '../../utils/feedback'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const detail = ref<OutboundDetail>({})
const selectedLineId = ref<number | string>('')
const shipQty = ref('0')
const carrierName = ref('SF')
const trackingNo = ref('')
const shipper = ref('mobile')
const remark = ref('')
const forceSapFail = ref(false)
const forceTraceFail = ref(false)

const orderId = computed(() => Number(route.params.orderId))
const routeLineId = computed(() => route.params.lineId ? Number(route.params.lineId) : 0)
const order = computed(() => detail.value.order)
const lines = computed(() => detail.value.details || detail.value.lines || order.value?.lines || [])
const allocations = computed(() => detail.value.allocations || [])
const shipments = computed(() => detail.value.shipments || [])
const shippableLines = computed(() => lines.value.filter((line) => remainingShipQty(line) > 0))
const selectedLine = computed(() => lines.value.find((line) => Number(lineKey(line)) === Number(selectedLineId.value)))
const pendingShipAllocations = computed(() => allocations.value.filter((row) =>
  ['PICKED', 'REVIEWED'].includes(String(row.allocation_status || ''))
  && (!selectedLine.value || Number(row.outbound_detail_id) === Number(lineKey(selectedLine.value)) || Number(row.line_no) === Number(selectedLine.value.line_no))
))
const availableToShip = computed(() => pendingShipAllocations.value.reduce((sum, row) => sum + Number(row.allocated_qty || 1), 0))

watch(selectedLineId, () => {
  shipQty.value = '0'
})

onMounted(load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    detail.value = await getOutboundOrder(orderId.value)
    selectedLineId.value = routeLineId.value || ''
    carrierName.value = order.value?.carrier_name || carrierName.value
    trackingNo.value = order.value?.tracking_no || `SF${Date.now()}`
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '发货上下文加载失败'
  } finally {
    loading.value = false
  }
}

function selectLine(line: OutboundLine) {
  selectedLineId.value = Number(selectedLineId.value) === Number(lineKey(line)) ? '' : lineKey(line)
}

async function submitShip() {
  const message = validateSubmit()
  if (message) {
    fail(message)
    return
  }
  await confirmAction(`确认本次发货 ${submitQtyText()} 件？发货后将扣减库存并更新 SN 状态。`, '发货确认')
  submitting.value = true
  try {
    detail.value = await withLoading('发货确认中', () => shipOutboundOrder(orderId.value, {
      lineId: selectedLine.value ? Number(lineKey(selectedLine.value)) : undefined,
      shipQty: Number(shipQty.value || 0),
      carrierName: carrierName.value,
      trackingNo: trackingNo.value,
      shipper: shipper.value,
      remark: remark.value,
      forceSapFail: forceSapFail.value,
      forceTraceFail: forceTraceFail.value
    }))
    success('发货确认完成，订单状态已刷新')
    await load()
  } finally {
    submitting.value = false
  }
}

async function cancelShipment(row: OutboundRecord) {
  const shipmentId = Number(row.id)
  if (!shipmentId) return
  await confirmAction(`确认取消发货批次 ${row.shipment_no}？取消后会按 PC 端逻辑回退库存和 SN 状态。`, '取消发货确认')
  detail.value = await withLoading('取消发货中', () => cancelOutboundShipment(orderId.value, shipmentId))
  success('发货批次已取消')
  await load()
}

function validateSubmit() {
  if (!order.value || ['CANCELED', 'CLOSED'].includes(String(order.value.status || ''))) return '当前订单状态不允许发货'
  if (!pendingShipAllocations.value.length) return '当前范围没有已拣货未发货记录'
  if (!carrierName.value) return '物流商不能为空'
  if (!trackingNo.value) return '物流单号不能为空'
  if (!shipper.value) return '发货人不能为空'
  const qty = Number(shipQty.value || 0)
  if (qty < 0) return '本次发货数量不能小于 0'
  if (qty > availableToShip.value) return '本次发货数量不能超过已拣货未发货数量'
  return ''
}

function canCancelShipmentRecord(row: OutboundRecord) {
  return !['CANCELED'].includes(String(row.shipment_status || row.status || ''))
    && !['SUCCESS', 'POSTED'].includes(String(row.sap_post_status || ''))
}

function submitQtyText() {
  const qty = Number(shipQty.value || 0)
  return qty > 0 ? qty : availableToShip.value
}

function remainingShipQty(line: OutboundLine) {
  return Math.max(Number(line.picked_qty || 0) - Number(line.shipped_qty || 0), 0)
}

function lineKey(line: Partial<OutboundLine>) {
  return line.id || line.line_id || line.outbound_detail_id || line.line_no || ''
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
    CANCELED: '订单取消'
  }
  return map[String(value || '')] || value || '-'
}

function sapStatusLabel(value?: string) {
  if (!value || value === 'NOT_POSTED') return '未回传'
  if (['SUCCESS', 'POSTED'].includes(value)) return '成功'
  if (value === 'FAILED') return '失败'
  if (value === 'CANCELED') return '已取消'
  return value
}

function goBack() {
  router.push(`/outbound/${orderId.value}`)
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
