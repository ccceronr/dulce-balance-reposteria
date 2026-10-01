import { describe, expect, it } from 'vitest'
import type { ArticuloInventario, Configuracion, PreparacionBase, Receta } from './modelos'
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

const catalogo = { inventario, preparaciones: [] }

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
    expect(validarReceta(recetaValida, catalogo)).toBeNull()
  })

  it('requiere nombre, al menos un ingrediente y rendimiento entero positivo', () => {
    expect(validarReceta({ ...recetaValida, nombre: ' ' }, catalogo)).toContain('nombre')
    expect(validarReceta({ ...recetaValida, ingredientes: [] }, catalogo)).toContain('ingrediente')
    expect(validarReceta({ ...recetaValida, rendimiento: 0 }, catalogo)).toContain('rendimiento')
    expect(validarReceta({ ...recetaValida, rendimiento: 1.5 }, catalogo)).toContain('entero')
  })

  it('rechaza referencias inexistentes o de tipo incorrecto', () => {
    expect(
      validarReceta({
        ...recetaValida,
        ingredientes: [{ insumoId: 'bolsa', cantidadUsada: 1 }],
      }, catalogo),
    ).toContain('ingredientes')
    expect(
      validarReceta({
        ...recetaValida,
        empaques: [{ insumoId: 'desconocido', cantidadUsada: 1 }],
      }, catalogo),
    ).toContain('empaques')
  })

  it('rechaza cantidades negativas y cantidades fraccionarias de empaque', () => {
    expect(
      validarReceta({
        ...recetaValida,
        ingredientes: [{ insumoId: 'chocolate', cantidadUsada: -1 }],
      }, catalogo),
    ).toContain('positiva')
    expect(
      validarReceta({
        ...recetaValida,
        empaques: [{ insumoId: 'bolsa', cantidadUsada: 0.5 }],
      }, catalogo),
    ).toContain('entera')
  })

  it('acepta un precio real entero no negativo y rechaza los demás', () => {
    expect(validarReceta({ ...recetaValida, precioVentaReal: 6_000 }, catalogo)).toBeNull()
    expect(validarReceta({ ...recetaValida, precioVentaReal: -1 }, catalogo)).toContain('precio')
    expect(validarReceta({ ...recetaValida, precioVentaReal: 10.5 }, catalogo)).toContain('precio')
  })
})

describe('calcularResultadoReceta', () => {
  const configuracion: Configuracion = {
    porcentajeIndirectos: 0.1,
    multiplicadorEstandar: 2.2,
    multiplicadorPremium: 2.5,
    porcentajeManoObraRapida: 0.2,
    porcentajeManoObraElaborada: 0.25,
    valorRedondeo: 1_000,
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
    const resultado = calcularResultadoReceta(
      receta,
      { inventario: inventarioActual, preparaciones: [] },
      configuracion,
    )
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

  it('usa el redondeo de la configuración', () => {
    const resultado = calcularResultadoReceta(
      brownie,
      { inventario: inventarioBrownie, preparaciones: [] },
      { ...configuracion, valorRedondeo: 100 },
    )

    expect(resultado.ok && resultado.precioEstandar).toBe(6_100)
    expect(resultado.ok && resultado.precioPremium).toBe(6_900)
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
      { inventario: inventarioBrownie.filter((articulo) => articulo.id !== 'caja'), preparaciones: [] },
      configuracion,
    )

    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      expect(resultado.error).toContain('inventario')
    }
  })
})

