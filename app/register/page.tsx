import { RegisterForm } from '@/components/auth/RegisterForm'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <Link href="/" className="mb-8">
        <h1 className="text-2xl font-bold">NestList</h1>
      </Link>
      <RegisterForm />
    </div>
  )
}
