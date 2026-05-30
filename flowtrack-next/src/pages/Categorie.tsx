'use client'

import { useStore } from '@/lib/store'
import { useState } from 'react'
import { DEFAULT_CATEGORIES, ICON_OPTIONS } from '@/lib/defaults'

export default function CategoriePage() {
  const customCategories = useStore(s => s.customCategories)
  const addCustomCategory = useStore(s => s.addCustomCategory)
  const renameCustomCategory = useStore(s => s.renameCustomCategory)
  const deleteCustomCategory = useStore(s => s.deleteCustomCategory)
  const updateCategoryIcon = useStore(s => s.updateCategoryIcon)
  const getAllCategories = useStore(s => s.getAllCategories)
  const showToast = useStore(s => s.showToast)

  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6366f1')
  const [newIcon, setNewIcon] = useState('🛒')
  const [editingIcon, setEditingIcon] = useState<string | null>(null)
  const [showIconPicker, setShowIconPicker] = useState(false)

  const allCategories = getAllCategories()

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

  const handleRename = (oldName: string) => {
    const input = prompt('Nuovo nome:', oldName)
    if (!input || input.trim() === oldName) return
    if (!input.trim()) { showToast('Nome non valido.', 'error'); return }
    if (allCategories.some(c => c.name.toLowerCase() === input.trim().toLowerCase() && c.name !== oldName)) {
      showToast('Categoria già esistente.', 'error'); return
    }
    renameCustomCategory(oldName, input.trim())
    showToast(`Categoria rinominata in "${input.trim()}".`, 'success')
  }

  const handleDelete = (name: string) => {
    if (confirm(`Eliminare la categoria "${name}" e le relative regole?`)) {
      deleteCustomCategory(name)
      showToast(`Categoria "${name}" eliminata.`, 'info')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Categorie</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
        {allCategories.map(cat => {
          const isCustom = customCategories.some(c => c.name === cat.name)
          return (
            <div key={cat.name} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="text-2xl">{cat.icon}</span>
                  {isCustom && (
                    <button onClick={() => setEditingIcon(editingIcon === cat.name ? null : cat.name)} className="absolute -top-1 -right-1 text-[10px] text-indigo-400 hover:text-indigo-600 bg-white rounded-full w-4 h-4 flex items-center justify-center shadow-sm border border-slate-200">&#9998;</button>
                  )}
                </div>
                <div>
                  <span className={`text-sm font-medium text-slate-800 ${isCustom ? 'cursor-pointer hover:text-indigo-600' : ''}`} onClick={() => isCustom && handleRename(cat.name)}>{cat.name}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ background: cat.color }} />
                    <span className="text-[10px] text-slate-400">{cat.color}</span>
                  </div>
                </div>
              </div>
              {isCustom && (
                <button onClick={() => handleDelete(cat.name)} className="text-red-300 hover:text-red-500 text-sm leading-none shrink-0">&times;</button>
              )}
            </div>
          )
        })}

        {showForm ? (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <input type="text" placeholder="Nome categoria" value={newName} onChange={e => setNewName(e.target.value)} className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-400" />
              <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-8 h-8 p-0.5 border border-slate-300 rounded cursor-pointer" />
              <button onClick={handleAdd} className="bg-indigo-600 text-white w-8 h-8 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center justify-center">&#10003;</button>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center text-sm">&#10005;</button>
            </div>
            <button type="button" onClick={() => setShowIconPicker(true)} className="flex items-center gap-2 text-xs text-indigo-600 hover:bg-indigo-100 rounded-lg px-3 py-1.5 transition-colors self-start">
              <span className="text-lg">{newIcon}</span> Cambia icona
            </button>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)} className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors min-h-[72px]">
            <span className="text-sm font-medium">+ Nuova categoria</span>
          </button>
        )}
      </div>

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
