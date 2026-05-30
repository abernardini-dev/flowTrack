import type { Rule } from '@/types'
import { CATEGORY_RULES } from './defaults'

export function categorize(
  description: string,
  amount: number,
  customRules: Rule[],
): string {
  const lower = description.toLowerCase()
  for (const rule of customRules) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) return rule.category
    }
  }
  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) return rule.category
    }
  }
  if (amount > 0) return 'Stipendio & Entrate'
  return 'Altro'
}
