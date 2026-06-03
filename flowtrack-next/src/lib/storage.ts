import type { Category, Rule, Bank, Transaction } from '@/types'

const KEYS = {
  customCategories: 'ft_custom_categories',
  customRules: 'ft_custom_rules',
  customBanks: 'ft_custom_banks',
  transactions: 'ft_transactions',
  hiddenDefaultCategories: 'ft_hidden_default_categories',
} as const

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

export function loadCustomCategories(): Category[] {
  return getItem<Category[]>(KEYS.customCategories, [])
}

export function saveCustomCategories(categories: Category[]): void {
  setItem(KEYS.customCategories, categories)
}

export function loadCustomRules(): Rule[] {
  return getItem<Rule[]>(KEYS.customRules, [])
}

export function saveCustomRules(rules: Rule[]): void {
  setItem(KEYS.customRules, rules)
}

export function loadCustomBanks(): Bank[] {
  return getItem<Bank[]>(KEYS.customBanks, [])
}

export function saveCustomBanks(banks: Bank[]): void {
  setItem(KEYS.customBanks, banks)
}

export function loadTransactions(): Transaction[] {
  return getItem<Transaction[]>(KEYS.transactions, [])
}

export function saveTransactions(transactions: Transaction[]): void {
  setItem(KEYS.transactions, transactions)
}

export function loadHiddenDefaultCategories(): string[] {
  return getItem<string[]>(KEYS.hiddenDefaultCategories, [])
}

export function saveHiddenDefaultCategories(names: string[]): void {
  setItem(KEYS.hiddenDefaultCategories, names)
}
