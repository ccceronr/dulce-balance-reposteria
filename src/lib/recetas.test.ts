import { describe, expect, it } from 'vitest'
import type { ArticuloInventario, Configuracion, Receta } from './modelos'
import { calcularResultadoReceta, validarReceta } from './recetas'

const inventario: ArticuloInventario[] = [
  {
    id: 'chocolate',
    nombre: 'Chocolate',
    tipo: 'ingrediente',
    precioCompra: 13_000,
    cantidadTotalComprada: 500,
    unidad: 'g',
  },
  {
    id: 'bolsa',
    nombre: 'Bolsa individual',
    tipo: 'empaque',
    precioCompra: 3_000,
    cantidadTotalComprada: 20,
    unidad: 'unidad',
  },
]

const recetaValida: Receta = {
  id: 'cakecicle',
  nombre: 'Cakecicle',
  ingredientes: [{ insumoId: 'chocolate', cantidadUsada: 100 }],
  empaques: [{ insumoId: 'bolsa', cantidadUsada: 1 }],
  rendimiento: 10,
  tipoElaboracion: 'elaborada',
}

describe('validarReceta', () => {
  it('acepta una receta con ingredientes por tanda y empaque entero por unidad', () => {
    expect(validarReceta(recetaValida, inventario)).toBeNull()
  })

  it('requiere nombre, al menos un ingrediente y rendimiento entero positivo', () => {
    expect(validarReceta({ ...recetaValida, nombre: ' ' }, inventario)).toContain('nombre')
    expect(validarReceta({ ...recetaValida, ingredientes: [] }, inventario)).toContain('ingrediente')
    expect(validarReceta({ ...recetaValida, rendimiento: 0 }, inventario)).toContain('rendimiento')
    expect(validarReceta({ ...recetaValida, rendimiento: 1.5 }, inventario)).toContain('entero')
  })

  it('rechaza referencias inexistentes o de tipo incorrecto', () => {
    expect(
      validarReceta({
        ...recetaValida,
        ingredientes: [{ insumoId: 'bolsa', cantidadUsada: 1 }],
      }, inventario),
    ).toContain('ingredientes')
    expect(
      validarReceta({
        ...recetaValida,
        empaques: [{ insumoId: 'desconocido', cantidadUsada: 1 }],
      }, inventario),
    ).toContain('empaques')
  })

  it('rechaza cantidades negativas y cantidades fraccionarias de empaque', () => {
    expect(
      validarReceta({
        ...recetaValida,
        ingredientes: [{ insumoId: 'chocolate', cantidadUsada: -1 }],
      }, inventario),
    ).toContain('positiva')
    expect(
      validarReceta({
        ...recetaValida,
        empaques: [{ insumoId: 'bolsa', cantidadUsada: 0.5 }],
      }, inventario),
    ).toContain('entera')
  })

  it('acepta un precio real entero no negativo y rechaza los demás', () => {
    expect(validarReceta({ ...recetaValida, precioVentaReal: 6_000 }, inventario)).toBeNull()
    expect(validarReceta({ ...recetaValida, precioVentaReal: -1 }, inventario)).toContain('precio')
    expect(validarReceta({ ...recetaValida, precioVentaReal: 10.5 }, inventario)).toContain('precio')
  })
})

