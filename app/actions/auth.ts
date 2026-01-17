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

/**
 * Register a new user
 */
export async function register(
  nickname: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    if (nickname.length < 3 || nickname.length > 30) {
      return { success: false, error: 'nickname invalido, deve ter ao menos 3 caracteres e no máximo 30 caracteres' }
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Senha deve ter ao menos 6 caracteres' }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { nickname: nickname.toLowerCase() },
    })

    if (existingUser) {
      return { success: false, error: 'Esse nick já está em uso' }
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    
    const user = await prisma.user.create({
      data: {
        nickname: nickname.toLowerCase(),
        password: hashedPassword,
      },
    })

    // Create session and set cookie
    const token = await createSession(user.id)
    await setSessionCookie(token)

    return { success: true }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'Registration failed. Please try again.' }
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
    // Validate input
    if (!nickname || !password) {
      return { success: false, error: 'Nick e senha são obrigatórios' }
    }

    // Find user by nickname
    const user = await prisma.user.findUnique({
      where: { nickname: nickname.toLowerCase() },
    })

    if (!user) {
      return { success: false, error: 'Nick ou senha inválidos' }
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password)

    if (!isValid) {
      return { success: false, error: 'Nick ou senha inválidos' }
    }

    // Create session and set cookie
    const token = await createSession(user.id)
    await setSessionCookie(token)

    return { success: true }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Login failed. Please try again.' }
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
