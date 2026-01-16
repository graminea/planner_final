"use client"

/**
 * ItemLinkEditor - Manage purchase links with styled cards
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, ExternalLink, Trash2, Check, Star } from "lucide-react"
import { addItemLink, deleteItemLink, selectItemLink } from "@/app/actions/items-new"
import type { ItemLink } from "@/app/actions/items-new"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ItemLinkEditorProps {
  itemId: string
  links: ItemLink[]
  lowestPrice: number | null
}

export function ItemLinkEditor({ itemId, links, lowestPrice }: ItemLinkEditorProps) {
  const router = useRouter()

  const [showAddForm, setShowAddForm] = useState(false)
  const [newLink, setNewLink] = useState({
    store: "",
    url: "",
    price: "",
    notes: "",
  })
  const [isAdding, setIsAdding] = useState(false)

  const handleAddLink = async () => {
    if (!newLink.store.trim() || !newLink.url.trim() || !newLink.price) return

    setIsAdding(true)
    await addItemLink(itemId, {
      store: newLink.store,
      url: newLink.url,
      price: Number.parseFloat(newLink.price),
      notes: newLink.notes || null,
    })

    setNewLink({ store: "", url: "", price: "", notes: "" })
    setShowAddForm(false)
    setIsAdding(false)
    router.refresh()
  }

  const handleSelectLink = async (linkId: string) => {
    await selectItemLink(itemId, linkId)
    router.refresh()
  }

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm("Excluir este link?")) return
    await deleteItemLink(linkId)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Links de Compra</h4>
        <Button variant="ghost" size="sm" onClick={() => setShowAddForm(!showAddForm)} className="h-8 gap-1">
          <Plus className={cn("w-4 h-4 transition-transform", showAddForm && "rotate-45")} />
          {showAddForm ? "Cancelar" : "Adicionar"}
        </Button>
      </div>

      {lowestPrice !== null && links.length > 1 && (
        <div className="flex items-center gap-1 text-xs text-primary">
          <Star className="w-3 h-3 fill-current" />
          Menor preço: R${lowestPrice.toFixed(2)}
        </div>
      )}

      {showAddForm && (
        <div className="p-4 rounded-lg bg-muted/50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Loja</Label>
              <Input
                placeholder="Ex: Amazon"
                value={newLink.store}
                onChange={(e) => setNewLink({ ...newLink, store: e.target.value })}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Preço</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={newLink.price}
                  onChange={(e) => setNewLink({ ...newLink, price: e.target.value })}
                  className="h-9 pl-9"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">URL</Label>
            <Input
              type="url"
              placeholder="https://..."
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notas (opcional)</Label>
            <Input
              placeholder="Observações..."
              value={newLink.notes}
              onChange={(e) => setNewLink({ ...newLink, notes: e.target.value })}
              className="h-9"
            />
          </div>
          <Button
            onClick={handleAddLink}
            disabled={isAdding || !newLink.store || !newLink.url || !newLink.price}
            size="sm"
            className="w-full"
          >
            {isAdding ? "Adicionando..." : "Adicionar Link"}
          </Button>
        </div>
      )}

      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Adicione links para comparar preços entre lojas.
        </p>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <div
              key={link.id}
              className={cn(
                "p-3 rounded-lg border transition-colors",
                link.isSelected ? "bg-primary/5 border-primary/30" : "bg-card border-border",
              )}
            >
              <div className="flex items-start gap-3">
                {/* Selection radio */}
                <button
                  onClick={() => handleSelectLink(link.id)}
                  className={cn(
                    "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    link.isSelected ? "border-primary bg-primary" : "border-muted-foreground hover:border-primary",
                  )}
                >
                  {link.isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </button>

                {/* Link info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{link.store}</span>
                    <span className="font-semibold text-primary">R${link.price.toFixed(2)}</span>
                    {link.price === lowestPrice && links.length > 1 && (
                      <Badge className="bg-primary/10 text-primary text-xs h-5">Menor</Badge>
                    )}
                  </div>

                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate">{link.url}</span>
                  </a>

                  {link.notes && <p className="text-xs text-muted-foreground mt-1">{link.notes}</p>}
                </div>

                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteLink(link.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