describe('recetas con preparaciones base', () => {
  const configuracion: Configuracion = {
    porcentajeIndirectos: 0.1,
    multiplicadorEstandar: 2.2,
    multiplicadorPremium: 2.5,
    porcentajeManoObraRapida: 0.2,
    porcentajeManoObraElaborada: 0.25,
    valorRedondeo: 1_000,
  }

  const inventarioCakecicle: ArticuloInventario[] = [
    { id: 'harina', nombre: 'Harina', tipo: 'ingrediente', precioCompra: 10_000, cantidadTotalComprada: 1_000, unidad: 'g' },
    { id: 'leche-condensada', nombre: 'Leche condensada', tipo: 'ingrediente', precioCompra: 20_000, cantidadTotalComprada: 1_000, unidad: 'g' },
    { id: 'chocolate', nombre: 'Chocolate de cobertura', tipo: 'ingrediente', precioCompra: 40_000, cantidadTotalComprada: 1_000, unidad: 'g' },
    { id: 'palito', nombre: 'Palito', tipo: 'empaque', precioCompra: 10_000, cantidadTotalComprada: 100, unidad: 'unidad' },
  ]

  // Masa: $30.000 en ingredientes, pesa 1.500 g -> $20 por g.
  const masa: PreparacionBase = {
    id: 'masa',
    nombre: 'Masa de pastel con leche condensada',
    ingredientes: [
      { insumoId: 'harina', cantidadUsada: 1_000 },
      { insumoId: 'leche-condensada', cantidadUsada: 1_000 },
    ],
    rendimientoTotal: 1_500,
    unidad: 'g',
  }

  // Cakecicle por unidad: 75 g de masa + 65 g de chocolate + 1 palito.
  const cakecicle: Receta = {
    id: 'cakecicle',
    nombre: 'Cakecicle',
    ingredientes: [{ insumoId: 'chocolate', cantidadUsada: 65 }],
    preparaciones: [{ preparacionId: 'masa', cantidadUsada: 75 }],
    empaques: [{ insumoId: 'palito', cantidadUsada: 1 }],
    rendimiento: 1,
    tipoElaboracion: 'elaborada',
  }

  const catalogoCakecicle = { inventario: inventarioCakecicle, preparaciones: [masa] }

  it('suma la preparación al costo del producto y aplica indirectos una sola vez', () => {
    const resultado = calcularResultadoReceta(cakecicle, catalogoCakecicle, configuracion)

    expect(resultado.ok).toBe(true)
    if (resultado.ok) {
      expect(resultado.insumosDirectos).toBeCloseTo(4_200)
      expect(resultado.costoPorUnidad).toBeCloseTo(4_620)
      expect(resultado.precioEstandar).toBe(10_000)
    }
  })

  it('se actualiza cuando cambia un ingrediente de la preparación', () => {
    const inventarioCaro = inventarioCakecicle.map((articulo) =>
      articulo.id === 'harina' ? { ...articulo, precioCompra: 16_000 } : articulo,
    )
    const resultado = calcularResultadoReceta(
      cakecicle,
      { inventario: inventarioCaro, preparaciones: [masa] },
      configuracion,
    )

    // Masa a $24 por g: 75 g = $1.800; directos $4.500; con 10% = $4.950.
    expect(resultado.ok && resultado.costoPorUnidad).toBeCloseTo(4_950)
  })

  it('devuelve un error claro si la preparación ya no existe', () => {
    const resultado = calcularResultadoReceta(
      cakecicle,
      { inventario: inventarioCakecicle, preparaciones: [] },
      configuracion,
    )

    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      expect(resultado.error).toContain('preparaciones base')
    }
  })

  it('valida las preparaciones usadas en la receta', () => {
    const soloMasa = { ...cakecicle, ingredientes: [] }
    expect(validarReceta(soloMasa, catalogoCakecicle)).toBeNull()
    expect(validarReceta({ ...soloMasa, preparaciones: [] }, catalogoCakecicle)).toContain('ingrediente')
    expect(
      validarReceta({ ...cakecicle, preparaciones: [{ preparacionId: 'otra', cantidadUsada: 75 }] }, catalogoCakecicle),
    ).toContain('preparaciones')
    expect(
      validarReceta({ ...cakecicle, preparaciones: [{ preparacionId: 'masa', cantidadUsada: 0 }] }, catalogoCakecicle),
    ).toContain('positiva')
    expect(
      validarReceta({
        ...cakecicle,
        preparaciones: [
          { preparacionId: 'masa', cantidadUsada: 50 },
          { preparacionId: 'masa', cantidadUsada: 25 },
        ],
      }, catalogoCakecicle),
    ).toContain('una vez')
  })
})
