"use client"

/**
 * CategoryList - Expandable category sections with purple theme
 */

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, Plus, Trash2, FolderOpen, Package, DollarSign, X } from "lucide-react"
import type { CategoryWithItems } from "@/lib/types"
import { createCategory, deleteCategory } from "@/app/actions/categories"
import { toggleItemBought } from "@/app/actions/items-new"
import { useIsDesktop } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

/** Normalize Brazilian comma decimal to dot before parsing */
function parsePrice(value: string): number {
  return parseFloat(value.replace(",", "."))
}

// ─── Compact Price Dialog (Desktop) ────────────────────────────
type BuyingItem = CategoryWithItems["items"][0]

function CategoryPriceDialogDesktop({
  item,
  onConfirm,
  onCancel,
}: {
  item: BuyingItem
  onConfirm: (price: number) => void
  onCancel: () => void
}) {
  const defaultPrice = item.plannedPrice || 0
  const [price, setPrice] = useState(defaultPrice.toFixed(2))
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const handleConfirm = () => {
    const numPrice = parsePrice(price)
    if (!isNaN(numPrice) && numPrice >= 0) {
      onConfirm(numPrice)
    }
  }

  const handleCancel = () => {
    setVisible(false)
    setTimeout(onCancel, 200)
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200",
        visible ? "bg-black/50" : "bg-black/0",
      )}
      onClick={handleCancel}
    >
      <Card
        className={cn(
          "w-full max-w-sm transition-all duration-200",
          visible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Quanto você pagou?
            </h3>
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            <span className="font-medium">{item.name}</span>
          </p>

          <div className="space-y-2">
            <Label htmlFor="catBoughtPrice">Preço pago (R$)</Label>
            <Input
              id="catBoughtPrice"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="text-lg"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm()
                if (e.key === "Escape") handleCancel()
              }}
            />
            {item.plannedPrice && (
              <p className="text-xs text-muted-foreground">
                Preço planejado: R${item.plannedPrice.toFixed(2)}
              </p>
            )}
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="outline" className="flex-1" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleConfirm}>
              Confirmar Compra
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Compact Price Dialog (Mobile - vaul Drawer) ───────────────
function CategoryPriceDialogMobile({
  item,
  onConfirm,
  onCancel,
}: {
  item: BuyingItem
  onConfirm: (price: number) => void
  onCancel: () => void
}) {
  const defaultPrice = item.plannedPrice || 0
  const [price, setPrice] = useState(defaultPrice.toFixed(2))

  const handleConfirm = () => {
    const numPrice = parsePrice(price)
    if (!isNaN(numPrice) && numPrice >= 0) {
      onConfirm(numPrice)
    }
  }

  return (
    <Drawer open onOpenChange={(open) => { if (!open) onCancel() }}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Quanto você pagou?
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-6 pb-8 pb-safe space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{item.name}</span>
          </p>

          <div className="space-y-2">
            <Label htmlFor="catBoughtPriceMobile">Preço pago (R$)</Label>
            <Input
              id="catBoughtPriceMobile"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="text-lg h-12"
              autoFocus
            />
            {item.plannedPrice && (
              <p className="text-xs text-muted-foreground">
                Preço planejado: R${item.plannedPrice.toFixed(2)}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleConfirm}>
              Confirmar Compra
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

interface CategoryListProps {
  categories: CategoryWithItems[]
  onSelectCategory?: (categoryId: string | null | undefined) => void
  selectedCategoryId?: string | null
}

export function CategoryList({ categories, onSelectCategory, selectedCategoryId }: CategoryListProps) {
  const router = useRouter()
  const isDesktop = useIsDesktop()

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryBudget, setNewCategoryBudget] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Optimistic state for toggled items: itemId -> optimistic isBought value
  const [optimisticBought, setOptimisticBought] = useState<Map<string, boolean>>(new Map())

  // Price dialog state
  const [buyingItem, setBuyingItem] = useState<BuyingItem | null>(null)

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

  const handleToggleBought = useCallback((item: BuyingItem, currentIsBought: boolean) => {
    if (currentIsBought) {
      // Unmarking as bought — optimistic, no dialog needed
      setOptimisticBought((prev) => new Map(prev).set(item.id, false))

      toggleItemBought(item.id).then((result) => {
        setOptimisticBought((prev) => {
          const next = new Map(prev)
          next.delete(item.id)
          return next
        })
        if (!result.success) return // rollback handled by refresh
        router.refresh()
      }).catch(() => {
        setOptimisticBought((prev) => {
          const next = new Map(prev)
          next.delete(item.id)
          return next
        })
      })
    } else {
      // Marking as bought — show price dialog
      setBuyingItem(item)
    }
  }, [router])

  const handleConfirmBuy = useCallback((price: number) => {
    if (!buyingItem) return

    const itemId = buyingItem.id

    // Optimistic update
    setOptimisticBought((prev) => new Map(prev).set(itemId, true))
    setBuyingItem(null)

    // Sync with DB
    toggleItemBought(itemId, price).then((result) => {
      setOptimisticBought((prev) => {
        const next = new Map(prev)
        next.delete(itemId)
        return next
      })
      if (!result.success) return
      router.refresh()
    }).catch(() => {
      setOptimisticBought((prev) => {
        const next = new Map(prev)
        next.delete(itemId)
        return next
      })
    })
  }, [buyingItem, router])

  // Calculate totals (respecting optimistic state)
  const getIsBought = (item: { id: string; isBought: boolean }) =>
    optimisticBought.has(item.id) ? optimisticBought.get(item.id)! : item.isBought

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0)
  const totalBought = categories.reduce((sum, cat) => sum + cat.items.filter((i) => getIsBought(i)).length, 0)

  return (
    <>
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
                            onClick={() => handleToggleBought(item, isBought)}
                            className={cn(
                              "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer",
                              isBought
                                ? "bg-primary border-primary"
                                : "border-muted-foreground hover:border-primary",
                            )}
                          >
                            {isBought && (
                              <svg className="w-2.5 h-2.5 text-primary-foreground" fill="currentColor" viewBox="0 0 12 12">
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

    {/* Price dialog when checking an item */}
    {buyingItem && (
      isDesktop ? (
        <CategoryPriceDialogDesktop
          item={buyingItem!}
          onConfirm={handleConfirmBuy}
          onCancel={() => setBuyingItem(null)}
        />
      ) : (
        <CategoryPriceDialogMobile
          item={buyingItem!}
          onConfirm={handleConfirmBuy}
          onCancel={() => setBuyingItem(null)}
        />
      )
    )}
    </>
  )
}
