"use client"

/**
 * UserMenu - Compact user menu for header
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/actions/auth"

interface UserMenuProps {
  email: string
}

export function UserMenu({ email }: UserMenuProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    await logout()
    router.push("/login")
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        <span className="hidden md:block max-w-[150px] truncate">{email}</span>
      </div>

      <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isLoading} className="h-9 gap-1.5">
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">{isLoading ? "Saindo..." : "Sair"}</span>
      </Button>
    </div>
  )
}
