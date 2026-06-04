'use client'

import { useStore } from '@/lib/store'
import { useState, useMemo } from 'react'
import { Plus, Trash2, Pencil, Shield, HelpCircle, X, Check, RotateCcw } from 'lucide-react'
import { CATEGORY_RULES } from '@/lib/defaults'
import { hexToPastel } from '@/lib/utils'

export default function RegolePage() {
  const customRules = useStore(s => s.customRules)
  const addCustomRule = useStore(s => s.addCustomRule)
  const updateCustomRule = useStore(s => s.updateCustomRule)
  const deleteCustomRule = useStore(s => s.deleteCustomRule)
  const updateBuiltinRuleKeywords = useStore(s => s.updateBuiltinRuleKeywords)
  const resetBuiltinRules = useStore(s => s.resetBuiltinRules)
  const builtinRuleOverrides = useStore(s => s.builtinRuleOverrides)
  const recategorizeAll = useStore(s => s.recategorizeAll)
  const getAllCategories = useStore(s => s.getAllCategories)
  const showToast = useStore(s => s.showToast)

  const [keywords, setKeywords] = useState('')
  const [category, setCategory] = useState('')
  const [matchType, setMatchType] = useState<'contains' | 'equals'>('contains')
  const [showHelp, setShowHelp] = useState(false)

  const [editingCustomIdx, setEditingCustomIdx] = useState<number | null>(null)
  const [editCustomKeywords, setEditCustomKeywords] = useState('')
  const [editCustomCategory, setEditCustomCategory] = useState('')
  const [editCustomMatchType, setEditCustomMatchType] = useState<'contains' | 'equals'>('contains')

  const [addingToBuiltinCat, setAddingToBuiltinCat] = useState<string | null>(null)
  const [newKeyword, setNewKeyword] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'keyword'; category: string; keyword: string } | { type: 'rule'; index: number; category: string; keywords: string[] } | null>(null)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [sortRuleKey, setSortRuleKey] = useState<'keywords' | 'matchType' | 'category'>('keywords')
  const [sortRuleDir, setSortRuleDir] = useState<'asc' | 'desc'>('asc')
  const [searchRules, setSearchRules] = useState('')

  const allCategories = getAllCategories()

  const sortedCustomRules = useMemo(() => {
    const indexed = customRules.map((rule, i) => ({ rule, originalIndex: i }))
    indexed.sort((a, b) => {
      let cmp = 0
      if (sortRuleKey === 'keywords') cmp = a.rule.keywords.join(', ').localeCompare(b.rule.keywords.join(', '))
      else if (sortRuleKey === 'matchType') cmp = ((a.rule.matchType ?? 'contains') === 'contains' ? 0 : 1) - ((b.rule.matchType ?? 'contains') === 'contains' ? 0 : 1)
      else if (sortRuleKey === 'category') cmp = a.rule.category.localeCompare(b.rule.category)
      return sortRuleDir === 'asc' ? cmp : -cmp
    })
    return indexed
  }, [customRules, sortRuleKey, sortRuleDir])

  const toggleSort = (key: typeof sortRuleKey) => {
    if (sortRuleKey === key) setSortRuleDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortRuleKey(key); setSortRuleDir('asc') }
  }

  const filteredRules = useMemo(() => {
    if (!searchRules.trim()) return sortedCustomRules
    const q = searchRules.toLowerCase()
    return sortedCustomRules.filter(({ rule }) =>
      rule.keywords.some(k => k.includes(q)) ||
      rule.category.toLowerCase().includes(q) ||
      (rule.matchType ?? 'contains').toLowerCase().includes(q)
    )
  }, [sortedCustomRules, searchRules])

  const getEffectiveBuiltinKeywords = (catName: string) =>
    builtinRuleOverrides[catName] ?? CATEGORY_RULES.find(r => r.category === catName)?.keywords ?? []

  const handleAdd = () => {
    if (!keywords.trim()) { showToast('Inserisci almeno una parola chiave.', 'error'); return }
    if (!category) { showToast('Seleziona una categoria.', 'error'); return }
    const kwList = keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k)
    if (kwList.length === 0) { showToast('Inserisci parole chiave valide.', 'error'); return }
    addCustomRule({ keywords: kwList, category, matchType })
    setKeywords('')
    setMatchType('contains')
    recategorizeAll()
    showToast(`Regola aggiunta: ${kwList.join(', ')} → ${category}`, 'success')
  }

  const startEditCustom = (idx: number) => {
    const rule = customRules[idx]
    setEditingCustomIdx(idx)
    setEditCustomKeywords(rule.keywords.join(', '))
    setEditCustomCategory(rule.category)
    setEditCustomMatchType(rule.matchType ?? 'contains')
  }

  const cancelEditCustom = () => {
    setEditingCustomIdx(null)
  }

  const saveEditCustom = () => {
    if (editingCustomIdx === null) return
    const kwList = editCustomKeywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k)
    if (kwList.length === 0) { showToast('Inserisci almeno una parola chiave.', 'error'); return }
    if (!editCustomCategory) { showToast('Seleziona una categoria.', 'error'); return }
    updateCustomRule(editingCustomIdx, { keywords: kwList, category: editCustomCategory, matchType: editCustomMatchType })
    setEditingCustomIdx(null)
    recategorizeAll()
    showToast('Regola modificata.', 'success')
  }

  const handleDelete = (index: number) => {
    const rule = customRules[index]
    setDeleteConfirm({ type: 'rule', index, category: rule.category, keywords: rule.keywords })
  }

  const confirmDeleteRule = () => {
    if (!deleteConfirm || deleteConfirm.type !== 'rule') return
    deleteCustomRule(deleteConfirm.index)
    if (editingCustomIdx === deleteConfirm.index) setEditingCustomIdx(null)
    setDeleteConfirm(null)
    recategorizeAll()
    showToast('Regola eliminata.', 'info')
  }

  const handleDeleteKeyword = () => {
    if (!deleteConfirm || deleteConfirm.type !== 'keyword') return
    const { category: catName, keyword } = deleteConfirm
    const current = getEffectiveBuiltinKeywords(catName)
    const updated = current.filter(k => k !== keyword)
    if (updated.length === 0) {
      showToast('Deve esserci almeno una parola chiave.', 'error')
      setDeleteConfirm(null)
      return
    }
    updateBuiltinRuleKeywords(catName, updated)
    recategorizeAll()
    setDeleteConfirm(null)
    showToast(`Parola "${keyword}" eliminata da ${catName}`, 'info')
  }

  const startAddKeyword = (catName: string) => {
    setAddingToBuiltinCat(catName)
    setNewKeyword('')
  }

  const confirmAddKeyword = () => {
    if (!addingToBuiltinCat) return
    const kw = newKeyword.trim().toLowerCase()
    if (!kw) { showToast('Inserisci una parola chiave.', 'error'); return }
    const current = getEffectiveBuiltinKeywords(addingToBuiltinCat)
    if (current.includes(kw)) { showToast('Parola gi&agrave; presente.', 'error'); return }
    updateBuiltinRuleKeywords(addingToBuiltinCat, [...current, kw])
    recategorizeAll()
    setAddingToBuiltinCat(null)
    setNewKeyword('')
    showToast(`Parola "${kw}" aggiunta a ${addingToBuiltinCat}`, 'success')
  }

  const handleResetBuiltin = () => {
    setResetConfirm(true)
  }

  const confirmResetBuiltin = () => {
    resetBuiltinRules()
    setAddingToBuiltinCat(null)
    setDeleteConfirm(null)
    setResetConfirm(false)
    recategorizeAll()
    showToast('Regole built-in ripristinate ai valori predefiniti.', 'info')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-800">Gestione Regole</h2>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer"
            title="Come funzionano le regole"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-slate-700 space-y-2 relative">
          <button
            onClick={() => setShowHelp(false)}
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X size={16} />
          </button>
          <p className="font-semibold text-indigo-800">Come funzionano le regole</p>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li><strong>Regole personalizzate</strong>: le crei tu qui sopra, hanno la precedenza su tutto</li>
            <li><strong>Regole built-in</strong>: preconfigurate, puoi modificarle o ripristinarle</li>
            <li>Ogni regola contiene una o pi&ugrave; <strong>parole chiave</strong> (separate da virgola)</li>
            <li><strong>Contenuta</strong>: la descrizione deve contenere la parola chiave</li>
            <li><strong>Uguale</strong>: la descrizione deve coincidere esattamente con la parola chiave</li>
            <li>L&rsquo;ordine conta: la prima corrispondenza viene usata</li>
          </ul>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nuova Regola</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="es. rimborso, reso, bonifico"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 min-w-[160px] border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => setMatchType('contains')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${matchType === 'contains' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Contenuta
            </button>
            <button
              onClick={() => setMatchType('equals')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${matchType === 'equals' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Uguale
            </button>
          </div>
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
            className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus size={16} />
            Aggiungi
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Regole Personalizzate</p>
          {customRules.length > 0 && (
            <input
              type="text"
              placeholder="Cerca nella tabella..."
              value={searchRules}
              onChange={e => setSearchRules(e.target.value)}
              className="max-w-[200px] border border-slate-300 rounded-md px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-400"
            />
          )}
        </div>
        {customRules.length === 0 ? (
          <div className="text-center text-slate-400 py-12 text-sm">
            Nessuna regola personalizzata. Creane una qui sopra.
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ maxHeight: '294px', overflowY: 'auto' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium cursor-pointer hover:text-slate-700 select-none" onClick={() => toggleSort('keywords')}>
                    Parole Chiave {sortRuleKey === 'keywords' ? (sortRuleDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:text-slate-700 select-none" onClick={() => toggleSort('matchType')}>
                    Tipo {sortRuleKey === 'matchType' ? (sortRuleDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:text-slate-700 select-none" onClick={() => toggleSort('category')}>
                    Categoria {sortRuleKey === 'category' ? (sortRuleDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
                  </th>
                  <th className="px-4 py-3 font-medium text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-slate-400 py-6 text-sm">Nessuna regola corrisponde alla ricerca.</td></tr>
                ) : filteredRules.map(({ rule, originalIndex }) => {
                  const cat = allCategories.find(c => c.name === rule.category)
                  const isEditing = editingCustomIdx === originalIndex
                  return (
                    <tr key={originalIndex} className="border-b border-slate-50 hover:bg-slate-50/50">
                      {isEditing ? (
                        <>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={editCustomKeywords}
                              onChange={e => setEditCustomKeywords(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && saveEditCustom()}
                              className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-400"
                              placeholder="parola1, parola2"
                              autoFocus
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-1 bg-slate-100 rounded-md p-0.5 w-fit">
                              <button
                                onClick={() => setEditCustomMatchType('contains')}
                                className={`px-2 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${editCustomMatchType === 'contains' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                              >
                                Cont.
                              </button>
                              <button
                                onClick={() => setEditCustomMatchType('equals')}
                                className={`px-2 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${editCustomMatchType === 'equals' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                              >
                                Ug.
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={editCustomCategory}
                              onChange={e => setEditCustomCategory(e.target.value)}
                              className="border border-slate-300 rounded-md px-2 py-1 text-xs bg-white outline-none focus:ring-1 focus:ring-indigo-400"
                            >
                              {allCategories.map(c => (
                                <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={saveEditCustom}
                                className="p-1.5 rounded-lg bg-green-100 text-green-500 hover:bg-green-200 hover:text-green-700 transition-colors cursor-pointer"
                                title="Salva"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={cancelEditCustom}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
                                title="Annulla"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-1">
                              {rule.keywords.map((kw, j) => (
                                <span key={j} className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-0.5 rounded-md">{kw}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${rule.matchType === 'equals' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                              {rule.matchType === 'equals' ? 'Uguale' : 'Contenuta'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full"
                              style={hexToPastel(cat?.color || '#94a3b8')}
                            >
                              {cat?.icon} {rule.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => startEditCustom(originalIndex)}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
                                title="Modifica"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(originalIndex)}
                                className="p-1.5 rounded-lg bg-red-100 text-red-400 hover:bg-red-200 hover:text-red-600 transition-colors cursor-pointer"
                                title="Elimina"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Regole Built-in</p>
          </div>
          <button
            onClick={handleResetBuiltin}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            Ripristina
          </button>
        </div>
        <p className="text-xs text-slate-400">Le regole personalizzate hanno la precedenza su quelle built-in.</p>
        <div className="grid grid-cols-1 gap-3">
          {CATEGORY_RULES.map((rule, i) => {
            const cat = allCategories.find(c => c.name === rule.category)
            const effectiveKeywords = getEffectiveBuiltinKeywords(rule.category)
            const isOverridden = builtinRuleOverrides[rule.category] !== undefined
            const isAdding = addingToBuiltinCat === rule.category
            return (
              <div key={i} className={`rounded-xl border p-4 ${isOverridden ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-start gap-3">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700 shrink-0 min-w-[160px] pt-0.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat?.color }} />
                    {cat?.icon} {rule.category}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 flex-1">
                    {effectiveKeywords.map((kw, j) => (
                      <span key={j} className="group relative inline-flex items-center text-xs px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-500">
                        {kw}
                        <button
                          onClick={() => setDeleteConfirm({ type: 'keyword', category: rule.category, keyword: kw })}
                          className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-all bg-red-400 hover:bg-red-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center shadow-sm cursor-pointer"
                        >
                          <X size={8} />
                        </button>
                      </span>
                    ))}
                    {isAdding ? (
                      <span className="inline-flex items-center gap-1">
                        <input
                          type="text"
                          value={newKeyword}
                          onChange={e => setNewKeyword(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') confirmAddKeyword(); if (e.key === 'Escape') setAddingToBuiltinCat(null) }}
                          className="w-28 border border-slate-300 rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-400"
                          placeholder="nuova parola"
                          autoFocus
                        />
                        <button
                          onClick={confirmAddKeyword}
                          className="p-1 rounded bg-green-100 text-green-500 hover:bg-green-200 transition-colors cursor-pointer"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => setAddingToBuiltinCat(null)}
                          className="p-1 rounded bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => startAddKeyword(rule.category)}
                        className="inline-flex items-center gap-0.5 text-xs px-2 py-1 rounded-md border border-dashed border-slate-300 text-slate-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Aggiungi parola chiave"
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {(deleteConfirm || resetConfirm) && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => { setDeleteConfirm(null); setResetConfirm(false) }}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            {deleteConfirm?.type === 'keyword' ? (
              <>
                <p className="font-semibold text-slate-800">Conferma eliminazione</p>
                <p className="text-sm text-slate-600">
                  Eliminare la parola chiave <strong>&ldquo;{deleteConfirm.keyword}&rdquo;</strong> dalla regola <strong>{deleteConfirm.category}</strong>?
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleDeleteKeyword}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
                  >
                    Elimina
                  </button>
                </div>
              </>
            ) : deleteConfirm?.type === 'rule' ? (
              <>
                <p className="font-semibold text-slate-800">Conferma eliminazione</p>
                <p className="text-sm text-slate-600">
                  Eliminare la regola per <strong>{deleteConfirm.category}</strong> con le parole <strong>{deleteConfirm.keywords.join(', ')}</strong>?
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={confirmDeleteRule}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
                  >
                    Elimina
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="font-semibold text-slate-800">Conferma ripristino</p>
                <p className="text-sm text-slate-600">
                  Ripristinare tutte le regole built-in ai valori predefiniti? Le eventuali modifiche verranno perse.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setResetConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={confirmResetBuiltin}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors cursor-pointer"
                  >
                    Ripristina
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
