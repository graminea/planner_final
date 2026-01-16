"use server"

/**
 * Server Actions for Authentication
 *
 * Handles user registration, login, and logout.
 */

import { redirect } from "next/navigation"
import { sql, generateId } from "@/lib/db"
import {
  hashPassword,
  verifyPassword,
  createSession,
  setSessionCookie,
  deleteSessionCookie,
  getCurrentUser,
} from "@/lib/auth"

/**
 * Register a new user
 */
export async function register(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    if (!email || !email.includes("@")) {
      return { success: false, error: "Invalid email address" }
    }

    if (!password || password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" }
    }

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM "User" WHERE email = ${email.toLowerCase()} LIMIT 1
    `

    if (existingUsers.length > 0) {
      return { success: false, error: "Email already registered" }
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    const userId = generateId()

    await sql`
      INSERT INTO "User" (id, email, password, "createdAt")
      VALUES (${userId}, ${email.toLowerCase()}, ${hashedPassword}, NOW())
    `

    // Create session and set cookie
    const token = await createSession(userId)
    await setSessionCookie(token)

    return { success: true }
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, error: "Registration failed. Please try again." }
  }
}

/**
 * Login an existing user
 */
export async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    if (!email || !password) {
      return { success: false, error: "Email and password are required" }
    }

    // Find user by email
    const users = await sql`
      SELECT id, password FROM "User" WHERE email = ${email.toLowerCase()} LIMIT 1
    `

    if (users.length === 0) {
      return { success: false, error: "Invalid email or password" }
    }

    const user = users[0]

    // Verify password
    const isValid = await verifyPassword(password, user.password)

    if (!isValid) {
      return { success: false, error: "Invalid email or password" }
    }

    // Create session and set cookie
    const token = await createSession(user.id)
    await setSessionCookie(token)

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "Login failed. Please try again." }
  }
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  await deleteSessionCookie()
  redirect("/login")
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
