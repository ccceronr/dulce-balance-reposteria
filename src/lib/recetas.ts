import type { ArticuloInventario, Receta, TipoInventario } from './modelos'

export function validarReceta(
  receta: Receta,
  inventario: ArticuloInventario[],
): string | null {
  if (!receta.nombre.trim()) {
    return 'El nombre de la receta es obligatorio.'
  }

  if (!Number.isInteger(receta.rendimiento) || receta.rendimiento <= 0) {
    return 'El rendimiento debe ser un número entero mayor que cero.'
  }

  if (receta.ingredientes.length === 0) {
    return 'Agrega al menos un ingrediente a la receta.'
  }

  const errorIngredientes = validarLineas(
    receta.ingredientes,
    inventario,
    'ingrediente',
  )
  if (errorIngredientes) {
    return errorIngredientes
  }

  return validarLineas(receta.empaques, inventario, 'empaque')
}

function validarLineas(
  lineas: Receta['ingredientes'],
  inventario: ArticuloInventario[],
  tipoEsperado: TipoInventario,
): string | null {
  const nombresTipo = tipoEsperado === 'ingrediente' ? 'ingredientes' : 'empaques'
  const ids = new Set<string>()

  for (const linea of lineas) {
    const articulo = inventario.find((item) => item.id === linea.insumoId)
    if (!articulo || articulo.tipo !== tipoEsperado) {
      return `Selecciona artículos válidos del inventario para los ${nombresTipo}.`
    }

    if (!Number.isFinite(linea.cantidadUsada) || linea.cantidadUsada <= 0) {
      return `La cantidad de cada ${tipoEsperado} debe ser positiva.`
    }

    if (tipoEsperado === 'empaque' && !Number.isInteger(linea.cantidadUsada)) {
      return 'La cantidad de empaques por unidad debe ser entera.'
    }

    if (ids.has(linea.insumoId)) {
      return `Cada ${tipoEsperado} solo puede agregarse una vez.`
    }
    ids.add(linea.insumoId)
  }

  return null
}
