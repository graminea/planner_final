"use client"

/**
 * CategoryList - Expandable category sections with purple theme
 */

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, Plus, Trash2, FolderOpen, Package } from "lucide-react"
import type { CategoryWithItems } from "@/lib/types"
import { createCategory, deleteCategory } from "@/app/actions/categories"
import { toggleItemBought } from "@/app/actions/items-new"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CategoryListProps {
  categories: CategoryWithItems[]
  onSelectCategory?: (categoryId: string | null | undefined) => void
  selectedCategoryId?: string | null
}

export function CategoryList({ categories, onSelectCategory, selectedCategoryId }: CategoryListProps) {
  const router = useRouter()

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryBudget, setNewCategoryBudget] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Optimistic state for toggled items: itemId -> optimistic isBought value
  const [optimisticBought, setOptimisticBought] = useState<Map<string, boolean>>(new Map())

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleCreate = async () => {
    if (!newCategoryName.trim()) return

    setIsCreating(true)
    const result = await createCategory(
      newCategoryName,
      undefined,
      newCategoryBudget ? Number.parseFloat(newCategoryBudget) : undefined,
    )

    if (result.success) {
      setNewCategoryName("")
      setNewCategoryBudget("")
      setShowAddForm(false)
      router.refresh()
    }
    setIsCreating(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta categoria? Os itens ficarão sem categoria.")) return
    await deleteCategory(id)
    router.refresh()
  }

  const handleToggleBought = useCallback((itemId: string, currentIsBought: boolean) => {
    // Optimistic update — flip immediately
    setOptimisticBought((prev) => new Map(prev).set(itemId, !currentIsBought))

    toggleItemBought(itemId).then((result) => {
      if (!result.success) {
        // Rollback on failure
        setOptimisticBought((prev) => {
          const next = new Map(prev)
          next.delete(itemId)
          return next
        })
      } else {
        // Clear optimistic state — server data will arrive via refresh
        setOptimisticBought((prev) => {
          const next = new Map(prev)
          next.delete(itemId)
          return next
        })
        router.refresh()
      }
    }).catch(() => {
      setOptimisticBought((prev) => {
        const next = new Map(prev)
        next.delete(itemId)
        return next
      })
    })
  }, [router])

  // Calculate totals (respecting optimistic state)
  const getIsBought = (item: { id: string; isBought: boolean }) =>
    optimisticBought.has(item.id) ? optimisticBought.get(item.id)! : item.isBought

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0)
  const totalBought = categories.reduce((sum, cat) => sum + cat.items.filter((i) => getIsBought(i)).length, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-primary" />
            Categorias
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className={cn("w-4 h-4 transition-transform", showAddForm && "rotate-45")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-1">
        {/* Animated add form */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            showAddForm ? "max-h-40 opacity-100 mb-2" : "max-h-0 opacity-0",
          )}
        >
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <Input
              type="text"
              placeholder="Nome da catigoria vai ser uguê"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="h-9"
              autoFocus={showAddForm}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Orçamento (opcional)"
                value={newCategoryBudget}
                onChange={(e) => setNewCategoryBudget(e.target.value)}
                className="h-9"
              />
              <Button size="sm" onClick={handleCreate} disabled={isCreating || !newCategoryName.trim()}>
                Criar
              </Button>
            </div>
          </div>
        </div>

        <button
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
            selectedCategoryId === undefined
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-muted text-foreground",
          )}
          onClick={() => onSelectCategory?.(undefined)}
        >
          <span className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Todos os Itens
          </span>
          <span className="text-xs text-muted-foreground">
            {totalBought}/{totalItems}
          </span>
        </button>

        {categories.map((category) => {
          const isExpanded = expandedIds.has(category.id)
          const isSelected = selectedCategoryId === category.id
          const boughtItems = category.items.filter((i) => getIsBought(i)).length
          const totalCatItems = category.items.length

          return (
            <div key={category.id} className="group">
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors",
                  isSelected ? "bg-primary/10" : "hover:bg-muted",
                )}
              >
                {/* Expand toggle - animated chevron rotation */}
                <button onClick={() => toggleExpanded(category.id)} className="p-1 hover:bg-muted rounded">
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform duration-200",
                      isExpanded && "rotate-90",
                    )}
                  />
                </button>

                {/* Category name */}
                <button
                  onClick={() => onSelectCategory?.(category.id)}
                  className={cn(
                    "flex-1 flex items-center gap-2 text-sm text-left",
                    isSelected ? "text-primary font-medium" : "text-foreground",
                  )}
                >
                  <span>{category.icon}</span>
                  <span className="truncate">{category.name}</span>
                </button>

                {/* Progress badge */}
                <span className="text-xs text-muted-foreground px-2">
                  {boughtItems}/{totalCatItems}
                </span>

                {/* Delete button - visible on group hover */}
                {!category.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(category.id)
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>

              {/* Animated expand/collapse for category items */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                )}
              >
                <div className="ml-8 mt-1 mb-2 space-y-0.5">
                  {category.items.length === 0 ? (
                    <div className="text-xs text-muted-foreground py-1 px-2">Sem itens</div>
                  ) : (
                    category.items.map((item) => {
                      const isBought = optimisticBought.has(item.id)
                        ? optimisticBought.get(item.id)!
                        : item.isBought

                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-muted/50"
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleBought(item.id, isBought)}
                            className={cn(
                              "w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer",
                              isBought
                                ? "bg-primary border-primary"
                                : "border-muted-foreground hover:border-primary",
                            )}
                          >
                            {isBought && (
                              <svg className="w-2 h-2 text-primary-foreground" fill="currentColor" viewBox="0 0 12 12">
                                <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" fill="none" />
                              </svg>
                            )}
                          </button>
                          <span className={cn("flex-1 truncate", isBought && "text-muted-foreground line-through")}>
                            {item.name}
                          </span>
                          {item.plannedPrice && (
                            <span className="text-muted-foreground">R${item.plannedPrice.toFixed(0)}</span>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )
        })}

        <button
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
            selectedCategoryId === null
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-muted text-muted-foreground",
          )}
          onClick={() => onSelectCategory?.(null)}
        >
          <span>Sem Categoria</span>
        </button>
      </CardContent>
    </Card>
  )
}
