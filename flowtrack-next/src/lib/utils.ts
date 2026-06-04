export function formatCurrency(amount: number): string {
  const abs = Math.abs(amount)
  const formatted = abs.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (amount < 0 ? '- ' : '') + '\u20AC ' + formatted
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) {
    const months = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
    return m[3] + ' ' + months[parseInt(m[2]) - 1] + ' ' + m[1]
  }
  return dateStr
}

export function parseItalianNumber(str: string): number {
  if (str == null || str.trim() === '') return 0
  let s = str.trim().replace(/\s/g, '')
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.')
  }
  const val = parseFloat(s)
  return isNaN(val) ? 0 : val
}

export function parseStandardNumber(str: string): number {
  if (str == null || str.trim() === '') return 0
  let s = str.trim().replace(/\s/g, '')
  const val = parseFloat(s)
  return isNaN(val) ? 0 : val
}

export function uuid(): string {
  return 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9)
}

export function normalizeDate(str: string): string {
  if (!str) return ''
  str = String(str).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10)
  const m = str.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})$/)
  if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0')
  const months: Record<string, number> = { 'gen': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'mag': 5, 'giu': 6, 'lug': 7, 'ago': 8, 'set': 9, 'ott': 10, 'nov': 11, 'dic': 12, 'jan': 1, 'may': 5, 'jun': 6, 'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'dec': 12 }
  const md = str.match(/^(\d{1,2})\s+([a-z]{3})\s+(\d{4})/i)
  if (md) return md[3] + '-' + String(months[md[2].toLowerCase()] || 1).padStart(2, '0') + '-' + md[1].padStart(2, '0')
  const dm = str.match(/^([a-z]{3})\s+(\d{1,2}),?\s+(\d{4})/i)
  if (dm) return dm[3] + '-' + String(months[dm[1].toLowerCase()] || 1).padStart(2, '0') + '-' + dm[2].padStart(2, '0')
  const d = new Date(str)
  if (!isNaN(d.getTime())) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  }
  return str
}

export function detectDelimiter(line: string): string {
  const delimiters = [';', '\t', ',']
  let best = ';'
  let max = 0
  for (const d of delimiters) {
    const count = line.split(d).length
    if (count > max) { max = count; best = d }
  }
  return best
}

export function hexToPastel(hex: string): { backgroundColor: string; color: string } {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const darken = (c: number) => Math.max(0, Math.round(c * 0.55))
  return {
    backgroundColor: `rgba(${r},${g},${b},0.15)`,
    color: `rgb(${darken(r)},${darken(g)},${darken(b)})`,
  }
}

export function serializeCellValue(v: unknown): string {
  if (v == null) return ''
  if (v instanceof Date) {
    const dd = String(v.getDate()).padStart(2, '0')
    const mm = String(v.getMonth() + 1).padStart(2, '0')
    const yyyy = v.getFullYear()
    return yyyy + '-' + mm + '-' + dd
  }
  if (typeof v === 'number' && v > 40000 && v < 80000) {
    const d = new Date((v - 25569) * 86400 * 1000)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return yyyy + '-' + mm + '-' + dd
  }
  return String(v).trim()
}