describe('calcularResultadoReceta', () => {
  const configuracion: Configuracion = {
    porcentajeIndirectos: 0.1,
    multiplicadorEstandar: 2.2,
    multiplicadorPremium: 2.5,
    porcentajeManoObraRapida: 0.2,
    porcentajeManoObraElaborada: 0.25,
  }

  // Brownie: $20.000 en ingredientes por tanda y una caja de $500 por unidad.
  const inventarioBrownie: ArticuloInventario[] = [
    {
      id: 'mezcla',
      nombre: 'Mezcla brownie',
      tipo: 'ingrediente',
      precioCompra: 40_000,
      cantidadTotalComprada: 1_000,
      unidad: 'g',
    },
    {
      id: 'caja',
      nombre: 'Caja craft',
      tipo: 'empaque',
      precioCompra: 10_000,
      cantidadTotalComprada: 20,
      unidad: 'unidad',
    },
  ]

  const brownie: Receta = {
    id: 'brownie',
    nombre: 'Brownie',
    ingredientes: [{ insumoId: 'mezcla', cantidadUsada: 500 }],
    empaques: [{ insumoId: 'caja', cantidadUsada: 1 }],
    rendimiento: 10,
    tipoElaboracion: 'rapida',
  }

  function calcular(receta: Receta, inventarioActual = inventarioBrownie) {
    const resultado = calcularResultadoReceta(receta, inventarioActual, configuracion)
    if (!resultado.ok) {
      throw new Error(resultado.error)
    }
    return resultado
  }

  it('multiplica los empaques por el rendimiento y aplica indirectos a todo', () => {
    const resultado = calcular(brownie)

    expect(resultado.insumosDirectos).toBeCloseTo(25_000)
    expect(resultado.gastosExtras).toBeCloseTo(2_500)
    expect(resultado.costoTanda).toBeCloseTo(27_500)
    expect(resultado.costoPorUnidad).toBeCloseTo(2_750)
  })

  it('sugiere precios redondeados y usa el Estándar si no hay precio real', () => {
    const resultado = calcular(brownie)

    expect(resultado.precioEstandar).toBe(6_000)
    expect(resultado.precioPremium).toBe(7_000)
    expect(resultado.precioUsado).toBe(6_000)
    expect(resultado.usaPrecioReal).toBe(false)
  })

  it('calcula los sobres por unidad y por tanda', () => {
    const resultado = calcular(brownie)

    expect(resultado.sobresUnidad.sobreReposicion).toBeCloseTo(2_750)
    expect(resultado.sobresUnidad.sobreSueldo).toBeCloseTo(1_200)
    expect(resultado.sobresUnidad.sobreGanancia).toBeCloseTo(2_050)
    expect(resultado.sobresUnidad.dineroLibre).toBeCloseTo(3_250)
    expect(resultado.sobresTanda.sobreReposicion).toBeCloseTo(27_500)
    expect(resultado.sobresTanda.sobreSueldo).toBeCloseTo(12_000)
    expect(resultado.sobresTanda.sobreGanancia).toBeCloseTo(20_500)
    expect(resultado.sobresTanda.dineroLibre).toBeCloseTo(32_500)
  })

  it('usa el precio real guardado y el % de mano de obra según el tipo', () => {
    const resultado = calcular({
      ...brownie,
      tipoElaboracion: 'elaborada',
      precioVentaReal: 8_000,
    })

    expect(resultado.precioUsado).toBe(8_000)
    expect(resultado.usaPrecioReal).toBe(true)
    expect(resultado.sobresUnidad.sobreSueldo).toBeCloseTo(2_000)
    expect(resultado.sobresUnidad.sobreGanancia).toBeCloseTo(3_250)
  })

  it('marca alerta de pérdida y de sueldo cuando el precio no alcanza', () => {
    const perdida = calcular({ ...brownie, precioVentaReal: 2_000 })
    expect(perdida.sobresUnidad.alertaPerdida).toBe(true)

    const sinSueldo = calcular({ ...brownie, precioVentaReal: 3_000 })
    expect(sinSueldo.sobresUnidad.alertaPerdida).toBe(false)
    expect(sinSueldo.sobresUnidad.alertaSueldo).toBe(true)
  })

  it('refleja el precio actual del inventario', () => {
    const inventarioCaro = inventarioBrownie.map((articulo) =>
      articulo.id === 'mezcla' ? { ...articulo, precioCompra: 60_000 } : articulo,
    )

    expect(calcular(brownie, inventarioCaro).costoPorUnidad).toBeCloseTo(3_850)
  })

  it('devuelve un error claro si falta un insumo del inventario', () => {
    const resultado = calcularResultadoReceta(
      brownie,
      inventarioBrownie.filter((articulo) => articulo.id !== 'caja'),
      configuracion,
    )

    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      expect(resultado.error).toContain('inventario')
    }
  })
})
