export type ActionRow = Record<string, any>

const SAP_POSTED_STATUSES = ['SUCCESS', 'POSTED']
const SAP_RETRYABLE_STATUSES = ['FAILED', 'NOT_POSTED', '']

const OUTBOUND_ALLOCATABLE_STATUSES = ['CREATED', 'PARTIAL_ALLOCATED', 'PENDING_ALLOC']
const OUTBOUND_PICKABLE_STATUSES = ['PARTIAL_ALLOCATED', 'ALLOCATED', 'PARTIAL_PICKED', 'PICKING']
const OUTBOUND_SHIPPABLE_STATUSES = ['PARTIAL_PICKED', 'PICKED', 'PARTIAL_SHIPPED', 'REVIEWED', 'PICKING']
const OUTBOUND_CLOSABLE_STATUSES = ['PARTIAL_SHIPPED', 'SHIPPED']

const INBOUND_RECEIVABLE_STATUSES = ['CREATED', 'PARTIAL_RECEIVED', 'RECEIVING']
const INBOUND_CLOSABLE_STATUSES = ['PARTIAL_RECEIVED', 'RECEIVED']
const INBOUND_SAP_POSTABLE_STATUSES = ['PARTIAL_RECEIVED', 'RECEIVED', 'ON_SHELF', 'BOUND', 'CLOSED']

function text(value: unknown) {
  return value == null ? '' : String(value)
}

