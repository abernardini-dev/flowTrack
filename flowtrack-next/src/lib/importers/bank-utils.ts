import type { Bank } from '@/types'
import { DEFAULT_BANKS } from '../defaults'
import { loadCustomBanks } from '../storage'

export function getAllBanks(): Bank[] {
  return [...DEFAULT_BANKS, ...loadCustomBanks()]
}

export function getBankStyle(bankName: string): { label: string; color: string; icon?: string } {
  const all = getAllBanks()
  const b = all.find(x => x.name === bankName) || all.find(x => x.id === bankName)
  if (!b) return { label: bankName.slice(0, 3).toUpperCase(), color: '#94a3b8' }
  return { label: b.label || bankName.slice(0, 3).toUpperCase(), color: b.color || '#94a3b8', icon: b.icon }
}
