import type { PageResult } from './http'
import { request } from './http'
import type { ExportFile } from '../utils/fileTransfer'

export type ReportKey =
  | 'inout-stock'
  | 'inbound-daily'
  | 'outbound-daily'
  | 'standard-aging'
  | 'segment-aging'
  | 'outbound-sn'
  | 'inbound-sn'

export interface ReportQuery {
  pageNum?: number
  pageSize?: number
  [key: string]: unknown
}

export const reportApi = {
  list<T = Record<string, unknown>>(reportKey: ReportKey, params: ReportQuery) {
    return request<PageResult<T>>({ url: `/reports/${reportKey}`, method: 'get', params })
  },
  exportData(reportKey: ReportKey, data: ReportQuery) {
    return request<ExportFile>({ url: `/reports/${reportKey}/export`, method: 'post', data })
  }
}
