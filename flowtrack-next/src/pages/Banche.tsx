'use client'

import { useStore } from '@/lib/store'
import { useState, useRef, useMemo } from 'react'
import { DEFAULT_BANKS } from '@/lib/defaults'
import * as XLSX from 'xlsx'
import { ArrowLeft, ArrowRight, Upload, FileText } from 'lucide-react'

const BANK_ICONS = ['intesa.svg', 'revolut.svg', 'paypal.svg', 'dollar.svg']

function iconSrc(icon: string) {
  return icon.startsWith('data:') ? icon : '/' + icon
}

type CustomBank = NonNullable<ReturnType<typeof useStore.getState>['customBanks']>[number]

type EditingBank = {
  index: number
  label: string
  color: string
  icon: string
  useIcon: boolean
  csvDate: string
  csvAmount: string
  csvDesc: string
} | null

function readSVG(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function parseHeaderAndRowsFromText(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '')
  if (lines.length < 2) return { headers: [], rows: [] }
  const delim = lines[0].includes('\t') ? '\t' : [',', ';', '|'].find(d => lines[0].includes(d)) || ','
  const parseLine = (line: string) => {
    const result: string[] = []
    let cur = ''
    let inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue }
      if (ch === delim && !inQ) { result.push(cur.trim()); cur = ''; continue }
      cur += ch
    }
    result.push(cur.trim())
    return result
  }
  const rows = lines.map(parseLine)
  return { headers: rows[0], rows: rows.slice(1).slice(0, 10) }
}

