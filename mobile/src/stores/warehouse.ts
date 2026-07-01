import { defineStore } from 'pinia'
import {
  ALL_WAREHOUSE_CODE,
  authorizedWarehousesForUser,
  currentWarehouseStorageKey,
  getWarehouseQueryScope,
  makeWarehouseContext,
  validateWarehouseAccess,
  type WarehouseOption,
  type WarehouseUser
} from '../utils/warehouseAccess'

export const useWarehouseStore = defineStore('mobileWarehouseScope', {
  state: () => ({
    authorizedWarehouses: [] as WarehouseOption[],
    currentWarehouseCode: ALL_WAREHOUSE_CODE
  }),
  getters: {
    options: (state) => [
      { text: '全部（授权仓库）', value: ALL_WAREHOUSE_CODE },
      ...state.authorizedWarehouses.map((row) => ({ text: row.warehouse_name, value: row.warehouse_code }))
    ],
    currentWarehouseName: (state) => {
      if (state.currentWarehouseCode === ALL_WAREHOUSE_CODE) return '全部（授权仓库）'
      return state.authorizedWarehouses.find((row) => row.warehouse_code === state.currentWarehouseCode)?.warehouse_name || state.currentWarehouseCode
    },
    context: (state) => makeWarehouseContext(
      state.currentWarehouseCode,
      state.authorizedWarehouses.map((row) => row.warehouse_code)
    ),
    queryScope: (state) => getWarehouseQueryScope(makeWarehouseContext(
      state.currentWarehouseCode,
      state.authorizedWarehouses.map((row) => row.warehouse_code)
    ))
  },
  actions: {
    initFromUser(user?: WarehouseUser | null) {
      this.authorizedWarehouses = authorizedWarehousesForUser(user)
      this.currentWarehouseCode = ALL_WAREHOUSE_CODE
      localStorage.setItem(currentWarehouseStorageKey(user?.username), this.currentWarehouseCode)
    },
    setCurrentWarehouse(code: string, username?: string) {
      const codes = this.authorizedWarehouses.map((row) => row.warehouse_code)
      this.currentWarehouseCode = code === ALL_WAREHOUSE_CODE || codes.includes(code) ? code : ALL_WAREHOUSE_CODE
      localStorage.setItem(currentWarehouseStorageKey(username), this.currentWarehouseCode)
      window.dispatchEvent(new CustomEvent('wms-mobile-warehouse-change', { detail: this.context }))
    },
    validateRow(row: Record<string, unknown>) {
      return validateWarehouseAccess(row, this.context)
    },
    clear(username?: string) {
      localStorage.removeItem(currentWarehouseStorageKey(username))
      this.authorizedWarehouses = []
      this.currentWarehouseCode = ALL_WAREHOUSE_CODE
    }
  }
})
