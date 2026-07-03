export interface StatusDefinition {
  value: string
  legacy?: boolean
}

export const OUTBOUND_ORDER_STATUS_DEFINITIONS: StatusDefinition[] = [
  { value: 'CREATED' },
  { value: 'PARTIAL_ALLOCATED' },
  { value: 'ALLOCATED' },
  { value: 'PARTIAL_PICKED' },
  { value: 'PICKED' },
  { value: 'PARTIAL_SHIPPED' },
  { value: 'SHIPPED' },
  { value: 'CLOSED' },
  { value: 'CANCELED' },
  { value: 'PENDING_ALLOC', legacy: true },
  { value: 'PICKING', legacy: true },
  { value: 'REVIEWING', legacy: true },
  { value: 'REVIEWED', legacy: true },
  { value: 'CALLBACK_SUCCESS', legacy: true },
  { value: 'CALLBACK_FAILED', legacy: true },
  { value: 'ALLOCATION_EXCEPTION', legacy: true }
]

export const INBOUND_ORDER_STATUS_DEFINITIONS: StatusDefinition[] = [
  { value: 'CREATED' },
  { value: 'PARTIAL_RECEIVED' },
  { value: 'RECEIVED' },
  { value: 'CLOSED' },
  { value: 'CANCELED' },
  { value: 'RECEIVING', legacy: true },
  { value: 'BOUND', legacy: true },
  { value: 'ON_SHELF', legacy: true },
  { value: 'SAP_FAILED', legacy: true }
]

export const SAP_POST_STATUS_DEFINITIONS: StatusDefinition[] = [
  { value: 'NOT_POSTED' },
  { value: 'SUCCESS' },
  { value: 'FAILED' },
  { value: 'POSTED', legacy: true }
]
