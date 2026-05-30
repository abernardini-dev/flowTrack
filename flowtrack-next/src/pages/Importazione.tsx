'use client'

import { useStore } from '@/lib/store'
import { useCallback, useRef, useState } from 'react'
import { parseCSV } from '@/lib/importers/csv'
import { parseExcel } from '@/lib/importers/excel'
import { loadCustomRules } from '@/lib/storage'
import type { Rule } from '@/types'

export default function ImportazionePage() {
  const transactions = useStore(s => s.transactions)
  const addTransactions = useStore(s => s.addTransactions)
  const getAllBanks = useStore(s => s.getAllBanks)
  const resetAllData = useStore(s => s.resetAllData)
  const showToast = useStore(s => s.showToast)

  const [bankName, setBankName] = useState('')
  const [dragover, setDragover] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ftInputRef = useRef<HTMLInputElement>(null)

  const allBanks = getAllBanks()

  const handleFile = useCallback(async (file: File) => {
    if (!bankName) { showToast('Seleziona una banca.', 'error'); return }
    const customRules: Rule[] = loadCustomRules()
    const isExcel = /\.xlsx?$/i.test(file.name)
    try {
      if (isExcel) {
        const buf = await file.arrayBuffer()
        const parsed = parseExcel(buf, bankName, customRules)
        addTransactions(parsed)
        showToast(`Caricate ${parsed.length} transazioni da ${bankName} (Excel)`, 'success')
      } else {
        const text = await file.text()
        const parsed = parseCSV(text, bankName, customRules)
        addTransactions(parsed)
        showToast(`Caricate ${parsed.length} transazioni da ${bankName}`, 'success')
      }
    } catch (err) {
      showToast((err as Error).message, 'error')
    }
  }, [bankName, addTransactions, showToast])

  const importFlowTrackCSV = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split(/\r?\n/).filter(l => l.trim())
        if (lines.length < 2) throw new Error('File CSV vuoto.')
        const header = lines[0].split(';').map(h => h.trim().toLowerCase())
        const dataIdx = header.findIndex(h => h === 'data')
        const bankIdx = header.findIndex(h => h === 'banca')
        const descIdx = header.findIndex(h => h === 'descrizione')
        const catIdx = header.findIndex(h => h === 'categoria')
        const amountIdx = header.findIndex(h => h === 'importo')
        if (dataIdx === -1 || bankIdx === -1 || descIdx === -1 || catIdx === -1 || amountIdx === -1)
          throw new Error('Formato FlowTrack non riconosciuto.')
        const imported = []
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(';').map(c => c.trim())
          if (cols.length <= Math.max(dataIdx, bankIdx, descIdx, catIdx, amountIdx)) continue
          const rawAmount = cols[amountIdx].replace(/\./g, '').replace(',', '.')
          const amount = parseFloat(rawAmount)
          if (isNaN(amount)) continue
          imported.push({
            id: 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
            date: cols[dataIdx],
            description: cols[descIdx] || '',
            amount,
            bank: cols[bankIdx] || 'FlowTrack',
            category: cols[catIdx] || 'Altro',
          })
        }
        if (imported.length === 0) throw new Error('Nessuna transazione valida trovata.')
        addTransactions(imported)
        showToast(`Ripristinate ${imported.length} transazioni da FlowTrack CSV`, 'success')
      } catch (err) {
        showToast((err as Error).message, 'error')
      }
    }
    reader.readAsText(file)
  }, [addTransactions, showToast])

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-800">Importa Transazioni</h2>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Banca di Origine</label>
          <select
            value={bankName}
            onChange={e => setBankName(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none bg-white"
          >
            <option value="">Seleziona banca...</option>
            {allBanks.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Carica CSV / Excel</label>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragover ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragover(true) }}
            onDragLeave={() => setDragover(false)}
            onDrop={e => { e.preventDefault(); setDragover(false); const files = e.dataTransfer.files; if (files.length > 0) handleFile(files[0]) }}
          >
            <p className="text-sm text-slate-500">Trascina il file qui</p>
            <p className="text-xs text-slate-400 mt-0.5">oppure clicca per selezionare</p>
          </div>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => { if (e.target.files?.length) { handleFile(e.target.files[0]); e.target.value = '' } }} />
        </div>

        <hr className="border-slate-200" />

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Ripristina CSV FlowTrack</label>
          <input
            ref={ftInputRef}
            type="file"
            accept=".csv"
            className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            onChange={e => { if (e.target.files?.length) { importFlowTrackCSV(e.target.files[0]); e.target.value = '' } }}
          />
          <p className="text-xs text-slate-400 mt-1">Carica un CSV esportato da FlowTrack per ripristinare i dati</p>
        </div>

        <hr className="border-slate-200" />

        <button
          onClick={() => { if (transactions.length === 0) return; if (confirm('Cancellare tutti i dati?')) { resetAllData(); showToast('Tutti i dati cancellati.', 'info') } }}
          className="w-full bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg px-4 py-2.5 transition-colors border border-red-200"
        >
          Cancella tutti i dati
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Stato Dati</p>
        <div className="flex items-center gap-1.5 text-sm">
          <span className={`inline-block w-2 h-2 rounded-full ${transactions.length > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          {transactions.length > 0 ? `${transactions.length} transazioni in memoria` : 'Nessun dato caricato'}
        </div>
        <p className="text-xs text-slate-400 mt-2">Le transazioni vengono salvate automaticamente nel browser.</p>
      </div>

      {transactions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Banche riconosciute nei dati</p>
          <div className="flex flex-wrap gap-2">
            {[...new Set(transactions.map(t => t.bank))].map(b => (
              <span key={b} className="inline-block text-xs bg-white px-2 py-1 rounded-lg border border-amber-200 text-amber-800">{b}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
