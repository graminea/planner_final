/**
 * Dashboard Page - Home Planner
 * 
 * MINIMAL UI - Intentionally unstyled for v0 redesign
 * 
 * Integrates all planner features:
 * - Categories with expand/collapse
 * - Filters and sorting
 * - Budget overview
 * - Tags
 * - Item CRUD with suggestions
 */

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { UserMenu } from '@/components/auth/UserMenu'
import { PlannerContent } from './PlannerContent'

// Data fetching
import { getCategories, getCategoriesWithItems } from '@/app/actions/categories'
import { getItems } from '@/app/actions/items-new'
import { getTags } from '@/app/actions/tags'
import { getBudgetSummary } from '@/app/actions/budget'
import { initializeUserData } from '@/app/actions/seed'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Initialize default data for new users
  await initializeUserData()

  // Fetch all data in parallel
  const [
    categories,
    categoriesWithItems,
    items,
    tags,
    budgetSummary
  ] = await Promise.all([
    getCategories(),
    getCategoriesWithItems(),
    getItems({}),
    getTags(),
    getBudgetSummary()
  ])

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ 
        borderBottom: '1px solid #ddd', 
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0 }}>Planejador de Casa</h1>
        <UserMenu email={user.email} />
      </header>

      {/* Main Content */}
      <main style={{ padding: '16px' }}>
        <PlannerContent
          categories={categories}
          categoriesWithItems={categoriesWithItems}
          initialItems={items}
          tags={tags}
          budgetSummary={budgetSummary}
        />
      </main>
    </div>
  )
}
