"use client"

import type React from "react"

/**
 * ItemForm - Create/Edit item form with mobile-first design
 */

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createItem, updateItem } from "@/app/actions/items-new"
import type { Item } from "@/app/actions/items-new"
import type { Category } from "@/app/actions/categories"
import type { Tag } from "@/app/actions/tags"
import type { ItemSuggestion } from "@/app/actions/suggestions"
import { ItemSuggestionInput } from "./ItemSuggestionInput"
import { PRIORITY_OPTIONS } from "@/lib/filters"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface ItemFormProps {
  categories: Category[]
  tags: Tag[]
  item?: Item
  onSuccess?: () => void
  onCancel?: () => void
}

export function ItemForm({ categories, tags, item, onSuccess, onCancel }: ItemFormProps) {
  const router = useRouter()
  const isEditing = !!item

  const [name, setName] = useState(item?.name || "")
  const [categoryId, setCategoryId] = useState<string | null>(item?.categoryId || null)
  const [priority, setPriority] = useState(item?.priority || 2)
  const [plannedPrice, setPlannedPrice] = useState(item?.plannedPrice?.toString() || "")
  const [notes, setNotes] = useState(item?.notes || "")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(item?.tags.map((t) => t.id) || [])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelectSuggestion = useCallback(
    (suggestion: ItemSuggestion) => {
      setName(suggestion.name)

      if (suggestion.categoryName) {
        const matchingCategory = categories.find((c) => c.name.toLowerCase() === suggestion.categoryName?.toLowerCase())
        if (matchingCategory) {
          setCategoryId(matchingCategory.id)
        }
      }
    },
    [categories],
  )

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("O nome do item é obrigatório")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (isEditing) {
        const result = await updateItem(item.id, {
          name: name.trim(),
          categoryId,
          priority,
          plannedPrice: plannedPrice ? Number.parseFloat(plannedPrice) : null,
          notes: notes || null,
        })

        if (!result.success) {
          setError(result.error || "Erro ao atualizar item")
          setIsSubmitting(false)
          return
        }
      } else {
        const result = await createItem({
          name: name.trim(),
          categoryId,
          priority,
          plannedPrice: plannedPrice ? Number.parseFloat(plannedPrice) : null,
          notes: notes || null,
          tagIds: selectedTagIds,
        })

        if (!result.success) {
          setError(result.error || "Erro ao criar item")
          setIsSubmitting(false)
          return
        }
      }

      router.refresh()
      onSuccess?.()

      if (!isEditing) {
        setName("")
        setCategoryId(null)
        setPriority(2)
        setPlannedPrice("")
        setNotes("")
        setSelectedTagIds([])
      }
    } catch (err) {
      setError("Ocorreu um erro")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      <div className="space-y-2">
        <Label htmlFor="item-name">Nome do Item</Label>
        <ItemSuggestionInput
          value={name}
          onChange={setName}
          onSelectSuggestion={handleSelectSuggestion}
          placeholder="Ex: Sofá, Mesa de jantar..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={categoryId || "none"} onValueChange={(val) => setCategoryId(val === "none" ? null : val)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem Categoria</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="planned-price">Preço Planejado</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
            <Input
              id="planned-price"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={plannedPrice}
              onChange={(e) => setPlannedPrice(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Prioridade</Label>
        <div className="flex gap-2">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPriority(opt.value)}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border",
                priority === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="space-y-2">
          <Label>Etiquetas</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <label
                key={tag.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm cursor-pointer border transition-colors",
                  selectedTagIds.includes(tag.id)
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card border-border hover:bg-muted",
                )}
              >
                <Checkbox
                  checked={selectedTagIds.includes(tag.id)}
                  onCheckedChange={() => toggleTag(tag.id)}
                  className="h-4 w-4"
                />
                {tag.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Adicione observações..."
          className="min-h-[80px] resize-none"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Adicionar Item"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}
