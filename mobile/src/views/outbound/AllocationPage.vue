<template>
  <main class="page outbound-allocation-page with-bottom-actions">
    <van-nav-bar title="库存分配" left-arrow fixed placeholder @click-left="goBack" />

    <PageState
      v-if="loading || errorMessage || !order"
      :loading="loading"
      :error="errorMessage"
      :empty="!loading && !errorMessage && !order"
      empty-text="未找到分配上下文"
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
          <InfoItem label="货主" :value="order.owner_name || order.owner_code" />
          <InfoItem label="订单数量" :value="order.planned_qty" />
          <InfoItem label="已分配数量" :value="order.allocated_qty || 0" />
        </div>
      </van-cell-group>

      <section class="section-title">产品行</section>
      <van-cell-group v-for="line in lines" :key="lineKey(line)" inset class="mini-card">
        <van-cell is-link :class="{ selected: Number(selectedLineId) === Number(lineKey(line)) }" @click="selectLine(line)">
          <template #title>
            <div class="line-title">
              <strong>行 {{ line.line_no }} / {{ line.product_code }}</strong>
              <span>{{ line.product_name || line.product_description }}</span>
            </div>
          </template>
          <template #label>
            <span>订单 {{ line.order_qty || line.planned_qty }} / 已分配 {{ line.allocated_qty || 0 }} / 待分配 {{ lineRemaining(line) }}</span>
          </template>
          <template #value>
            <StatusTag :status="line.line_status || line.status" :label="statusLabel(line.line_status || line.status)" />
          </template>
        </van-cell>
      </van-cell-group>

      <section class="section-title">可用库存</section>
      <div v-if="!lineInventory.length" class="empty-inline">当前产品行暂无可用库存</div>
      <van-checkbox-group v-model="selectedInventoryIds">
        <van-cell-group v-for="item in lineInventory" :key="item.id || item.inventory_id" inset class="mini-card inventory-card">
          <van-cell>
            <template #title>
              <div class="order-title compact-title">{{ item.sn_code || item.location_code }}</div>
              <div class="order-subtitle">{{ item.product_code }} / {{ item.product_name }}</div>
            </template>
            <template #label>
              <span>{{ item.location_code }} / 可用 {{ item.available_qty || 0 }} / {{ inventoryStateText(item) }}</span>
            </template>
            <template #right-icon>
              <van-checkbox
                :name="Number(item.id || item.inventory_id)"
                :disabled="!isAllocatableInventory(item)"
                @click.stop
              />
            </template>
          </van-cell>
        </van-cell-group>
      </van-checkbox-group>

      <van-cell-group inset class="mini-card">
        <van-cell title="人工指定分配" :value="selectedLine ? `行 ${selectedLine.line_no}` : '请选择产品行'" />
        <van-field
          v-model="manualQty"
          type="number"
          label="分配数量"
          placeholder="非 SN 产品输入数量；SN 产品按选择 SN 数量"
          :disabled="selectedLineSnRequired"
        />
        <van-field v-model="manualLocationCode" label="库位" placeholder="可按库位筛选非 SN 库存" />
      </van-cell-group>

      <section class="section-title">分配结果</section>
      <div v-if="!allocations.length" class="empty-inline">暂无分配记录</div>
      <van-cell-group v-for="row in allocations" :key="row.id || row.allocation_no" inset class="mini-card">
        <van-cell>
          <template #title>
            <div class="order-title compact-title">{{ row.allocation_no }}</div>
            <div class="order-subtitle">行 {{ row.line_no }} / {{ row.product_code }}</div>
          </template>
          <template #label>
            <span>{{ row.location_code || '-' }} / {{ row.sn_code || '非 SN' }} / 数量 {{ row.allocated_qty || 0 }}</span>
          </template>
          <template #value>
            <StatusTag :status="row.allocation_status" />
          </template>
          <template #right-icon>
            <van-button v-if="canCancelAllocationRecord(row)" size="mini" type="danger" plain @click.stop="cancelAllocation(row)">
              取消
            </van-button>
          </template>
        </van-cell>
      </van-cell-group>
    </template>

    <div class="bottom-action-bar scroll-actions">
      <van-button size="small" plain @click="goBack">返回详情</van-button>
      <van-button size="small" type="primary" @click="autoAllocate">自动分配</van-button>
      <van-button size="small" type="primary" plain @click="manualAllocate">人工分配</van-button>
      <van-button v-if="allocations.some(canCancelAllocationRecord)" size="small" type="danger" plain @click="releaseAllocation">
        取消分配
      </van-button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  allocateOutboundAuto,
  allocateOutboundManual,
  cancelOutboundAllocations,
  getOutboundAllocationView,
  releaseOutboundAllocation,
  type OutboundDetail,
  type OutboundInventory,
  type OutboundLine,
  type OutboundRecord
} from '../../api/outbound'
import PageState from '../../components/PageState.vue'
import StatusTag from '../../components/StatusTag.vue'
import { confirmAction, fail, success, withLoading } from '../../utils/feedback'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const detail = ref<OutboundDetail>({})
const selectedLineId = ref<number | string>('')
const selectedInventoryIds = ref<number[]>([])
const manualQty = ref('')
const manualLocationCode = ref('')

