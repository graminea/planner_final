'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { login } from '@/app/actions/auth'

export function LoginForm() {
  const router = useRouter()
  const { theme } = useTheme()
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const isFigueira = mounted && theme === 'figueira'

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const result = await login(nickname, password)

    if (result.success) {
      router.push('/dashboard')
    } else {
      setError(result.error || 'Login failed')
    }

    setIsLoading(false)
  }

  return (
    <>
      {isFigueira && (
        <div className="mb-6 flex justify-center mascot-container">
          <div className="relative w-[140px] h-[140px] -ml-2">
            <Image 
              src="/figueirense/mascot.png" 
              alt="Figueirense Mascot" 
              fill
              className="drop-shadow-2xl object-contain"
              priority
            />
          </div>
        </div>
      )}
      <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Bem-vindo de Volta</CardTitle>
        <CardDescription>Entre para acessar sua lista de casa</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md dark:bg-red-950/50">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nickname">Nick</Label>
            <Input
              id="nickname"
              type="text"
              placeholder="Seu nick"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
          <p className="text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Registre-se
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
    </>
  )
}
