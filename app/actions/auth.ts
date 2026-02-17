'use server'

/**
 * Server Actions for Authentication
 * 
 * Handles user registration, login, and logout.
 */

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  hashPassword,
  verifyPassword,
  createSession,
  setSessionCookie,
  deleteSessionCookie,
  getCurrentUser,
} from '@/lib/auth'
import { registerSchema, loginSchema } from '@/lib/validation'

/**
 * Register a new user
 */
export async function register(
  nickname: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = registerSchema.safeParse({ nickname, password })
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { nickname: parsed.data.nickname.toLowerCase() },
    })

    if (existingUser) {
      return { success: false, error: 'Esse nick já está em uso' }
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(parsed.data.password)
    
    const user = await prisma.user.create({
      data: {
        nickname: parsed.data.nickname.toLowerCase(),
        password: hashedPassword,
      },
    })

    // Create session and set cookie
    const token = await createSession(user.id)
    await setSessionCookie(token)

    return { success: true }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'Falha no registro. Tente novamente.' }
  }
}

/**
 * Login an existing user
 */
export async function login(
  nickname: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = loginSchema.safeParse({ nickname, password })
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
    }

    // Find user by nickname
    const user = await prisma.user.findUnique({
      where: { nickname: parsed.data.nickname.toLowerCase() },
    })

    if (!user) {
      return { success: false, error: 'Nick ou senha inválidos' }
    }

    // Verify password
    const isValid = await verifyPassword(parsed.data.password, user.password)

    if (!isValid) {
      return { success: false, error: 'Nick ou senha inválidos' }
    }

    // Create session and set cookie
    const token = await createSession(user.id)
    await setSessionCookie(token)

    return { success: true }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Falha no login. Tente novamente.' }
  }
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  await deleteSessionCookie()
  redirect('/login')
}

/**
 * Get the current authenticated user
 */
export async function getAuthUser() {
  return getCurrentUser()
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}
