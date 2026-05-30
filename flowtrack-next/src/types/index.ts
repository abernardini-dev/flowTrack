export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  bank: string
  category: string
}

export interface Category {
  name: string
  color: string
  icon: string
}

export interface CsvConfig {
  dateCol: string
  amountType: 'single' | 'dare-avere'
  amountCol?: string
  dareCol?: string
  avereCol?: string
  descTemplate: string
  dateFormat?: string
  useFee?: boolean
}

export interface Bank {
  id: string
  name: string
  label: string
  color: string
  icon?: string
  csvConfig?: CsvConfig
}

export interface Rule {
  keywords: string[]
  category: string
}

export interface SplitPart {
  date: string
  bank: string
  description: string
  amount: number
  category: string
}

export type ChartStyle = 'doughnut' | 'pie' | 'bar' | 'polarArea' | 'radar'

export type SortColumn = 'date' | 'bank' | 'description' | 'category' | 'amount'
export type SortDirection = 'asc' | 'desc'
