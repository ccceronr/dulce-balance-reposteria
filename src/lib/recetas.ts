import {
  calcularCostoReceta,
  calcularPreciosSugeridos,
  calcularSobres,
  type DatosInsumo,
  type ResultadoSobres,
} from './calculos'
import { obtenerPorcentajeManoObra } from './configuracion'
import type {
  ArticuloInventario,
  Configuracion,
  DetalleSobreVenta,
  Receta,
  TipoInventario,
} from './modelos'

export type ResultadoReceta =
  | {
      ok: true
      insumosDirectos: number
      gastosExtras: number
      costoTanda: number
      costoPorUnidad: number
      precioEstandar: number
      precioPremium: number
      precioUsado: number
      usaPrecioReal: boolean
      sobresUnidad: ResultadoSobres
      sobresTanda: DetalleSobreVenta
    }
  | { ok: false; error: string }

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

  if (
    receta.precioVentaReal !== undefined &&
    (!Number.isInteger(receta.precioVentaReal) || receta.precioVentaReal < 0)
  ) {
    return 'El precio de venta real debe ser un número entero mayor o igual a cero.'
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

export function calcularResultadoReceta(
  receta: Receta,
  inventario: ArticuloInventario[],
  configuracion: Configuracion,
): ResultadoReceta {
  const insumos: DatosInsumo[] = []
  // Los ingredientes son por tanda; los empaques son por unidad y se multiplican por el rendimiento.
  const lineas = [
    ...receta.ingredientes.map((linea) => ({ linea, factor: 1 })),
    ...receta.empaques.map((linea) => ({ linea, factor: receta.rendimiento })),
  ]

  for (const { linea, factor } of lineas) {
    const articulo = inventario.find((item) => item.id === linea.insumoId)
    if (!articulo) {
      return {
        ok: false,
        error: 'Uno de los insumos de esta receta ya no está en el inventario. Edita la receta para reemplazarlo.',
      }
    }

    insumos.push({
      precioCompra: articulo.precioCompra,
      cantidadTotalComprada: articulo.cantidadTotalComprada,
      cantidadUsada: linea.cantidadUsada * factor,
    })
  }

  try {
    const costo = calcularCostoReceta({
      insumos,
      rendimiento: receta.rendimiento,
      porcentajeIndirectos: configuracion.porcentajeIndirectos,
    })
    const precios = calcularPreciosSugeridos(costo.costoPorUnidad, {
      multiplicadorEstandar: configuracion.multiplicadorEstandar,
      multiplicadorPremium: configuracion.multiplicadorPremium,
    })
    const usaPrecioReal = receta.precioVentaReal !== undefined
    const precioUsado = receta.precioVentaReal ?? precios.precioEstandar
    const sobresUnidad = calcularSobres({
      costoPorUnidad: costo.costoPorUnidad,
      precioVenta: precioUsado,
      tipoElaboracion: receta.tipoElaboracion,
      porcentajeManoObra: obtenerPorcentajeManoObra(receta.tipoElaboracion, configuracion),
    })

    return {
      ok: true,
      insumosDirectos: costo.insumosDirectos,
      gastosExtras: costo.gastosExtras,
      costoTanda: costo.costoBaseTotal,
      costoPorUnidad: costo.costoPorUnidad,
      precioEstandar: precios.precioEstandar,
      precioPremium: precios.precioPremium,
      precioUsado,
      usaPrecioReal,
      sobresUnidad,
      sobresTanda: {
        sobreReposicion: sobresUnidad.sobreReposicion * receta.rendimiento,
        sobreSueldo: sobresUnidad.sobreSueldo * receta.rendimiento,
        sobreGanancia: sobresUnidad.sobreGanancia * receta.rendimiento,
        dineroLibre: sobresUnidad.dineroLibre * receta.rendimiento,
      },
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'No fue posible calcular esta receta.',
    }
  }
}
