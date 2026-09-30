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

const FORMATO_FECHA = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

// Recibe AAAA-MM-DD; se interpreta a mediodía local para que la zona horaria no cambie el día.
export function formatearFecha(fecha: string): string {
  return FORMATO_FECHA.format(new Date(`${fecha}T12:00:00`))
}

// Fecha local de hoy en formato AAAA-MM-DD.
export function fechaDeHoy(): string {
  const hoy = new Date()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${hoy.getFullYear()}-${mes}-${dia}`
}
