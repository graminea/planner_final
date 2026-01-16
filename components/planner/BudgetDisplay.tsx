'use client'

/**
 * BudgetDisplay - Shows budget progress
 * 
 * MINIMAL UI - Intentionally unstyled for v0 redesign
 * 
 * Features:
 * - Total budget with progress bar
 * - Category-level budgets
 * - Planned vs Spent breakdown
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BudgetSummary } from '@/app/actions/budget'
import { setBudget, setCategoryBudget } from '@/app/actions/budget'

interface BudgetDisplayProps {
  summary: BudgetSummary | null
}

export function BudgetDisplay({ summary }: BudgetDisplayProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [newBudget, setNewBudget] = useState(summary?.totalBudget?.toString() || '')
  const [isSaving, setIsSaving] = useState(false)

  if (!summary) {
    return (
      <div style={{ padding: '8px', border: '1px solid #ddd' }}>
        <p>Nenhum orçamento definido</p>
        <button onClick={() => setIsEditing(true)}>Definir Orçamento</button>
        {isEditing && (
          <div style={{ marginTop: '8px' }}>
            <input
              type="number"
              placeholder="Orçamento total"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              style={{ marginRight: '8px' }}
            />
            <button 
              onClick={async () => {
                setIsSaving(true)
                await setBudget(parseFloat(newBudget))
                router.refresh()
                setIsSaving(false)
                setIsEditing(false)
              }}
              disabled={isSaving}
            >
              Salvar
            </button>
          </div>
        )}
      </div>
    )
  }

  const { totalBudget, totalPlanned, totalSpent, remaining, percentSpent, currency, categories } = summary

  return (
    <div style={{ padding: '8px', border: '1px solid #ddd' }}>
      {/* Total Budget Header */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Visão Geral do Orçamento</strong>
          <button onClick={() => setIsEditing(!isEditing)} style={{ fontSize: '12px' }}>
            {isEditing ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {isEditing ? (
          <div style={{ marginTop: '8px' }}>
            <input
              type="number"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              style={{ marginRight: '8px', width: '120px' }}
            />
            <button 
              onClick={async () => {
                setIsSaving(true)
                await setBudget(parseFloat(newBudget))
                router.refresh()
                setIsSaving(false)
                setIsEditing(false)
              }}
              disabled={isSaving}
            >
              Salvar
            </button>
          </div>
        ) : (
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            ${totalBudget.toFixed(2)}
          </div>
        )}
      </div>

      {/* Progress Bar (div-based as required) */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ 
          width: '100%', 
          height: '20px', 
          backgroundColor: '#eee', 
          position: 'relative' 
        }}>
          {/* Planned bar */}
          <div style={{
            position: 'absolute',
            height: '100%',
            width: `${Math.min(summary.percentPlanned, 100)}%`,
            backgroundColor: '#cce5ff',
            left: 0
          }} />
          {/* Spent bar */}
          <div style={{
            position: 'absolute',
            height: '100%',
            width: `${Math.min(percentSpent, 100)}%`,
            backgroundColor: percentSpent > 100 ? '#f8d7da' : '#28a745',
            left: 0
          }} />
        </div>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>
          <span style={{ color: '#28a745' }}>Gasto: R${totalSpent.toFixed(2)}</span>
          {' | '}
          <span style={{ color: '#cce5ff' }}>Planejado: R${totalPlanned.toFixed(2)}</span>
          {' | '}
          <span>Restante: R${remaining.toFixed(2)}</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '14px' }}>
        <div>
          <div style={{ color: '#888' }}>Planejado</div>
          <div>R${totalPlanned.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ color: '#888' }}>Gasto</div>
          <div>R${totalSpent.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ color: '#888' }}>Restante</div>
          <div style={{ color: remaining < 0 ? 'red' : 'green' }}>
            R${remaining.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Category Budgets */}
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Por Categoria</div>
        {categories.map(cat => (
          <CategoryBudgetRow key={cat.id} category={cat} />
        ))}
      </div>
    </div>
  )
}

/**
 * Individual category budget row
 */
function CategoryBudgetRow({ category }: { category: BudgetSummary['categories'][0] }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [budgetValue, setBudgetValue] = useState(category.budget?.toString() || '')

  const handleSave = async () => {
    if (category.id === 'uncategorized') return
    await setCategoryBudget(category.id, budgetValue ? parseFloat(budgetValue) : null)
    router.refresh()
    setIsEditing(false)
  }

  const percentWidth = category.budget 
    ? Math.min((category.spent / category.budget) * 100, 100)
    : (category.planned > 0 ? (category.spent / category.planned) * 100 : 0)

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          {category.icon} {category.name}
          <span style={{ color: '#888', marginLeft: '4px' }}>
            ({category.boughtCount}/{category.itemCount})
          </span>
        </span>
        <span style={{ fontSize: '12px' }}>
          ${category.spent.toFixed(0)} / ${(category.budget || category.planned).toFixed(0)}
          {category.id !== 'uncategorized' && (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              style={{ marginLeft: '4px', fontSize: '10px' }}
            >
              Edit
            </button>
          )}
        </span>
      </div>

      {/* Mini progress bar */}
      <div style={{ 
        width: '100%', 
        height: '4px', 
        backgroundColor: '#eee',
        marginTop: '2px'
      }}>
        <div style={{
          height: '100%',
          width: `${percentWidth}%`,
          backgroundColor: category.percentSpent > 100 ? '#dc3545' : '#28a745'
        }} />
      </div>

      {/* Edit budget */}
      {isEditing && (
        <div style={{ marginTop: '4px' }}>
          <input
            type="number"
            placeholder="Category budget"
            value={budgetValue}
            onChange={(e) => setBudgetValue(e.target.value)}
            style={{ width: '100px', marginRight: '4px' }}
          />
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      )}
    </div>
  )
}
