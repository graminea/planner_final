/**
 * Shared Types for Planner Actions
 * 
 * Types are separated from 'use server' files because
 * Server Actions can only export async functions.
 */

// ============================================================================
// CATEGORY TYPES
// ============================================================================

export interface Category {
  id: string
  name: string
  icon: string | null
  isDefault: boolean
  order: number
  budget: number | null
  createdAt: Date
  updatedAt: Date
  userId: string
  _count?: {
    items: number
  }
}

export interface CategoryWithItems extends Category {
  items: {
    id: string
    name: string
    isBought: boolean
    plannedPrice: number | null
    boughtPrice: number | null
  }[]
}

export const DEFAULT_CATEGORIES = [
  { name: 'Sala de Estar', icon: null, order: 1 },
  { name: 'Cozinha', icon: null, order: 2 },
  { name: 'Quarto', icon: null, order: 3 },
  { name: 'Banheiro', icon: null, order: 4 },
  { name: 'Escritório', icon: null, order: 5 },
  { name: 'Área Externa', icon: null, order: 6 },
  { name: 'Eletrônicos', icon: null, order: 7 },
  { name: 'Decoração', icon: null, order: 8 },
  { name: 'Armazenamento', icon: null, order: 9 },
  { name: 'Outros', icon: null, order: 10 },
]

// ============================================================================
// TAG TYPES
// ============================================================================

export interface Tag {
  id: string
  name: string
  color: string | null
  createdAt: Date
  userId: string
}

// ============================================================================
// ITEM TYPES
// ============================================================================

export interface ItemLink {
  id: string
  itemId: string
  store: string
  url: string
  price: number
  notes: string | null
  isSelected: boolean
  createdAt: Date
}

export interface Item {
  id: string
  name: string
  notes: string | null
  priority: number
  plannedPrice: number | null
  boughtPrice: number | null
  isBought: boolean
  boughtAt: Date | null
  createdAt: Date
  updatedAt: Date
  userId: string
  categoryId: string | null
  category: {
    id: string
    name: string
    icon: string | null
  } | null
  tags: Tag[]
  links: ItemLink[]
  // Computed
  lowestPrice: number | null
  selectedLink: ItemLink | null
}

export interface ItemFilters {
  isBought?: boolean
  categoryId?: string | null // null = uncategorized, undefined = all
  priority?: number
  tagIds?: string[]
  search?: string
}

export type ItemSortField = 'name' | 'price' | 'priority' | 'createdAt'
export type ItemSortOrder = 'asc' | 'desc'

export interface ItemSort {
  field: ItemSortField
  order: ItemSortOrder
}

// ============================================================================
// SUGGESTION TYPES
// ============================================================================

export interface ItemSuggestion {
  id: string
  name: string
  icon: string | null
  categoryName: string | null
  isSystem: boolean
  usageCount: number
  createdAt: Date
  userId: string | null
}

export interface DefaultSuggestion {
  name: string
  icon: string | null
  category: string
}

