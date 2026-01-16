"use client"

/**
 * PlannerItemList - Main item list with mobile-first cards
 */

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronUp, Pencil, Trash2, Link2, ShoppingBag } from "lucide-react"
import type { Item, ItemFilters, ItemSort } from "@/app/actions/items-new"
import type { Category } from "@/app/actions/categories"
import type { Tag } from "@/app/actions/tags"
import { toggleItemBought, deleteItem } from "@/app/actions/items-new"
import { ItemForm } from "./ItemForm"
import { ItemLinkEditor } from "./ItemLinkEditor"
import { filterAndSortItems, PRIORITY_LABELS } from "@/lib/filters"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface PlannerItemListProps {
  items: Item[]
  categories: Category[]
  tags: Tag[]
  filters: ItemFilters
  sort: ItemSort
}

export function PlannerItemList({ items, categories, tags, filters, sort }: PlannerItemListProps) {
  const router = useRouter()

  const displayedItems = useMemo(() => filterAndSortItems(items, filters, sort), [items, filters, sort])

  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  const handleToggleBought = async (itemId: string) => {
    await toggleItemBought(itemId)
    router.refresh()
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm("Excluir este item?")) return
    await deleteItem(itemId)
    router.refresh()
  }

  if (displayedItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Nenhum item corresponde aos filtros.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Mostrando {displayedItems.length} de {items.length} itens
      </p>

      {displayedItems.map((item) => {
        const isExpanded = expandedItemId === item.id
        const isEditing = editingItemId === item.id

        return (
          <Card key={item.id} className={cn("transition-all duration-200", item.isBought && "opacity-70")}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <Checkbox
                  checked={item.isBought}
                  onCheckedChange={() => handleToggleBought(item.id)}
                  className="mt-1 h-5 w-5 rounded-full"
                />

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3
                        className={cn(
                          "font-medium text-foreground",
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
                        {item.tags.map((tag) => (
                          <Badge key={tag.id} variant="secondary" className="text-xs h-5">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      {item.isBought && item.boughtPrice ? (
                        <div>
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
                        <span className="text-sm text-muted-foreground">—</span>
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
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border">
                  <ItemLinkEditor itemId={item.id} links={item.links} lowestPrice={item.lowestPrice} />
                </div>
              )}

              {isEditing && (
                <div className="mt-4 pt-4 border-t border-border">
                  <ItemForm
                    categories={categories}
                    tags={tags}
                    item={item}
                    onSuccess={() => setEditingItemId(null)}
                    onCancel={() => setEditingItemId(null)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
