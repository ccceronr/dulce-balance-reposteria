import { calcularSobres } from './calculos'
import { obtenerPorcentajeManoObra } from './configuracion'
import type {
  Configuracion,
  DatosAplicacion,
  DetalleSobreVenta,
  TipoElaboracion,
  TipoVenta,
  VentaHistorial,
} from './modelos'
import { calcularResultadoPresentacion } from './presentaciones'
import { calcularResultadoReceta } from './recetas'

type DatosCatalogo = Pick<DatosAplicacion, 'inventario' | 'recetas' | 'presentaciones'>

export interface DatosNuevaVenta {
  tipo: TipoVenta
  referenciaId: string
  cantidad: number
  precioUnitario: number
  fecha: string
}

export type ResultadoNuevaVenta =
  | { ok: true; venta: VentaHistorial }
  | { ok: false; error: string }

export interface ResumenMes {
  ventas: VentaHistorial[]
  cantidadVentas: number
  totalVendido: number
  sobres: DetalleSobreVenta
}

type CostoVigente =
  | { ok: true; nombre: string; costoUnitario: number; tipoElaboracion: TipoElaboracion }
  | { ok: false; error: string }

function obtenerCostoVigente(
  tipo: TipoVenta,
  referenciaId: string,
  datos: DatosCatalogo,
  configuracion: Configuracion,
): CostoVigente {
  if (tipo === 'producto') {
    const receta = datos.recetas.find((item) => item.id === referenciaId)
    if (!receta) {
      return { ok: false, error: 'Selecciona un producto válido.' }
    }

    const resultado = calcularResultadoReceta(receta, datos.inventario, configuracion)
    return resultado.ok
      ? {
          ok: true,
          nombre: receta.nombre,
          costoUnitario: resultado.costoPorUnidad,
          tipoElaboracion: receta.tipoElaboracion,
        }
      : resultado
  }

  const caja = datos.presentaciones.find((item) => item.id === referenciaId)
  if (!caja) {
    return { ok: false, error: 'Selecciona una caja válida.' }
  }

  const resultado = calcularResultadoPresentacion(caja, datos, configuracion)
  return resultado.ok
    ? {
        ok: true,
        nombre: caja.nombre,
        costoUnitario: resultado.costoCaja,
        tipoElaboracion: caja.tipoElaboracion,
      }
    : resultado
}

function esFechaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return false
  }

  // Descarta fechas inexistentes como el 30 de febrero.
  const fechaInterpretada = new Date(`${fecha}T00:00:00Z`)
  return !Number.isNaN(fechaInterpretada.getTime()) &&
    fechaInterpretada.toISOString().slice(0, 10) === fecha
}

function multiplicarSobres(sobres: DetalleSobreVenta, cantidad: number): DetalleSobreVenta {
  return {
    sobreReposicion: sobres.sobreReposicion * cantidad,
    sobreSueldo: sobres.sobreSueldo * cantidad,
    sobreGanancia: sobres.sobreGanancia * cantidad,
    dineroLibre: sobres.dineroLibre * cantidad,
  }
}

export function crearVenta(
  datosVenta: DatosNuevaVenta,
  datos: DatosCatalogo,
  configuracion: Configuracion,
): ResultadoNuevaVenta {
  const { tipo, referenciaId, cantidad, precioUnitario, fecha } = datosVenta

  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return { ok: false, error: 'La cantidad vendida debe ser un número entero mayor que cero.' }
  }

  if (!Number.isInteger(precioUnitario) || precioUnitario < 0) {
    return { ok: false, error: 'El precio cobrado debe ser un número entero mayor o igual a cero.' }
  }

  if (!esFechaValida(fecha)) {
    return { ok: false, error: 'Escribe una fecha de venta válida.' }
  }

  const costo = obtenerCostoVigente(tipo, referenciaId, datos, configuracion)
  if (!costo.ok) {
    return costo
  }

  try {
    const { sobreReposicion, sobreSueldo, sobreGanancia, dineroLibre } = calcularSobres({
      costoPorUnidad: costo.costoUnitario,
      precioVenta: precioUnitario,
      tipoElaboracion: costo.tipoElaboracion,
      porcentajeManoObra: obtenerPorcentajeManoObra(costo.tipoElaboracion, configuracion),
    })
    const sobresUnitarios = { sobreReposicion, sobreSueldo, sobreGanancia, dineroLibre }

    return {
      ok: true,
      venta: {
        id: crypto.randomUUID(),
        fecha,
        tipo,
        referenciaId,
        nombre: costo.nombre,
        cantidad,
        precioUnitario,
        costoUnitario: costo.costoUnitario,
        sobresUnitarios,
        totalVenta: precioUnitario * cantidad,
        costoTotal: costo.costoUnitario * cantidad,
        sobresTotales: multiplicarSobres(sobresUnitarios, cantidad),
      },
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'No fue posible registrar la venta.',
    }
  }
}

// `mes` en formato AAAA-MM.
export function resumirMes(historial: VentaHistorial[], mes: string): ResumenMes {
  // Más recientes primero; entre ventas del mismo día, la última registrada va arriba.
  const ventas = historial
    .filter((venta) => venta.fecha.startsWith(`${mes}-`))
    .reverse()
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  return {
    ventas,
    cantidadVentas: ventas.length,
    totalVendido: ventas.reduce((total, venta) => total + venta.totalVenta, 0),
    sobres: ventas.reduce<DetalleSobreVenta>(
      (total, venta) => ({
        sobreReposicion: total.sobreReposicion + venta.sobresTotales.sobreReposicion,
        sobreSueldo: total.sobreSueldo + venta.sobresTotales.sobreSueldo,
        sobreGanancia: total.sobreGanancia + venta.sobresTotales.sobreGanancia,
        dineroLibre: total.dineroLibre + venta.sobresTotales.dineroLibre,
      }),
      { sobreReposicion: 0, sobreSueldo: 0, sobreGanancia: 0, dineroLibre: 0 },
    ),
  }
}
