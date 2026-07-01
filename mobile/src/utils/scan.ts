export type ScanCodeType = 'SN' | 'BOX' | 'PALLET' | 'LOCATION' | 'DOCUMENT' | 'PRODUCT' | 'UNKNOWN'

export interface ScanResult {
  raw: string
  value: string
  type: ScanCodeType
}

export function parseScanText(text: string): string {
  return normalizeScanCode(text)
}

// Normalize scanner keyboard input and manual fallback input into the same compact code.
export function normalizeScanCode(code: string): string {
  return String(code || '')
    .trim()
    .replace(/[\r\n\t]/g, '')
    .replace(/\s+/g, '')
}

export function parseScanResult(raw: string): ScanResult {
  const value = normalizeScanCode(raw)
  return {
    raw,
    value,
    type: detectScanType(value)
  }
}

export function detectScanType(value: string): ScanCodeType {
  const code = normalizeScanCode(value).toUpperCase()
  if (!code) return 'UNKNOWN'
  if (/^SN[-_A-Z0-9]+$/.test(code)) return 'SN'
  if (/^(BOX|CTN|CASE)[-_A-Z0-9]+$/.test(code)) return 'BOX'
  if (/^(PLT|PALLET)[-_A-Z0-9]+$/.test(code)) return 'PALLET'
  if (/^[A-Z]\d{2}-\d{2}-\d{2}$/.test(code) || /^LOC[-_A-Z0-9]+$/.test(code)) return 'LOCATION'
  if (/^(IN|ASN|SO|STO|OUT|MO|PO|RMA)[-_A-Z0-9]+$/.test(code)) return 'DOCUMENT'
  if (/^[A-Z0-9]{3,}[-_][A-Z0-9-_]{3,}$/.test(code)) return 'PRODUCT'
  return 'UNKNOWN'
}

export function isDuplicateScan(code: string, list: string[]): boolean {
  const target = normalizeScanCode(code).toUpperCase()
  return list.some((item) => normalizeScanCode(item).toUpperCase() === target)
}

export function normalizeScanValue(value: string) {
  return normalizeScanCode(value)
}

export function isLikelySn(value: string) {
  return detectScanType(value) === 'SN'
}

export function isLikelyLocation(value: string) {
  return detectScanType(value) === 'LOCATION'
}

export function isAcceptedScanType(type: ScanCodeType, acceptedTypes: ScanCodeType[] = []) {
  return acceptedTypes.length === 0 || acceptedTypes.includes(type)
}
