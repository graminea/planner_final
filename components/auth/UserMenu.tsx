"use client"

/**
 * UserMenu - Compact user menu for header
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import Image from "next/image"
import { useEffect } from "react"
import { User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/actions/auth"

interface UserMenuProps {
  nickname: string
}

export function UserMenu({ nickname }: UserMenuProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const isFigueira = mounted && theme === 'figueira'
  const isCouple = mounted && theme === 'couple'

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    setIsLoading(true)
    await logout()
    router.push("/login")
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center relative overflow-hidden">
          {isFigueira ? (
            <Image 
              src="/figueirense/icon.png" 
              alt="Avatar" 
              fill
              className="object-contain p-0.5"
            />
          ) : isCouple ? (
            <Image 
              src="/couple/icon.jpg" 
              alt="Surpresinha bb" 
              fill
              className="object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-primary" />
          )}
        </div>
        <span className="hidden md:block max-w-[150px] truncate">{nickname}</span>
      </div>

      <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isLoading} className="h-9 gap-1.5">
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">{isLoading ? "Saindo..." : "Sair"}</span>
      </Button>
    </div>
  )
}
