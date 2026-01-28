"use client"

/**
 * BudgetDisplay - Redesigned Budget System
 * 
 * MENTAL MODEL:
 * - One single source of truth: the overall budget
 * - Categories have "allocations" that divide the budget
 * - Sum of allocations ≤ overall budget
 * - Real-time feedback shows remaining available for allocation
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import Image from "next/image"
import { Wallet, Check, X, Pencil, AlertCircle, PiggyBank } from "lucide-react"
import type { BudgetSummary } from "@/app/actions/budget"
import { setBudget, setCategoryAllocation } from "@/app/actions/budget"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BudgetDisplayProps {
  summary: BudgetSummary | null
}

export function BudgetDisplay({ summary }: BudgetDisplayProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [chartView, setChartView] = useState<"bar" | "donut">("donut")
  const [showGraphs, setShowGraphs] = useState(false)
  const [newBudget, setNewBudget] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const isFigueira = mounted && theme === 'figueira'
  const isCouple = mounted && theme === 'couple'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (summary?.totalBudget) {
      setNewBudget(summary.totalBudget.toString())
    }
    // Clear optimistic state when summary changes (i.e., when server data arrives)
    setOptimisticBudget(null)
  }, [summary?.totalBudget])

  // Optimistic budget state
  const [optimisticBudget, setOptimisticBudget] = useState<number | null>(null)

  const handleSaveBudget = async () => {
    setError(null)
    
    const value = parseFloat(newBudget)
    if (isNaN(value) || value < 0) {
      setError("Digite um valor válido")
      return
    }

    // Optimistic update - close editor and show new value immediately
    setOptimisticBudget(value)
    setIsEditingBudget(false)

    // Sync with DB in background
    setBudget(value).then(result => {
      if (!result.success) {
        setError(result.error || "Erro ao salvar")
        setOptimisticBudget(null) // Rollback
        setIsEditingBudget(true)
      } else {
        router.refresh()
      }
    }).catch(() => {
      setOptimisticBudget(null)
      setIsEditingBudget(true)
    })
  }

  // No budget set yet - prompt user to set one
  if (!summary?.hasBudget) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4">
            {isFigueira ? (
              <div className="w-12 h-12 relative">
                <Image 
                  src="/figueirense/icon.png" 
                  alt="Figueirense" 
                  fill
                  className="object-contain"
                />
              </div>
            ) : isCouple ? (
              <div className="w-12 h-12 relative rounded-full overflow-hidden border-2 border-primary">
                <Image 
                  src="/couple/icon.jpg" 
                  alt="Surpresinha bb" 
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <PiggyBank className="w-6 h-6 text-primary" />
              </div>
            )}
            <div>
              <h3 className="font-medium mb-1">Defina seu orçamento total</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Quanto moneys nois tem mor?
              </p>
              
              {error && (
                <div className="text-sm text-destructive mb-3 flex items-center gap-1 justify-center">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 justify-center">
                <span className="text-sm text-muted-foreground">R$</span>
                <Input
                  type="number"
                  placeholder="5000"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="w-32"
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveBudget}>
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { 
    totalBudget: summaryBudget, 
    totalSpent, 
    totalAllocated, 
    unallocated: summaryUnallocated, 
    remaining: summaryRemaining,
    categories 
  } = summary

  // Use optimistic budget if set, otherwise use summary budget
  const totalBudget = optimisticBudget ?? summaryBudget
  // Recalculate derived values when using optimistic budget
  const unallocated = optimisticBudget !== null 
    ? totalBudget - totalAllocated 
    : summaryUnallocated
  const remaining = optimisticBudget !== null 
    ? totalBudget - totalSpent 
    : summaryRemaining

  const percentSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  const percentAllocated = totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0
  const percentRemaining = totalBudget > 0 ? Math.max((remaining / totalBudget) * 100, 0) : 0
  const percentUnallocated = totalBudget > 0 ? Math.max((unallocated / totalBudget) * 100, 0) : 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            Orçamento Total
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={() => setIsEditingBudget(!isEditingBudget)}
          >
            {isEditingBudget ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Budget Display / Edit */}
        {isEditingBudget ? (
          <div className="space-y-2">
            {error && (
              <div className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">R$</span>
              <Input 
                type="number" 
                value={newBudget} 
                onChange={(e) => { setNewBudget(e.target.value); setError(null) }} 
                className="h-9" 
              />
              <Button size="sm" onClick={handleSaveBudget}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
            {summary.totalAllocated > 0 && (
              <p className="text-xs text-muted-foreground">
                Mínimo: R${summary.totalAllocated.toFixed(0)} (já alocado em categorias)
              </p>
            )}
          </div>
        ) : (
          <div>
            <div className="text-3xl font-bold text-foreground">
              R${totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </div>
          </div>
        )}

        {/* Allocation Progress Bar */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded-full overflow-hidden relative">
            {/* Allocated but not spent (lighter) - full background */}
            <div
              className="absolute inset-y-0 left-0 bg-primary/30 transition-all duration-500"
              style={{ width: `${Math.min(percentAllocated, 100)}%` }}
            />
            {/* Spent portion (solid color) - on top */}
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
              Gasto: R${totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary/30" />
              Alocado: R${totalAllocated.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Graph View Toggle */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowGraphs(!showGraphs)}
            className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
          >
            <span>Grafecos top mor</span>
            <span className="text-xs normal-case font-normal">
              {showGraphs ? "Ocultar ▲" : "Mostrar ▼"}
            </span>
          </button>

          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showGraphs ? "max-h-[520px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-4"
            }`}
          >
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground text-center">Gastos</div>
                <DonutChart
                  segments={[
                    { value: totalSpent, color: percentSpent > 100 ? "#ef4444" : "#f12c2c" },
                    { value: Math.max(remaining, 0), color: "#32f50b" },
                  ]}
                />
                <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: percentSpent > 100 ? "#ef4444" : "#f12c2c" }} />
                    Gasto
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: "#32f50b" }} />
                    Restante
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-muted-foreground text-center">Alocação</div>
                <DonutChart
                  segments={[
                    { value: totalAllocated, color: "#6366f1" },
                    { value: Math.max(unallocated, 0), color: "#fffb00" },
                  ]}
                />
                <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
                    Alocado
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: "#fffb00" }} />
                    Disponível
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Gasto</div>
            <div className="text-lg font-semibold">R${totalSpent.toFixed(0)}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Alocado</div>
            <div className="text-lg font-semibold">R${totalAllocated.toFixed(0)}</div>
          </div>
          <div className={`text-center p-3 rounded-lg ${remaining < 0 ? "bg-destructive/10" : "bg-primary/10"}`}>
            <div className="text-xs text-muted-foreground">Restante</div>
            <div className={`text-lg font-semibold ${remaining < 0 ? "text-destructive" : "text-primary"}`}>
              R${remaining.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Unallocated Budget Alert */}
        {unallocated > 0 && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <PiggyBank className="w-4 h-4" />
              <span className="text-sm font-medium">
                R${unallocated.toFixed(0)} disponível para alocar
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Distribua esse valor entre suas categorias
            </p>
          </div>
        )}

        {/* Category Allocations */}
        {categories.length > 0 && (
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Alocação por Categoria
              </span>
              <span className="text-xs text-muted-foreground">
                Disponível: R${unallocated.toFixed(0)}
              </span>
            </div>
            
            {categories.map((cat) => (
              <CategoryAllocationRow 
                key={cat.id} 
                category={cat} 
                availableBudget={unallocated}
                totalBudget={totalBudget}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface CategoryAllocationRowProps {
  category: BudgetSummary["categories"][0]
  availableBudget: number
  totalBudget: number
}

function CategoryAllocationRow({ category, availableBudget, totalBudget }: CategoryAllocationRowProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [allocationValue, setAllocationValue] = useState(category.budget?.toString() || "")
  const [error, setError] = useState<string | null>(null)
  const [optimisticAllocation, setOptimisticAllocation] = useState<number | null>(null)

  // Clear optimistic state when category.budget changes (i.e., when server data arrives)
  useEffect(() => {
    setOptimisticAllocation(null)
    setAllocationValue(category.budget?.toString() || "")
  }, [category.budget])

  // Max this category can allocate = current allocation + available
  const maxAllocation = (category.budget ?? 0) + availableBudget

  const handleSave = async () => {
    if (category.id === "uncategorized") return
    
    setError(null)

    const value = allocationValue ? parseFloat(allocationValue) : null
    
    if (value !== null && value < 0) {
      setError("Valor deve ser positivo bb duuuur")
      return
    }

    if (value !== null && value > maxAllocation) {
      setError(`So tem mais isso affs veyr: R$${maxAllocation.toFixed(0)}`)
      return
    }

    // Optimistic update - close editor and show new value immediately
    setOptimisticAllocation(value ?? 0)
    setIsEditing(false)

    // Sync with DB in background
    setCategoryAllocation(category.id, value).then(result => {
      if (!result.success) {
        setError(result.error || "Erro ao salvar")
        setOptimisticAllocation(null) // Rollback
        setIsEditing(true)
      } else {
        router.refresh()
      }
    }).catch(() => {
      setOptimisticAllocation(null)
      setIsEditing(true)
    })
  }

  // Calculate progress - use optimistic value if set
  const allocation = optimisticAllocation ?? (category.budget ?? 0)
  const percentOfAllocation = allocation > 0 
    ? Math.min((category.spent / allocation) * 100, 100) 
    : 0
  const isOverBudget = allocation > 0 && category.spent > allocation

  return (
    <div className="group p-2 rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-foreground">
          <span>{category.icon}</span>
          <span className="font-medium truncate">{category.name}</span>
          <span className="text-xs text-muted-foreground">
            ({category.boughtCount}/{category.itemCount})
          </span>
        </span>

        {isEditing ? (
          <div className="flex flex-col items-end gap-1">
            {error && (
              <span className="text-xs text-destructive">{error}</span>
            )}
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">R$</span>
              <Input
                type="number"
                value={allocationValue}
                onChange={(e) => { setAllocationValue(e.target.value); setError(null) }}
                className="h-7 w-24 text-xs"
                placeholder="0"
                max={maxAllocation}
              />
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 w-7 p-0" 
                onClick={handleSave}
              >
                <Check className="w-3 h-3" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 w-7 p-0" 
                onClick={() => { setIsEditing(false); setError(null) }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <span className="text-xs text-muted-foreground">
              Máx: R${maxAllocation.toFixed(0)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className={`text-xs font-medium ${isOverBudget ? "text-destructive" : ""}`}>
                R${category.spent.toFixed(0)} 
                <span className="text-muted-foreground"> / </span>
                {allocation > 0 ? (
                  <span>R${allocation.toFixed(0)}</span>
                ) : (
                  <span className="text-muted-foreground italic">não alocado</span>
                )}
              </div>
            </div>
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
          </div>
        )}
      </div>

      {/* Progress bar */}
      {allocation > 0 && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
          <div
            className={`h-full transition-all duration-300 ${
              isOverBudget ? "bg-destructive" : "bg-primary/60"
            }`}
            style={{ width: `${percentOfAllocation}%` }}
          />
        </div>
      )}
      
      {/* Show planned vs allocation difference */}
      {allocation > 0 && category.planned > allocation && (
        <div className="flex items-center gap-1 mt-1 text-xs text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-3 h-3" />
          Itens planejados (R${category.planned.toFixed(0)}) excedem alocação
        </div>
      )}
    </div>
  )
}

interface DonutSegment {
  value: number
  color: string
}

function DonutChart({ segments }: { segments: DonutSegment[] }) {
  const [animate, setAnimate] = useState(false)
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const normalized = total > 0 ? segments : [{ value: 1, color: "hsl(var(--muted-foreground) / 0.2)" }]
  const safeTotal = normalized.reduce((sum, s) => sum + s.value, 0)
  
  // Trigger animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // Calculate all segments with their offsets
  const segmentsWithOffsets = normalized.map((segment, index) => {
    const percent = safeTotal > 0 ? (segment.value / safeTotal) * 100 : 0
    const previousPercents = normalized
      .slice(0, index)
      .reduce((sum, s) => sum + (safeTotal > 0 ? (s.value / safeTotal) * 100 : 0), 0)
    return {
      ...segment,
      percent,
      offset: 25 - previousPercents, // 25 starts at top (12 o'clock)
    }
  })

  return (
    <div className="flex items-center justify-center">
      <svg viewBox="0 0 36 36" className="h-24 w-24">
        {/* Background circle */}
        <circle
          cx="18"
          cy="18"
          r="15.915"
          fill="transparent"
          stroke="hsl(var(--muted))"
          strokeWidth="4"
        />
        {/* Segments */}
        {segmentsWithOffsets.map((segment, index) => (
          <circle
            key={index}
            cx="18"
            cy="18"
            r="15.915"
            fill="transparent"
            stroke={segment.color}
            strokeWidth="4"
            strokeDasharray={animate ? `${segment.percent} ${100 - segment.percent}` : "0 100"}
            strokeDashoffset={segment.offset}
            strokeLinecap="butt"
            style={{
              transition: `stroke-dasharray 0.8s ease-out ${index * 0.1}s`,
            }}
          />
        ))}
      </svg>
    </div>
  )
}