const orderId = computed(() => Number(route.params.orderId))
const order = computed(() => detail.value.order)
const lines = computed(() => detail.value.details || detail.value.lines || order.value?.lines || [])
const allocations = computed(() => detail.value.allocations || [])
const inventories = computed(() => detail.value.availableInventory || [])
const selectedLine = computed(() => lines.value.find((line) => Number(lineKey(line)) === Number(selectedLineId.value)))
const selectedLineSnRequired = computed(() => selectedLine.value ? isSnRequired(selectedLine.value) : false)
const lineInventory = computed(() => inventories.value.filter((row) =>
  !selectedLine.value || Number(row.outbound_detail_id || row.line_id) === Number(lineKey(selectedLine.value))
))
const selectedInventories = computed(() => lineInventory.value.filter((row) => selectedInventoryIds.value.includes(Number(row.id || row.inventory_id))))

watch(selectedLineId, () => {
  selectedInventoryIds.value = []
  manualQty.value = selectedLineSnRequired.value ? '' : String(lineRemaining(selectedLine.value))
  manualLocationCode.value = ''
})

onMounted(load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    detail.value = await getOutboundAllocationView(orderId.value)
    selectedLineId.value ||= lineKey(lines.value.find((line) => lineRemaining(line) > 0) || lines.value[0] || {})
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '分配上下文加载失败'
  } finally {
    loading.value = false
  }
}

function selectLine(line: OutboundLine) {
  selectedLineId.value = lineKey(line)
}

async function autoAllocate() {
  await confirmAction(`确认对发运订单 ${order.value?.shipment_order_no || order.value?.order_no} 执行系统自动分配？`, '自动分配确认')
  detail.value = await withLoading('自动分配中', () => allocateOutboundAuto(orderId.value))
  success('自动分配完成，库存已锁定但未扣减')
}

async function manualAllocate() {
  const message = validateManualAllocate()
  if (message) {
    fail(message)
    return
  }
  await confirmAction('确认按当前选择的产品行和库存执行人工分配？', '人工分配确认')
  detail.value = await withLoading('人工分配中', () => allocateOutboundManual(orderId.value, {
    lineId: Number(selectedLineId.value),
    serialNumbers: selectedInventories.value.map((row) => String(row.sn_code || '')).filter(Boolean),
    quantity: selectedLineSnRequired.value ? selectedInventories.value.length : Number(manualQty.value || 0),
    locationCode: manualLocationCode.value || selectedInventories.value[0]?.location_code
  }))
  success('人工分配完成')
  await load()
}

async function releaseAllocation() {
  await confirmAction('确认取消当前订单全部未拣货分配？已拣货记录将按 PC 端规则拦截。', '取消分配确认')
  detail.value = await withLoading('取消分配中', () => releaseOutboundAllocation(orderId.value))
  success('已取消未拣货分配')
}

async function cancelAllocation(row: OutboundRecord) {
  const allocationId = Number(row.id)
  if (!allocationId) return
  await confirmAction(`确认取消分配记录 ${row.allocation_no}？`, '取消分配确认')
  detail.value = await withLoading('取消分配中', () => cancelOutboundAllocations(orderId.value, [allocationId]))
  success('分配记录已取消')
}

function validateManualAllocate() {
  if (!selectedLine.value) return '请选择产品行'
  if (lineRemaining(selectedLine.value) <= 0) return '当前产品行已完成分配'
  if (!selectedInventories.value.length && selectedLineSnRequired.value) return 'SN 管理产品必须选择 SN 库存'
  if (selectedInventories.value.some((row) => !isAllocatableInventory(row))) return '选择的库存存在冻结、不合格、不可用或已锁定记录'
  if (selectedLineSnRequired.value && selectedInventories.value.length > lineRemaining(selectedLine.value)) return '分配 SN 数量不能超过剩余待分配数量'
  if (!selectedLineSnRequired.value) {
    const qty = Number(manualQty.value || 0)
    if (qty <= 0) return '分配数量必须大于 0'
    if (qty > lineRemaining(selectedLine.value)) return '分配数量不能超过剩余待分配数量'
  }
  return ''
}

function canCancelAllocationRecord(row: OutboundRecord) {
  return row.allocation_status === 'ALLOCATED'
}

function isAllocatableInventory(row: OutboundInventory) {
  return Number(row.available_qty || 0) > 0
    && ['AVAILABLE', 'QUALIFIED', 'NORMAL', ''].includes(String(row.inventory_status || ''))
    && ['QUALIFIED', 'PASS', ''].includes(String(row.quality_status || ''))
    && !truthy(row.frozen_flag)
    && !truthy(row.locked_flag)
}

function inventoryStateText(row: OutboundInventory) {
  if (truthy(row.frozen_flag) || row.inventory_status === 'FROZEN') return '冻结，不可分配'
  if (row.quality_status === 'UNQUALIFIED') return '不合格，不可分配'
  if (truthy(row.locked_flag)) return '已锁定'
  return '合格可用'
}

function lineRemaining(line?: OutboundLine) {
  if (!line) return 0
  return Math.max(Number(line.order_qty || line.planned_qty || 0) - Number(line.allocated_qty || 0), 0)
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

function truthy(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'Y'
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
