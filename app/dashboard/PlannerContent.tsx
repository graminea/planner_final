"use client"

/**
 * PlannerContent - Main dashboard content (Client Component)
 *
 * Mobile-first responsive layout with bottom sheet for add item
 */

import { useState, useMemo } from "react"
import type { Category, CategoryWithItems } from "@/app/actions/categories"
import type { Item, ItemFilters, ItemSort } from "@/app/actions/items-new"
import type { Tag } from "@/app/actions/tags"
import type { BudgetSummary } from "@/app/actions/budget"
import { Plus, X, SlidersHorizontal, TagIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

import { CategoryList, FilterBar, BudgetDisplay, TagManager, ItemForm, PlannerItemList } from "@/components/planner"
import { DEFAULT_FILTERS, DEFAULT_SORT, getFilterCounts } from "@/lib/filters"

interface PlannerContentProps {
  categories: Category[]
  categoriesWithItems: CategoryWithItems[]
  initialItems: Item[]
  tags: Tag[]
  budgetSummary: BudgetSummary | null
}

export function PlannerContent({
  categories,
  categoriesWithItems,
  initialItems,
  tags,
  budgetSummary,
}: PlannerContentProps) {
  // Filter and sort state
  const [filters, setFilters] = useState<ItemFilters>(DEFAULT_FILTERS)
  const [sort, setSort] = useState<ItemSort>(DEFAULT_SORT)

  const [showAddForm, setShowAddForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showTagManager, setShowTagManager] = useState(false)

  // Calculate filter counts
  const filterCounts = useMemo(() => getFilterCounts(initialItems), [initialItems])

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.isBought !== undefined ||
      filters.categoryId !== undefined ||
      filters.priority !== undefined ||
      (filters.tagIds && filters.tagIds.length > 0) ||
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

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6">
        <aside className="hidden lg:block w-72 flex-shrink-0 space-y-4">
          <BudgetDisplay summary={budgetSummary} />

          <CategoryList
            categories={categoriesWithItems}
            selectedCategoryId={filters.categoryId}
            onSelectCategory={handleCategorySelect}
          />

          <div className="rounded-xl border border-border bg-card p-4">
            <button
              onClick={() => setShowTagManager(!showTagManager)}
              className="w-full flex items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              <span className="flex items-center gap-2">
                <TagIcon className="w-4 h-4" />
                Etiquetas
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{tags.length}</span>
            </button>
            {showTagManager && (
              <div className="mt-4">
                <TagManager tags={tags} />
              </div>
            )}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-4 lg:hidden">
            {/* Budget sheet trigger for mobile */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <span className="truncate">
                    {budgetSummary ? `R$${budgetSummary.remaining.toFixed(0)} restante` : "Definir orçamento"}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>Orçamento e Categorias</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4 overflow-y-auto pb-8">
                  <BudgetDisplay summary={budgetSummary} />
                  <CategoryList
                    categories={categoriesWithItems}
                    selectedCategoryId={filters.categoryId}
                    onSelectCategory={(id) => {
                      handleCategorySelect(id)
                    }}
                  />
                  <div className="pt-4">
                    <TagManager tags={tags} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Filter toggle for mobile */}
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

          <div className={`mb-4 ${showFilters ? "block" : "hidden"} lg:block`}>
            <FilterBar
              categories={categories}
              tags={tags}
              filters={filters}
              sort={sort}
              onFiltersChange={setFilters}
              onSortChange={setSort}
              counts={filterCounts}
            />
          </div>

          <div className="hidden lg:block mb-4">
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

            {showAddForm && (
              <div className="mt-4">
                <ItemForm
                  categories={categories}
                  tags={tags}
                  onSuccess={() => setShowAddForm(false)}
                  onCancel={() => setShowAddForm(false)}
                />
              </div>
            )}
          </div>

          {/* Items List */}
          <PlannerItemList items={initialItems} categories={categories} tags={tags} filters={filters} sort={sort} />
        </div>
      </div>

      <div className="lg:hidden fixed bottom-6 right-4 z-40">
        <Sheet open={showAddForm} onOpenChange={setShowAddForm}>
          <SheetTrigger asChild>
            <Button size="lg" className="h-14 w-14 rounded-full shadow-lg">
              <Plus className="w-6 h-6" />
              <span className="sr-only">Adicionar item</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Adicionar Novo Item</SheetTitle>
            </SheetHeader>
            <div className="mt-4 overflow-y-auto pb-8">
              <ItemForm
                categories={categories}
                tags={tags}
                onSuccess={() => setShowAddForm(false)}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
