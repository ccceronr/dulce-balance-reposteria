import { describe, expect, it } from 'vitest'
import { CONFIGURACION_PREDETERMINADA } from './configuracion'
import type {
  ArticuloInventario,
  PresentacionVenta,
  Receta,
  VentaHistorial,
} from './modelos'
import { crearVenta, resumirMes, type DatosNuevaVenta } from './ventas'

const inventario: ArticuloInventario[] = [
  {
    id: 'mezcla',
    nombre: 'Mezcla brownie',
    tipo: 'ingrediente',
    precioCompra: 40_000,
    cantidadTotalComprada: 1_000,
    unidad: 'g',
  },
  {
    id: 'caja-craft',
    nombre: 'Caja craft individual',
    tipo: 'empaque',
    precioCompra: 10_000,
    cantidadTotalComprada: 20,
    unidad: 'unidad',
  },
  {
    id: 'caja-regalo',
    nombre: 'Caja regalo',
    tipo: 'empaque',
    precioCompra: 30_000,
    cantidadTotalComprada: 10,
    unidad: 'unidad',
  },
]

// Brownie: costo $2.750 por unidad; precio guardado $7.000.
const brownie: Receta = {
  id: 'brownie',
  nombre: 'Brownie',
  ingredientes: [{ insumoId: 'mezcla', cantidadUsada: 500 }],
  empaques: [{ insumoId: 'caja-craft', cantidadUsada: 1 }],
  rendimiento: 10,
  tipoElaboracion: 'rapida',
  precioVentaReal: 7_000,
}

// Caja: 4 brownies ($11.000) + caja regalo ($3.000 + 10%) = $14.300.
const caja: PresentacionVenta = {
  id: 'caja-x4',
  nombre: 'Caja x4',
  productos: [{ recetaId: 'brownie', cantidad: 4 }],
  empaques: [{ insumoId: 'caja-regalo', cantidad: 1 }],
  tipoElaboracion: 'elaborada',
}

const datos = { inventario, recetas: [brownie], presentaciones: [caja] }

const ventaBrownies: DatosNuevaVenta = {
  tipo: 'producto',
  referenciaId: 'brownie',
  cantidad: 3,
  precioUnitario: 6_000,
  fecha: '2026-09-29',
}

function crear(datosVenta: DatosNuevaVenta, datosActuales = datos): VentaHistorial {
  const resultado = crearVenta(datosVenta, datosActuales, CONFIGURACION_PREDETERMINADA)
  if (!resultado.ok) {
    throw new Error(resultado.error)
  }
  return resultado.venta
}

describe('crearVenta', () => {
  it('guarda una copia de los valores de un producto con el precio cobrado', () => {
    const venta = crear(ventaBrownies)

    expect(venta.tipo).toBe('producto')
    expect(venta.referenciaId).toBe('brownie')
    expect(venta.nombre).toBe('Brownie')
    expect(venta.fecha).toBe('2026-09-29')
    expect(venta.cantidad).toBe(3)
    expect(venta.precioUnitario).toBe(6_000)
    expect(venta.costoUnitario).toBeCloseTo(2_750)
    expect(venta.sobresUnitarios.sobreSueldo).toBeCloseTo(1_200)
    expect(venta.totalVenta).toBe(18_000)
    expect(venta.costoTotal).toBeCloseTo(8_250)
    expect(venta.sobresTotales.sobreReposicion).toBeCloseTo(8_250)
    expect(venta.sobresTotales.sobreSueldo).toBeCloseTo(3_600)
    expect(venta.sobresTotales.sobreGanancia).toBeCloseTo(6_150)
    expect(venta.sobresTotales.dineroLibre).toBeCloseTo(9_750)
    expect(venta.id).toBeTruthy()
  })

  it('registra la venta de una caja con su propio tipo de elaboración', () => {
    const venta = crear({
      tipo: 'caja',
      referenciaId: 'caja-x4',
      cantidad: 1,
      precioUnitario: 32_000,
      fecha: '2026-09-29',
    })

    expect(venta.nombre).toBe('Caja x4')
    expect(venta.costoUnitario).toBeCloseTo(14_300)
    expect(venta.sobresTotales.sobreSueldo).toBeCloseTo(8_000)
    expect(venta.sobresTotales.sobreGanancia).toBeCloseTo(9_700)
  })

  it('no cambia una venta ya creada si después cambia un costo', () => {
    const venta = crear(ventaBrownies)
    const inventarioCaro = inventario.map((articulo) =>
      articulo.id === 'mezcla' ? { ...articulo, precioCompra: 80_000 } : articulo,
    )
    const ventaNueva = crear(ventaBrownies, { ...datos, inventario: inventarioCaro })

    expect(venta.costoUnitario).toBeCloseTo(2_750)
    expect(ventaNueva.costoUnitario).toBeGreaterThan(venta.costoUnitario)
  })

  it('valida producto, cantidad, precio y fecha', () => {
    const errorDe = (cambios: Partial<DatosNuevaVenta>) => {
      const resultado = crearVenta({ ...ventaBrownies, ...cambios }, datos, CONFIGURACION_PREDETERMINADA)
      return resultado.ok ? null : resultado.error
    }

    expect(errorDe({ referenciaId: 'torta' })).toContain('producto')
    expect(errorDe({ tipo: 'caja', referenciaId: 'brownie' })).toContain('caja')
    expect(errorDe({ cantidad: 0 })).toContain('cantidad')
    expect(errorDe({ cantidad: 1.5 })).toContain('cantidad')
    expect(errorDe({ precioUnitario: -1 })).toContain('precio')
    expect(errorDe({ precioUnitario: 10.5 })).toContain('precio')
    expect(errorDe({ fecha: '' })).toContain('fecha')
    expect(errorDe({ fecha: '2026-02-30' })).toContain('fecha')
  })
})

describe('resumirMes', () => {
  const septiembre1 = crear({ ...ventaBrownies, fecha: '2026-09-01' })
  const septiembre2 = crear({ ...ventaBrownies, cantidad: 1, fecha: '2026-09-15' })
  const octubre = crear({ ...ventaBrownies, fecha: '2026-10-02' })

  it('suma solo las ventas del mes elegido', () => {
    const resumen = resumirMes([septiembre1, octubre, septiembre2], '2026-09')

    expect(resumen.cantidadVentas).toBe(2)
    expect(resumen.totalVendido).toBe(24_000)
    expect(resumen.sobres.sobreReposicion).toBeCloseTo(11_000)
    expect(resumen.sobres.sobreSueldo).toBeCloseTo(4_800)
    expect(resumen.sobres.sobreGanancia).toBeCloseTo(8_200)
    expect(resumen.sobres.dineroLibre).toBeCloseTo(13_000)
  })

  it('ordena las ventas de la más reciente a la más antigua', () => {
    const resumen = resumirMes([septiembre1, octubre, septiembre2], '2026-09')

    expect(resumen.ventas.map((venta) => venta.fecha)).toEqual(['2026-09-15', '2026-09-01'])
  })

  it('devuelve ceros si no hay ventas en el mes', () => {
    const resumen = resumirMes([octubre], '2026-09')

    expect(resumen.cantidadVentas).toBe(0)
    expect(resumen.totalVendido).toBe(0)
    expect(resumen.ventas).toEqual([])
  })
})
