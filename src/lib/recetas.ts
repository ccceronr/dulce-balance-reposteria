import {
  calcularCostoReceta,
  calcularPrecioVenta,
  validarPrecioVentaReal,
  type DatosInsumo,
  type ResultadoSobres,
} from './calculos'
import type {
  ArticuloInventario,
  Configuracion,
  DatosAplicacion,
  DetalleSobreVenta,
  Receta,
  TipoInventario,
} from './modelos'
import { calcularCostoPreparacion } from './preparaciones'

type Catalogo = Pick<DatosAplicacion, 'inventario' | 'preparaciones'>

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

export function validarReceta(receta: Receta, datos: Catalogo): string | null {
  if (!receta.nombre.trim()) {
    return 'El nombre de la receta es obligatorio.'
  }

  if (!Number.isInteger(receta.rendimiento) || receta.rendimiento <= 0) {
    return 'El rendimiento debe ser un número entero mayor que cero.'
  }

  const errorPrecio = validarPrecioVentaReal(receta.precioVentaReal)
  if (errorPrecio) {
    return errorPrecio
  }

  const preparaciones = receta.preparaciones ?? []
  if (receta.ingredientes.length === 0 && preparaciones.length === 0) {
    return 'Agrega al menos un ingrediente o una preparación base a la receta.'
  }

  const errorIngredientes = validarLineas(
    receta.ingredientes,
    datos.inventario,
    'ingrediente',
  )
  if (errorIngredientes) {
    return errorIngredientes
  }

  const errorPreparaciones = validarLineasPreparacion(preparaciones, datos)
  if (errorPreparaciones) {
    return errorPreparaciones
  }

  return validarLineas(receta.empaques, datos.inventario, 'empaque')
}

function validarLineasPreparacion(
  lineas: NonNullable<Receta['preparaciones']>,
  datos: Catalogo,
): string | null {
  const ids = new Set<string>()

  for (const linea of lineas) {
    if (!datos.preparaciones.some((preparacion) => preparacion.id === linea.preparacionId)) {
      return 'Selecciona preparaciones base válidas para la receta.'
    }

    if (!Number.isFinite(linea.cantidadUsada) || linea.cantidadUsada <= 0) {
      return 'La cantidad de cada preparación base debe ser positiva.'
    }

    if (ids.has(linea.preparacionId)) {
      return 'Cada preparación base solo puede agregarse una vez.'
    }
    ids.add(linea.preparacionId)
  }

  return null
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
  datos: Catalogo,
  configuracion: Configuracion,
): ResultadoReceta {
  const insumos: DatosInsumo[] = []
  // Los ingredientes son por tanda; los empaques son por unidad y se multiplican por el rendimiento.
  const lineas = [
    ...receta.ingredientes.map((linea) => ({ linea, factor: 1 })),
    ...receta.empaques.map((linea) => ({ linea, factor: receta.rendimiento })),
  ]

  for (const { linea, factor } of lineas) {
    const articulo = datos.inventario.find((item) => item.id === linea.insumoId)
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

  // Las preparaciones base son por tanda, como los ingredientes: su costo total se reparte
  // entre lo que pesan o miden, y se cobra la parte usada.
  for (const linea of receta.preparaciones ?? []) {
    const preparacion = datos.preparaciones.find((item) => item.id === linea.preparacionId)
    if (!preparacion) {
      return {
        ok: false,
        error: 'Una de las preparaciones base de esta receta ya no existe. Edita la receta para reemplazarla.',
      }
    }

    const costoPreparacion = calcularCostoPreparacion(preparacion, datos.inventario)
    if (!costoPreparacion.ok) {
      return costoPreparacion
    }

    insumos.push({
      precioCompra: costoPreparacion.costoTotal,
      cantidadTotalComprada: preparacion.rendimientoTotal,
      cantidadUsada: linea.cantidadUsada,
    })
  }

  try {
    const costo = calcularCostoReceta({
      insumos,
      rendimiento: receta.rendimiento,
      porcentajeIndirectos: configuracion.porcentajeIndirectos,
    })
    const { sobres: sobresUnidad, ...venta } = calcularPrecioVenta({
      costoPorUnidad: costo.costoPorUnidad,
      precioVentaReal: receta.precioVentaReal,
      tipoElaboracion: receta.tipoElaboracion,
      configuracion,
    })

    return {
      ok: true,
      insumosDirectos: costo.insumosDirectos,
      gastosExtras: costo.gastosExtras,
      costoTanda: costo.costoBaseTotal,
      costoPorUnidad: costo.costoPorUnidad,
      ...venta,
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
