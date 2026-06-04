import type { Rule } from '@/types'
import { CATEGORY_RULES } from './defaults'

export function categorize(
  description: string,
  amount: number,
  customRules: Rule[],
  builtinOverrides: Record<string, string[]> = {},
): string {
  const lower = description.toLowerCase()
  for (const rule of customRules) {
    const matchType = rule.matchType ?? 'contains'
    for (const kw of rule.keywords) {
      if (matchType === 'equals' ? lower === kw : lower.includes(kw)) return rule.category
    }
  }
  for (const rule of CATEGORY_RULES) {
    const keywords = builtinOverrides[rule.category] ?? rule.keywords
    for (const kw of keywords) {
      if (lower.includes(kw)) return rule.category
    }
  }
  if (amount > 0) return 'Stipendio & Entrate'
  return 'Altro'
}
