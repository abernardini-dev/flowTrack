'use client'

import { useStore } from '@/lib/store'
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ICON_OPTIONS } from '@/lib/defaults'
import { Pencil, Trash2, Settings, Plus, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type SortMode = 'spesa' | 'entrate' | 'az'

export default function CategoriePage() {
  const navigate = useNavigate()
  const transactions = useStore(s => s.transactions)
  const customCategories = useStore(s => s.customCategories)
  const addCustomCategory = useStore(s => s.addCustomCategory)
  const renameCustomCategory = useStore(s => s.renameCustomCategory)
  const deleteCustomCategory = useStore(s => s.deleteCustomCategory)
  const updateCategoryIcon = useStore(s => s.updateCategoryIcon)
  const getAllCategories = useStore(s => s.getAllCategories)
  const showToast = useStore(s => s.showToast)

  const [sortMode, setSortMode] = useState<SortMode>('spesa')
  const [editingIcon, setEditingIcon] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6366f1')
  const [newIcon, setNewIcon] = useState('🛒')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const allCategories = getAllCategories()

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
    const cats = [...allCategories]
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
    }
  }, [allCategories, sortMode, categoryStats])

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
    setRenamingId(oldName)
    setRenameValue(oldName)
  }

  const commitRename = () => {
    const oldName = renamingId
    if (!oldName) return
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === oldName) { setRenamingId(null); return }
    if (allCategories.some(c => c.name.toLowerCase() === trimmed.toLowerCase() && c.name !== oldName)) {
      showToast('Categoria già esistente.', 'error'); return
    }
    renameCustomCategory(oldName, trimmed)
    showToast(`Categoria rinominata in "${trimmed}".`, 'success')
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

      <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          {(['spesa', 'entrate', 'az'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                sortMode === mode
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {mode === 'spesa' ? 'Spesa' : mode === 'entrate' ? 'Entrate' : 'A-Z'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedCategories.map(cat => {
          const stats = categoryStats.get(cat.name) ?? { count: 0, total: 0 }
          const isIncome = stats.total >= 0
          return (
            <div key={cat.name} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ background: cat.color }} />
                  {renamingId === cat.name ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') cancelRename() }}
                      onBlur={commitRename}
                      className="text-base font-bold text-slate-800 bg-white border border-indigo-400 rounded-lg px-2 py-0.5 w-3/4 outline-none focus:ring-1 focus:ring-indigo-400"
                      autoFocus
                    />
                  ) : (
                    <span className="text-base font-bold text-slate-800 truncate">{cat.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {renamingId === cat.name ? (
                    <button
                      onClick={commitRename}
                      className="p-1.5 rounded-lg bg-emerald-100 text-emerald-500 hover:bg-emerald-200 transition-colors cursor-pointer"
                    >
                      <Check size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => startRename(cat.name)}
                      className="p-1.5 rounded-lg bg-indigo-100 text-indigo-500 hover:bg-indigo-200 transition-colors cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteTarget(cat.name)}
                    className="p-1.5 rounded-lg bg-red-100 text-red-400 hover:bg-red-200 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center relative">
                <span className="text-5xl">{cat.icon}</span>
                <button
                  onClick={() => navigate('/regole')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Regole di categorizzazione"
                >
                  <Settings size={16} />
                </button>
              </div>

              <div className={`text-xs ${isIncome ? 'text-emerald-600' : ''}`}>
                <span className={isIncome ? 'text-emerald-600' : 'text-slate-500'}>{stats.count} Transazione{stats.count !== 1 ? 'i' : ''}</span>
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
          <span className="text-sm font-medium">+ Nuova categoria</span>
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
    </div>
  )
}
