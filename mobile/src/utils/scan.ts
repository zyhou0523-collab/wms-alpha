export function parseScanText(text: string): string {
  return normalizeScanCode(text)
}

export function normalizeScanCode(code: string): string {
  return String(code || '')
    .trim()
    .replace(/[\r\n\t]/g, '')
    .replace(/\s+/g, '')
}

export function isDuplicateScan(code: string, list: string[]): boolean {
  const target = normalizeScanCode(code).toUpperCase()
  return list.some((item) => normalizeScanCode(item).toUpperCase() === target)
}

export function normalizeScanValue(value: string) {
  return normalizeScanCode(value)
}

export function isLikelySn(value: string) {
  return /^SN[-_A-Z0-9]+$/i.test(normalizeScanCode(value))
}

export function isLikelyLocation(value: string) {
  return /^[A-Z]\d{2}-\d{2}-\d{2}$/i.test(normalizeScanCode(value))
}
