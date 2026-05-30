import * as XLSX from 'xlsx'
import { parseRowsFromArray } from './parser-common'
import type { Transaction, Rule } from '@/types'

export function parseExcel(data: ArrayBuffer, bank: string, customRules: Rule[]): Transaction[] {
  const workbook = XLSX.read(data, { type: 'array', cellDates: true })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const json: unknown[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' })
  let maxLen = 0
  for (const row of json) if (row.length > maxLen) maxLen = row.length
  const rows = json
    .map(row => { while (row.length < maxLen) row.push(''); return row.map(c => String(c)) })
    .filter(row => row.some(cell => cell.trim() !== ''))
  return parseRowsFromArray(rows, bank, customRules)
}
