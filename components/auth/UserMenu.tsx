'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logout } from '@/app/actions/auth'

interface UserMenuProps {
  email: string
}

export function UserMenu({ email }: UserMenuProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    await logout()
    router.push('/login')
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <User className="h-4 w-4" />
        <span>{email}</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        disabled={isLoading}
      >
        <LogOut className="h-4 w-4 mr-1" />
        {isLoading ? 'Saindo...' : 'Sair'}
      </Button>
    </div>
  )
}
