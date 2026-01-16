'use client'

/**
 * TagManager - Manage tags
 * 
 * MINIMAL UI - Intentionally unstyled for v0 redesign
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Tag } from '@/app/actions/tags'
import { createTag, deleteTag } from '@/app/actions/tags'

interface TagManagerProps {
  tags: Tag[]
}

export function TagManager({ tags }: TagManagerProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!newTagName.trim()) return
    
    setIsCreating(true)
    await createTag(newTagName)
    setNewTagName('')
    setShowForm(false)
    setIsCreating(false)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta etiqueta?')) return
    await deleteTag(id)
    router.refresh()
  }

  return (
    <div style={{ padding: '8px', border: '1px solid #ddd' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <strong>Etiquetas</strong>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Adicionar Etiqueta'}
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom: '8px' }}>
          <input
            type="text"
            placeholder="Nome da etiqueta"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            style={{ marginRight: '8px' }}
          />
          <button onClick={handleCreate} disabled={isCreating || !newTagName.trim()}>
            Criar
          </button>
        </div>
      )}

      {tags.length === 0 ? (
        <p style={{ color: '#888', fontSize: '14px' }}>Nenhuma etiqueta ainda</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {tags.map(tag => (
            <span 
              key={tag.id} 
              style={{ 
                backgroundColor: '#eee', 
                padding: '2px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {tag.name}
              <button 
                onClick={() => handleDelete(tag.id)}
                style={{ fontSize: '10px', border: 'none', cursor: 'pointer' }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
