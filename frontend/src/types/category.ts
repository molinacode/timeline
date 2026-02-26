/** Tipos compartidos para categorías */

export interface Category {
  id: number
  name: string
  icon: string | null
  color: string | null
  description: string | null
  /** Categoría especial / destacada (23F, DANA, etc.) */
  isSpecial?: boolean
}
