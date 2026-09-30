import type { UnidadInventario } from './modelos'

export const FORMATO_COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export const FORMATO_CANTIDAD = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 2,
})

export const FORMATO_PORCENTAJE = new Intl.NumberFormat('es-CO', {
  style: 'percent',
  maximumFractionDigits: 1,
})

export const ETIQUETA_UNIDAD: Record<UnidadInventario, string> = {
  g: 'g',
  ml: 'ml',
  unidad: 'und.',
}
