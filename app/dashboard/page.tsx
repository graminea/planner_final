/**
 * Dashboard Page - Home Planner
 *
 * Mobile-first responsive design with purple theme
 */

import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { UserMenu } from "@/components/auth/UserMenu"
import { PlannerContent } from "./PlannerContent"
import { Home } from "lucide-react"

// Data fetching
import { getCategories, getCategoriesWithItems } from "@/app/actions/categories"
import { getItems } from "@/app/actions/items-new"
import { getTags } from "@/app/actions/tags"
import { getBudgetSummary } from "@/app/actions/budget"
import { initializeUserData } from "@/app/actions/seed"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Initialize default data for new users
  await initializeUserData()

  // Fetch all data in parallel
  const [categories, categoriesWithItems, items, tags, budgetSummary] = await Promise.all([
    getCategories(),
    getCategoriesWithItems(),
    getItems({}),
    getTags(),
    getBudgetSummary(),
  ])

  const totalItems = items.length
  const boughtItems = items.filter((i) => i.isBought).length
  const progressPercent = totalItems > 0 ? Math.round((boughtItems / totalItems) * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Home className="w-4 h-4 text-primary" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-foreground">NestList</h1>
            </div>
          </div>

          <div className="flex-1 max-w-xs mx-4 hidden sm:block">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {boughtItems}/{totalItems}
              </span>
            </div>
          </div>

          <UserMenu email={user.email} />
        </div>

        <div className="sm:hidden px-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{progressPercent}%</span>
          </div>
        </div>
      </header>

      <main className="pb-24 lg:pb-8">
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
