import { detectDelimiter } from '../utils'
import { parseRowsFromArray } from './parser-common'
import type { Transaction, Rule } from '@/types'

function parseCSVLine(line: string, delim: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === delim && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

export function parseCSV(text: string, bank: string, customRules: Rule[]): Transaction[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '')
  if (lines.length < 2) throw new Error('Il file CSV sembra vuoto o non contiene dati validi.')
  const delim = detectDelimiter(lines[0])
  const rows = lines.map(line => parseCSVLine(line, delim))
  return parseRowsFromArray(rows, bank, customRules)
}
