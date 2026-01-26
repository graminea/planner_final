'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Home } from 'lucide-react'
import Image from 'next/image'

export function DashboardHeader() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const isFigueira = mounted && theme === 'figueira'

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 relative overflow-hidden">
        {isFigueira ? (
          <Image 
            src="/figueirense/logo.svg" 
            alt="Figueirense" 
            fill
            className="text-primary object-contain p-1"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon')
              if (fallback) fallback.classList.remove('hidden')
            }}
          />
        ) : null}
        <Home className={`w-4 h-4 text-primary fallback-icon ${isFigueira ? 'hidden' : ''}`} />
      </div>
      <div>
        <h1 className="text-lg font-semibold">Planejador de Casa</h1>
      </div>
    </div>
  )
}
