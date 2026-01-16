/**
 * Neon-optimized Prisma Client Setup
 * 
 * This configuration uses the Neon serverless driver for optimal performance
 * in serverless environments (Vercel Edge Functions, etc.)
 */

import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'

// Configure Neon to use WebSockets in Node.js environments (local dev)
// In Vercel production, native fetch is used instead
if (typeof globalThis.WebSocket === 'undefined') {
  try {
    const ws = require('ws')
    neonConfig.webSocketConstructor = ws
  } catch {
    // ws not available, using fetch mode (Vercel production)
  }
}

// Declare global type for development client caching
declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined
}

// Use globalThis for compatibility with edge runtime and Turbopack
const globalForPrisma = globalThis as unknown as { cachedPrisma: PrismaClient | undefined }

/**
 * Creates a new Prisma client with Neon adapter
 */
function createPrismaClient(): PrismaClient {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaNeon(pool)
  
  const prisma = new PrismaClient({ 
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  return prisma
}

/**
 * Prisma Client Singleton
 */
export const prisma = globalForPrisma.cachedPrisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.cachedPrisma = prisma
}