function num(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function status(row: ActionRow = {}) {
  return text(row.status ?? row.order_status ?? row.orderStatus)
}

function sapStatus(row: ActionRow = {}) {
  return text(row.sap_post_status ?? row.sapPostStatus)
}

function hasSapPosted(row: ActionRow = {}) {
  return SAP_POSTED_STATUSES.includes(sapStatus(row))
}

function plannedQty(row: ActionRow = {}) {
  return num(row.order_qty ?? row.planned_qty ?? row.planQty ?? row.plannedQty)
}

function allocatedQty(row: ActionRow = {}) {
  return num(row.allocated_qty ?? row.allocatedQty)
}

function pickedQty(row: ActionRow = {}) {
  return num(row.picked_qty ?? row.pickedQty)
}

function shippedQty(row: ActionRow = {}) {
  return num(row.shipped_qty ?? row.shippedQty ?? row.ship_qty ?? row.shipQty)
}

function receivedQty(row: ActionRow = {}) {
  return num(row.received_qty ?? row.receivedQty)
}

function shelvedQty(row: ActionRow = {}) {
  return num(row.shelved_qty ?? row.shelvedQty)
}

function pendingReceiveQty(row: ActionRow = {}) {
  return num(row.pending_receive_qty ?? row.pendingReceiveQty)
}

function collectedQty(row: ActionRow = {}) {
  return num(row.collected_qty ?? row.collectedQty)
}

function snRequired(row: ActionRow = {}) {
  return row.snRequired === true || num(row.sn_required ?? row.snManaged ?? row.sn_managed, 0) === 1
}

function remainingCollectQty(row: ActionRow = {}) {
  return Math.max(plannedQty(row) - receivedQty(row) - pendingReceiveQty(row), 0)
}

function remainingReceiveQty(row: ActionRow = {}) {
  return Math.max(plannedQty(row) - receivedQty(row), 0)
}

export function canEditOutboundOrder(row: ActionRow = {}) {
  return status(row) === 'CREATED'
    && allocatedQty(row) === 0
    && pickedQty(row) === 0
    && shippedQty(row) === 0
    && !hasSapPosted(row)
}

export function canAllocateOutboundOrder(row: ActionRow = {}) {
  return OUTBOUND_ALLOCATABLE_STATUSES.includes(status(row)) && !hasSapPosted(row)
}

export function canPickOutboundOrder(row: ActionRow = {}, line?: ActionRow) {
  const source = line || row
  return OUTBOUND_PICKABLE_STATUSES.includes(status(row))
    && pickedQty(source) < plannedQty(source)
}

export function canShipOutboundOrder(row: ActionRow = {}, line?: ActionRow) {
  const source = line || row
  return OUTBOUND_SHIPPABLE_STATUSES.includes(status(row))
    && pickedQty(source) > shippedQty(source)
}

export function canCloseOutboundOrder(row: ActionRow = {}) {
  return OUTBOUND_CLOSABLE_STATUSES.includes(status(row)) && shippedQty(row) > 0
}

export function canCancelOutboundOrder(row: ActionRow = {}) {
  return ['CREATED', 'PENDING_ALLOC'].includes(status(row)) && !hasSapPosted(row)
}

export function canCancelAllocationOutboundOrder(row: ActionRow = {}) {
  return text(row.allocation_status ?? row.allocationStatus) === 'ALLOCATED'
}

export function canCancelPickOutboundOrder(row: ActionRow = {}) {
  const orderStatus = text(row.order_status ?? row.orderStatus)
  if (orderStatus && !['PARTIAL_PICKED', 'PICKED', 'PICKING', 'REVIEWING', 'REVIEWED'].includes(orderStatus)) return false
  const recordStatus = text(row.result || row.status || row.pick_status || row.pickStatus)
  if (row.result != null || row.task_no != null || row.pick_id != null) {
    return !['CANCELED', 'SHIPPED'].includes(recordStatus)
      && text(row.allocation_status ?? row.allocationStatus) !== 'SHIPPED'
      && !row.shipment_no
  }
  return ['PARTIAL_PICKED', 'PICKED', 'PICKING', 'REVIEWING', 'REVIEWED'].includes(status(row))
    && pickedQty(row) > shippedQty(row)
}

export function canCancelShipOutboundOrder(row: ActionRow = {}) {
  const orderStatus = status(row)
  if (['CANCELED', 'CLOSED', 'SHIPPED'].includes(orderStatus)) return false
  if (row.shipment_status != null || row.shipment_no != null || row.shipmentNo != null) {
    return text(row.shipment_status || row.status) !== 'CANCELED' && !hasSapPosted(row)
  }
  return orderStatus === 'PARTIAL_SHIPPED' && shippedQty(row) > 0 && !hasSapPosted(row)
}

export function canPostSapOutboundOrder(row: ActionRow = {}) {
  return status(row) === 'CLOSED' && SAP_RETRYABLE_STATUSES.includes(sapStatus(row))
}

export function canRetrySapOutboundOrder(row: ActionRow = {}) {
  return canPostSapOutboundOrder(row)
}

export function canEditInboundOrder(row: ActionRow = {}) {
  return status(row) === 'CREATED'
    && collectedQty(row) === 0
    && pendingReceiveQty(row) === 0
    && receivedQty(row) === 0
    && shelvedQty(row) === 0
    && !hasSapPosted(row)
}

export function canCollectSnInboundOrder(row: ActionRow = {}, line?: ActionRow): boolean {
  const lines = Array.isArray(row.lines) ? row.lines : []
  if (!line && lines.length) {
    return lines.some((item: ActionRow) => canCollectSnInboundOrder(row, item))
  }
  const source = line || row
  return INBOUND_RECEIVABLE_STATUSES.includes(status(row))
    && snRequired(source)
    && remainingCollectQty(source) > 0
}

export function canReceiveInboundOrder(row: ActionRow = {}, line?: ActionRow): boolean {
  const lines = Array.isArray(row.lines) ? row.lines : []
  if (!line && lines.length) {
    return INBOUND_RECEIVABLE_STATUSES.includes(status(row))
      && lines.some((item: ActionRow) => remainingReceiveQty(item) > 0)
  }
  if (!INBOUND_RECEIVABLE_STATUSES.includes(status(row))) return false
  const source = line || row
  if (snRequired(source)) return pendingReceiveQty(source) > 0
  return remainingReceiveQty(source) > 0
}

export function canCancelReceiveInboundOrder(row: ActionRow = {}) {
  const orderStatus = status(row)
  return !['CANCELED', 'CLOSED', 'ON_SHELF'].includes(orderStatus)
    && text(row.receipt_status || row.receiptStatus || row.status) !== 'CANCELED'
    && !hasSapPosted(row)
    && (num(row.receive_qty ?? row.receiveQty) > 0 || row.receipt_no != null || row.receiptNo != null)
}

export function canPutawayInboundOrder(row: ActionRow = {}) {
  return ['RECEIVED', 'BOUND'].includes(status(row))
}

export function canCancelInboundOrder(row: ActionRow = {}) {
  return status(row) === 'CREATED'
    && collectedQty(row) === 0
    && pendingReceiveQty(row) === 0
    && receivedQty(row) === 0
    && !hasSapPosted(row)
}

export function canCloseInboundOrder(row: ActionRow = {}) {
  return INBOUND_CLOSABLE_STATUSES.includes(status(row))
}

export function canPostSapInboundOrder(row: ActionRow = {}) {
  return INBOUND_SAP_POSTABLE_STATUSES.includes(status(row))
    && (num(row.pending_sap_receipt_count ?? row.pendingSapReceiptCount) > 0 || SAP_RETRYABLE_STATUSES.includes(sapStatus(row)))
}

export function canRetrySapInboundOrder(row: ActionRow = {}) {
  return canPostSapInboundOrder(row)
}
