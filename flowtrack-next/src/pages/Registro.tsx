'use client'

import { useStore } from '@/lib/store'
import { useMemo, useState, useEffect, useCallback, Fragment } from 'react'
import { formatCurrency, formatDate, uuid } from '@/lib/utils'
import { getBankStyle } from '@/lib/importers/bank-utils'
import { categorize } from '@/lib/categorizer'
import type { SortColumn, SplitPart } from '@/types'

export default function RegistroPage() {
  const transactions = useStore(s => s.transactions)
  const customRules = useStore(s => s.customRules)
  const getAllCategories = useStore(s => s.getAllCategories)
  const getAllBanks = useStore(s => s.getAllBanks)
  const addTransaction = useStore(s => s.addTransaction)
  const updateTransaction = useStore(s => s.updateTransaction)
  const deleteTransaction = useStore(s => s.deleteTransaction)
  const addTransactions = useStore(s => s.addTransactions)
  const deleteSelectedTransactions = useStore(s => s.deleteSelectedTransactions)
  const toggleSelectedId = useStore(s => s.toggleSelectedId)
  const clearSelectedIds = useStore(s => s.clearSelectedIds)
  const selectedIds = useStore(s => s.selectedIds)
  const persistTransactions = useStore(s => s.persistTransactions)
  const showToast = useStore(s => s.showToast)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterBank, setFilterBank] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [sortColumn, setSortColumn] = useState<SortColumn>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAllMode, setEditAllMode] = useState(false)
  const [savedPageSize, setSavedPageSize] = useState(25)
  const [splittingId, setSplittingId] = useState<string | null>(null)
  const [splitParts, setSplitParts] = useState<SplitPart[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [addDate, setAddDate] = useState('')
  const [addDesc, setAddDesc] = useState('')
  const [addAmount, setAddAmount] = useState('')
  const [addBank, setAddBank] = useState('')
  const [addCategory, setAddCategory] = useState('')

  const allCategories = getAllCategories()
  const allBanks = getAllBanks()

  useEffect(() => { setAddDate(new Date().toISOString().slice(0, 10)) }, [])

  useEffect(() => { if (!editAllMode) { persistTransactions() } }, [transactions, editAllMode, persistTransactions])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.tx-menu-btn')) {
        document.querySelectorAll('.tx-menu-dropdown').forEach(m => {
          const el = m as HTMLElement
          el.classList.add('hidden')
          el.style.position = ''
          el.style.top = ''
          el.style.left = ''
          el.style.visibility = ''
        })
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const filtered = useMemo(() => {
    let f = [...transactions]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      f = f.filter(t => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
    }
    if (filterBank) f = f.filter(t => t.bank === filterBank)
    if (filterCategory) f = f.filter(t => t.category === filterCategory)
    if (filterType === 'entrate') f = f.filter(t => t.amount > 0)
    else if (filterType === 'uscite') f = f.filter(t => t.amount < 0)
    if (filterYear) f = f.filter(t => { const d = new Date(t.date); return !isNaN(d.getTime()) && String(d.getFullYear()) === filterYear })
    if (filterMonth) f = f.filter(t => { const d = new Date(t.date); return !isNaN(d.getTime()) && String(d.getMonth() + 1) === filterMonth })
    return f
  }, [transactions, searchQuery, filterBank, filterCategory, filterType, filterYear, filterMonth])

  const years = useMemo(() => {
    const y = new Set<number>()
    for (const tx of transactions) {
      const d = new Date(tx.date)
      if (!isNaN(d.getTime())) y.add(d.getFullYear())
    }
    return [...y].sort((a, b) => b - a)
  }, [transactions])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va: string | number = a[sortColumn]
      let vb: string | number = b[sortColumn]
      if (sortColumn === 'date') { va = new Date(va as string).getTime(); vb = new Date(vb as string).getTime() }
      else if (sortColumn === 'amount') { va = Number(va); vb = Number(vb) }
      else { va = String(va).toLowerCase(); vb = String(vb).toLowerCase() }
      if (va < vb) return sortDirection === 'asc' ? -1 : 1
      if (va > vb) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortColumn, sortDirection])

  const totalPages = pageSize === 0 ? 1 : Math.ceil(sorted.length / pageSize)
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages))
  const start = pageSize === 0 ? 0 : (safeCurrentPage - 1) * pageSize
  const end = pageSize === 0 ? sorted.length : start + pageSize
  const pageRows = sorted.slice(start, end)

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortColumn(col); setSortDirection('asc') }
  }

  const toggleEditAll = () => {
    if (editAllMode) {
      setEditAllMode(false)
      setPageSize(savedPageSize)
      setCurrentPage(1)
    } else {
      setSavedPageSize(pageSize)
      setEditAllMode(true)
      setPageSize(0)
      setCurrentPage(1)
      setEditingId(null)
      setSplittingId(null)
      setSplitParts([])
      clearSelectedIds()
    }
  }

  const saveEditAll = () => {
    const table = document.getElementById('registro-tbody')
    if (!table) return
    const rows = table.querySelectorAll<HTMLTableRowElement>('tr[data-id]')
    let errors: string[] = []
    let saved = 0
    rows.forEach(row => {
      const id = row.dataset.id
      if (!id) return
      const tx = transactions.find(t => t.id === id)
      if (!tx) return
      const dateInput = row.querySelector<HTMLInputElement>('.date-input')
      const bankSelect = row.querySelector<HTMLSelectElement>('.bank-input')
      const descInput = row.querySelector<HTMLInputElement>('.desc-input')
      const catSelect = row.querySelector<HTMLSelectElement>('.category-select')
      const amountInput = row.querySelector<HTMLInputElement>('.amount-input')
      const newDate = dateInput?.value || ''
      const newBank = bankSelect?.value || ''
      const newDesc = descInput?.value.trim() || ''
      const newCat = catSelect?.value || ''
      const newAmount = amountInput ? parseFloat(amountInput.value) : NaN
      if (!newDate) { errors.push(tx.description + ': data mancante'); return }
      if (!newDesc) { errors.push(tx.description + ': descrizione mancante'); return }
      if (isNaN(newAmount) || newAmount === 0) { errors.push(tx.description + ': importo non valido'); return }
      if (!newBank) { errors.push(tx.description + ': banca mancante'); return }
      if (!newCat) { errors.push(tx.description + ': categoria mancante'); return }
      updateTransaction(id, { date: newDate, bank: newBank, description: newDesc, amount: newAmount, category: newCat })
      saved++
    })
    setEditAllMode(false)
    setPageSize(savedPageSize)
    setCurrentPage(1)
    showToast(errors.length > 0 ? `Salvate ${saved} modifiche. Errori: ${errors.join('; ')}` : `Salvate ${saved} modifiche.`, errors.length > 0 ? 'error' : 'success')
  }

  const startSplit = (id: string) => {
    const tx = transactions.find(t => t.id === id)
    if (!tx) return
    const half = tx.amount / 2
    setSplittingId(id)
    setSplitParts([
      { date: tx.date, bank: tx.bank, description: '', amount: half, category: 'Altro' },
      { date: tx.date, bank: tx.bank, description: '', amount: half, category: 'Altro' },
    ])
    setEditingId(id)
  }

  const confirmSplit = (id: string) => {
    const table = document.getElementById('registro-tbody')
    if (!table) return
    const origRow = table.querySelector<HTMLTableRowElement>(`tr[data-id="${id}"]`)
    if (!origRow) return
    const origDate = origRow.querySelector<HTMLInputElement>('.date-input')?.value || ''
    const origBank = origRow.querySelector<HTMLSelectElement>('.bank-input')?.value || ''
    const origDesc = origRow.querySelector<HTMLInputElement>('.desc-input')?.value.trim() || ''
    const origCat = origRow.querySelector<HTMLSelectElement>('.category-select')?.value || ''
    const origAmount = parseFloat(origRow.querySelector<HTMLInputElement>('.amount-input')?.value || '0')
    if (!origDate || !origDesc || isNaN(origAmount) || origAmount === 0 || !origBank || !origCat) {
      showToast('Compila tutti i campi della transazione originale.', 'error'); return
    }
    const splitRows = table.querySelectorAll<HTMLTableRowElement>('tr[data-split]')
    const parts: SplitPart[] = []
    let valid = true
    splitRows.forEach(sr => {
      const sd = sr.querySelector<HTMLInputElement>('.split-date')?.value || ''
      const sb = sr.querySelector<HTMLSelectElement>('.split-bank')?.value || ''
      const sdesc = sr.querySelector<HTMLInputElement>('.split-desc')?.value.trim() || ''
      const scat = sr.querySelector<HTMLSelectElement>('.split-cat')?.value || ''
      const samount = parseFloat(sr.querySelector<HTMLInputElement>('.split-amount')?.value || '0')
      if (!sd || !sdesc || isNaN(samount) || samount === 0 || !sb || !scat) valid = false
      else parts.push({ date: sd, bank: sb, description: sdesc, amount: samount, category: scat })
    })
    if (!valid) { showToast('Compila tutti i campi degli split.', 'error'); return }
    if (parts.length === 0) { showToast('Aggiungi almeno uno split.', 'error'); return }
    deleteTransaction(id)
    for (const p of parts) {
      addTransaction({ id: uuid(), date: p.date, bank: p.bank, description: p.description, amount: p.amount, category: p.category })
    }
    setSplittingId(null)
    setSplitParts([])
    setEditingId(null)
    showToast('Transazione suddivisa in ' + parts.length + ' parti.', 'success')
  }

  const deleteSplitPart = (si: number) => {
    const table = document.getElementById('registro-tbody')
    if (!table) return
    const splitRows = table.querySelectorAll<HTMLTableRowElement>('tr[data-split]')
    const parts = [...splitParts]
    splitRows.forEach((r, i) => {
      if (i < parts.length) {
        parts[i] = {
          date: r.querySelector<HTMLInputElement>('.split-date')?.value || parts[i].date,
          bank: r.querySelector<HTMLSelectElement>('.split-bank')?.value || parts[i].bank,
          description: r.querySelector<HTMLInputElement>('.split-desc')?.value || '',
          category: r.querySelector<HTMLSelectElement>('.split-cat')?.value || 'Altro',
          amount: parseFloat(r.querySelector<HTMLInputElement>('.split-amount')?.value || '0'),
        }
      }
    })
    if (parts.length <= 1) { showToast('Deve esserci almeno uno split.', 'error'); return }
    const total = parts.reduce((s, p) => s + p.amount, 0)
    parts.splice(si, 1)
    const equal = total / parts.length
    for (let i = 0; i < parts.length; i++) {
      parts[i].amount = i < parts.length - 1 ? equal : total - equal * (parts.length - 1)
    }
    setSplitParts(parts)
  }

  const addSplitPart = (si: number) => {
    const table = document.getElementById('registro-tbody')
    if (!table) return
    const splitRows = table.querySelectorAll<HTMLTableRowElement>('tr[data-split]')
    const parts = [...splitParts]
    splitRows.forEach((r, i) => {
      if (i < parts.length) {
        parts[i] = {
          date: r.querySelector<HTMLInputElement>('.split-date')?.value || parts[i].date,
          bank: r.querySelector<HTMLSelectElement>('.split-bank')?.value || parts[i].bank,
          description: r.querySelector<HTMLInputElement>('.split-desc')?.value || '',
          category: r.querySelector<HTMLSelectElement>('.split-cat')?.value || 'Altro',
          amount: parseFloat(r.querySelector<HTMLInputElement>('.split-amount')?.value || '0'),
        }
      }
    })
    const lastPart = parts[si]
    const total = parts.reduce((s, p) => s + p.amount, 0)
    parts.splice(si + 1, 0, { date: lastPart.date, bank: lastPart.bank, description: '', amount: 0, category: 'Altro' })
    const equal = total / parts.length
    for (let i = 0; i < parts.length; i++) {
      parts[i].amount = i < parts.length - 1 ? equal : total - equal * (parts.length - 1)
    }
    setSplitParts(parts)
  }

  const addManualTx = () => {
    if (!addDate) { showToast('Inserisci una data.', 'error'); return }
    if (!addDesc) { showToast('Inserisci una descrizione.', 'error'); return }
    const amount = parseFloat(addAmount)
    if (isNaN(amount) || amount === 0) { showToast('Inserisci un importo valido.', 'error'); return }
    if (!addBank) { showToast('Seleziona una banca.', 'error'); return }
    if (!addCategory) { showToast('Seleziona una categoria.', 'error'); return }
    addTransaction({ id: uuid(), date: addDate, description: addDesc, amount, bank: addBank, category: addCategory })
    setShowAddForm(false)
    setAddDesc('')
    setAddAmount('')
    showToast('Transazione aggiunta.', 'success')
  }

  const exportCSV = () => {
    if (filtered.length === 0) { showToast('Nessuna transazione da esportare.', 'error'); return }
    const header = 'Data;Banca;Descrizione;Categoria;Importo'
    const rows = filtered.map(t => {
      const desc = t.description.replace(/;/g, ',')
      return `${t.date.split(' ')[0]};${t.bank};${desc};${t.category};${String(t.amount).replace('.', ',')}`
    })
    const csv = '\uFEFF' + header + '\n' + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'flowtrack_export.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast(`Esportate ${filtered.length} transazioni`, 'success')
  }

  const isEditing = (id: string) => editAllMode || editingId === id

  const SORT_ARROW: Record<string, string> = { asc: ' \u25B2', desc: ' \u25BC' }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">
          Registro Transazioni
          <span className="text-xs font-normal text-slate-400 ml-2">{filtered.length} / {transactions.length} transazioni</span>
        </h2>
      </div>

      {showAddForm && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-slate-500 font-medium">Data</label>
            <input type="date" value={addDate} onChange={e => setAddDate(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-400" />
          </div>
          <div className="flex flex-col gap-0.5 flex-1 min-w-[160px]">
            <label className="text-[10px] text-slate-500 font-medium">Descrizione</label>
            <input type="text" placeholder="es. Supermercato" value={addDesc} onChange={e => { setAddDesc(e.target.value); setAddCategory(categorize(e.target.value, parseFloat(addAmount) || -1, customRules)) }} className="border border-slate-300 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-400" />
          </div>
          <div className="flex flex-col gap-0.5 w-[100px]">
            <label className="text-[10px] text-slate-500 font-medium">Importo (&euro;)</label>
            <input type="number" step="0.01" placeholder="0.00" value={addAmount} onChange={e => { setAddAmount(e.target.value); if (addDesc) setAddCategory(categorize(addDesc, parseFloat(e.target.value) || -1, customRules)) }} className="border border-slate-300 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-400" />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-slate-500 font-medium">Banca</label>
            <select value={addBank} onChange={e => setAddBank(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-400 bg-white">
              <option value="">Seleziona...</option>
              {allBanks.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-slate-500 font-medium">Categoria</label>
            <select value={addCategory} onChange={e => setAddCategory(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-400 bg-white">
              <option value="">Seleziona...</option>
              {allCategories.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <button onClick={addManualTx} className="bg-indigo-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">Salva</button>
          <button onClick={() => setShowAddForm(false)} className="text-xs text-slate-500 px-2 py-1.5 hover:text-slate-700">Annulla</button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowAddForm(true)} className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-indigo-50 hover:border-indigo-300 transition-colors bg-white flex items-center gap-1">+ Aggiungi</button>
          <button onClick={toggleEditAll} className={`text-xs border rounded-lg px-3 py-1.5 transition-colors bg-white flex items-center gap-1 ${editAllMode ? 'bg-amber-100 border-amber-400 text-amber-700' : 'hover:bg-amber-50 hover:border-amber-300 border-slate-300'}`}>&#9998; {editAllMode ? 'Esci modifica' : 'Modifica'}</button>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">&#128269;</span>
            <input type="text" placeholder="Cerca..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }} className="border border-slate-300 rounded-lg pl-7 pr-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none w-60" />
          </div>
          <button onClick={exportCSV} className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-indigo-50 hover:border-indigo-300 transition-colors bg-white flex items-center gap-1">&#8595; Scarica</button>
        </div>
        <button onClick={() => setShowFilters(v => !v)} className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 hover:bg-indigo-50 hover:border-indigo-300 transition-colors bg-white flex items-center gap-1">
          &#9660; Filtri
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
            <select value={filterBank} onChange={e => { setFilterBank(e.target.value); setCurrentPage(1) }} className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-400 outline-none bg-white">
              <option value="">Tutte le banche</option>
              {allBanks.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
            <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1) }} className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-400 outline-none bg-white">
              <option value="">Tutte le categorie</option>
              {allCategories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            <select value={filterType} onChange={e => { setFilterType(e.target.value); setCurrentPage(1) }} className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-400 outline-none bg-white">
              <option value="">Entrate e Uscite</option>
              <option value="entrate">Solo Entrate</option>
              <option value="uscite">Solo Uscite</option>
            </select>
            <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setCurrentPage(1) }} className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-400 outline-none bg-white">
              <option value="">Tutti gli anni</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setCurrentPage(1) }} className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-400 outline-none bg-white">
              <option value="">Tutti i mesi</option>
              {['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'].map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <button onClick={() => { setFilterBank(''); setFilterCategory(''); setFilterType(''); setFilterYear(''); setFilterMonth(''); setSearchQuery(''); setCurrentPage(1) }} className="text-xs border border-red-300 text-red-500 rounded-lg px-2 py-1 hover:bg-red-50 transition-colors bg-white">Reset</button>
          </div>
        )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-3 py-3 text-center w-8">
                {!editAllMode && <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400 cursor-pointer" checked={selectedIds.size > 0 && selectedIds.size === pageRows.length && pageRows.length > 0} onChange={e => { pageRows.forEach(t => toggleSelectedId(t.id)); if (!e.target.checked) clearSelectedIds() }} />}
              </th>
              {(['date', 'bank', 'description', 'category', 'amount'] as SortColumn[]).map(col => (
                <th key={col} className="text-left px-4 py-3 font-semibold cursor-pointer hover:text-indigo-600 select-none" onClick={() => handleSort(col)}>
                  {col === 'date' ? 'Data' : col === 'bank' ? 'Banca' : col === 'description' ? 'Descrizione' : col === 'category' ? 'Categoria' : 'Importo'}
                  <span className="text-[10px]">{sortColumn === col ? SORT_ARROW[sortDirection] : ''}</span>
                </th>
              ))}
              <th className="px-4 py-3 text-center font-semibold text-slate-400 w-10"></th>
            </tr>
          </thead>
          <tbody id="registro-tbody" className="divide-y divide-slate-100">
            {pageRows.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-slate-400 py-10">
                {transactions.length === 0 ? 'Nessuna transazione. Carica un file CSV nella sezione Importa.' : 'Nessuna transazione corrisponde ai filtri.'}
              </td></tr>
            ) : pageRows.map(tx => {
              const bStyle = getBankStyle(tx.bank)
              const isEd = isEditing(tx.id)
              const catOptions = allCategories.map(c => `<option value="${c.name}" ${c.name === tx.category ? 'selected' : ''}>${c.icon || '📦'} ${c.name}</option>`).join('')
              const isSplit = splittingId === tx.id
              return (
                <Fragment key={tx.id}>
                  <tr data-id={tx.id} className={`hover:bg-slate-50 transition-colors ${isSplit ? 'bg-indigo-50/40' : ''} ${selectedIds.has(tx.id) ? 'bg-indigo-50/30' : ''}`}>
                    <td className="px-3 py-2.5 text-center w-8">
                      {isSplit || editAllMode ? null : (
                        <input type="checkbox" className="tx-checkbox w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400 cursor-pointer" checked={selectedIds.has(tx.id)} onChange={() => toggleSelectedId(tx.id)} />
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">
                      {isEd ? <input type="date" defaultValue={tx.date} className="date-input border border-indigo-400 rounded px-1.5 py-0.5 text-xs outline-none w-full" /> : <span className="text-xs">{formatDate(tx.date)}</span>}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {isEd ? (
                        <select defaultValue={tx.bank} className="bank-input text-xs border border-indigo-400 rounded px-1.5 py-1 outline-none bg-white">
                          {allBanks.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                        </select>
                      ) : bStyle.icon ? (
                        <img src={bStyle.icon.startsWith('data:') ? bStyle.icon : "/" + bStyle.icon} alt={tx.bank} className="h-8 w-auto" title={tx.bank} />
                      ) : (
                        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: bStyle.color }}>{bStyle.label}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700 max-w-xs">
                      {isEd ? <input type="text" defaultValue={tx.description} className="desc-input w-full bg-transparent border border-indigo-400 rounded px-1.5 py-0.5 text-xs outline-none" /> : <span className="text-xs leading-relaxed">{tx.description}</span>}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {isEd ? (
                        <select defaultValue={tx.category} className="category-select text-xs border border-indigo-400 rounded px-1.5 py-1 outline-none bg-white" dangerouslySetInnerHTML={{ __html: catOptions }} />
                      ) : (
                        <span className="text-xs text-slate-600">{tx.category}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-right">
                      {isEd ? <input type="number" step="0.01" defaultValue={tx.amount} className="amount-input text-right border border-indigo-400 rounded px-1.5 py-0.5 text-xs outline-none w-24" /> : <span className={`font-semibold text-sm ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(tx.amount)}</span>}
                    </td>
                    <td className="px-2 py-2.5 whitespace-nowrap text-center">
                      <div className="relative inline-block">
                        <button className="tx-menu-btn text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none" onClick={e => {
                          e.stopPropagation()
                          document.querySelectorAll('.tx-menu-dropdown').forEach(m => {
                            const el = m as HTMLElement
                            el.classList.add('hidden')
                            el.style.position = ''
                            el.style.top = ''
                            el.style.left = ''
                            el.style.visibility = ''
                          })
                          const btn = e.currentTarget
                          const menu = btn.parentElement?.querySelector('.tx-menu-dropdown') as HTMLElement
                          if (menu) {
                            if (!menu.classList.contains('hidden')) {
                              menu.classList.add('hidden')
                              return
                            }
                            menu.classList.remove('hidden')
                            menu.style.position = 'fixed'
                            menu.style.visibility = 'hidden'
                            const rect = btn.getBoundingClientRect()
                            const mh = menu.offsetHeight
                            const mw = menu.offsetWidth
                            menu.style.top = (rect.top - mh - 4) + 'px'
                            menu.style.left = Math.max(4, rect.right - mw) + 'px'
                            menu.style.visibility = 'visible'
                          }
                        }}>&#8942;</button>
                        <div className="tx-menu-dropdown hidden bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 min-w-[140px]">
                          {isEd ? (
                            <>
                              <button className="w-full text-left px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 flex items-center gap-2" onClick={() => { if (isSplit) confirmSplit(tx.id); else { saveEditSingle(tx.id); setEditingId(null) } }}>&#10003; Salva</button>
                              <button className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2" onClick={() => { setSplittingId(null); setSplitParts([]); if (!editAllMode) setEditingId(null) }}>&#8634; Annulla</button>
                            </>
                          ) : (
                            <>
                              <button className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 flex items-center gap-2" onClick={() => setEditingId(tx.id)}>&#9998; Modifica</button>
                              <button className="w-full text-left px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50 flex items-center gap-2" onClick={() => startSplit(tx.id)}>&#8621; Split</button>
                              <button className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2" onClick={() => { if (confirm(`Eliminare "${tx.description}"?`)) { deleteTransaction(tx.id); showToast('Transazione eliminata', 'info') } }}>&#10005; Elimina</button>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                  {isSplit && splitParts.map((sp, si) => (
                    <tr key={`split-${si}`} data-split={si} className="bg-amber-50/30 border-t-0">
                      <td className="px-3 py-2 text-center w-8"></td>
                      <td className="px-4 py-2 whitespace-nowrap"><input type="date" defaultValue={sp.date} className="split-date border border-amber-400 rounded px-1.5 py-0.5 text-xs outline-none w-full" /></td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <select defaultValue={sp.bank} className="split-bank text-xs border border-amber-400 rounded px-1.5 py-1 outline-none bg-white">
                          {allBanks.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-slate-700 max-w-xs"><input type="text" defaultValue={sp.description} className="split-desc w-full bg-transparent border border-amber-400 rounded px-1.5 py-0.5 text-xs outline-none" /></td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <select defaultValue={sp.category} className="split-cat text-xs border border-amber-400 rounded px-1.5 py-1 outline-none bg-white">
                          {allCategories.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right"><input type="number" step="0.01" defaultValue={sp.amount} className="split-amount text-right border border-amber-400 rounded px-1.5 py-0.5 text-xs outline-none w-24" /></td>
                      <td className="px-2 py-2 whitespace-nowrap text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <button className="split-del-btn text-red-400 hover:text-red-600 text-sm" onClick={() => deleteSplitPart(si)}>&#10005;</button>
                          <button className="split-add-btn text-amber-500 hover:text-amber-700 text-base" onClick={() => addSplitPart(si)}>&#10133;</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Righe per pagina:</span>
          <select value={editAllMode ? 0 : pageSize} onChange={e => { if (editAllMode) return; setPageSize(parseInt(e.target.value) || 0); setCurrentPage(1) }} className="border border-slate-300 rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-indigo-400 bg-white">
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={0}>Tutte</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage(1)} className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-300">&#171;</button>
          <button disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-300">&#9664;</button>
          <span className="text-slate-600">{sorted.length > 0 ? `Pagina ${safeCurrentPage} di ${totalPages} (${Math.min(pageSize || sorted.length, sorted.length)} righe)` : ''}</span>
          <button disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-300">&#9654;</button>
          <button disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage(totalPages)} className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-300">&#187;</button>
        </div>
      </div>

      {editAllMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white border border-amber-300 rounded-xl shadow-lg px-5 py-3">
          <span className="text-sm text-amber-700 font-medium">&#9998; Modalità modifica</span>
          <span className="text-slate-200">|</span>
          <button onClick={saveEditAll} className="text-sm bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition-colors font-medium">Salva tutto</button>
          <button onClick={toggleEditAll} className="text-sm text-slate-500 hover:text-slate-700 px-2 py-1.5 transition-colors">Esci</button>
        </div>
      )}

      {selectedIds.size > 0 && !editAllMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white border border-red-200 rounded-xl shadow-lg px-5 py-3">
          <span className="text-sm text-red-600 font-medium">{selectedIds.size} selezionat{selectedIds.size === 1 ? 'a' : 'e'}</span>
          <span className="text-slate-200">|</span>
          <button onClick={() => { if (confirm(`Eliminare ${selectedIds.size} transazioni?`)) { deleteSelectedTransactions(); showToast(`Eliminate ${selectedIds.size} transazioni.`, 'success') } }} className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors font-medium">Elimina selezionate</button>
          <button onClick={clearSelectedIds} className="text-sm text-slate-500 hover:text-slate-700 px-2 py-1.5 transition-colors">Annulla</button>
        </div>
      )}
    </div>
  )
}

function saveEditSingle(id: string) {
  const row = document.querySelector<HTMLTableRowElement>(`tr[data-id="${id}"]`)
  if (!row) return
  const dateInput = row.querySelector<HTMLInputElement>('.date-input')
  const bankSelect = row.querySelector<HTMLSelectElement>('.bank-input')
  const descInput = row.querySelector<HTMLInputElement>('.desc-input')
  const catSelect = row.querySelector<HTMLSelectElement>('.category-select')
  const amountInput = row.querySelector<HTMLInputElement>('.amount-input')
  const newDate = dateInput?.value || ''
  const newBank = bankSelect?.value || ''
  const newDesc = descInput?.value.trim() || ''
  const newCat = catSelect?.value || ''
  const newAmount = amountInput ? parseFloat(amountInput.value) : NaN
  if (!newDate || !newDesc || isNaN(newAmount) || newAmount === 0 || !newBank || !newCat) return
  const store = useStore.getState()
  store.updateTransaction(id, { date: newDate, bank: newBank, description: newDesc, amount: newAmount, category: newCat })
  store.setEditingId(null)
  const drop = row.parentElement?.querySelector('.tx-menu-dropdown')
  if (drop) drop.classList.add('hidden')
  store.showToast('Transazione modificata.', 'success')
}
