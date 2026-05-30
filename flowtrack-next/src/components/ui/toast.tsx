'use client'

import { useStore } from '@/lib/store'
import { useEffect } from 'react'

export function Toast() {
  const { toastMessage, toastType, hideToast } = useStore()

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(hideToast, 3500)
      return () => clearTimeout(t)
    }
  }, [toastMessage, hideToast])

  if (!toastMessage) return null

  const colors = {
    success: 'border-emerald-200 text-emerald-700',
    error: 'border-red-200 text-red-700',
    info: 'border-slate-200 text-slate-700',
  }

  const icons = {
    success: '\u2713',
    error: '\u2717',
    info: '\u2139',
  }

  const iconColors = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    info: 'text-slate-400',
  }

  return (
    <div className={`fixed top-4 right-4 z-50 bg-white shadow-lg border rounded-xl px-5 py-3 flex items-center gap-3 text-sm max-w-sm transition-opacity duration-400 ${toastType ? colors[toastType] : ''}`}>
      <span className={`text-lg ${toastType ? iconColors[toastType] : ''}`}>{toastType ? icons[toastType] : ''}</span>
      {toastMessage}
    </div>
  )
}
