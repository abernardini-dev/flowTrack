'use client'

import { useStore } from '@/lib/store'
import { useState } from 'react'

export default function RegolePage() {
  const customRules = useStore(s => s.customRules)
  const addCustomRule = useStore(s => s.addCustomRule)
  const deleteCustomRule = useStore(s => s.deleteCustomRule)
  const recategorizeAll = useStore(s => s.recategorizeAll)
  const getAllCategories = useStore(s => s.getAllCategories)
  const showToast = useStore(s => s.showToast)

  const [keywords, setKeywords] = useState('')
  const [category, setCategory] = useState('')

  const allCategories = getAllCategories()

  const handleAdd = () => {
    if (!keywords.trim()) { showToast('Inserisci almeno una parola chiave.', 'error'); return }
    if (!category) { showToast('Seleziona una categoria.', 'error'); return }
    const kwList = keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k)
    if (kwList.length === 0) { showToast('Inserisci parole chiave valide.', 'error'); return }
    addCustomRule({ keywords: kwList, category })
    setKeywords('')
    recategorizeAll()
    showToast(`Regola aggiunta: ${kwList.join(', ')} → ${category}`, 'success')
  }

  const handleDelete = (index: number) => {
    deleteCustomRule(index)
    recategorizeAll()
    showToast('Regola eliminata.', 'info')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Regole Personalizzate</h2>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="es. rimborso, reso"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs bg-white outline-none focus:ring-1 focus:ring-indigo-400"
          >
            <option value="">Categoria...</option>
            {allCategories.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
          </select>
          <button onClick={handleAdd} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 w-8 h-8 rounded-lg text-lg font-medium transition-colors flex items-center justify-center">+</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {customRules.length === 0 ? (
          <div className="text-center text-slate-400 py-10 text-xs">Nessuna regola personalizzata.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {customRules.map((rule, i) => {
              const cat = allCategories.find(c => c.name === rule.category)
              return (
                <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-medium text-slate-800">{rule.keywords.join(', ')}</span>
                    <span className="text-slate-400">&rarr;</span>
                    <span>{cat?.icon} {rule.category}</span>
                  </div>
                  <button onClick={() => handleDelete(i)} className="text-red-300 hover:text-red-500 text-sm leading-none opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Regole Built-in</p>
        <div className="text-xs text-slate-500 space-y-1">
          <p>Le regole built-in categorizzano automaticamente le transazioni in base a parole chiave predefinite per ogni categoria.</p>
          <p className="mt-2">Le regole personalizzate hanno la precedenza su quelle built-in.</p>
        </div>
      </div>
    </div>
  )
}
