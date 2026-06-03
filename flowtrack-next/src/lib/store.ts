'use client'

import { create } from 'zustand'
import type { Transaction, Category, Rule, Bank, SplitPart, ChartStyle, SortColumn, SortDirection } from '@/types'
import { DEFAULT_CATEGORIES } from './defaults'
import { loadCustomCategories, saveCustomCategories, loadCustomRules, saveCustomRules, loadCustomBanks, saveCustomBanks, loadTransactions, saveTransactions, loadHiddenDefaultCategories, saveHiddenDefaultCategories } from './storage'
import { getAllBanks as getAllBanksUtil } from './importers/bank-utils'
import { categorize } from './categorizer'

export interface AppState {
  transactions: Transaction[]
  customCategories: Category[]
  customRules: Rule[]
  customBanks: Bank[]
  chartType: ChartStyle
  barChartType: ChartStyle
  sortColumn: SortColumn
  sortDirection: SortDirection
  pageSize: number
  currentPage: number
  editingId: string | null
  splittingId: string | null
  splitParts: SplitPart[]
  editAllMode: boolean
  savedPageSize: number
  selectedIds: Set<string>
  searchQuery: string
  filterBank: string
  filterCategory: string
  filterType: string
  filterYear: string
  filterMonth: string
  toastMessage: string | null
  toastType: 'success' | 'error' | 'info' | null
  hiddenDefaultCategories: string[]

  getAllCategories: () => Category[]
  getAllBanks: () => Bank[]
  addTransactions: (txs: Transaction[]) => void
  addTransaction: (tx: Transaction) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  deleteSelectedTransactions: () => void
  addCustomCategory: (cat: Category) => void
  renameCustomCategory: (oldName: string, newName: string) => void
  deleteCustomCategory: (name: string) => void
  updateCategoryIcon: (name: string, icon: string) => void
  addCustomRule: (rule: Rule) => void
  deleteCustomRule: (index: number) => void
  addCustomBank: (bank: Bank) => void
  updateCustomBank: (index: number, bank: Partial<Bank>) => void
  deleteCustomBank: (index: number) => void
  recategorizeAll: () => void
  persistTransactions: () => void
  setChartType: (t: ChartStyle) => void
  setBarChartType: (t: ChartStyle) => void
  setSortColumn: (col: SortColumn) => void
  setSortDirection: (dir: SortDirection) => void
  setPageSize: (size: number) => void
  setCurrentPage: (page: number) => void
  setEditingId: (id: string | null) => void
  setSplittingId: (id: string | null) => void
  setSplitParts: (parts: SplitPart[]) => void
  setEditAllMode: (mode: boolean) => void
  toggleSelectedId: (id: string) => void
  clearSelectedIds: () => void
  setSearchQuery: (q: string) => void
  setFilterBank: (v: string) => void
  setFilterCategory: (v: string) => void
  setFilterType: (v: string) => void
  setFilterYear: (v: string) => void
  setFilterMonth: (v: string) => void
  resetFilters: () => void
  resetAllData: () => void
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
  hideToast: () => void
  hideDefaultCategory: (name: string) => void
}

