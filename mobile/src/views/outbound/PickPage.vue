<template>
  <main class="page outbound-pick-page with-bottom-actions">
    <van-nav-bar title="出库拣货" left-arrow fixed placeholder @click-left="goBack" />

    <PageState
      v-if="loading || errorMessage || !order"
      :loading="loading"
      :error="errorMessage"
      :empty="!loading && !errorMessage && !order"
      empty-text="未找到拣货上下文"
      @retry="load"
    />

    <template v-else>
      <van-cell-group inset class="detail-card">
        <van-cell>
          <template #title>
            <div class="order-title compact-title">{{ order.shipment_order_no || order.order_no }}</div>
            <div class="order-subtitle">{{ order.customer_name || order.consignee_name || '-' }}</div>
          </template>
          <template #value>
            <StatusTag :status="order.status" :label="statusLabel(order.status)" />
          </template>
        </van-cell>
        <div class="detail-grid compact">
          <InfoItem label="仓库" :value="order.warehouse_name || order.warehouse_code" />
          <InfoItem label="订单数量" :value="order.planned_qty" />
          <InfoItem label="已分配数量" :value="order.allocated_qty || 0" />
          <InfoItem label="已拣货数量" :value="order.picked_qty || 0" />
        </div>
      </van-cell-group>

      <section class="section-title">选择产品行</section>
      <van-cell-group v-for="line in lines" :key="lineKey(line)" inset class="mini-card">
        <van-cell is-link :class="{ selected: Number(selectedLineId) === Number(lineKey(line)) }" @click="selectLine(line)">
          <template #title>
            <div class="line-title">
              <strong>行 {{ line.line_no }} / {{ line.product_code }}</strong>
              <span>{{ line.product_name || line.product_description }}</span>
            </div>
          </template>
          <template #label>
            <span>已分配 {{ line.allocated_qty || 0 }} / 已拣货 {{ line.picked_qty || 0 }} / 待拣 {{ lineRemaining(line) }}</span>
          </template>
          <template #value>
            <StatusTag :status="line.line_status || line.status" :label="statusLabel(line.line_status || line.status)" />
          </template>
        </van-cell>
      </van-cell-group>

      <section class="section-title">扫码拣货</section>
      <ScanInput
        v-model="productInput"
        label="产品编码"
        placeholder="可先扫描产品编码定位产品行"
        :accepted-types="['PRODUCT', 'UNKNOWN']"
        :clear-on-scan="false"
        @scan-detail="handleProductScan"
      />
      <ScanInput
        v-model="locationCode"
        label="库位码"
        placeholder="扫描或输入拣货库位"
        :accepted-types="['LOCATION', 'UNKNOWN']"
        :clear-on-scan="false"
        @scan-detail="handleLocationScan"
      />
      <ScanInput
        v-if="selectedLineSnRequired"
        v-model="snInput"
        label="SN"
        placeholder="连续扫描或手工输入 SN"
        :accepted-types="['SN', 'UNKNOWN']"
        :duplicate-list="draftSns"
        duplicate-message="本次拣货列表中已存在该 SN"
        @scan-detail="handleSnScan"
      />

      <van-cell-group inset class="mini-card">
        <van-cell title="拣货方式" :value="pickModeLabel" />
        <van-field
          v-if="!selectedLineSnRequired"
          v-model="pickQty"
          type="number"
          label="拣货数量"
          placeholder="非 SN 产品输入本次拣货数量"
        />
      </van-cell-group>

      <van-cell-group v-if="selectedLineSnRequired" inset class="mini-card">
        <van-cell title="本次待提交 SN" :value="`${draftSns.length} 个`" />
        <div v-if="!draftSns.length" class="empty-inline">请扫描当前订单已分配的 SN</div>
        <van-swipe-cell v-for="sn in draftSns" :key="sn">
          <van-cell :title="sn" />
          <template #right>
            <van-button square type="danger" text="删除" @click="removeDraftSn(sn)" />
          </template>
        </van-swipe-cell>
      </van-cell-group>

      <section class="section-title">可拣分配</section>
      <div v-if="!lineAllocations.length" class="empty-inline">当前产品行暂无可拣分配记录</div>
      <van-cell-group v-for="row in lineAllocations" :key="row.id || row.allocation_no" inset class="mini-card">
        <van-cell>
          <template #title>
            <div class="order-title compact-title">{{ row.sn_code || row.allocation_no }}</div>
            <div class="order-subtitle">{{ row.product_code }} / {{ row.location_code || '-' }}</div>
          </template>
          <template #label>
            <span>数量 {{ row.allocated_qty || 0 }} / {{ row.allocation_mode || '-' }}</span>
          </template>
          <template #value>
            <StatusTag :status="row.allocation_status" />
          </template>
        </van-cell>
      </van-cell-group>

      <section class="section-title">拣货记录</section>
      <div v-if="!pickingRecords.length" class="empty-inline">暂无拣货记录</div>
      <van-cell-group v-for="row in pickingRecords" :key="row.id || row.task_no" inset class="mini-card">
        <van-cell>
          <template #title>
            <div class="order-title compact-title">{{ row.task_no }}</div>
            <div class="order-subtitle">行 {{ row.line_no }} / {{ row.product_code }}</div>
          </template>
          <template #label>
            <span>{{ row.location_code || '-' }} / {{ row.sn_code || '非 SN' }} / 数量 {{ row.picked_qty || 0 }}</span>
          </template>
          <template #value>
            <StatusTag :status="row.result || row.status" />
          </template>
          <template #right-icon>
            <van-button v-if="canCancelPickRecord(row)" size="mini" type="danger" plain @click.stop="cancelPick(row)">
              取消
            </van-button>
          </template>
        </van-cell>
      </van-cell-group>
    </template>

    <div class="bottom-action-bar">
      <van-button block plain @click="goBack">返回详情</van-button>
      <van-button block type="primary" :loading="submitting" @click="submitPick">确认拣货</van-button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  cancelOutboundPick,
  getOutboundOrder,
  pickOutboundOrder,
  type OutboundDetail,
  type OutboundLine,
  type OutboundRecord
} from '../../api/outbound'
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
const detail = ref<OutboundDetail>({})
const selectedLineId = ref<number | string>('')
const productInput = ref('')
const locationCode = ref('')
const snInput = ref('')
const draftSns = ref<string[]>([])
const pickQty = ref('')

