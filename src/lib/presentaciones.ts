import {
  calcularCostoInsumo,
  calcularPrecioVenta,
  validarPrecioVentaReal,
  type ResultadoSobres,
} from './calculos'
import type {
  Configuracion,
  DatosAplicacion,
  PresentacionVenta,
} from './modelos'
import { calcularResultadoReceta } from './recetas'

export type ResultadoPresentacion =
  | {
      ok: true
      costoProductos: number
      costoEmpaques: number
      gastosExtras: number
      costoCaja: number
      precioEstandar: number
      precioPremium: number
      precioUsado: number
      usaPrecioReal: boolean
      sobres: ResultadoSobres
    }
  | { ok: false; error: string }

export function validarPresentacion(
  presentacion: PresentacionVenta,
  datos: Pick<DatosAplicacion, 'inventario' | 'recetas' | 'presentaciones'>,
): string | null {
  const nombre = presentacion.nombre.trim()
  if (!nombre) {
    return 'El nombre de la caja es obligatorio.'
  }

  const nombreDuplicado = datos.presentaciones.some(
    (existente) =>
      existente.id !== presentacion.id &&
      existente.nombre.trim().toLocaleLowerCase('es-CO') === nombre.toLocaleLowerCase('es-CO'),
  )
  if (nombreDuplicado) {
    return 'Ya existe una caja con ese nombre.'
  }

  if (presentacion.productos.length === 0) {
    return 'Agrega al menos un producto a la caja.'
  }

  const errorProductos = validarLineas(
    presentacion.productos.map((producto) => ({ id: producto.recetaId, cantidad: producto.cantidad })),
    (id) => datos.recetas.some((receta) => receta.id === id),
    'productos',
  )
  if (errorProductos) {
    return errorProductos
  }

  const errorEmpaques = validarLineas(
    presentacion.empaques.map((empaque) => ({ id: empaque.insumoId, cantidad: empaque.cantidad })),
    (id) => datos.inventario.some((articulo) => articulo.id === id && articulo.tipo === 'empaque'),
    'empaques',
  )
  if (errorEmpaques) {
    return errorEmpaques
  }

  return validarPrecioVentaReal(presentacion.precioVentaReal)
}

function validarLineas(
  lineas: { id: string; cantidad: number }[],
  existe: (id: string) => boolean,
  nombreLista: 'productos' | 'empaques',
): string | null {
  const ids = new Set<string>()

  for (const linea of lineas) {
    if (!existe(linea.id)) {
      return `Selecciona ${nombreLista} válidos para la caja.`
    }

    if (!Number.isInteger(linea.cantidad) || linea.cantidad <= 0) {
      return `La cantidad de ${nombreLista} debe ser un número entero mayor que cero.`
    }

    if (ids.has(linea.id)) {
      return `Cada uno de los ${nombreLista} solo puede agregarse una vez.`
    }
    ids.add(linea.id)
  }

  return null
}

export function calcularResultadoPresentacion(
  presentacion: PresentacionVenta,
  datos: Pick<DatosAplicacion, 'inventario' | 'recetas' | 'preparaciones'>,
  configuracion: Configuracion,
): ResultadoPresentacion {
  let costoProductos = 0
  // El costo por unidad de cada producto ya incluye sus indirectos y sus empaques individuales.
  for (const producto of presentacion.productos) {
    const receta = datos.recetas.find((item) => item.id === producto.recetaId)
    if (!receta) {
      return {
        ok: false,
        error: 'Uno de los productos de esta caja ya no existe. Edita la caja para reemplazarlo.',
      }
    }

    const resultadoReceta = calcularResultadoReceta(receta, datos, configuracion)
    if (!resultadoReceta.ok) {
      return { ok: false, error: `“${receta.nombre}”: ${resultadoReceta.error}` }
    }
    costoProductos += resultadoReceta.costoPorUnidad * producto.cantidad
  }

  let costoEmpaques = 0
  for (const empaque of presentacion.empaques) {
    const articulo = datos.inventario.find((item) => item.id === empaque.insumoId)
    if (!articulo) {
      return {
        ok: false,
        error: 'Uno de los empaques de esta caja ya no está en el inventario. Edita la caja para reemplazarlo.',
      }
    }

    costoEmpaques += calcularCostoInsumo({
      precioCompra: articulo.precioCompra,
      cantidadTotalComprada: articulo.cantidadTotalComprada,
      cantidadUsada: empaque.cantidad,
    })
  }

  try {
    // Los indirectos solo se suman a los empaques exteriores; los productos ya los traen.
    const gastosExtras = costoEmpaques * configuracion.porcentajeIndirectos
    const costoCaja = costoProductos + costoEmpaques + gastosExtras

    return {
      ok: true,
      costoProductos,
      costoEmpaques,
      gastosExtras,
      costoCaja,
      ...calcularPrecioVenta({
        costoPorUnidad: costoCaja,
        precioVentaReal: presentacion.precioVentaReal,
        tipoElaboracion: presentacion.tipoElaboracion,
        configuracion,
      }),
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'No fue posible calcular esta caja.',
    }
  }
}
