'use client'

import { useStore } from '@/lib/store'
import { useState, useRef } from 'react'
import { DEFAULT_BANKS } from '@/lib/defaults'

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

  const allBanks = getAllBanks()

  const handleFilePick = async (file: File | undefined, setIcon: (v: string) => void, setCustom: (v: boolean) => void) => {
    if (!file || !file.type.includes('svg')) {
      showToast('Seleziona un file SVG valido.', 'error'); return
    }
    const dataUrl = await readSVG(file)
    setIcon(dataUrl)
    setCustom(true)
  }

  const handleAdd = () => {
    if (!newName.trim()) { showToast('Inserisci un nome per la banca.', 'error'); return }
    if (allBanks.some(b => b.name.toLowerCase() === newName.trim().toLowerCase())) {
      showToast('Banca già esistente.', 'error'); return
    }
    const bank: Parameters<typeof addCustomBank>[0] = {
      id: 'custom_' + Date.now(),
      name: newName.trim(),
      label: newLabel.trim().toUpperCase() || newName.trim().slice(0, 3).toUpperCase(),
      color: newColor,
    }
    if (newUseIcon && newIcon.trim()) bank.icon = newIcon.trim()
    if (csvDate.trim() && csvAmount.trim()) {
      bank.csvConfig = {
        dateCol: csvDate.trim().toLowerCase(),
        amountType: 'single',
        amountCol: csvAmount.trim().toLowerCase(),
        descTemplate: csvDesc.trim(),
      }
    }
    addCustomBank(bank)
    setNewName('')
    setNewLabel('')
    setNewColor('#6366f1')
    setNewIcon('')
    setNewUseIcon(false)
    setNewCustomIcon(false)
    setCsvDate('')
    setCsvAmount('')
    setCsvDesc('')
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

        {showForm ? (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <input type="text" placeholder="Nome banca" value={newName} onChange={e => setNewName(e.target.value)} className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-400" />
              <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-8 h-8 p-0.5 border border-slate-300 rounded cursor-pointer" />
            </div>
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="radio" name="display-mode" checked={!newUseIcon} onChange={() => { setNewUseIcon(false); setNewCustomIcon(false) }} className="w-3 h-3" />
                Label
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="radio" name="display-mode" checked={newUseIcon && !newCustomIcon} onChange={() => { setNewUseIcon(true); setNewCustomIcon(false) }} className="w-3 h-3" />
                Icona predefinita
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="radio" name="display-mode" checked={newUseIcon && newCustomIcon} onChange={() => { setNewUseIcon(true); setNewCustomIcon(true) }} className="w-3 h-3" />
                Carica SVG
              </label>
            </div>
            {newUseIcon && !newCustomIcon ? (
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowNewIconPicker(true)} className="flex items-center gap-2 text-xs text-indigo-600 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-3 py-1.5 transition-colors bg-white">
                  {newIcon ? <img src={iconSrc(newIcon)} alt="" className="h-6 w-auto" /> : <span className="text-slate-400">?</span>}
                  Scegli icona
                </button>
              </div>
            ) : newUseIcon && newCustomIcon ? (
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file" accept=".svg"
                  className="flex-1 text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-white file:text-indigo-700 hover:file:bg-indigo-50 border border-slate-300 rounded-lg cursor-pointer"
                  onChange={e => handleFilePick(e.target.files?.[0], setNewIcon, setNewCustomIcon)}
                />
                {newIcon && <img src={iconSrc(newIcon)} alt="" className="h-8 w-auto" />}
              </div>
            ) : (
              <input type="text" placeholder="Label (es. ISP)" maxLength={5} value={newLabel} onChange={e => setNewLabel(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-400" />
            )}
            <div className="border-t border-indigo-200 pt-2">
              <p className="text-[10px] text-slate-500 font-medium mb-1">Configurazione CSV</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" placeholder="Colonna data" value={csvDate} onChange={e => setCsvDate(e.target.value)} className="flex-1 min-w-0 border border-slate-300 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-400" />
                <input type="text" placeholder="Colonna importo" value={csvAmount} onChange={e => setCsvAmount(e.target.value)} className="flex-1 min-w-0 border border-slate-300 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-400" />
              </div>
              <input type="text" placeholder="Template descrizione (es. {ColA} - {ColB})" value={csvDesc} onChange={e => setCsvDesc(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-400 mt-1" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="flex-1 bg-indigo-600 text-white rounded-lg text-xs font-medium py-1.5 hover:bg-indigo-700 transition-colors">&#10003; Aggiungi</button>
              <button onClick={() => setShowForm(false)} className="flex-1 text-slate-400 hover:text-slate-600 rounded-lg text-xs py-1.5 transition-colors">&#10005; Annulla</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)} className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors min-h-[72px]">
            <span className="text-sm font-medium">+ Nuova banca</span>
          </button>
        )}
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
    </div>
  )
}
