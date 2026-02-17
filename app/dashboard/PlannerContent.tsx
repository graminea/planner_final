"use client"

/**
 * PlannerContent - Main dashboard content (Client Component)
 *
 * Uses useIsDesktop() to render the correct layout instead of rendering
 * both mobile AND desktop DOM and hiding via CSS.
 *
 * Mobile: vaul Drawer for budget/categories/add-item, FAB for add.
 * Desktop: two-column layout with sidebar.
 */

import { useState, useMemo } from "react"
import type { Category, CategoryWithItems, Item, ItemFilters, ItemSort, BudgetSummary } from "@/lib/types"
import { Plus, X, SlidersHorizontal, Loader2 } from "lucide-react"
import { useIsDesktop } from "@/lib/hooks"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import { CategoryList, FilterBar, BudgetDisplay, ItemForm, PlannerItemList } from "@/components/planner"
import { DEFAULT_FILTERS, DEFAULT_SORT, getFilterCounts } from "@/lib/filters"

interface PlannerContentProps {
  categories: Category[]
  categoriesWithItems: CategoryWithItems[]
  initialItems: Item[]
  budgetSummary: BudgetSummary | null
}

export function PlannerContent({
  categories,
  categoriesWithItems,
  initialItems,
  budgetSummary,
}: PlannerContentProps) {
  const isDesktop = useIsDesktop()

  // Filter and sort state
  const [filters, setFilters] = useState<ItemFilters>(DEFAULT_FILTERS)
  const [sort, setSort] = useState<ItemSort>(DEFAULT_SORT)

  const [showAddForm, setShowAddForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [budgetDrawerOpen, setBudgetDrawerOpen] = useState(false)

  // Calculate filter counts
  const filterCounts = useMemo(() => getFilterCounts(initialItems), [initialItems])

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.isBought !== undefined ||
      filters.categoryId !== undefined ||
      filters.priority !== undefined ||
      (filters.search && filters.search.length > 0)
    )
  }, [filters])

  // Handle category filter from sidebar
  const handleCategorySelect = (categoryId: string | null | undefined) => {
    if (categoryId === undefined) {
      setFilters((prev) => ({ ...prev, categoryId: undefined }))
    } else {
      setFilters((prev) => ({ ...prev, categoryId }))
    }
  }

  // SSR / hydration: show a lightweight skeleton until we know the viewport
  if (isDesktop === undefined) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ─── DESKTOP LAYOUT ───────────────────────────────────────────
  if (isDesktop) {
    return (
      <div className="flex flex-row gap-6 p-6 relative z-10">
        <aside className="w-96 flex-shrink-0 space-y-4">
          <BudgetDisplay summary={budgetSummary} />
          <CategoryList
            categories={categoriesWithItems}
            selectedCategoryId={filters.categoryId}
            onSelectCategory={handleCategorySelect}
          />
        </aside>

        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <FilterBar
              categories={categories}
              filters={filters}
              sort={sort}
              onFiltersChange={setFilters}
              onSortChange={setSort}
              counts={filterCounts}
            />
          </div>

          <div className="mb-4">
            <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2" size="lg">
              {showAddForm ? (
                <>
                  <X className="w-4 h-4" />
                  Cancelar
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Adicionar Item
                </>
              )}
            </Button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                showAddForm ? "max-h-[600px] opacity-100 mt-4" : "max-h-0 opacity-0"
              }`}
            >
              <ItemForm
                categories={categories}
                onSuccess={() => setShowAddForm(false)}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </div>

          <PlannerItemList items={initialItems} categories={categories} filters={filters} sort={sort} />
        </div>
      </div>
    )
  }

  // ─── MOBILE LAYOUT ────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col gap-4 p-4 relative z-10">
        {/* Top bar: budget drawer trigger + filter toggle */}
        <div className="flex items-center gap-2">
          {/* Budget drawer trigger */}
          <Drawer open={budgetDrawerOpen} onOpenChange={setBudgetDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                <span className="truncate">
                  {budgetSummary ? `R$${budgetSummary.remaining.toFixed(0)} restante` : "Definir orçamento"}
                </span>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader>
                <DrawerTitle>Orçamento e Categorias</DrawerTitle>
              </DrawerHeader>
              <div className="flex-1 overflow-y-auto overscroll-contain px-6">
                <div className="space-y-4 pb-8 pb-safe">
                  <BudgetDisplay summary={budgetSummary} />
                  <CategoryList
                    categories={categoriesWithItems}
                    selectedCategoryId={filters.categoryId}
                    onSelectCategory={(id) => {
                      handleCategorySelect(id)
                    }}
                  />
                </div>
              </div>
            </DrawerContent>
          </Drawer>

          {/* Filter toggle */}
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {hasActiveFilters && <span className="text-xs">Ativo</span>}
          </Button>
        </div>

        {/* Animated filter bar */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showFilters ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <FilterBar
            categories={categories}
            filters={filters}
            sort={sort}
            onFiltersChange={setFilters}
            onSortChange={setSort}
            counts={filterCounts}
          />
        </div>

        {/* Items List */}
        <PlannerItemList items={initialItems} categories={categories} filters={filters} sort={sort} />
      </div>

      {/* FAB + Add Item Drawer */}
      <div className="fixed bottom-6 right-4 z-40 pb-safe">
        <Drawer open={showAddForm} onOpenChange={setShowAddForm}>
          <DrawerTrigger asChild>
            <Button size="lg" className="h-14 w-14 rounded-full shadow-lg">
              <Plus className="w-6 h-6" />
              <span className="sr-only">Adicionar item</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Adicionar Novo Item</DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto overscroll-contain px-6">
              <div className="pb-8 pb-safe">
                <ItemForm
                  categories={categories}
                  onSuccess={() => setShowAddForm(false)}
                  onCancel={() => setShowAddForm(false)}
                />
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  )
}
