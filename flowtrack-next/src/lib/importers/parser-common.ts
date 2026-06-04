import type { Bank, Transaction } from '@/types'
import { getAllBanks } from './bank-utils'
import { categorize } from '../categorizer'
import { uuid, normalizeDate, serializeCellValue, parseItalianNumber, parseStandardNumber, detectDelimiter } from '../utils'
import { loadCustomRules, loadBuiltinRuleOverrides } from '../storage'

function parsePayPalDate(v: string): string {
  const s = String(v).trim()
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0')
  return normalizeDate(serializeCellValue(v))
}

export function parseRowsFromArray(rows: string[][], bankName: string, customRules: ReturnType<typeof loadCustomRules>, builtinOverrides?: Record<string, string[]>): Transaction[] {
  const overrides = builtinOverrides ?? loadBuiltinRuleOverrides()
  if (rows.length < 2) throw new Error('Il file sembra vuoto o non contiene dati validi.')

  function findHeaderRow(rows: string[][]): number {
    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      const row = rows[r].map(h => String(h).trim().toLowerCase())
      const hasData = row.some(h => h.includes('data'))
      const hasDesc = row.some(h => h.includes('descrizion') || h.includes('operazione') || h.includes('dettagli') || h.includes('causale') || h.includes('tipo'))
      const hasAmount = row.some(h => h.includes('importo') || h.includes('dare') || h.includes('avere') || h === 'amount' || h.includes('lordo') || h.includes('netto'))
      if (hasData && hasDesc && hasAmount) return r
    }
    return -1
  }

  let headerRow = findHeaderRow(rows)
  if (headerRow === -1) {
    const firstRow = rows[0].map(h => String(h).trim().toLowerCase()).join(', ')
    throw new Error('Formato file non riconosciuto.\nRiga iniziale trovata: [' + firstRow + ']\nAttese colonne: Data, Descrizione, Importo.')
  }

  const header = rows[headerRow].map(h => String(h).trim().toLowerCase())
  const result: Transaction[] = []
  const bankConfig = getAllBanks().find(b => b.name === bankName)
  const bankId = bankConfig ? bankConfig.id : ''

  if (bankId === 'intesa') {
    const dataIdx = header.findIndex(h => h.includes('data'))
    const descIdx = header.findIndex(h => h.includes('descrizion') || h.includes('operazione') || h.includes('causale') || h.includes('dettagli'))
    const amountIdx = header.findIndex(h => h.includes('importo') || h.includes('dare') || h.includes('avere'))
    const hasDareAvere = header.includes('dare') && header.includes('avere')
    const dareIdx = header.findIndex(h => h === 'dare')
    const avereIdx = header.findIndex(h => h === 'avere')

    for (let i = headerRow + 1; i < rows.length; i++) {
      const row = rows[i]
      const dateVal = row[dataIdx] ? normalizeDate(serializeCellValue(row[dataIdx])) : ''
      const descVal = row[descIdx] ? serializeCellValue(row[descIdx]) : ''
      const amountRaw = row[amountIdx]
      if (!dateVal || amountRaw == null) continue
      if (hasDareAvere) {
        const dare = parseItalianNumber(row[dareIdx] ? serializeCellValue(row[dareIdx]) : '0')
        const avere = parseItalianNumber(row[avereIdx] ? serializeCellValue(row[avereIdx]) : '0')
        const amount = dare > 0 ? -dare : avere
        result.push({ id: uuid(), date: dateVal, description: descVal, amount, bank: bankName, category: categorize(descVal, amount, customRules, overrides) })
      } else {
        const amount = parseItalianNumber(serializeCellValue(amountRaw))
        result.push({ id: uuid(), date: dateVal, description: descVal, amount, bank: bankName, category: categorize(descVal, amount, customRules, overrides) })
      }
    }
  } else if (bankId === 'revolut') {
    const dataIdx = header.findIndex(h => h.includes('started date') || h.includes('date') || h.includes('data'))
    const descIdx = header.findIndex(h => h.includes('description') || h.includes('descrizion'))
    const amountIdx = header.findIndex(h => h === 'amount' || h.includes('importo'))
    const feeIdx = header.findIndex(h => h === 'fee' || h === 'costo')

    for (let i = headerRow + 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row[dataIdx] || row[amountIdx] == null) continue
      let amount = amountIdx !== -1 ? parseStandardNumber(serializeCellValue(row[amountIdx])) : 0
      const fee = feeIdx !== -1 ? parseStandardNumber(serializeCellValue(row[feeIdx])) : 0
      const desc = serializeCellValue(row[descIdx]) || 'Transazione Revolut'
      result.push({ id: uuid(), date: normalizeDate(serializeCellValue(row[dataIdx])), description: desc, amount: amount - fee, bank: bankName, category: categorize(desc, amount - fee, customRules, overrides) })
    }
  } else if (bankId === 'paypal') {
    const dataIdx = header.findIndex(h => h.includes('data'))
    const descIdx = header.findIndex(h => h.includes('descrizion') || h.includes('tipo'))
    const nameIdx = header.findIndex(h => h === 'nome')
    const amountIdx = header.findIndex(h => h.includes('lordo'))
    const msgIdx = header.findIndex(h => h.includes('messaggio'))
    if (dataIdx === -1 || descIdx === -1 || amountIdx === -1) throw new Error('Colonne PayPal non trovate (Data, Descrizione, Lordo).')

    for (let i = headerRow + 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row[dataIdx] || row[amountIdx] == null) continue
      const amount = parseItalianNumber(serializeCellValue(row[amountIdx]))
      if (amount === 0) continue
      let description = ''
      if (nameIdx !== -1) { const name = serializeCellValue(row[nameIdx]); if (name) description = name + ' - ' }
      description += serializeCellValue(row[descIdx]) || 'Transazione PayPal'
      if (msgIdx !== -1) { const msg = serializeCellValue(row[msgIdx]); if (msg) description += ' (' + msg + ')' }
      result.push({ id: uuid(), date: parsePayPalDate(row[dataIdx]), description, amount, bank: bankName, category: categorize(description, amount, customRules, overrides) })
    }
  } else if (bankConfig && bankConfig.csvConfig) {
    const cfg = bankConfig.csvConfig
    const dateIdx = header.findIndex(h => h.includes(cfg.dateCol))
    const amountIdx = cfg.amountType === 'dare-avere' ? -1 : header.findIndex(h => h.includes(cfg.amountCol!))
    const dareIdx = cfg.amountType === 'dare-avere' ? header.findIndex(h => h === cfg.dareCol) : -1
    const avereIdx = cfg.amountType === 'dare-avere' ? header.findIndex(h => h === cfg.avereCol) : -1
    if (dateIdx === -1 || (cfg.amountType === 'single' && amountIdx === -1) || (cfg.amountType === 'dare-avere' && (dareIdx === -1 || avereIdx === -1)))
      throw new Error('Colonne CSV non trovate per "' + bankName + '". Verifica la configurazione banca.')
    const descTemplate = cfg.descTemplate

    for (let i = headerRow + 1; i < rows.length; i++) {
      const row = rows[i]
      const dateVal = row[dateIdx] ? normalizeDate(serializeCellValue(row[dateIdx])) : ''
      if (!dateVal) continue
      let amount: number
      if (cfg.amountType === 'dare-avere') {
        const dare = parseItalianNumber(row[dareIdx] ? serializeCellValue(row[dareIdx]) : '0')
        const avere = parseItalianNumber(row[avereIdx] ? serializeCellValue(row[avereIdx]) : '0')
        amount = dare > 0 ? -dare : avere
      } else {
        if (row[amountIdx] == null) continue
        amount = parseStandardNumber(serializeCellValue(row[amountIdx]))
      }
      if (amount === 0) continue
      let description = descTemplate
      header.forEach((col, ci) => {
        const val = serializeCellValue(row[ci])
        const escaped = col.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const re = new RegExp('\\{' + escaped + '\\}', 'gi')
        description = description.replace(re, val || '')
      })
      description = description.replace(/\s+/g, ' ').trim()
      if (!description) description = 'Transazione ' + bankName
      result.push({ id: uuid(), date: dateVal, description, amount, bank: bankName, category: categorize(description, amount, customRules, overrides) })
    }
  }

  if (result.length === 0) throw new Error('Nessuna transazione valida trovata nel file.')
  return result
}
