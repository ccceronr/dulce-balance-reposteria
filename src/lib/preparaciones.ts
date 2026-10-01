import { calcularCostoInsumo } from './calculos'
import type { ArticuloInventario, DatosAplicacion, PreparacionBase, Receta } from './modelos'

export type CostoPreparacion =
  | { ok: true; costoTotal: number; costoPorUnidad: number }
  | { ok: false; error: string }

// Solo suma los ingredientes: el % de indirectos se aplica una vez, en el producto que la usa.
export function calcularCostoPreparacion(
  preparacion: PreparacionBase,
  inventario: ArticuloInventario[],
): CostoPreparacion {
  let costoTotal = 0

  for (const linea of preparacion.ingredientes) {
    const articulo = inventario.find((item) => item.id === linea.insumoId)
    if (!articulo) {
      return {
        ok: false,
        error: `Uno de los ingredientes de “${preparacion.nombre}” ya no está en el inventario. Edita la preparación para reemplazarlo.`,
      }
    }

    costoTotal += calcularCostoInsumo({
      precioCompra: articulo.precioCompra,
      cantidadTotalComprada: articulo.cantidadTotalComprada,
      cantidadUsada: linea.cantidadUsada,
    })
  }

  if (!Number.isFinite(preparacion.rendimientoTotal) || preparacion.rendimientoTotal <= 0) {
    return { ok: false, error: `Revisa cuánto pesa o mide lo que sale de “${preparacion.nombre}”.` }
  }

  return { ok: true, costoTotal, costoPorUnidad: costoTotal / preparacion.rendimientoTotal }
}

export function validarPreparacion(
  preparacion: PreparacionBase,
  datos: Pick<DatosAplicacion, 'inventario' | 'preparaciones'>,
): string | null {
  const nombre = preparacion.nombre.trim()
  if (!nombre) {
    return 'El nombre de la preparación es obligatorio.'
  }

  const nombreDuplicado = datos.preparaciones.some(
    (existente) =>
      existente.id !== preparacion.id &&
      existente.nombre.trim().toLocaleLowerCase('es-CO') === nombre.toLocaleLowerCase('es-CO'),
  )
  if (nombreDuplicado) {
    return 'Ya existe una preparación con ese nombre.'
  }

  if (preparacion.ingredientes.length === 0) {
    return 'Agrega al menos un ingrediente a la preparación.'
  }

  const ids = new Set<string>()
  for (const linea of preparacion.ingredientes) {
    const articulo = datos.inventario.find((item) => item.id === linea.insumoId)
    if (!articulo || articulo.tipo !== 'ingrediente') {
      return 'Selecciona ingredientes válidos del inventario para la preparación.'
    }

    if (!Number.isFinite(linea.cantidadUsada) || linea.cantidadUsada <= 0) {
      return 'La cantidad de cada ingrediente debe ser positiva.'
    }

    if (ids.has(linea.insumoId)) {
      return 'Cada ingrediente solo puede agregarse una vez.'
    }
    ids.add(linea.insumoId)
  }

  if (!Number.isFinite(preparacion.rendimientoTotal) || preparacion.rendimientoTotal <= 0) {
    return 'Escribe cuánto pesa o mide lo que sale de la preparación (mayor que cero).'
  }

  if (preparacion.unidad !== 'g' && preparacion.unidad !== 'ml') {
    return 'La preparación se mide en gramos o mililitros.'
  }

  return null
}

export function preparacionEstaEnUso(preparacionId: string, recetas: Receta[]): boolean {
  return recetas.some((receta) =>
    (receta.preparaciones ?? []).some((linea) => linea.preparacionId === preparacionId),
  )
}
