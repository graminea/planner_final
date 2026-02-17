'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useIsDesktop } from '@/lib/hooks'

/**
 * Photo positions for the collage effect
 * Each photo has: top/bottom, left/right, size, rotation, opacity, blur
 */
const PHOTO_POSITIONS = [
  // Top row
  { top: '5%', left: '5%', size: 180, rotate: -8, opacity: 0.18, blur: 1 },
  { top: '3%', left: '25%', size: 140, rotate: 5, opacity: 0.15, blur: 1.5 },
  { top: '8%', right: '25%', size: 160, rotate: -3, opacity: 0.16, blur: 1 },
  { top: '2%', right: '5%', size: 150, rotate: 12, opacity: 0.17, blur: 1.2 },
  { top: '6%', left: '45%', size: 155, rotate: -6, opacity: 0.16, blur: 1.3 },
  
  // Middle-top row
  { top: '25%', left: '-5%', size: 200, rotate: 15, opacity: 0.2, blur: 0.8 },
  { top: '22%', right: '-3%', size: 170, rotate: -10, opacity: 0.18, blur: 1 },
  { top: '28%', left: '40%', size: 185, rotate: 7, opacity: 0.19, blur: 0.9 },
  
  // Center (main focal area - larger, more visible)
  { top: '35%', left: '15%', size: 220, rotate: -5, opacity: 0.22, blur: 0.5 },
  { top: '40%', right: '15%', size: 200, rotate: 8, opacity: 0.2, blur: 0.5 },
  { top: '45%', left: '45%', size: 210, rotate: -3, opacity: 0.21, blur: 0.6 },
  { top: '38%', left: '60%', size: 190, rotate: 10, opacity: 0.19, blur: 0.7 },
  
  // Middle-bottom row
  { top: '55%', left: '-8%', size: 180, rotate: -12, opacity: 0.18, blur: 1 },
  { top: '58%', left: '30%', size: 150, rotate: 6, opacity: 0.15, blur: 1.2 },
  { top: '52%', right: '8%', size: 190, rotate: -4, opacity: 0.19, blur: 0.8 },
  { top: '62%', left: '50%', size: 175, rotate: -8, opacity: 0.17, blur: 1.1 },
  
  // Bottom row
  { bottom: '5%', left: '10%', size: 160, rotate: 10, opacity: 0.17, blur: 1 },
  { bottom: '8%', left: '35%', size: 140, rotate: -7, opacity: 0.14, blur: 1.5 },
  { bottom: '3%', right: '20%', size: 180, rotate: 5, opacity: 0.18, blur: 1 },
  { bottom: '10%', right: '-5%', size: 170, rotate: -15, opacity: 0.16, blur: 1.2 },
  { bottom: '6%', left: '55%', size: 165, rotate: 9, opacity: 0.16, blur: 1.3 },
]

// Photo files - add more as needed
const COUPLE_PHOTOS = [
  '/couple/photo-1.jpg',
  '/couple/photo-2.jpg',
  '/couple/photo-3.jpg',
  '/couple/photo-4.jpg',
  '/couple/photo-5.jpg',
  '/couple/photo-6.jpg',
  '/couple/photo-7.jpg',
  '/couple/photo-8.jpg',
  '/couple/photo-9.jpg',
  '/couple/photo-10.jpg',
  '/couple/photo-11.jpg',
  '/couple/photo-12.jpg',
  '/couple/photo-13.jpg',
  '/couple/photo-14.jpg',
]

/**
 * CoupleWatermark - Photo collage background when Couple theme is active
 * Displays a scattered collage of couple photos with blur and opacity effects
 */
export function CoupleWatermark() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const isDesktop = useIsDesktop()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || theme !== 'couple') return null

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {/* Render only the correct layout based on viewport */}
      {isDesktop ? (
        // Desktop: Full photo collage
        <>
          {PHOTO_POSITIONS.map((pos, index) => {
            const photoIndex = index % COUPLE_PHOTOS.length
            const photo = COUPLE_PHOTOS[photoIndex]
            
            return (
              <div
                key={index}
                className="absolute rounded-xl overflow-hidden shadow-2xl photo-frame"
                style={{
                  top: pos.top,
                  bottom: pos.bottom,
                  left: pos.left,
                  right: pos.right,
                  width: pos.size,
                  height: pos.size * 1.2, // Portrait ratio
                  transform: `rotate(${pos.rotate}deg)`,
                  opacity: pos.opacity,
                  filter: `blur(${pos.blur}px)`,
                  animationDelay: `${index * 0.5}s`,
                }}
              >
                <Image
                  src={photo}
                  alt=""
                  fill
                  className="object-cover"
                  sizes={`${pos.size}px`}
                />
                {/* Romantic gradient overlay */}
                <div 
                  className="absolute inset-0" 
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.65 0.2 350 / 0.15) 0%, oklch(0.7 0.18 20 / 0.1) 100%)',
                  }}
                />
              </div>
            )
          })}
        </>
      ) : (
        // Mobile: Single full-background photo
        <div className="absolute inset-0">
          <div className="w-full h-full relative">
            <Image
              src="/couple/photo-1.jpg"
              alt=""
              fill
              className="object-cover opacity-15 blur-[2px]"
            />
            {/* Romantic gradient overlay */}
            <div 
              className="absolute inset-0" 
              style={{
                background: 'linear-gradient(135deg, oklch(0.65 0.2 350 / 0.15) 0%, oklch(0.7 0.18 20 / 0.1) 100%)',
              }}
            />
          </div>
        </div>
      )}
      
      {/* Soft vignette overlay for depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, oklch(0.12 0.025 350 / 0.4) 100%)',
        }}
      />
    </div>
  )
}
