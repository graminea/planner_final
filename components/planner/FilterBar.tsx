"use client"

/**
 * FilterBar - Filter and sort controls with mobile-first design
 */

import { useState, useCallback } from "react"
import { Search, X, ArrowUpDown } from "lucide-react"
import type { ItemFilters, ItemSort, ItemSortField } from "@/app/actions/items-new"
import type { Category } from "@/app/actions/categories"
import type { Tag } from "@/app/actions/tags"
import { PRIORITY_OPTIONS, SORT_OPTIONS } from "@/lib/filters"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface FilterBarProps {
  categories: Category[]
  tags: Tag[]
  filters: ItemFilters
  sort: ItemSort
  onFiltersChange: (filters: ItemFilters) => void
  onSortChange: (sort: ItemSort) => void
  counts?: {
    bought: number
    notBought: number
    byCategory: Record<string, number>
  }
}

export function FilterBar({ categories, tags, filters, sort, onFiltersChange, onSortChange, counts }: FilterBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "")

  const setFilter = useCallback(
    <K extends keyof ItemFilters>(key: K, value: ItemFilters[K]) => {
      onFiltersChange({ ...filters, [key]: value })
    },
    [filters, onFiltersChange],
  )

  const clearFilters = useCallback(() => {
    setSearchValue("")
    onFiltersChange({})
  }, [onFiltersChange])

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    setTimeout(() => {
      setFilter("search", value || undefined)
    }, 300)
  }

  const toggleTagFilter = (tagId: string) => {
    const currentTags = filters.tagIds || []
    const newTags = currentTags.includes(tagId) ? currentTags.filter((id) => id !== tagId) : [...currentTags, tagId]
    setFilter("tagIds", newTags.length > 0 ? newTags : undefined)
  }

  const hasFilters =
    filters.search ||
    filters.isBought !== undefined ||
    filters.categoryId !== undefined ||
    filters.priority !== undefined ||
    (filters.tagIds && filters.tagIds.length > 0)

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar itens..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-10"
          />
          {searchValue && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpar
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Status Filter */}
        <Select
          value={filters.isBought === undefined ? "all" : filters.isBought.toString()}
          onValueChange={(val) => {
            setFilter("isBought", val === "all" ? undefined : val === "true")
          }}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos ({(counts?.bought || 0) + (counts?.notBought || 0)})</SelectItem>
            <SelectItem value="false">A Comprar ({counts?.notBought || 0})</SelectItem>
            <SelectItem value="true">Comprados ({counts?.bought || 0})</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select
          value={filters.categoryId === undefined ? "all" : filters.categoryId || "null"}
          onValueChange={(val) => {
            if (val === "all") setFilter("categoryId", undefined)
            else if (val === "null") setFilter("categoryId", null)
            else setFilter("categoryId", val)
          }}
        >
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
            <SelectItem value="null">Sem Categoria</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select
          value={filters.priority?.toString() ?? "all"}
          onValueChange={(val) => {
            setFilter("priority", val === "all" ? undefined : Number.parseInt(val))
          }}
        >
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {PRIORITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value.toString()}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Controls */}
        <div className="flex items-center gap-1 ml-auto">
          <Select value={sort.field} onValueChange={(val) => onSortChange({ ...sort, field: val as ItemSortField })}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.field} value={opt.field}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 bg-transparent"
            onClick={() =>
              onSortChange({
                ...sort,
                order: sort.order === "asc" ? "desc" : "asc",
              })
            }
          >
            <ArrowUpDown className={cn("w-4 h-4 transition-transform", sort.order === "desc" && "rotate-180")} />
          </Button>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted-foreground self-center mr-1">Tags:</span>
          {tags.map((tag) => {
            const isActive = filters.tagIds?.includes(tag.id)
            return (
              <Badge
                key={tag.id}
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-colors",
                  isActive ? "bg-primary hover:bg-primary/90" : "hover:bg-muted",
                )}
                onClick={() => toggleTagFilter(tag.id)}
              >
                {tag.name}
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
