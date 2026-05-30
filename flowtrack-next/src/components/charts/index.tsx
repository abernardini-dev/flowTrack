'use client'

import { useRef, useEffect } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, Filler, LineController, DoughnutController, PieController, BarController, PolarAreaController, RadarController } from 'chart.js'

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement,
  RadialLinearScale, PointElement, LineElement, Filler, LineController,
  DoughnutController, PieController, BarController, PolarAreaController, RadarController,
)

export function ExpensesChart({
  type, labels, data, colors, onLabelClick,
}: {
  type: string
  labels: string[]
  data: number[]
  colors: string[]
  onLabelClick?: (label: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<ChartJS | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    if (chartRef.current) chartRef.current.destroy()
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    const isPie = type === 'doughnut' || type === 'pie'
    chartRef.current = new ChartJS(ctx, {
      type: type as 'doughnut' | 'pie' | 'bar' | 'polarArea' | 'radar',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors, borderWidth: isPie ? 0 : 1, borderColor: '#fff', label: 'Spese' }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (_event, elements) => {
          if (elements.length > 0 && onLabelClick) {
            onLabelClick(labels[elements[0].index])
          }
        },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } },
          tooltip: { callbacks: { label: (ctx) => ' ' + ctx.label + ': \u20AC ' + Number(ctx.parsed).toLocaleString('it-IT') } },
        },
        scales: isPie ? {} : {
          y: { beginAtZero: true, ticks: { callback: (v) => Number.isFinite(v as number) ? '\u20AC ' + Number(v).toLocaleString('it-IT') : '' } },
        },
      },
    })
    return () => { if (chartRef.current) chartRef.current.destroy() }
  }, [type, labels, data, colors, onLabelClick])

  return <canvas ref={canvasRef} />
}

export function BalanceLineChart({
  labels, data,
}: {
  labels: string[]
  data: number[]
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<ChartJS | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    if (chartRef.current) chartRef.current.destroy()
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const suggestedMin = min - range * 0.2
    const suggestedMax = max + range * 0.2
    chartRef.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Saldo',
          data,
          borderColor: '#6366f1',
          backgroundColor: (c) => {
            if (!c.chart.chartArea) return 'transparent'
            const { ctx, chartArea } = c.chart
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
            gradient.addColorStop(0, 'rgba(99,102,241,0.3)')
            gradient.addColorStop(1, 'rgba(99,102,241,0)')
            return gradient
          },
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ' \u20AC ' + Number(ctx.parsed.y).toLocaleString('it-IT'),
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: {
            suggestedMin,
            suggestedMax,
            ticks: { callback: (v) => '\u20AC ' + Number(v).toLocaleString('it-IT'), font: { size: 10 } },
          },
        },
      },
    })
    return () => { if (chartRef.current) chartRef.current.destroy() }
  }, [labels, data])

  return <canvas ref={canvasRef} />
}

export function IncomeExpenseChart({
  type, entries, expenses,
}: {
  type: string
  entries: number
  expenses: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<ChartJS | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    if (chartRef.current) chartRef.current.destroy()
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    const isPie = type === 'doughnut' || type === 'pie'
    chartRef.current = new ChartJS(ctx, {
      type: type as 'doughnut' | 'pie' | 'bar' | 'polarArea' | 'radar',
      data: {
        labels: ['Entrate', 'Uscite'],
        datasets: [{
          data: [entries, expenses],
          backgroundColor: ['#10b981', '#ef4444'],
          borderWidth: isPie ? 0 : 1,
          borderColor: '#fff',
          borderRadius: isPie ? 0 : 6,
          maxBarThickness: isPie ? undefined : 60,
          label: 'Importo',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: isPie ? { position: 'bottom', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } } : { display: false },
          tooltip: { callbacks: { label: (ctx) => ' ' + ctx.label + ': \u20AC ' + Number(ctx.parsed).toLocaleString('it-IT') } },
        },
        scales: isPie ? {} : {
          y: { beginAtZero: true, ticks: { callback: (v) => Number.isFinite(v as number) ? '\u20AC ' + Number(v).toLocaleString('it-IT') : '' } },
        },
      },
    })
    return () => { if (chartRef.current) chartRef.current.destroy() }
  }, [type, entries, expenses])

  return <canvas ref={canvasRef} />
}
