'use client'

import { useStore } from '@/lib/store'
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_CATEGORIES, ICON_OPTIONS } from '@/lib/defaults'
import { Pencil, Trash2, Settings, Plus, Check, X, RotateCcw, MoreVertical } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type SortMode = 'spesa' | 'entrate' | 'az' | 'colore'

export default function CategoriePage() {
  const navigate = useNavigate()
  const transactions = useStore(s => s.transactions)
  const customCategories = useStore(s => s.customCategories)
  const addCustomCategory = useStore(s => s.addCustomCategory)
  const renameCustomCategory = useStore(s => s.renameCustomCategory)
  const deleteCustomCategory = useStore(s => s.deleteCustomCategory)
  const updateCategoryIcon = useStore(s => s.updateCategoryIcon)
  const updateCategoryColor = useStore(s => s.updateCategoryColor)
  const resetDefaultCategories = useStore(s => s.resetDefaultCategories)
  const getAllCategories = useStore(s => s.getAllCategories)
  const showToast = useStore(s => s.showToast)

  const [sortMode, setSortMode] = useState<SortMode>('spesa')
  const [showCustomOnly, setShowCustomOnly] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const [editingIcon, setEditingIcon] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6366f1')
  const [newIcon, setNewIcon] = useState('🛒')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [editColor, setEditColor] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [menuTarget, setMenuTarget] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [resetCatsConfirm, setResetCatsConfirm] = useState(false)

  const allCategories = getAllCategories()
  const defaultNames = new Set(DEFAULT_CATEGORIES.map(c => c.name))
  const customNames = new Set(customCategories.map(c => c.name))

  const isBaseCategory = (name: string) => (defaultNames.has(name) && !customNames.has(name)) || allCategories.find(c => c.name === name)?.originDefault

  const PRESET_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#78716c',
    '#64748b', '#1e293b',
  ]

  const categoryStats = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>()
    for (const cat of allCategories) {
      map.set(cat.name, { count: 0, total: 0 })
    }
    for (const tx of transactions) {
      const stats = map.get(tx.category)
      if (stats) {
        stats.count++
        stats.total += tx.amount
      }
    }
    return map
  }, [transactions, allCategories])

  const sortedCategories = useMemo(() => {
    let cats = [...allCategories]
    if (showCustomOnly) cats = cats.filter(c => !isBaseCategory(c.name))
    switch (sortMode) {
      case 'spesa':
        return cats.sort((a, b) => {
          const aTotal = categoryStats.get(a.name)?.total ?? 0
          const bTotal = categoryStats.get(b.name)?.total ?? 0
          return aTotal - bTotal
        })
      case 'entrate':
        return cats.sort((a, b) => {
          const aTotal = categoryStats.get(a.name)?.total ?? 0
          const bTotal = categoryStats.get(b.name)?.total ?? 0
          return bTotal - aTotal
        })
      case 'az':
        return cats.sort((a, b) => a.name.localeCompare(b.name))
      case 'colore':
        return cats.sort((a, b) => {
          const hue = (hex: string) => {
            const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
            if (!m) return 0
            const r = parseInt(m[1], 16) / 255, g = parseInt(m[2], 16) / 255, b = parseInt(m[3], 16) / 255
            const max = Math.max(r, g, b), min = Math.min(r, g, b)
            if (max === min) return 0
            let h = 0
            if (max === r) h = 60 * ((g - b) / (max - min) + (g < b ? 6 : 0))
            else if (max === g) h = 60 * ((b - r) / (max - min) + 2)
            else h = 60 * ((r - g) / (max - min) + 4)
            return h
          }
          return hue(a.color) - hue(b.color)
        })
    }
  }, [allCategories, showCustomOnly, sortMode, categoryStats])

  const handleAdd = () => {
    if (!newName.trim()) { showToast('Inserisci un nome per la categoria.', 'error'); return }
    if (allCategories.some(c => c.name.toLowerCase() === newName.trim().toLowerCase())) {
      showToast('Categoria già esistente.', 'error'); return
    }
    addCustomCategory({ name: newName.trim(), color: newColor, icon: newIcon })
    setNewName('')
    setNewColor('#6366f1')
    setNewIcon('🛒')
    setShowForm(false)
    showToast('Categoria aggiunta.', 'success')
  }

  const startRename = (oldName: string) => {
    const cat = allCategories.find(c => c.name === oldName)
    setRenamingId(oldName)
    setRenameValue(oldName)
    setEditColor(cat?.color || '#6366f1')
  }

  const commitRename = () => {
    const oldName = renamingId
    if (!oldName) return
    const trimmed = renameValue.trim()
    const cat = allCategories.find(c => c.name === oldName)
    if (!trimmed || (trimmed === oldName && cat?.color === editColor)) { setRenamingId(null); return }
    if (trimmed !== oldName) {
      if (allCategories.some(c => c.name.toLowerCase() === trimmed.toLowerCase() && c.name !== oldName)) {
        showToast('Categoria già esistente.', 'error'); return
      }
      renameCustomCategory(oldName, trimmed)
      showToast(`Categoria rinominata in "${trimmed}".`, 'success')
    }
    if (cat && cat.color !== editColor) {
      const newName = trimmed !== oldName ? trimmed : oldName
      updateCategoryColor(newName, editColor)
      if (trimmed === oldName) showToast('Colore aggiornato.', 'success')
    }
    setRenamingId(null)
  }

  const cancelRename = () => setRenamingId(null)

  const handleDelete = (name: string) => {
    deleteCustomCategory(name)
    showToast(`Categoria "${name}" eliminata.`, 'info')
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Gestione Categorie</h2>
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          {(['spesa', 'entrate', 'az', 'colore'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                sortMode === mode
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {mode === 'spesa' ? 'Spesa' : mode === 'entrate' ? 'Entrate' : mode === 'az' ? 'A-Z' : 'Colore'}
            </button>
          ))}
          <span className="w-px h-5 bg-slate-200 mx-1.5" />
          <button
            onClick={() => setShowCustomOnly(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              showCustomOnly
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              showCustomOnly ? 'border-white bg-white' : 'border-slate-300 bg-white'
            }`}>
              {showCustomOnly && <span className="w-2 h-2 rounded-sm bg-indigo-500" />}
            </span>
            Solo create
          </button>
          <button
            onClick={() => setShowLabels(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              showLabels
                ? 'bg-slate-200 text-slate-700'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              showLabels ? 'border-slate-500 bg-slate-500' : 'border-slate-300 bg-white'
            }`}>
              {showLabels && <span className="w-2 h-2 rounded-sm bg-white" />}
            </span>
            Etichette
          </button>
        </div>
        <button
          onClick={() => setResetCatsConfirm(true)}
          className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
        >
          <RotateCcw size={14} />
          Ripristina
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedCategories.map(cat => {
          const stats = categoryStats.get(cat.name) ?? { count: 0, total: 0 }
          const isIncome = stats.total >= 0
          return (
            <div key={cat.name} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {renamingId === cat.name ? (
                      <div className="relative shrink-0">
                        <button
                          onClick={() => setShowColorPicker(v => !v)}
                          className="w-7 h-7 p-0.5 border border-slate-300 rounded cursor-pointer"
                          style={{ background: editColor }}
                        />
                        {showColorPicker && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)} />
                            <div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg p-2.5 z-50 w-52">
                              <div className="grid grid-cols-5 gap-1.5">
                                {PRESET_COLORS.map(c => (
                                  <button
                                    key={c}
                                    onClick={() => { setEditColor(c); setShowColorPicker(false) }}
                                    className="w-7 h-7 rounded-lg border border-slate-200 hover:scale-110 transition-transform"
                                    style={{ background: c }}
                                  />
                                ))}
                              </div>
                              <div className="border-t border-slate-100 mt-2 pt-2">
                                <button
                                onClick={async () => {
                                  setShowColorPicker(false)
                                  if ('EyeDropper' in window) {
                                    const eyeDropper = new (window as any).EyeDropper()
                                    try {
                                      const result = await eyeDropper.open()
                                      setEditColor(result.sRGBHex)
                                    } catch {}
                                  }
                                }}
                                  className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                <span className="text-base">💉</span>
                                Contagocce
                              </button>
                            </div>
                          </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ background: cat.color }} />
                    )}
                    {renamingId === cat.name ? (
                      <input
                        type="text"
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') cancelRename() }}
                        className="text-base font-bold text-slate-800 bg-white border border-indigo-400 rounded-lg px-2 py-0.5 w-3/4 outline-none focus:ring-1 focus:ring-indigo-400"
                        autoFocus
                      />
                    ) : (
                      <span className="text-base font-bold text-slate-800 truncate">{cat.name}</span>
                    )}
                    {renamingId !== cat.name && showLabels && (
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${isBaseCategory(cat.name) ? 'text-slate-400 bg-slate-100' : 'text-indigo-500 bg-indigo-50'}`}>
                        {isBaseCategory(cat.name) ? 'Base' : 'Creata'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {renamingId === cat.name ? (
                      <>
                        <button
                          onClick={commitRename}
                          className="p-1.5 rounded-lg bg-emerald-100 text-emerald-500 hover:bg-emerald-200 transition-colors cursor-pointer"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={cancelRename}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <div className="relative">
                        <button
                          onClick={() => setMenuTarget(menuTarget === cat.name ? null : cat.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {menuTarget === cat.name && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setMenuTarget(null)} />
                            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 w-40">
                              <button
                                onClick={() => { startRename(cat.name); setMenuTarget(null) }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <Pencil size={14} className="text-slate-400" />
                                Modifica
                              </button>
                              <button
                                onClick={() => { navigate('/regole'); setMenuTarget(null) }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <Settings size={14} className="text-slate-400" />
                                Regole
                              </button>
                              <div className="border-t border-slate-100 my-1" />
                              <button
                                onClick={() => { setDeleteTarget(cat.name); setMenuTarget(null) }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={14} />
                                Elimina
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              <div className="flex items-center justify-center">
                {renamingId === cat.name ? (
                  <button onClick={() => setEditingIcon(cat.name)} className="text-5xl cursor-pointer hover:opacity-80 transition-opacity" title="Cambia icona">
                    {cat.icon}
                  </button>
                ) : (
                  <span className="text-5xl">{cat.icon}</span>
                )}
              </div>

              <div className={`text-xs ${isIncome ? 'text-emerald-600' : ''}`}>
                <span className={isIncome ? 'text-emerald-600' : 'text-slate-500'}>{stats.count} {stats.count === 1 ? 'Transazione' : 'Transazioni'}</span>
                <span className={isIncome ? 'text-emerald-600' : 'text-slate-400'}> / </span>
                <span className={isIncome ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>{formatCurrency(stats.total)}</span>
              </div>
            </div>
          )
        })}

        <button
          onClick={() => setShowForm(true)}
          className="border-2 border-dashed border-slate-300 rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors h-full"
        >
          <Plus size={28} />
          <span className="text-sm font-medium">Nuova categoria</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-5 max-w-sm w-full mx-4 space-y-4" onClick={e => e.stopPropagation()}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nuova Categoria</p>
            <input type="text" placeholder="Nome categoria" value={newName} onChange={e => setNewName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-400" />
            <div className="flex items-center gap-3">
              <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-10 h-10 p-0.5 border border-slate-300 rounded cursor-pointer" />
              <button type="button" onClick={() => setShowIconPicker(true)} className="flex items-center gap-2 text-sm text-indigo-600 hover:bg-indigo-100 rounded-lg px-3 py-2 transition-colors">
                <span className="text-xl">{newIcon}</span> Cambia icona
              </button>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Annulla</button>
              <button onClick={handleAdd} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Aggiungi</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 max-w-sm w-full mx-4 text-center space-y-4" onClick={e => e.stopPropagation()}>
            <p className="text-sm text-slate-700">Eliminare la categoria <span className="font-semibold text-slate-900">&ldquo;{deleteTarget}&rdquo;</span> e le relative regole?</p>
            <div className="flex items-center gap-2 justify-center">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Annulla</button>
              <button onClick={() => handleDelete(deleteTarget)} className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Elimina</button>
            </div>
          </div>
        </div>
      )}

      {editingIcon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setEditingIcon(null)}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-4 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Scegli icona per {editingIcon}</p>
            <div className="flex flex-wrap gap-0.5 max-h-60 overflow-y-auto">
              {ICON_OPTIONS.map(icon => (
                <span key={icon} onClick={() => { updateCategoryIcon(editingIcon, icon); setEditingIcon(null); showToast('Icona aggiornata.', 'success') }} className="w-8 h-8 flex items-center justify-center text-base rounded cursor-pointer hover:bg-indigo-100">{icon}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {showIconPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setShowIconPicker(false)}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-4 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Scegli icona</p>
            <div className="flex flex-wrap gap-0.5 max-h-60 overflow-y-auto">
              {ICON_OPTIONS.map(icon => (
                <span key={icon} onClick={() => { setNewIcon(icon); setShowIconPicker(false) }} className={`w-8 h-8 flex items-center justify-center text-base rounded cursor-pointer hover:bg-indigo-100 ${icon === newIcon ? 'ring-2 ring-indigo-400 bg-indigo-50' : ''}`}>{icon}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {resetCatsConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setResetCatsConfirm(false)}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 max-w-sm w-full mx-4 text-center space-y-4" onClick={e => e.stopPropagation()}>
            <p className="font-semibold text-slate-800">Conferma ripristino</p>
            <p className="text-sm text-slate-600">
              Ripristinare tutte le categorie di default? Le modifiche a colore e icona delle categorie predefinite verranno perse. Le categorie personalizzate (con nome diverso) rimarranno.
            </p>
            <div className="flex items-center gap-2 justify-center">
              <button onClick={() => setResetCatsConfirm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">Annulla</button>
              <button onClick={() => { resetDefaultCategories(); setResetCatsConfirm(false); showToast('Categorie di default ripristinate.', 'info') }} className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors cursor-pointer">Ripristina</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