function parseHeaderAndRowsFromExcel(buf: ArrayBuffer): { headers: string[]; rows: string[][] } {
  const workbook = XLSX.read(buf, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const json: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  let maxLen = 0
  for (const row of json) if (row.length > maxLen) maxLen = row.length
  const rows = json.map(row => { while (row.length < maxLen) row.push(''); return row.map(c => String(c)) }).filter(row => row.some(cell => cell.trim() !== ''))
  if (rows.length < 2) return { headers: [], rows: [] }
  return { headers: rows[0], rows: rows.slice(1).slice(0, 10) }
}

export default function BanchePage() {
  const customBanks = useStore(s => s.customBanks)
  const addCustomBank = useStore(s => s.addCustomBank)
  const updateCustomBank = useStore(s => s.updateCustomBank)
  const deleteCustomBank = useStore(s => s.deleteCustomBank)
  const getAllBanks = useStore(s => s.getAllBanks)
  const showToast = useStore(s => s.showToast)

  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newColor, setNewColor] = useState('#6366f1')
  const [newIcon, setNewIcon] = useState('')
  const [newUseIcon, setNewUseIcon] = useState(false)
  const [newCustomIcon, setNewCustomIcon] = useState(false)
  const [csvDate, setCsvDate] = useState('')
  const [csvAmount, setCsvAmount] = useState('')
  const [csvDesc, setCsvDesc] = useState('')
  const [editing, setEditing] = useState<EditingBank>(null)
  const [showNewIconPicker, setShowNewIconPicker] = useState(false)
  const [showEditIconPicker, setShowEditIconPicker] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const editFileRef = useRef<HTMLInputElement>(null)

  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizStep, setWizStep] = useState(0)
  const [wizName, setWizName] = useState('')
  const [wizColor, setWizColor] = useState('#6366f1')
  const [wizLabel, setWizLabel] = useState('')
  const [wizIcon, setWizIcon] = useState('')
  const [wizUseIcon, setWizUseIcon] = useState(false)
  const [wizCustomIcon, setWizCustomIcon] = useState(false)
  const [wizPasted, setWizPasted] = useState('')
  const [wizHeaders, setWizHeaders] = useState<string[]>([])
  const [wizRows, setWizRows] = useState<string[][]>([])
  const [wizDateCol, setWizDateCol] = useState('')
  const [wizDescCols, setWizDescCols] = useState<string[]>([])
  const [wizAmountCol, setWizAmountCol] = useState('')
  const [showWizIconPicker, setShowWizIconPicker] = useState(false)
  const wizFileRef = useRef<HTMLInputElement>(null)

  const allBanks = getAllBanks()

  const handleFilePick = async (file: File | undefined, setIcon: (v: string) => void, setCustom: (v: boolean) => void) => {
    if (!file || !file.type.includes('svg')) {
      showToast('Seleziona un file SVG valido.', 'error'); return
    }
    const dataUrl = await readSVG(file)
    setIcon(dataUrl)
    setCustom(true)
  }

  const handleWizFile = async (file: File | undefined) => {
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'csv' && ext !== 'tsv' && ext !== 'xlsx' && ext !== 'xls') {
      showToast('Seleziona un file CSV o Excel valido.', 'error'); return
    }
    const isExcel = ext === 'xlsx' || ext === 'xls'
    if (isExcel) {
      const buf = await file.arrayBuffer()
      const { headers, rows } = parseHeaderAndRowsFromExcel(buf)
      if (headers.length === 0) { showToast('Impossibile leggere il file Excel.', 'error'); return }
      setWizHeaders(headers)
      setWizRows(rows)
      setWizPasted('')
      setWizStep(1)
    } else {
      const text = await file.text()
      const { headers, rows } = parseHeaderAndRowsFromText(text)
      if (headers.length === 0) { showToast('Impossibile leggere il file.', 'error'); return }
      setWizHeaders(headers)
      setWizRows(rows)
      setWizPasted(text)
      setWizStep(1)
    }
  }

  const handleWizPaste = () => {
    if (!wizPasted.trim()) { showToast('Incolla prima il contenuto del file.', 'error'); return }
    const { headers, rows } = parseHeaderAndRowsFromText(wizPasted)
    if (headers.length === 0) { showToast('Impossibile leggere il contenuto incollato.', 'error'); return }
    setWizHeaders(headers)
    setWizRows(rows)
    setWizStep(1)
  }

  const resetWizard = () => {
    setWizardOpen(false)
    setWizStep(0)
    setWizName('')
    setWizColor('#6366f1')
    setWizLabel('')
    setWizIcon('')
    setWizUseIcon(false)
    setWizCustomIcon(false)
    setWizPasted('')
    setWizHeaders([])
    setWizRows([])
    setWizDateCol('')
    setWizDescCols([])
    setWizAmountCol('')
  }

  const wizDescTemplate = useMemo(() => {
    if (wizDescCols.length === 0) return ''
    return wizDescCols.map(c => `{${c}}`).join(' - ')
  }, [wizDescCols])

  const handleWizSave = () => {
    if (!wizName.trim()) { showToast('Inserisci un nome per la banca.', 'error'); return }
    if (allBanks.some(b => b.name.toLowerCase() === wizName.trim().toLowerCase())) {
      showToast('Banca già esistente.', 'error'); return
    }
    const bank: Parameters<typeof addCustomBank>[0] = {
      id: 'custom_' + Date.now(),
      name: wizName.trim(),
      label: wizLabel.trim().toUpperCase() || wizName.trim().slice(0, 3).toUpperCase(),
      color: wizColor,
    }
    if (wizUseIcon && wizIcon.trim()) bank.icon = wizIcon.trim()
    if (wizDateCol && wizAmountCol) {
      bank.csvConfig = {
        dateCol: wizDateCol.toLowerCase(),
        amountType: 'single',
        amountCol: wizAmountCol.toLowerCase(),
        descTemplate: wizDescTemplate,
      }
    }
    addCustomBank(bank)
    resetWizard()
    setShowForm(false)
    showToast(`Banca "${bank.name}" aggiunta.`, 'success')
  }

  const startEdit = (index: number) => {
    const bank = customBanks[index]
    setEditing({
      index,
      label: bank.label || '',
      color: bank.color || '#6366f1',
      icon: bank.icon || '',
      useIcon: !!bank.icon,
      csvDate: bank.csvConfig?.dateCol || '',
      csvAmount: bank.csvConfig?.amountCol || '',
      csvDesc: bank.csvConfig?.descTemplate || '',
    })
  }

  const saveEdit = () => {
    if (!editing) return
    const bank = customBanks[editing.index]
    const updates: Record<string, unknown> = {}
    if (editing.label) updates.label = editing.label.toUpperCase()
    if (editing.color) updates.color = editing.color
    if (editing.useIcon && editing.icon.trim()) updates.icon = editing.icon.trim()
    else updates.icon = null
    if (editing.csvDate && editing.csvAmount) {
      updates.csvConfig = { dateCol: editing.csvDate.toLowerCase(), amountType: 'single', amountCol: editing.csvAmount.toLowerCase(), descTemplate: editing.csvDesc }
    } else {
      updates.csvConfig = null
    }
    updateCustomBank(editing.index, updates as never)
    setEditing(null)
    showToast(`Banca "${bank.name}" aggiornata.`, 'success')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Banche</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
        {allBanks.map((bank, i) => {
          const isCustom = customBanks.some((c, ci) => c.name === bank.name && ci < customBanks.length && customBanks[ci].name === bank.name)
          const bankIndex = customBanks.findIndex(c => c.name === bank.name)
          const isEditingThis = editing && editing.index === bankIndex
          const isDefault = DEFAULT_BANKS.some(d => d.id === bank.id)

          if (isEditingThis) {
            const isCustomIcon = editing!.icon.startsWith('data:')
            return (
              <div key={bank.id} className="bg-indigo-50/40 border border-indigo-200 rounded-xl p-4 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <input type="color" value={editing!.color} onChange={e => setEditing({ ...editing!, color: e.target.value })} className="w-7 h-7 p-0.5 border border-slate-300 rounded cursor-pointer" />
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="edit-display" checked={!editing!.useIcon} onChange={() => setEditing({ ...editing!, useIcon: false })} className="w-3 h-3" />
                    Label
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="edit-display" checked={editing!.useIcon && !isCustomIcon} onChange={() => setEditing({ ...editing!, useIcon: true, icon: '' })} className="w-3 h-3" />
                    Icona predefinita
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="edit-display" checked={editing!.useIcon && isCustomIcon} onChange={() => {
                      setEditing({ ...editing!, useIcon: true, icon: '' })
                      setTimeout(() => editFileRef.current?.click(), 0)
                    }} className="w-3 h-3" />
                    Carica SVG
                  </label>
                </div>
                {editing!.useIcon && !isCustomIcon ? (
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setShowEditIconPicker(true)} className="flex items-center gap-2 text-xs text-indigo-600 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-3 py-1.5 transition-colors bg-white">
                      {editing!.icon ? <img src={iconSrc(editing!.icon)} alt="" className="h-6 w-auto" /> : <span className="text-slate-400">?</span>}
                      Scegli icona
                    </button>
                  </div>
                ) : editing!.useIcon && isCustomIcon ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={editFileRef}
                      type="file" accept=".svg"
                      className="flex-1 text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-white file:text-indigo-700 hover:file:bg-indigo-50 border border-slate-300 rounded-lg cursor-pointer"
                      onChange={e => handleFilePick(e.target.files?.[0], v => setEditing({ ...editing!, icon: v }), () => {})}
                    />
                    {editing!.icon && <img src={iconSrc(editing!.icon)} alt="" className="h-8 w-auto" />}
                  </div>
                ) : (
                  <input type="text" value={editing!.label} onChange={e => setEditing({ ...editing!, label: e.target.value })} placeholder="Label" maxLength={5} className="w-full border border-indigo-300 rounded px-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-400" />
                )}
                <div className="border-t border-indigo-200 pt-1">
                  <div className="flex flex-col sm:flex-row gap-1 mb-0.5">
                    <input type="text" value={editing!.csvDate} onChange={e => setEditing({ ...editing!, csvDate: e.target.value })} placeholder="Colonna data" className="flex-1 min-w-0 border border-slate-300 rounded px-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-400" />
                    <input type="text" value={editing!.csvAmount} onChange={e => setEditing({ ...editing!, csvAmount: e.target.value })} placeholder="Colonna importo" className="flex-1 min-w-0 border border-slate-300 rounded px-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-400" />
                  </div>
                  <input type="text" value={editing!.csvDesc} onChange={e => setEditing({ ...editing!, csvDesc: e.target.value })} placeholder="Template descrizione" className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-400" />
                </div>
                <div className="flex gap-1 pt-1">
                  <button onClick={saveEdit} className="flex-1 bg-indigo-600 text-white rounded text-xs font-medium py-1 hover:bg-indigo-700 transition-colors">&#10003; Salva</button>
                  <button onClick={() => setEditing(null)} className="flex-1 text-slate-400 hover:text-slate-600 rounded text-xs py-1 transition-colors">&#10005; Annulla</button>
                </div>
              </div>
            )
          }

          return (
            <div key={bank.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ background: bank.color }} />
                {bank.icon ? (
                  <img src={iconSrc(bank.icon)} alt={bank.name} className="h-10 w-auto" />
                ) : null}
                <div>
                  <span className="text-sm font-medium text-slate-800">{bank.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono ml-1">{bank.label}</span>
                  {bank.csvConfig && <p className="text-[10px] text-slate-400 mt-0.5">CSV configurato</p>}
                </div>
              </div>
              {!isDefault && bankIndex !== -1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(bankIndex)} className="text-indigo-300 hover:text-indigo-500 text-xs leading-none">&#9998;</button>
                  <button onClick={() => { if (confirm(`Eliminare la banca "${bank.name}"?`)) { deleteCustomBank(bankIndex); showToast(`Banca "${bank.name}" eliminata.`, 'info') } }} className="text-red-300 hover:text-red-500 text-xs leading-none">&times;</button>
                </div>
              )}
            </div>
          )
        })}

        <button onClick={() => setWizardOpen(true)} className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors min-h-[72px]">
          <span className="text-sm font-medium">+ Nuova banca</span>
        </button>
      </div>

      {showNewIconPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setShowNewIconPicker(false)}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-4 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Scegli icona</p>
            <div className="flex flex-wrap gap-3 max-h-60 overflow-y-auto">
              {BANK_ICONS.map(ico => (
                <button key={ico} onClick={() => { setNewIcon(ico); setShowNewIconPicker(false) }} className={`p-2 rounded-lg border transition-colors ${newIcon === ico ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-400' : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                  <img src={iconSrc(ico)} alt={ico} className="h-10 w-auto" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showEditIconPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setShowEditIconPicker(false)}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-4 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Scegli icona</p>
            <div className="flex flex-wrap gap-3 max-h-60 overflow-y-auto">
              {BANK_ICONS.map(ico => (
                <button key={ico} onClick={() => { setEditing({ ...editing!, icon: ico }); setShowEditIconPicker(false) }} className={`p-2 rounded-lg border transition-colors ${editing?.icon === ico ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-400' : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                  <img src={iconSrc(ico)} alt={ico} className="h-10 w-auto" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => { if (confirm('Annullare la creazione della banca?')) resetWizard() }}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Nuova Banca</h3>
              <button onClick={resetWizard} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center gap-1 px-6 pt-4 pb-2">
              {['File', 'Data', 'Descrizione', 'Importo', 'Riepilogo'].map((label, i) => (
                <div key={label} className={`flex items-center gap-1 text-xs ${i <= wizStep ? 'text-indigo-600 font-medium' : 'text-slate-300'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i < wizStep ? 'bg-indigo-500 text-white' : i === wizStep ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-300'}`}>
                    {i < wizStep ? '✓' : i + 1}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                  {i < 4 && <span className="text-slate-200 mx-0.5">—</span>}
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

              {/* Step 0: File upload */}
              {wizStep === 0 && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">Carica un file CSV/Excel o incolla il contenuto per riconoscere automaticamente le colonne.</p>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center gap-3">
                    <Upload size={28} className="text-slate-300" />
                    <input
                      ref={wizFileRef}
                      type="file" accept=".csv,.tsv,.xlsx,.xls"
                      className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      onChange={e => handleWizFile(e.target.files?.[0])}
                    />
                    <span className="text-[10px] text-slate-400">oppure</span>
                    <textarea
                      placeholder="Incolla qui il contenuto del file CSV..."
                      value={wizPasted}
                      onChange={e => setWizPasted(e.target.value)}
                      rows={6}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
                    />
                    <button onClick={handleWizPaste} className="text-xs bg-indigo-600 text-white rounded-lg px-4 py-1.5 font-medium hover:bg-indigo-700 transition-colors">
                      Analizza
                    </button>
                  </div>
                </div>
              )}

              {/* Step 1: Date column */}
              {wizStep === 1 && wizHeaders.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Seleziona la colonna che contiene la <strong>data</strong> della transazione.</p>
                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50">
                          {wizHeaders.map(h => (
                            <th key={h} className={`px-2 py-1.5 text-left font-medium ${wizDateCol === h ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600'}`}>
                              <button onClick={() => setWizDateCol(h)} className="w-full text-left">
                                {h}
                                {wizDateCol === h && <span className="ml-1 text-indigo-500">←</span>}
                              </button>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {wizRows.map((row, ri) => (
                          <tr key={ri} className="border-t border-slate-100">
                            {row.map((cell, ci) => (
                              <td key={ci} className={`px-2 py-1 text-slate-700 ${wizHeaders[ci] === wizDateCol ? 'bg-indigo-50/40' : ''}`}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Step 2: Description columns */}
              {wizStep === 2 && wizHeaders.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Seleziona una o più colonne che compongono la <strong>descrizione</strong>. L'ordine di selezione determina il template.</p>
                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50">
                          {wizHeaders.map(h => (
                            <th key={h} className={`px-2 py-1.5 text-left font-medium ${wizDescCols.includes(h) ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600'}`}>
                              <button onClick={() => {
                                setWizDescCols(prev => prev.includes(h) ? prev.filter(c => c !== h) : [...prev, h])
                              }} className="w-full text-left">
                                {wizDescCols.includes(h) ? <span className="text-emerald-600">✓ </span> : <span className="text-slate-300 mr-1">○</span>}
                                {h}
                              </button>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {wizRows.map((row, ri) => (
                          <tr key={ri} className="border-t border-slate-100">
                            {row.map((cell, ci) => (
                              <td key={ci} className={`px-2 py-1 text-slate-700 ${wizDescCols.includes(wizHeaders[ci]) ? 'bg-emerald-50/40' : ''}`}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {wizDescCols.length > 0 && (
                    <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600">
                      Template: <code className="text-indigo-600 font-mono">{wizDescTemplate || '(nessuna)'}</code>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Amount column */}
              {wizStep === 3 && wizHeaders.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Seleziona la colonna che contiene l'<strong>importo</strong> della transazione.</p>
                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50">
                          {wizHeaders.map(h => (
                            <th key={h} className={`px-2 py-1.5 text-left font-medium ${wizAmountCol === h ? 'bg-amber-100 text-amber-700' : 'text-slate-600'}`}>
                              <button onClick={() => setWizAmountCol(h)} className="w-full text-left">
                                {h}
                                {wizAmountCol === h && <span className="ml-1 text-amber-500">←</span>}
                              </button>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {wizRows.map((row, ri) => (
                          <tr key={ri} className="border-t border-slate-100">
                            {row.map((cell, ci) => (
                              <td key={ci} className={`px-2 py-1 text-slate-700 ${wizHeaders[ci] === wizAmountCol ? 'bg-amber-50/40' : ''}`}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {wizStep === 4 && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Conferma i dati della banca e la configurazione CSV.</p>
                  <div className="flex items-center gap-2">
                    <input type="text" placeholder="Nome banca" value={wizName} onChange={e => setWizName(e.target.value)} className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-400" />
                    <input type="color" value={wizColor} onChange={e => setWizColor(e.target.value)} className="w-8 h-8 p-0.5 border border-slate-300 rounded cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" name="wiz-icon-mode" checked={!wizUseIcon} onChange={() => { setWizUseIcon(false); setWizCustomIcon(false) }} className="w-3 h-3" />
                      Label
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" name="wiz-icon-mode" checked={wizUseIcon && !wizCustomIcon} onChange={() => { setWizUseIcon(true); setWizCustomIcon(false) }} className="w-3 h-3" />
                      Icona predefinita
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" name="wiz-icon-mode" checked={wizUseIcon && wizCustomIcon} onChange={() => { setWizUseIcon(true); setWizCustomIcon(true) }} className="w-3 h-3" />
                      Carica SVG
                    </label>
                  </div>
                  {wizUseIcon && !wizCustomIcon ? (
                    <button onClick={() => setShowWizIconPicker(true)} className="flex items-center gap-2 text-xs text-indigo-600 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-3 py-1.5 transition-colors bg-white">
                      {wizIcon ? <img src={iconSrc(wizIcon)} alt="" className="h-6 w-auto" /> : <span className="text-slate-400">?</span>}
                      Scegli icona
                    </button>
                  ) : wizUseIcon && wizCustomIcon ? (
                    <input ref={fileRef} type="file" accept=".svg" className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-white file:text-indigo-700 hover:file:bg-indigo-50 border border-slate-300 rounded-lg cursor-pointer" onChange={e => handleFilePick(e.target.files?.[0], setWizIcon, setWizCustomIcon)} />
                  ) : (
                    <input type="text" placeholder="Label (es. ISP)" maxLength={5} value={wizLabel} onChange={e => setWizLabel(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-400" />
                  )}
                  <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-xs">
                    <p><span className="text-slate-500">Colonna data:</span> <span className="font-mono text-indigo-600">{wizDateCol}</span></p>
                    <p><span className="text-slate-500">Colonna importo:</span> <span className="font-mono text-indigo-600">{wizAmountCol}</span></p>
                    <p><span className="text-slate-500">Template descrizione:</span> <span className="font-mono text-indigo-600">{wizDescTemplate || '(nessuna)'}</span></p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
              <div>
                {wizStep > 0 && (
                  <button onClick={() => setWizStep(s => s - 1)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <ArrowLeft size={14} /> Indietro
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={resetWizard} className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">Annulla</button>
                {wizStep < 4 ? (
                  <button
                    onClick={() => setWizStep(s => s + 1)}
                    disabled={wizStep === 0 ? false : wizStep === 1 ? !wizDateCol : wizStep === 2 ? wizDescCols.length === 0 : wizStep === 3 ? !wizAmountCol : false}
                    className="flex items-center gap-1 text-xs bg-indigo-600 text-white rounded-lg px-4 py-1.5 font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Avanti <ArrowRight size={14} />
                  </button>
                ) : (
                  <button onClick={handleWizSave} disabled={!wizName.trim()} className="text-xs bg-indigo-600 text-white rounded-lg px-4 py-1.5 font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    &#10003; Crea banca
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showWizIconPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setShowWizIconPicker(false)}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-4 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Scegli icona</p>
            <div className="flex flex-wrap gap-3 max-h-60 overflow-y-auto">
              {BANK_ICONS.map(ico => (
                <button key={ico} onClick={() => { setWizIcon(ico); setShowWizIconPicker(false) }} className={`p-2 rounded-lg border transition-colors ${wizIcon === ico ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-400' : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                  <img src={iconSrc(ico)} alt={ico} className="h-10 w-auto" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
