'use client'

import { useStore } from '@/lib/store'
import { useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ExpensesChart, IncomeExpenseChart, BalanceLineChart } from '@/components/charts'

export default function DashboardPage() {
  const navigate = useNavigate()
  const transactions = useStore(s => s.transactions)
  const chartType = useStore(s => s.chartType)
  const barChartType = useStore(s => s.barChartType)
  const setChartType = useStore(s => s.setChartType)
  const setBarChartType = useStore(s => s.setBarChartType)
  const getAllCategories = useStore(s => s.getAllCategories)
  const setFilterCategory = useStore(s => s.setFilterCategory)
  const navigateToRegistro = useCallback(() => { navigate('/registro') }, [navigate])

  const kpis = useMemo(() => {
    const entries = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
    const expenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
    const bilancio = entries - expenses
    const savingsPct = entries > 0 ? ((entries - expenses) / entries * 100) : 0
    return { entries, expenses, bilancio, savingsPct }
  }, [transactions])

  const expenseByCategory = useMemo(() => {
    const expenses = transactions.filter(t => t.amount < 0)
    const catTotals: Record<string, number> = {}
    expenses.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + Math.abs(t.amount) })
    return catTotals
  }, [transactions])

  const allCategories = getAllCategories()
  const donutLabels = Object.keys(expenseByCategory)
  const donutData = Object.values(expenseByCategory)
  const donutColors = donutLabels.map(l => {
    const found = allCategories.find(c => c.name === l)
    return found ? found.color : '#94a3b8'
  })

  const recentTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7)
  }, [transactions])

  const monthlyBalance = useMemo(() => {
    const byMonth: Record<string, number> = {}
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    for (const tx of sorted) {
      const key = tx.date.slice(0, 7)
      byMonth[key] = (byMonth[key] || 0) + tx.amount
    }
    const months = Object.keys(byMonth).sort()
    let cumulative = 0
    const labels: string[] = []
    const data: number[] = []
    for (const m of months) {
      cumulative += byMonth[m]
      labels.push(m)
      data.push(cumulative)
    }
    return { labels, data }
  }, [transactions])

  const handleCategoryClick = useCallback((label: string) => {
    setFilterCategory(label)
    navigateToRegistro()
  }, [setFilterCategory, navigateToRegistro])

  const KPI_CARDS = [
    { label: 'Bilancio Totale', value: formatCurrency(kpis.bilancio), color: kpis.bilancio >= 0 ? 'text-slate-800' : 'text-red-500' },
    { label: 'Totale Entrate', value: formatCurrency(kpis.entries), color: 'text-emerald-600' },
    { label: 'Totale Uscite', value: formatCurrency(kpis.expenses), color: 'text-red-500' },
    { label: 'Risparmio Netto', value: kpis.savingsPct ? kpis.savingsPct.toFixed(1) + '%' : '--', color: 'text-slate-800' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-800">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map(kpi => (
          <div key={kpi.label} className="kpi-card bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {transactions.length > 0 && monthlyBalance.labels.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-600 mb-2">Andamento Saldo</p>
          <div className="relative h-48">
            <BalanceLineChart labels={monthlyBalance.labels} data={monthlyBalance.data} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-600">Spese per Categoria</p>
            <select
              value={chartType}
              onChange={e => setChartType(e.target.value as never)}
              className="text-xs border border-slate-300 rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
            >
              <option value="doughnut">Ciambella</option>
              <option value="pie">Torta</option>
              <option value="bar">Barre</option>
              <option value="polarArea">Polar</option>
              <option value="radar">Radar</option>
            </select>
          </div>
          <div className="relative h-60">
            {transactions.length > 0 ? (
              <ExpensesChart type={chartType} labels={donutLabels} data={donutData} colors={donutColors} onLabelClick={handleCategoryClick} />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">Nessun dato</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-600">Entrate vs Uscite</p>
            <select
              value={barChartType}
              onChange={e => setBarChartType(e.target.value as never)}
              className="text-xs border border-slate-300 rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
            >
              <option value="bar">Barre</option>
              <option value="doughnut">Ciambella</option>
              <option value="pie">Torta</option>
              <option value="polarArea">Polar</option>
              <option value="radar">Radar</option>
            </select>
          </div>
          <div className="relative h-60">
            {transactions.length > 0 ? (
              <IncomeExpenseChart type={barChartType} entries={kpis.entries} expenses={kpis.expenses} />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">Nessun dato</div>
            )}
          </div>
        </div>
      </div>

      {recentTransactions.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-600 mb-3">Transazioni Recenti</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left py-2 pr-2 font-medium">Data</th>
                  <th className="text-left py-2 pr-2 font-medium">Descrizione</th>
                  <th className="text-left py-2 pr-2 font-medium">Categoria</th>
                  <th className="text-right py-2 font-medium">Importo</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map(tx => (
                  <tr key={tx.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2 pr-2 text-xs text-slate-500 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="py-2 pr-2 text-xs text-slate-700 max-w-[200px] truncate">{tx.description}</td>
                    <td className="py-2 pr-2 text-xs text-slate-500">{tx.category}</td>
                    <td className={`py-2 text-xs font-semibold text-right whitespace-nowrap ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(tx.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
