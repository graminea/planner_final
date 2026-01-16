"use client"

/**
 * TagManager - Manage tags with styled chips
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"
import type { Tag } from "@/app/actions/tags"
import { createTag, deleteTag } from "@/app/actions/tags"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface TagManagerProps {
  tags: Tag[]
}

export function TagManager({ tags }: TagManagerProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!newTagName.trim()) return

    setIsCreating(true)
    await createTag(newTagName)
    setNewTagName("")
    setShowForm(false)
    setIsCreating(false)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta etiqueta?")) return
    await deleteTag(id)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {showForm ? (
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Nome da etiqueta"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="h-9"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button size="sm" onClick={handleCreate} disabled={isCreating || !newTagName.trim()} className="h-9">
            Criar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="h-9">
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="w-full h-9">
          <Plus className="w-4 h-4 mr-1" />
          Nova Etiqueta
        </Button>
      )}

      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">Nenhuma etiqueta ainda</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="group pl-3 pr-1 py-1 gap-1">
              {tag.name}
              <button
                onClick={() => handleDelete(tag.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