const orderId = computed(() => Number(route.params.orderId))
const routeLineId = computed(() => route.params.lineId ? Number(route.params.lineId) : 0)
const order = computed(() => detail.value.order)
const lines = computed(() => detail.value.details || detail.value.lines || order.value?.lines || [])
const allocations = computed(() => detail.value.allocations || [])
const pickingRecords = computed(() => detail.value.pickingRecords || [])
const selectedLine = computed(() => lines.value.find((line) => Number(lineKey(line)) === Number(selectedLineId.value)))
const selectedLineSnRequired = computed(() => selectedLine.value ? isSnRequired(selectedLine.value) : false)
const lineAllocations = computed(() => allocations.value.filter((row) =>
  !selectedLine.value || Number(row.outbound_detail_id) === Number(lineKey(selectedLine.value)) || Number(row.line_no) === Number(selectedLine.value.line_no)
))
const pickMode = computed(() => lineAllocations.value.some((row) => ['ALLOCATED', 'PICKED', 'REVIEWED'].includes(String(row.allocation_status || ''))) ? 'ALLOCATED' : 'DIRECT')
const pickModeLabel = computed(() => pickMode.value === 'DIRECT' ? '不分配直接拣货（PC 已开放规则）' : '按已分配库存拣货')

watch(selectedLineId, () => {
  draftSns.value = []
  pickQty.value = selectedLineSnRequired.value ? '' : String(lineRemaining(selectedLine.value))
  productInput.value = selectedLine.value?.product_code || ''
  locationCode.value = lineAllocations.value[0]?.location_code || locationCode.value
})

onMounted(load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    detail.value = await getOutboundOrder(orderId.value)
    selectedLineId.value = routeLineId.value || lineKey(lines.value.find((line) => lineRemaining(line) > 0) || lines.value[0] || {})
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '拣货上下文加载失败'
  } finally {
    loading.value = false
  }
}

function selectLine(line: OutboundLine) {
  selectedLineId.value = lineKey(line)
}

function handleProductScan(result: ScanResult) {
  productInput.value = result.value
  const match = lines.value.find((line) => line.product_code === result.value)
  if (match) {
    selectLine(match)
    success('已定位到产品行')
  } else {
    fail('当前发运订单中没有该产品编码')
  }
}

function handleLocationScan(result: ScanResult) {
  locationCode.value = result.value
}

