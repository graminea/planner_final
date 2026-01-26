'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import Image from 'next/image'

/**
 * FigueiraWatermark - Subtle background watermark when Figueira theme is active
 */
export function FigueiraWatermark() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || theme !== 'figueira') return null

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {/* Mobile: Single centered logo */}
      <div className="lg:hidden absolute inset-0 flex items-center justify-center">
        <div className="w-full h-full relative opacity-20">
          <Image 
            src="/figueirense/logo.png" 
            alt="" 
            fill
            className="object-contain blur-[1px]"
          />
        </div>
      </div>

      {/* Desktop: Full collage */}
      <div className="hidden lg:block">
        {/* Central large logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-25 -ml-4">
          <Image 
            src="/figueirense/logo.png" 
            alt="" 
            width={600} 
            height={600}
            className="blur-[0.5px]"
          />
        </div>
        {/* Secondary logos for depth */}
        <div className="absolute top-1/4 -left-32 w-80 h-80 rotate-12 opacity-15">
          <Image 
            src="/figueirense/logo.png" 
            alt="" 
            width={320} 
            height={320}
            className="blur-[1px]"
          />
        </div>
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 -rotate-12 opacity-15">
          <Image 
            src="/figueirense/logo.png" 
            alt="" 
            width={320} 
            height={320}
            className="blur-[1px]"
          />
        </div>
        {/* Subtle corner accents */}
        <div className="absolute top-10 right-10 w-24 h-24 rotate-45 opacity-10">
          <Image 
            src="/figueirense/logo.png" 
            alt="" 
            width={96} 
            height={96}
            className="blur-sm"
          />
        </div>
        <div className="absolute bottom-10 left-10 w-24 h-24 -rotate-45 opacity-10">
        <Image 
          src="/figueirense/logo.png" 
          alt="" 
          width={96} 
          height={96}
          className="blur-sm"
        />
      </div>
      </div>
    </div>
  )
}
