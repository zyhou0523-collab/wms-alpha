import { showConfirmDialog, showFailToast, showLoadingToast, showSuccessToast, ToastWrapperInstance } from 'vant'

export type RequiredField = {
  label: string
  value: unknown
}

export function success(message = '操作成功') {
  showSuccessToast(message)
}

export function fail(message = '操作失败') {
  showFailToast(message)
}

// Wrap async actions with a mobile-friendly loading toast and one consistent error message path.
export async function withLoading<T>(message: string, action: () => Promise<T>): Promise<T> {
  const toast = showLoadingToast({
    message,
    forbidClick: true,
    duration: 0
  }) as ToastWrapperInstance
  try {
    return await action()
  } catch (error) {
    fail(error instanceof Error ? error.message : '网络异常，请稍后重试')
    throw error
  } finally {
    toast.close()
  }
}

export async function confirmAction(message: string, title = '操作确认') {
  await showConfirmDialog({
    title,
    message,
    confirmButtonText: '确认',
    cancelButtonText: '取消'
  })
}

export function validateRequired(fields: RequiredField[]) {
  const missing = fields.find((field) => {
    const value = field.value
    return value === undefined || value === null || String(value).trim() === ''
  })
  if (missing) {
    fail(`请填写${missing.label}`)
    return false
  }
  return true
}

export async function confirmLeaveIfDirty(isDirty: boolean, message = '当前页面有未保存内容，确认返回吗？') {
  if (!isDirty) return true
  try {
    await confirmAction(message, '离开确认')
    return true
  } catch {
    return false
  }
}