function handleSnScan(result: ScanResult) {
  const sn = result.value.trim()
  const message = validateSn(sn)
  if (message) {
    fail(message)
    return
  }
  draftSns.value.push(sn)
  success('SN 已加入本次拣货列表')
}

async function submitPick() {
  const message = validateSubmit()
  if (message) {
    fail(message)
    return
  }
  await confirmAction(`确认提交本次拣货 ${submitQty()} 件？`, '拣货确认')
  submitting.value = true
  try {
    detail.value = await withLoading('拣货提交中', () => pickOutboundOrder(orderId.value, {
      lineId: Number(selectedLineId.value),
      pickMode: pickMode.value,
      serialNumbers: draftSns.value,
      quantity: submitQty(),
      locationCode: locationCode.value,
      operator: 'mobile'
    }))
    success('拣货成功，订单状态已刷新')
    draftSns.value = []
    await load()
  } finally {
    submitting.value = false
  }
}

async function cancelPick(row: OutboundRecord) {
  const pickId = Number(row.id)
  if (!pickId) return
  await confirmAction(`确认取消拣货记录 ${row.task_no}？`, '取消拣货确认')
  detail.value = await withLoading('取消拣货中', () => cancelOutboundPick(orderId.value, pickId))
  success('拣货记录已取消')
}

function validateSn(sn: string) {
  if (!selectedLine.value) return '请选择产品行'
  if (!selectedLineSnRequired.value) return '非 SN 产品请录入拣货数量'
  if (!sn) return 'SN 不能为空'
  if (draftSns.value.includes(sn)) return 'SN 不能重复扫描'
  if (draftSns.value.length + 1 > lineRemaining(selectedLine.value)) return '拣货 SN 数量不能超过剩余待拣数量'
  const allocation = lineAllocations.value.find((row) => row.sn_code === sn)
  if (pickMode.value !== 'DIRECT' && !allocation) return 'SN 不属于当前订单分配范围'
  if (allocation && allocation.allocation_status !== 'ALLOCATED') return 'SN 当前分配状态不允许拣货'
  if (locationCode.value && allocation?.location_code && locationCode.value !== allocation.location_code) return 'SN 所在库位与拣货库位不一致'
  return ''
}

function validateSubmit() {
  if (!selectedLine.value) return '请选择产品行'
  if (!order.value || ['CANCELED', 'CLOSED', 'SHIPPED', 'CALLBACK_SUCCESS'].includes(String(order.value.status || ''))) return '当前订单状态不允许拣货'
  if (lineRemaining(selectedLine.value) <= 0) return '当前产品行已完成拣货'
  if (selectedLineSnRequired.value) {
    if (!draftSns.value.length) return '请先扫描 SN'
    const invalid = draftSns.value.find((sn) => validateSn(sn))
    if (invalid) return validateSn(invalid)
  } else {
    const qty = Number(pickQty.value || 0)
    if (qty <= 0) return '拣货数量必须大于 0'
    if (qty > lineRemaining(selectedLine.value)) return '拣货数量不能超过剩余待拣数量'
    const activeAllocatedQty = lineAllocations.value.filter((row) => row.allocation_status === 'ALLOCATED').reduce((sum, row) => sum + Number(row.allocated_qty || 0), 0)
    if (pickMode.value !== 'DIRECT' && qty > activeAllocatedQty) return '拣货数量不能超过已分配数量'
  }
  return ''
}

function canCancelPickRecord(row: OutboundRecord) {
  return !['CANCELED', 'SHIPPED'].includes(String(row.result || row.status || ''))
    && !['SHIPPED'].includes(String(row.allocation_status || ''))
    && !row.shipment_no
}

function removeDraftSn(sn: string) {
  draftSns.value = draftSns.value.filter((item) => item !== sn)
}

function submitQty() {
  return selectedLineSnRequired.value ? draftSns.value.length : Number(pickQty.value || 0)
}

function lineRemaining(line?: OutboundLine) {
  if (!line) return 0
  const allocated = Number(line.allocated_qty || 0)
  const planned = Number(line.order_qty || line.planned_qty || 0)
  const limit = allocated > 0 ? allocated : planned
  return Math.max(limit - Number(line.picked_qty || 0), 0)
}

function lineKey(line: Partial<OutboundLine>) {
  return line.id || line.line_id || line.outbound_detail_id || line.line_no || ''
}

function isSnRequired(line: OutboundLine) {
  return line.snRequired === true || Number(line.sn_required ?? 0) === 1
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