export const useStore = create<AppState>((set, get) => ({
  transactions: loadTransactions(),
  customCategories: loadCustomCategories(),
  customRules: loadCustomRules(),
  customBanks: loadCustomBanks(),
  chartType: 'doughnut',
  barChartType: 'bar',
  sortColumn: 'date',
  sortDirection: 'desc',
  pageSize: 25,
  currentPage: 1,
  editingId: null,
  splittingId: null,
  splitParts: [],
  editAllMode: false,
  savedPageSize: 25,
  selectedIds: new Set<string>(),
  searchQuery: '',
  filterBank: '',
  filterCategory: '',
  filterType: '',
  filterYear: '',
  filterMonth: '',
  toastMessage: null,
  toastType: null,
  hiddenDefaultCategories: loadHiddenDefaultCategories(),

  getAllCategories: () => [...DEFAULT_CATEGORIES.filter(c => !get().hiddenDefaultCategories.includes(c.name)), ...get().customCategories],
  getAllBanks: () => getAllBanksUtil(),

  addTransactions: (txs) => {
    set(s => {
      const updated = [...s.transactions, ...txs]
      saveTransactions(updated)
      return { transactions: updated }
    })
  },

  addTransaction: (tx) => {
    set(s => {
      const updated = [...s.transactions, tx]
      saveTransactions(updated)
      return { transactions: updated }
    })
  },

  updateTransaction: (id, updates) => {
    set(s => {
      const updated = s.transactions.map(t => t.id === id ? { ...t, ...updates } : t)
      saveTransactions(updated)
      return { transactions: updated }
    })
  },

  deleteTransaction: (id) => {
    set(s => {
      const updated = s.transactions.filter(t => t.id !== id)
      saveTransactions(updated)
      return { transactions: updated }
    })
  },

  deleteSelectedTransactions: () => {
    set(s => {
      const updated = s.transactions.filter(t => !s.selectedIds.has(t.id))
      saveTransactions(updated)
      return { transactions: updated, selectedIds: new Set() }
    })
  },

  addCustomCategory: (cat) => {
    set(s => {
      const updated = [...s.customCategories, cat]
      saveCustomCategories(updated)
      return { customCategories: updated }
    })
  },

  renameCustomCategory: (oldName, newName) => {
    set(s => {
      const isDefault = DEFAULT_CATEGORIES.some(c => c.name === oldName)
      let cats = s.customCategories.map(c => c.name === oldName ? { ...c, name: newName } : c)
      let hidden = s.hiddenDefaultCategories
      if (isDefault) {
        const def = DEFAULT_CATEGORIES.find(c => c.name === oldName)!
        cats = [...cats, { name: newName, color: def.color, icon: def.icon }]
        hidden = [...hidden, oldName]
      }
      const rules = s.customRules.map(r => r.category === oldName ? { ...r, category: newName } : r)
      const txs = s.transactions.map(t => t.category === oldName ? { ...t, category: newName } : t)
      saveCustomCategories(cats)
      saveCustomRules(rules)
      saveTransactions(txs)
      saveHiddenDefaultCategories(hidden)
      return { customCategories: cats, customRules: rules, transactions: txs, hiddenDefaultCategories: hidden }
    })
  },

  deleteCustomCategory: (name) => {
    set(s => {
      const isDefault = DEFAULT_CATEGORIES.some(c => c.name === name)
      let cats = s.customCategories.filter(c => c.name !== name)
      let hidden = s.hiddenDefaultCategories
      if (isDefault) {
        hidden = [...hidden, name]
      }
      const rules = s.customRules.filter(r => r.category !== name)
      const txs = s.transactions.map(t => t.category === name ? { ...t, category: 'Altro' } : t)
      saveCustomCategories(cats)
      saveCustomRules(rules)
      saveTransactions(txs)
      saveHiddenDefaultCategories(hidden)
      return { customCategories: cats, customRules: rules, transactions: txs, hiddenDefaultCategories: hidden }
    })
  },

  updateCategoryIcon: (name, icon) => {
    set(s => {
      const cats = s.customCategories.map(c => c.name === name ? { ...c, icon } : c)
      saveCustomCategories(cats)
      return { customCategories: cats }
    })
  },

  addCustomRule: (rule) => {
    set(s => {
      const updated = [...s.customRules, rule]
      saveCustomRules(updated)
      return { customRules: updated }
    })
  },

  deleteCustomRule: (index) => {
    set(s => {
      const updated = s.customRules.filter((_, i) => i !== index)
      saveCustomRules(updated)
      return { customRules: updated }
    })
  },

  addCustomBank: (bank) => {
    set(s => {
      const updated = [...s.customBanks, bank]
      saveCustomBanks(updated)
      return { customBanks: updated }
    })
  },

  updateCustomBank: (index, bankUpdates) => {
    set(s => {
      const updated = s.customBanks.map((b, i) => i === index ? { ...b, ...bankUpdates } : b)
      saveCustomBanks(updated)
      return { customBanks: updated }
    })
  },

  deleteCustomBank: (index) => {
    set(s => {
      const updated = s.customBanks.filter((_, i) => i !== index)
      saveCustomBanks(updated)
      return { customBanks: updated }
    })
  },

  recategorizeAll: () => {
    const { transactions, customRules } = get()
    const updated = transactions.map(t => ({
      ...t,
      category: categorize(t.description, t.amount, customRules),
    }))
    saveTransactions(updated)
    set({ transactions: updated })
  },

  persistTransactions: () => {
    saveTransactions(get().transactions)
  },

  setChartType: (t) => set({ chartType: t }),
  setBarChartType: (t) => set({ barChartType: t }),
  setSortColumn: (col) => set({ sortColumn: col }),
  setSortDirection: (dir) => set({ sortDirection: dir }),
  setPageSize: (size) => set({ pageSize: size }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setEditingId: (id) => set({ editingId: id }),
  setSplittingId: (id) => set({ splittingId: id }),
  setSplitParts: (parts) => set({ splitParts: parts }),
  setEditAllMode: (mode) => set({ editAllMode: mode }),

  toggleSelectedId: (id) => {
    set(s => {
      const next = new Set(s.selectedIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selectedIds: next }
    })
  },

  clearSelectedIds: () => set({ selectedIds: new Set() }),

  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterBank: (v) => set({ filterBank: v }),
  setFilterCategory: (v) => set({ filterCategory: v }),
  setFilterType: (v) => set({ filterType: v }),
  setFilterYear: (v) => set({ filterYear: v }),
  setFilterMonth: (v) => set({ filterMonth: v }),

  resetFilters: () => set({
    searchQuery: '', filterBank: '', filterCategory: '', filterType: '', filterYear: '', filterMonth: '', currentPage: 1,
  }),

  resetAllData: () => {
    saveTransactions([])
    set({ transactions: [], selectedIds: new Set() })
  },

  showToast: (msg, type) => set({ toastMessage: msg, toastType: type }),
  hideToast: () => set({ toastMessage: null, toastType: null }),

  hideDefaultCategory: (name) => {
    set(s => {
      const hidden = [...s.hiddenDefaultCategories, name]
      saveHiddenDefaultCategories(hidden)
      return { hiddenDefaultCategories: hidden }
    })
  },
}))
