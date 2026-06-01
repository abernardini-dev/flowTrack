'use client'

import { Link, useLocation } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  FileText,
  Tags,
  Settings,
  BarChart3,
  Landmark,
  Upload,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/registro', label: 'Registro', icon: FileText },
  { href: '/categorie', label: 'Categorie', icon: Tags },
  { href: '/regole', label: 'Regole', icon: Settings },
  { href: '/analisi', label: 'Analisi', icon: BarChart3 },
  { href: '/banche', label: 'Banche', icon: Landmark },
  { href: '/importazione', label: 'Importa', icon: Upload },
]

export function Sidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const pathname = useLocation().pathname
  const transactions = useStore(s => s.transactions)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <>
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen bg-white border-r border-slate-200 flex flex-col shrink-0 transition-[width,transform] duration-300 ${
          open ? 'translate-x-0 w-64' : '-translate-x-full w-0 overflow-hidden'
        }`}
      >
        <div className="flex items-center px-4 h-20 border-b border-slate-200">
          <button onClick={onToggle} className="flex items-center h-full w-full cursor-pointer text-left">
            <img
              src="/new_logo_no_bg.png"
              alt="FlowTrack"
              className="max-h-28 w-auto object-contain"
            />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-3 border-t border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                mounted && transactions.length > 0
                  ? 'bg-emerald-500'
                  : 'bg-slate-300'
              }`}
            />
            {mounted
              ? transactions.length > 0
                ? `${transactions.length} transazioni`
                : 'Nessun dato'
              : 'Nessun dato'}
          </div>
        </div>
      </aside>

      {!open && (
        <button
          onClick={onToggle}
          className="fixed top-3 left-3 z-50 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg shadow-sm px-2.5 py-1.5 text-lg leading-none transition-colors"
        >
          &#9776;
        </button>
      )}
    </>
  )
}
