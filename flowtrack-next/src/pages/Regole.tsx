'use client'

import { useStore } from '@/lib/store'
import { useState } from 'react'
import { Plus, Trash2, ArrowRight, Shield } from 'lucide-react'
import { CATEGORY_RULES } from '@/lib/defaults'

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
        <h2 className="text-lg font-bold text-slate-800">Gestione Regole</h2>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nuova Regola</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="es. rimborso, reso, bonifico"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-1 focus:ring-indigo-400"
          >
            <option value="">Categoria...</option>
            {allCategories.map(c => (
              <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus size={16} />
            Aggiungi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {customRules.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm text-center text-slate-400 py-12 text-sm">
            Nessuna regola personalizzata. Creane una qui sopra.
          </div>
        ) : (
          customRules.map((rule, i) => {
            const cat = allCategories.find(c => c.name === rule.category)
            return (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {rule.keywords.map((kw, j) => (
                      <span key={j} className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-1 rounded-md">{kw}</span>
                    ))}
                  </div>
                  <ArrowRight size={14} className="text-slate-400 shrink-0" />
                  <span className="flex items-center gap-1.5 text-sm font-medium text-slate-800 shrink-0">
                    {cat && <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />}
                    {cat?.icon} {rule.category}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(i)}
                  className="p-1.5 rounded-lg bg-red-100 text-red-400 hover:bg-red-200 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-slate-400" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Regole Built-in</p>
        </div>
        <p className="text-xs text-slate-400">Le regole personalizzate hanno la precedenza su quelle built-in.</p>
        <div className="grid grid-cols-1 gap-3">
          {CATEGORY_RULES.map((rule, i) => {
            const cat = allCategories.find(c => c.name === rule.category)
            return (
              <div key={i} className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700 shrink-0 min-w-[160px]">
                  {cat && <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />}
                  {cat?.icon} {rule.category}
                </span>
                <ArrowRight size={14} className="text-slate-300 shrink-0" />
                <div className="flex flex-wrap items-center gap-1.5">
                  {rule.keywords.map((kw, j) => (
                    <span key={j} className="bg-white text-slate-500 text-xs px-2 py-1 rounded-md border border-slate-200">{kw}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
