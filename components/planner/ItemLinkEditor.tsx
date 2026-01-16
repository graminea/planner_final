'use client'

/**
 * ItemLinkEditor - Manage multiple purchase links
 * 
 * MINIMAL UI - Intentionally unstyled for v0 redesign
 * 
 * Features:
 * - Add multiple links per item
 * - Select preferred link
 * - Auto-compute lowest price
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addItemLink, updateItemLink, deleteItemLink, selectItemLink } from '@/app/actions/items-new'
import type { ItemLink } from '@/app/actions/items-new'

interface ItemLinkEditorProps {
  itemId: string
  links: ItemLink[]
  lowestPrice: number | null
}

export function ItemLinkEditor({ itemId, links, lowestPrice }: ItemLinkEditorProps) {
  const router = useRouter()
  
  // Add link form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLink, setNewLink] = useState({
    store: '',
    url: '',
    price: '',
    notes: ''
  })
  const [isAdding, setIsAdding] = useState(false)

  // Add new link
  const handleAddLink = async () => {
    if (!newLink.store.trim() || !newLink.url.trim() || !newLink.price) return
    
    setIsAdding(true)
    await addItemLink(itemId, {
      store: newLink.store,
      url: newLink.url,
      price: parseFloat(newLink.price),
      notes: newLink.notes || null
    })
    
    setNewLink({ store: '', url: '', price: '', notes: '' })
    setShowAddForm(false)
    setIsAdding(false)
    router.refresh()
  }

  // Select link as preferred
  const handleSelectLink = async (linkId: string) => {
    await selectItemLink(itemId, linkId)
    router.refresh()
  }

  // Delete link
  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Excluir este link?')) return
    await deleteItemLink(linkId)
    router.refresh()
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Links de Compra</strong>
        <button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancelar' : '+ Adicionar Link'}
        </button>
      </div>

      {/* Lowest price indicator */}
      {lowestPrice !== null && links.length > 1 && (
        <div style={{ fontSize: '12px', color: '#28a745', marginTop: '4px' }}>
          Menor: R${lowestPrice.toFixed(2)}
        </div>
      )}

      {/* Add link form */}
      {showAddForm && (
        <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #ddd' }}>
          <div style={{ marginBottom: '4px' }}>
            <input
              type="text"
              placeholder="Nome da loja"
              value={newLink.store}
              onChange={(e) => setNewLink({ ...newLink, store: e.target.value })}
              style={{ marginRight: '8px' }}
            />
            <input
              type="number"
              placeholder="Preço"
              value={newLink.price}
              onChange={(e) => setNewLink({ ...newLink, price: e.target.value })}
              style={{ width: '80px' }}
            />
          </div>
          <div style={{ marginBottom: '4px' }}>
            <input
              type="url"
              placeholder="URL"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Notas (opcional)"
              value={newLink.notes}
              onChange={(e) => setNewLink({ ...newLink, notes: e.target.value })}
              style={{ width: '100%', marginBottom: '4px' }}
            />
          </div>
          <button onClick={handleAddLink} disabled={isAdding}>
            {isAdding ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>
      )}

      {/* Links list */}
      {links.length === 0 ? (
        <p style={{ color: '#888', fontSize: '14px', marginTop: '8px' }}>
          Sem links ainda. Adicione opções de compra para comparar preços.
        </p>
      ) : (
        <div style={{ marginTop: '8px' }}>
          {links.map(link => (
            <div 
              key={link.id} 
              style={{ 
                padding: '8px', 
                border: '1px solid #ddd',
                marginBottom: '4px',
                backgroundColor: link.isSelected ? '#e8f5e9' : 'white'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {/* Radio for selection */}
                  <input
                    type="radio"
                    name={`link-${itemId}`}
                    checked={link.isSelected}
                    onChange={() => handleSelectLink(link.id)}
                    style={{ marginRight: '8px' }}
                  />
                  <strong>{link.store}</strong>
                  <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                    R${link.price.toFixed(2)}
                  </span>
                  {link.price === lowestPrice && links.length > 1 && (
                    <span style={{ 
                      marginLeft: '8px', 
                      fontSize: '10px', 
                      backgroundColor: '#28a745', 
                      color: 'white',
                      padding: '2px 4px'
                    }}>
                      MENOR
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => handleDeleteLink(link.id)}
                  style={{ fontSize: '12px', color: '#dc3545' }}
                >
                  Excluir
                </button>
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.url.length > 50 ? link.url.substring(0, 50) + '...' : link.url}
                </a>
              </div>
              {link.notes && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {link.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
