export interface ExportFile {
  filename: string
  content: string
  mimeType?: string
}

export interface ImportErrorItem {
  rowNo?: number
  reason: string
}

export interface ImportResult {
  successCount: number
  failedCount: number
  errors?: ImportErrorItem[]
}

export type CsvRow = Record<string, string>

export function timestamp() {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

export function downloadTextFile(file: ExportFile) {
  const mimeType = file.mimeType || 'text/csv;charset=utf-8'
  const content = file.content.startsWith('\ufeff') ? file.content : `\ufeff${file.content}`
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = file.filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function readTextFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('文件读取失败'))
    reader.readAsText(file, 'utf-8')
  })
}

export function parseCsvRows(text: string): CsvRow[] {
  const table = parseCsvTable(text)
  const headerIndex = table.findIndex((row) => row.some((cell) => cell.trim()) && !String(row[0] || '').trim().startsWith('#'))
  if (headerIndex < 0) return []
  const headers = table[headerIndex].map((cell) => normalizeHeader(cell))
  return table.slice(headerIndex + 1)
    .filter((row) => row.some((cell) => cell.trim()) && !String(row[0] || '').trim().startsWith('#'))
    .map((row) => rowToObject(headers, row))
}

export function parseSectionedCsv(text: string) {
  const table = parseCsvTable(text)
  const headerStart = table.findIndex((row) => String(row[0] || '').includes('Sheet1'))
  const lineStart = table.findIndex((row) => String(row[0] || '').includes('Sheet2'))
  if (headerStart < 0 || lineStart < 0 || lineStart <= headerStart) {
    return { headers: parseCsvRows(text), lines: [] }
  }
  const headerRows = table.slice(headerStart + 1, lineStart).filter((row) => row.some((cell) => cell.trim()))
  const lineRows = table.slice(lineStart + 1).filter((row) => row.some((cell) => cell.trim()))
  return {
    headers: rowsWithHeader(headerRows),
    lines: rowsWithHeader(lineRows)
  }
}

export function importResultHtml(result: ImportResult) {
  const errors = result.errors || []
  const rows = errors.slice(0, 20).map((item) => `<tr><td>${item.rowNo || '-'}</td><td>${escapeHtml(item.reason)}</td></tr>`).join('')
  const more = errors.length > 20 ? `<p>仅展示前 20 条失败原因，共 ${errors.length} 条。</p>` : ''
  return `
    <p>成功：${result.successCount || 0} 条，失败：${result.failedCount || 0} 条</p>
    ${rows ? `<table class="import-result-table"><thead><tr><th>行号</th><th>失败原因</th></tr></thead><tbody>${rows}</tbody></table>${more}` : ''}
  `
}

function rowsWithHeader(rows: string[][]): CsvRow[] {
  if (rows.length < 2) return []
  const headers = rows[0].map((cell) => normalizeHeader(cell))
  return rows.slice(1)
    .filter((row) => row.some((cell) => cell.trim()) && !String(row[0] || '').trim().startsWith('#'))
    .map((row) => rowToObject(headers, row))
}

function rowToObject(headers: string[], row: string[]): CsvRow {
  return headers.reduce<CsvRow>((acc, header, index) => {
    if (header) acc[header] = String(row[index] || '').trim()
    return acc
  }, {})
}

function normalizeHeader(value: string) {
  return String(value || '').replace(/^\ufeff/, '').trim()
}

function parseCsvTable(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quote = false
  const source = String(text || '').replace(/^\ufeff/, '')
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    const next = source[index + 1]
    if (quote) {
      if (char === '"' && next === '"') {
        cell += '"'
        index += 1
      } else if (char === '"') {
        quote = false
      } else {
        cell += char
      }
      continue
    }
    if (char === '"') {
      quote = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (char !== '\r') {
      cell += char
    }
  }
  row.push(cell)
  rows.push(row)
  return rows
}

function escapeHtml(value: string) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
