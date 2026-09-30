import { describe, expect, it } from 'vitest'
import {
  calcularCostoInsumo,
  calcularCostoReceta,
  calcularPreciosSugeridos,
  calcularSobres,
} from './calculos'

describe('calcularCostoInsumo', () => {
  it('calcula el costo proporcional de la mantequilla', () => {
    expect(
      calcularCostoInsumo({
        precioCompra: 13_000,
        cantidadTotalComprada: 500,
        cantidadUsada: 100,
      }),
    ).toBe(2_600)
  })

  it('rechaza cantidades compradas iguales a cero y cantidades usadas negativas', () => {
    expect(() =>
      calcularCostoInsumo({
        precioCompra: 13_000,
        cantidadTotalComprada: 0,
        cantidadUsada: 100,
      }),
    ).toThrow()

    expect(() =>
      calcularCostoInsumo({
        precioCompra: 13_000,
        cantidadTotalComprada: 500,
        cantidadUsada: -1,
      }),
    ).toThrow()
  })
})

describe('calcularCostoReceta', () => {
  it('suma ingredientes y empaques, agrega indirectos y calcula costo por unidad', () => {
    const resultado = calcularCostoReceta({
      insumos: [
        { precioCompra: 13_000, cantidadTotalComprada: 500, cantidadUsada: 100 },
        { precioCompra: 5_000, cantidadTotalComprada: 10, cantidadUsada: 1 },
      ],
      rendimiento: 3,
    })

    expect(resultado).toEqual({
      insumosDirectos: 3_100,
      gastosExtras: 310,
      costoBaseTotal: 3_410,
      costoPorUnidad: 3_410 / 3,
    })
  })

  it('permite configurar el porcentaje de costos indirectos', () => {
    const resultado = calcularCostoReceta({
      insumos: [{ precioCompra: 1_000, cantidadTotalComprada: 1, cantidadUsada: 1 }],
      rendimiento: 1,
      porcentajeIndirectos: 0.2,
    })

    expect(resultado.gastosExtras).toBe(200)
  })

  it.each([0, -1])('rechaza un rendimiento de %s', (rendimiento) => {
    expect(() => calcularCostoReceta({ insumos: [], rendimiento })).toThrow()
  })
})

describe('calcularPreciosSugeridos', () => {
  it('aplica los multiplicadores predeterminados y redondea al millar más cercano', () => {
    expect(calcularPreciosSugeridos(1_000)).toEqual({
      precioEstandar: 2_000,
      precioPremium: 3_000,
    })
  })

  it('redondea los empates exactos hacia arriba', () => {
    expect(
      calcularPreciosSugeridos(1_000, {
        multiplicadorEstandar: 1.5,
        multiplicadorPremium: 1.49,
      }),
    ).toEqual({
      precioEstandar: 2_000,
      precioPremium: 1_000,
    })
  })

  it('redondea al valor configurado: $500, $100 o al peso', () => {
    // 1.000 × 2,25 = 2.250 (empate a $500) y 1.000 × 2,35 = 2.350 (empate a $100).
    expect(
      calcularPreciosSugeridos(1_000, {
        multiplicadorEstandar: 2.25,
        multiplicadorPremium: 2.6,
        valorRedondeo: 500,
      }),
    ).toEqual({ precioEstandar: 2_500, precioPremium: 2_500 })
    expect(
      calcularPreciosSugeridos(1_000, {
        multiplicadorEstandar: 2.35,
        multiplicadorPremium: 2.34,
        valorRedondeo: 100,
      }),
    ).toEqual({ precioEstandar: 2_400, precioPremium: 2_300 })
    expect(
      calcularPreciosSugeridos(1_066.4, { valorRedondeo: 1 }),
    ).toEqual({ precioEstandar: 2_346, precioPremium: 2_666 })
  })
})

describe('calcularSobres', () => {
  it('usa el 20% predeterminado para elaboración rápida', () => {
    expect(
      calcularSobres({
        costoPorUnidad: 5_000,
        precioVenta: 10_000,
        tipoElaboracion: 'rapida',
      }),
    ).toEqual({
      sobreReposicion: 5_000,
      sobreSueldo: 2_000,
      sobreGanancia: 3_000,
      dineroLibre: 5_000,
      alertaPerdida: false,
      alertaSueldo: false,
    })
  })

  it('usa el 25% predeterminado para elaboración elaborada', () => {
    expect(
      calcularSobres({
        costoPorUnidad: 5_000,
        precioVenta: 10_000,
        tipoElaboracion: 'elaborada',
      }).sobreSueldo,
    ).toBe(2_500)
  })

  it('permite configurar la mano de obra dentro del rango acordado', () => {
    expect(
      calcularSobres({
        costoPorUnidad: 5_000,
        precioVenta: 10_000,
        tipoElaboracion: 'rapida',
        porcentajeManoObra: 0.3,
      }).sobreSueldo,
    ).toBe(3_000)

    expect(() =>
      calcularSobres({
        costoPorUnidad: 5_000,
        precioVenta: 10_000,
        tipoElaboracion: 'rapida',
        porcentajeManoObra: 0.31,
      }),
    ).toThrow()
  })

  it('activa solo la alerta amarilla cuando el sueldo deja ganancia negativa', () => {
    const resultado = calcularSobres({
      costoPorUnidad: 5_000,
      precioVenta: 6_000,
      tipoElaboracion: 'rapida',
    })

    expect(resultado.alertaPerdida).toBe(false)
    expect(resultado.alertaSueldo).toBe(true)
    expect(resultado.sobreGanancia).toBe(-200)
  })

  it('activa la alerta de pérdida cuando el precio es menor que el costo', () => {
    const resultado = calcularSobres({
      costoPorUnidad: 5_000,
      precioVenta: 4_000,
      tipoElaboracion: 'rapida',
    })

    expect(resultado.alertaPerdida).toBe(true)
    expect(resultado.alertaSueldo).toBe(true)
  })
})
