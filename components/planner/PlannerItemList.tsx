"use client"

/**
 * PlannerItemList - Main item list with mobile-first cards
 *
 * Features:
 * - Optimistic updates for toggle/delete/price changes
 * - PriceDialog: vaul Drawer on mobile, animated overlay on desktop
 * - Item card enter animations via CSS
 * - Expandable link editor and inline edit form
 */

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import Image from "next/image"
import { ChevronDown, ChevronUp, Pencil, Trash2, Link2, ShoppingBag, DollarSign, X } from "lucide-react"
import type { Item, ItemFilters, ItemSort, Category } from "@/lib/types"
import { toggleItemBought, deleteItem, updateItemBoughtPrice } from "@/app/actions/items-new"
import { useIsDesktop } from "@/lib/hooks"
import { ItemForm } from "./ItemForm"
import { ItemLinkEditor } from "./ItemLinkEditor"
import { filterAndSortItems, PRIORITY_LABELS } from "@/lib/filters"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

interface PlannerItemListProps {
  items: Item[]
  categories: Category[]
  filters: ItemFilters
  sort: ItemSort
}

// ─── Price Dialog (Desktop) ────────────────────────────────────
function PriceDialogDesktop({
  item,
  onConfirm,
  onCancel,
}: {
  item: Item
  onConfirm: (price: number) => void
  onCancel: () => void
}) {
  const defaultPrice = item.plannedPrice || item.selectedLink?.price || 0
  const [price, setPrice] = useState(defaultPrice.toFixed(2))
  const [visible, setVisible] = useState(false)

  // Animate in on mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const handleConfirm = () => {
    const numPrice = parseFloat(price)
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
            <Label htmlFor="boughtPrice">Preço pago (R$)</Label>
            <Input
              id="boughtPrice"
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

// ─── Price Dialog (Mobile - vaul Drawer) ───────────────────────
function PriceDialogMobile({
  item,
  onConfirm,
  onCancel,
}: {
  item: Item
  onConfirm: (price: number) => void
  onCancel: () => void
}) {
  const defaultPrice = item.plannedPrice || item.selectedLink?.price || 0
  const [price, setPrice] = useState(defaultPrice.toFixed(2))

  const handleConfirm = () => {
    const numPrice = parseFloat(price)
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
            <Label htmlFor="boughtPriceMobile">Preço pago (R$)</Label>
            <Input
              id="boughtPriceMobile"
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

export function PlannerItemList({ items, categories, filters, sort }: PlannerItemListProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const isDesktop = useIsDesktop()
  const [mounted, setMounted] = useState(false)
  const isFigueira = mounted && theme === "figueira"
  const isCouple = mounted && theme === "couple"

  useEffect(() => {
    setMounted(true)
  }, [])

  // Optimistic updates state
  const [optimisticItems, setOptimisticItems] = useState<Map<string, Partial<Item>>>(new Map())

  // Clear optimistic state when items prop changes (i.e., when server data arrives)
  useEffect(() => {
    setOptimisticItems(new Map())
  }, [items])

  const displayedItems = useMemo(() => {
    // Apply optimistic updates to items
    const updatedItems = items
      .filter((item) => !(optimisticItems.get(item.id) as any)?._deleted)
      .map((item) => {
        const optimistic = optimisticItems.get(item.id)
        return optimistic ? { ...item, ...optimistic } : item
      })
    return filterAndSortItems(updatedItems, filters, sort)
  }, [items, filters, sort, optimisticItems])

  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [buyingItem, setBuyingItem] = useState<Item | null>(null)
  const [editingPriceItemId, setEditingPriceItemId] = useState<string | null>(null)

  const handleToggleBought = async (item: Item) => {
    if (item.isBought) {
      // Unmarking as bought - optimistic update first
      setOptimisticItems((prev) => new Map(prev).set(item.id, { isBought: false, boughtPrice: null }))

      // Then sync with DB in background
      toggleItemBought(item.id)
        .then(() => {
          router.refresh()
        })
        .catch(() => {
          // Rollback on error
          setOptimisticItems((prev) => {
            const next = new Map(prev)
            next.delete(item.id)
            return next
          })
        })
    } else {
      // Marking as bought - show price dialog
      setBuyingItem(item)
    }
  }

  const handleConfirmBuy = async (price: number) => {
    if (!buyingItem) return

    const itemId = buyingItem.id

    // Optimistic update
    setOptimisticItems((prev) => new Map(prev).set(itemId, { isBought: true, boughtPrice: price }))
    setBuyingItem(null)

    // Sync with DB in background
    toggleItemBought(itemId, price)
      .then(() => {
        router.refresh()
      })
      .catch(() => {
        setOptimisticItems((prev) => {
          const next = new Map(prev)
          next.delete(itemId)
          return next
        })
      })
  }

  const handleUpdateBoughtPrice = async (itemId: string, price: number) => {
    // Optimistic update
    setOptimisticItems((prev) => new Map(prev).set(itemId, { boughtPrice: price }))
    setEditingPriceItemId(null)

    // Sync with DB in background
    updateItemBoughtPrice(itemId, price)
      .then(() => {
        router.refresh()
      })
      .catch(() => {
        setOptimisticItems((prev) => {
          const next = new Map(prev)
          next.delete(itemId)
          return next
        })
      })
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm("Excluir este item?")) return

    // Optimistic update - hide item immediately
    setOptimisticItems((prev) => new Map(prev).set(itemId, { _deleted: true } as any))

    deleteItem(itemId)
      .then(() => {
        router.refresh()
      })
      .catch(() => {
        // Rollback
        setOptimisticItems((prev) => {
          const next = new Map(prev)
          next.delete(itemId)
          return next
        })
      })
  }

  if (displayedItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          {isFigueira ? (
            <div className="w-28 h-28 mx-auto mb-4 relative -ml-1 mascot-container">
              <Image
                src="/figueirense/mascot.png"
                alt="Figueirense Mascot"
                fill
                className="opacity-50 object-contain"
              />
            </div>
          ) : isCouple ? (
            <div className="w-24 h-24 mx-auto mb-4 relative rounded-full overflow-hidden border-4 border-primary/30 photo-frame">
              <Image
                src="/couple/main-photo.jpg"
                alt="Surpresinha bb"
                fill
                className="opacity-50 object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <p className="text-muted-foreground">Nenhum item corresponde aos filtros.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Price Dialog - responsive */}
      {buyingItem &&
        (isDesktop ? (
          <PriceDialogDesktop
            item={buyingItem}
            onConfirm={handleConfirmBuy}
            onCancel={() => setBuyingItem(null)}
          />
        ) : (
          <PriceDialogMobile
            item={buyingItem}
            onConfirm={handleConfirmBuy}
            onCancel={() => setBuyingItem(null)}
          />
        ))}

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Mostrando {displayedItems.length} de {items.length} itens
        </p>

        {displayedItems.map((item, index) => {
          const isExpanded = expandedItemId === item.id
          const isEditing = editingItemId === item.id
          const isEditingPrice = editingPriceItemId === item.id

          return (
            <Card
              key={item.id}
              className={cn(
                "transition-all duration-200 animate-in fade-in slide-in-from-bottom-2",
                item.isBought && "opacity-70",
              )}
              style={{ animationDelay: `${Math.min(index * 30, 300)}ms`, animationFillMode: "backwards" }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <Checkbox
                    checked={item.isBought}
                    onCheckedChange={() => handleToggleBought(item)}
                    className="mt-1 h-5 w-5 rounded-full"
                  />

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3
                          className={cn(
                            "font-medium text-foreground transition-all duration-200",
                            item.isBought && "line-through text-muted-foreground",
                          )}
                        >
                          {item.name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {item.category && (
                            <span className="text-xs text-muted-foreground">
                              {item.category.icon} {item.category.name}
                            </span>
                          )}
                          <Badge variant="outline" className="text-xs h-5">
                            {PRIORITY_LABELS[item.priority]}
                          </Badge>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        {item.isBought && item.boughtPrice ? (
                          <div
                            className="cursor-pointer hover:bg-accent/50 p-1 rounded -m-1 transition-colors duration-150"
                            onClick={() => setEditingPriceItemId(isEditingPrice ? null : item.id)}
                            title="Clique para editar o preço"
                          >
                            <div className="font-semibold text-primary">R${item.boughtPrice.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">Pago</div>
                          </div>
                        ) : item.selectedLink ? (
                          <div>
                            <div className="font-semibold">R${item.selectedLink.price.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[80px]">
                              {item.selectedLink.store}
                            </div>
                          </div>
                        ) : item.plannedPrice ? (
                          <div>
                            <div className="font-semibold">R${item.plannedPrice.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">Planejado</div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">&mdash;</span>
                        )}
                      </div>
                    </div>

                    {item.notes && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.notes}</p>}

                    <div className="flex items-center gap-1 mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-muted-foreground"
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                      >
                        <Link2 className="w-4 h-4" />
                        <span className="text-xs">{item.links.length}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground"
                        onClick={() => setEditingItemId(isEditing ? null : item.id)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Inline price editor for bought items */}
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-200 ease-in-out",
                        isEditingPrice && item.isBought ? "max-h-16 opacity-100 mt-3" : "max-h-0 opacity-0",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={item.boughtPrice?.toFixed(2) || "0.00"}
                          className="w-28 h-8 text-sm"
                          autoFocus={isEditingPrice}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const value = parseFloat((e.target as HTMLInputElement).value)
                              if (!isNaN(value)) handleUpdateBoughtPrice(item.id, value)
                            }
                            if (e.key === "Escape") setEditingPriceItemId(null)
                          }}
                        />
                        <Button
                          size="sm"
                          className="h-8"
                          onClick={(e) => {
                            const input = (e.target as HTMLElement).parentElement?.querySelector("input")
                            if (input) {
                              const value = parseFloat(input.value)
                              if (!isNaN(value)) handleUpdateBoughtPrice(item.id, value)
                            }
                          }}
                        >
                          Salvar
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8" onClick={() => setEditingPriceItemId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expandable link editor */}
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isExpanded ? "max-h-[500px] opacity-100 mt-4 pt-4 border-t border-border" : "max-h-0 opacity-0",
                  )}
                >
                  <ItemLinkEditor itemId={item.id} links={item.links} lowestPrice={item.lowestPrice} />
                </div>

                {/* Expandable edit form */}
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isEditing ? "max-h-[700px] opacity-100 mt-4 pt-4 border-t border-border" : "max-h-0 opacity-0",
                  )}
                >
                  <ItemForm
                    categories={categories}
                    item={item}
                    onSuccess={() => setEditingItemId(null)}
                    onCancel={() => setEditingItemId(null)}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
