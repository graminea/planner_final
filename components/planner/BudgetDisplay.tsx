"use client"

/**
 * BudgetDisplay - Shows budget progress with calm purple theme
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Check, X, Wallet } from "lucide-react"
import type { BudgetSummary } from "@/app/actions/budget"
import { setBudget, setCategoryBudget } from "@/app/actions/budget"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BudgetDisplayProps {
  summary: BudgetSummary | null
}

export function BudgetDisplay({ summary }: BudgetDisplayProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [newBudget, setNewBudget] = useState(summary?.totalBudget?.toString() || "")
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await setBudget(Number.parseFloat(newBudget))
    router.refresh()
    setIsSaving(false)
    setIsEditing(false)
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-3">Nenhum orçamento definido</p>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Valor total"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-32"
                  />
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  Definir Orçamento
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { totalBudget, totalPlanned, totalSpent, remaining, percentSpent } = summary

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            Orçamento
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">R$</span>
            <Input type="number" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} className="h-9" />
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Check className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="text-2xl font-semibold text-foreground">R${totalBudget.toFixed(2)}</div>
        )}

        <div className="space-y-2">
          <div className="h-3 bg-muted rounded-full overflow-hidden relative">
            {/* Planned bar (lighter) */}
            <div
              className="absolute inset-y-0 left-0 bg-primary/30 transition-all duration-500"
              style={{ width: `${Math.min(summary.percentPlanned, 100)}%` }}
            />
            {/* Spent bar (solid) */}
            <div
              className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                percentSpent > 100 ? "bg-destructive" : "bg-primary"
              }`}
              style={{ width: `${Math.min(percentSpent, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Gasto: R${totalSpent.toFixed(0)}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary/30" />
              Planejado: R${totalPlanned.toFixed(0)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Planejado</div>
            <div className="text-sm font-medium">R${totalPlanned.toFixed(0)}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Gasto</div>
            <div className="text-sm font-medium">R${totalSpent.toFixed(0)}</div>
          </div>
          <div className={`text-center p-2 rounded-lg ${remaining < 0 ? "bg-destructive/10" : "bg-primary/10"}`}>
            <div className="text-xs text-muted-foreground">Restante</div>
            <div className={`text-sm font-medium ${remaining < 0 ? "text-destructive" : "text-primary"}`}>
              R${remaining.toFixed(0)}
            </div>
          </div>
        </div>

        {summary.categories.length > 0 && (
          <div className="pt-2 space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Por Categoria</div>
            {summary.categories.map((cat) => (
              <CategoryBudgetRow key={cat.id} category={cat} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CategoryBudgetRow({ category }: { category: BudgetSummary["categories"][0] }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [budgetValue, setBudgetValue] = useState(category.budget?.toString() || "")

  const handleSave = async () => {
    if (category.id === "uncategorized") return
    await setCategoryBudget(category.id, budgetValue ? Number.parseFloat(budgetValue) : null)
    router.refresh()
    setIsEditing(false)
  }

  const percentWidth = category.budget
    ? Math.min((category.spent / category.budget) * 100, 100)
    : category.planned > 0
      ? (category.spent / category.planned) * 100
      : 0

  return (
    <div className="group">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-foreground">
          <span>{category.icon}</span>
          <span className="truncate">{category.name}</span>
          <span className="text-xs text-muted-foreground">
            ({category.boughtCount}/{category.itemCount})
          </span>
        </span>

        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={budgetValue}
              onChange={(e) => setBudgetValue(e.target.value)}
              className="h-7 w-20 text-xs"
              placeholder="Orçamento"
            />
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSave}>
              <Check className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setIsEditing(false)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            R${category.spent.toFixed(0)} / R${(category.budget || category.planned).toFixed(0)}
            {category.id !== "uncategorized" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="w-3 h-3" />
              </Button>
            )}
          </span>
        )}
      </div>

      {/* Mini progress bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden mt-1">
        <div
          className={`h-full transition-all duration-300 ${
            category.percentSpent > 100 ? "bg-destructive" : "bg-primary/60"
          }`}
          style={{ width: `${percentWidth}%` }}
        />
      </div>
    </div>
  )
}
