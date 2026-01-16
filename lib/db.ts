/**
 * Neon Database Client
 *
 * Uses the @neondatabase/serverless package for direct SQL queries.
 * This replaces Prisma for v0 runtime compatibility.
 */

import { neon } from "@neondatabase/serverless"

// Create the SQL client using the DATABASE_URL environment variable
export const sql = neon(process.env.DATABASE_URL!)

// Helper to generate cuid-like IDs
export function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "").substring(0, 25)
}