export const DEFAULT_SUGGESTIONS: DefaultSuggestion[] = [
  // Sala de Estar
  { name: 'Sofá', icon: null, category: 'Sala de Estar' },
  { name: 'Mesa de Centro', icon: null, category: 'Sala de Estar' },
  { name: 'Rack de TV', icon: null, category: 'Sala de Estar' },
  { name: 'Estante', icon: null, category: 'Sala de Estar' },
  { name: 'Tapete', icon: null, category: 'Sala de Estar' },
  { name: 'Luminária de Chão', icon: null, category: 'Sala de Estar' },
  { name: 'Cortinas', icon: null, category: 'Sala de Estar' },
  { name: 'Almofadas', icon: null, category: 'Sala de Estar' },

  // Cozinha
  { name: 'Geladeira', icon: null, category: 'Cozinha' },
  { name: 'Micro-ondas', icon: null, category: 'Cozinha' },
  { name: 'Torradeira', icon: null, category: 'Cozinha' },
  { name: 'Cafeteira', icon: null, category: 'Cozinha' },
  { name: 'Liquidificador', icon: null, category: 'Cozinha' },
  { name: 'Jogo de Panelas', icon: null, category: 'Cozinha' },
  { name: 'Jogo de Facas', icon: null, category: 'Cozinha' },
  { name: 'Tábua de Corte', icon: null, category: 'Cozinha' },
  { name: 'Jogo de Pratos', icon: null, category: 'Cozinha' },
  { name: 'Jogo de Talheres', icon: null, category: 'Cozinha' },
  { name: 'Lixeira', icon: null, category: 'Cozinha' },
  { name: 'Porta Papel Toalha', icon: null, category: 'Cozinha' },

  // Quarto
  { name: 'Cama', icon: null, category: 'Quarto' },
  { name: 'Colchão', icon: null, category: 'Quarto' },
  { name: 'Travesseiros', icon: null, category: 'Quarto' },
  { name: 'Jogo de Cama', icon: null, category: 'Quarto' },
  { name: 'Cômoda', icon: null, category: 'Quarto' },
  { name: 'Criado-Mudo', icon: null, category: 'Quarto' },
  { name: 'Guarda-Roupa', icon: null, category: 'Quarto' },
  { name: 'Abajur', icon: null, category: 'Quarto' },
  { name: 'Despertador', icon: null, category: 'Quarto' },

  // Banheiro
  { name: 'Cortina de Box', icon: null, category: 'Banheiro' },
  { name: 'Toalhas de Banho', icon: null, category: 'Banheiro' },
  { name: 'Tapete de Banheiro', icon: null, category: 'Banheiro' },
  { name: 'Escova Sanitária', icon: null, category: 'Banheiro' },
  { name: 'Saboneteira', icon: null, category: 'Banheiro' },
  { name: 'Porta Escova de Dentes', icon: null, category: 'Banheiro' },
  { name: 'Espelho de Banheiro', icon: null, category: 'Banheiro' },
  { name: 'Cesto de Roupa Suja', icon: null, category: 'Banheiro' },

  // Escritório
  { name: 'Escrivaninha', icon: null, category: 'Escritório' },
  { name: 'Cadeira de Escritório', icon: null, category: 'Escritório' },
  { name: 'Monitor', icon: null, category: 'Escritório' },
  { name: 'Luminária de Mesa', icon: null, category: 'Escritório' },
  { name: 'Arquivo', icon: null, category: 'Escritório' },
  { name: 'Impressora', icon: null, category: 'Escritório' },
  { name: 'Organizador de Mesa', icon: null, category: 'Escritório' },

  // Eletrônicos
  { name: 'TV', icon: null, category: 'Eletrônicos' },
  { name: 'Caixas de Som', icon: null, category: 'Eletrônicos' },
  { name: 'Roteador', icon: null, category: 'Eletrônicos' },
  { name: 'Filtro de Linha', icon: null, category: 'Eletrônicos' },
  { name: 'Central de Automação', icon: null, category: 'Eletrônicos' },
  { name: 'Aspirador de Pó', icon: null, category: 'Eletrônicos' },
  { name: 'Purificador de Ar', icon: null, category: 'Eletrônicos' },
  { name: 'Ventilador', icon: null, category: 'Eletrônicos' },

  // Decoração
  { name: 'Quadros', icon: null, category: 'Decoração' },
  { name: 'Porta-Retratos', icon: null, category: 'Decoração' },
  { name: 'Vasos', icon: null, category: 'Decoração' },
  { name: 'Velas', icon: null, category: 'Decoração' },
  { name: 'Plantas', icon: null, category: 'Decoração' },
  { name: 'Espelho Decorativo', icon: null, category: 'Decoração' },
  { name: 'Relógio de Parede', icon: null, category: 'Decoração' },

  // Armazenamento
  { name: 'Caixas Organizadoras', icon: null, category: 'Armazenamento' },
  { name: 'Organizador de Armário', icon: null, category: 'Armazenamento' },
  { name: 'Sapateira', icon: null, category: 'Armazenamento' },
  { name: 'Cabides', icon: null, category: 'Armazenamento' },
  { name: 'Divisores de Gaveta', icon: null, category: 'Armazenamento' },
  { name: 'Sacos à Vácuo', icon: null, category: 'Armazenamento' },

  // Área Externa
  { name: 'Capacho', icon: null, category: 'Área Externa' },
  { name: 'Móveis de Varanda', icon: null, category: 'Área Externa' },
  { name: 'Churrasqueira', icon: null, category: 'Área Externa' },
  { name: 'Mangueira de Jardim', icon: null, category: 'Área Externa' },
  { name: 'Iluminação Externa', icon: null, category: 'Área Externa' },
  { name: 'Vasos para Plantas', icon: null, category: 'Área Externa' },

  // Outros
  { name: 'Kit de Primeiros Socorros', icon: null, category: 'Outros' },
  { name: 'Caixa de Ferramentas', icon: null, category: 'Outros' },
  { name: 'Extintor de Incêndio', icon: null, category: 'Outros' },
  { name: 'Pilhas', icon: null, category: 'Outros' },
  { name: 'Lâmpadas', icon: null, category: 'Outros' },
  { name: 'Extensão Elétrica', icon: null, category: 'Outros' },
]

// ============================================================================
// BUDGET TYPES
// ============================================================================

export interface BudgetSettings {
  id: string
  userId: string
  totalBudget: number
  currency: string
  createdAt: Date
  updatedAt: Date
}

export interface CategoryBudgetSummary {
  id: string
  name: string
  icon: string | null
  budget: number | null
  planned: number
  spent: number
  remaining: number
  percentSpent: number
  itemCount: number
  boughtCount: number
}

export interface BudgetSummary {
  totalBudget: number
  totalPlanned: number
  totalSpent: number
  remaining: number
  percentSpent: number
  percentPlanned: number
  currency: string
  categories: CategoryBudgetSummary[]
}
