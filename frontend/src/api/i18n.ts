import { request } from './http'

export interface I18nMessage {
  id?: number
  messageKey: string
  sourceText?: string
  locale: string
  translatedText: string
  source?: 'manual' | 'baidu' | 'google'
  module?: string
  status?: 'ACTIVE' | 'DISABLED'
}

export const i18nMessageService = {
  messages: (locale: string) => request<I18nMessage[]>({ url: '/i18n/messages', method: 'get', params: { locale } }),
  translate: (data: Record<string, unknown>) => request<I18nMessage>({ url: '/i18n/translate', method: 'post', data }),
  create: (data: I18nMessage) => request<I18nMessage>({ url: '/i18n/messages', method: 'post', data }),
  update: (id: number, data: Partial<I18nMessage>) => request<I18nMessage>({ url: `/i18n/messages/${id}`, method: 'put', data })
}
