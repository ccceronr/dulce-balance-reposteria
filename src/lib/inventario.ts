import type { ArticuloInventario, DatosAplicacion } from './modelos'

type DatosUso = Pick<DatosAplicacion, 'recetas' | 'presentaciones' | 'preparaciones'>

export function articuloEstaEnUso(articuloId: string, datos: DatosUso): boolean {
  const usadoEnReceta = datos.recetas.some((receta) =>
    [...receta.ingredientes, ...receta.empaques].some(
      (linea) => linea.insumoId === articuloId,
    ),
  )
  const usadoEnPresentacion = datos.presentaciones.some((presentacion) =>
    presentacion.empaques.some((empaque) => empaque.insumoId === articuloId),
  )
  const usadoEnPreparacion = datos.preparaciones.some((preparacion) =>
    preparacion.ingredientes.some((linea) => linea.insumoId === articuloId),
  )

  return usadoEnReceta || usadoEnPresentacion || usadoEnPreparacion
}

export function validarArticulo(
  articulo: ArticuloInventario,
  datos: DatosUso & Pick<DatosAplicacion, 'inventario'>,
): string | null {
  if (!articulo.nombre.trim()) {
    return 'Escribe el nombre del ingrediente o empaque.'
  }

  if (!Number.isInteger(articulo.precioCompra) || articulo.precioCompra < 0) {
    return 'El precio pagado debe ser un monto entero igual o mayor que cero.'
  }

  if (!Number.isFinite(articulo.cantidadTotalComprada) || articulo.cantidadTotalComprada <= 0) {
    return 'La cantidad comprada debe ser mayor que cero.'
  }

  if (articulo.tipo === 'empaque' && articulo.unidad !== 'unidad') {
    return 'Los empaques se miden por unidad.'
  }

  if (articulo.tipo === 'empaque' && !Number.isInteger(articulo.cantidadTotalComprada)) {
    return 'La cantidad de empaques debe ser un número entero.'
  }

  const articuloActual = datos.inventario.find((actual) => actual.id === articulo.id)
  if (
    articuloActual &&
    articuloActual.tipo !== articulo.tipo &&
    articuloEstaEnUso(articulo.id, datos)
  ) {
    return 'No puedes cambiar el tipo de un ingrediente o empaque asociado a una receta, preparación o caja.'
  }

  return null
}

// La cantidad usada en las recetas no se convierte: al cambiar la unidad hay que revisarlas.
export function cambiaUnidadEnUso(
  articulo: ArticuloInventario,
  datos: DatosUso & Pick<DatosAplicacion, 'inventario'>,
): boolean {
  const articuloActual = datos.inventario.find((actual) => actual.id === articulo.id)

  return Boolean(
    articuloActual &&
      articuloActual.unidad !== articulo.unidad &&
      articuloEstaEnUso(articulo.id, datos),
  )
}
