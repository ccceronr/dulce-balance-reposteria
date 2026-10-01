import { describe, expect, it } from 'vitest'
import { CONFIGURACION_PREDETERMINADA } from './configuracion'
import type { ArticuloInventario, PresentacionVenta, Receta } from './modelos'
import { calcularResultadoPresentacion, validarPresentacion } from './presentaciones'

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
    id: 'harina',
    nombre: 'Harina',
    tipo: 'ingrediente',
    precioCompra: 15_000,
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
  {
    id: 'cinta',
    nombre: 'Cinta',
    tipo: 'empaque',
    precioCompra: 5_000,
    cantidadTotalComprada: 10,
    unidad: 'unidad',
  },
]

// Brownie: $2.750 por unidad. Galleta: $1.500 por unidad.
const recetas: Receta[] = [
  {
    id: 'brownie',
    nombre: 'Brownie',
    ingredientes: [{ insumoId: 'mezcla', cantidadUsada: 500 }],
    empaques: [{ insumoId: 'caja-craft', cantidadUsada: 1 }],
    rendimiento: 10,
    tipoElaboracion: 'rapida',
  },
  {
    id: 'galleta',
    nombre: 'Galleta',
    ingredientes: [{ insumoId: 'harina', cantidadUsada: 1_000 }],
    empaques: [],
    rendimiento: 11,
    tipoElaboracion: 'rapida',
  },
]

const caja: PresentacionVenta = {
  id: 'caja-mixta',
  nombre: 'Caja mixta',
  productos: [
    { recetaId: 'brownie', cantidad: 4 },
    { recetaId: 'galleta', cantidad: 2 },
  ],
  empaques: [
    { insumoId: 'caja-regalo', cantidad: 1 },
    { insumoId: 'cinta', cantidad: 1 },
  ],
  tipoElaboracion: 'elaborada',
}

const datos = { inventario, recetas, presentaciones: [caja], preparaciones: [] }

function calcular(presentacion: PresentacionVenta, datosActuales = datos) {
  const resultado = calcularResultadoPresentacion(
    presentacion,
    datosActuales,
    CONFIGURACION_PREDETERMINADA,
  )
  if (!resultado.ok) {
    throw new Error(resultado.error)
  }
  return resultado
}

describe('calcularResultadoPresentacion', () => {
  it('suma el costo de los productos y los empaques exteriores con indirectos', () => {
    const resultado = calcular(caja)

    expect(resultado.costoProductos).toBeCloseTo(14_000)
    expect(resultado.costoEmpaques).toBeCloseTo(3_500)
    expect(resultado.gastosExtras).toBeCloseTo(350)
    expect(resultado.costoCaja).toBeCloseTo(17_850)
  })

  it('sugiere precios redondeados sobre el costo de la caja', () => {
    const resultado = calcular(caja)

    expect(resultado.precioEstandar).toBe(39_000)
    expect(resultado.precioPremium).toBe(45_000)
    expect(resultado.precioUsado).toBe(39_000)
    expect(resultado.usaPrecioReal).toBe(false)
  })

  it('reparte los sobres con el tipo de elaboración de la caja', () => {
    const { sobres } = calcular(caja)

    expect(sobres.sobreReposicion).toBeCloseTo(17_850)
    expect(sobres.sobreSueldo).toBeCloseTo(9_750)
    expect(sobres.sobreGanancia).toBeCloseTo(11_400)
    expect(sobres.dineroLibre).toBeCloseTo(21_150)
  })

  it('usa el precio real guardado y marca pérdida si no cubre el costo', () => {
    const resultado = calcular({ ...caja, tipoElaboracion: 'rapida', precioVentaReal: 15_000 })

    expect(resultado.precioUsado).toBe(15_000)
    expect(resultado.usaPrecioReal).toBe(true)
    expect(resultado.sobres.sobreSueldo).toBeCloseTo(3_000)
    expect(resultado.sobres.alertaPerdida).toBe(true)
  })

  it('refleja cambios de precio en el inventario', () => {
    const inventarioCaro = inventario.map((articulo) =>
      articulo.id === 'cinta' ? { ...articulo, precioCompra: 10_000 } : articulo,
    )

    expect(calcular(caja, { ...datos, inventario: inventarioCaro }).costoCaja).toBeCloseTo(18_400)
  })

  it('devuelve un error claro si falta una receta o un empaque', () => {
    const sinReceta = calcularResultadoPresentacion(
      caja,
      { ...datos, recetas: recetas.filter((receta) => receta.id !== 'galleta') },
      CONFIGURACION_PREDETERMINADA,
    )
    expect(sinReceta.ok).toBe(false)
    if (!sinReceta.ok) {
      expect(sinReceta.error).toContain('producto')
    }

    const sinEmpaque = calcularResultadoPresentacion(
      caja,
      { ...datos, inventario: inventario.filter((articulo) => articulo.id !== 'cinta') },
      CONFIGURACION_PREDETERMINADA,
    )
    expect(sinEmpaque.ok).toBe(false)
    if (!sinEmpaque.ok) {
      expect(sinEmpaque.error).toContain('inventario')
    }
  })
})

describe('validarPresentacion', () => {
  it('acepta una caja válida', () => {
    expect(validarPresentacion(caja, datos)).toBeNull()
    expect(validarPresentacion({ ...caja, empaques: [] }, datos)).toBeNull()
  })

  it('requiere nombre único y al menos un producto', () => {
    expect(validarPresentacion({ ...caja, nombre: ' ' }, datos)).toContain('nombre')
    expect(
      validarPresentacion({ ...caja, id: 'otra', nombre: 'caja MIXTA' }, datos),
    ).toContain('nombre')
    expect(validarPresentacion({ ...caja, productos: [] }, datos)).toContain('producto')
  })

  it('exige cantidades enteras positivas y sin repetidos', () => {
    expect(
      validarPresentacion({ ...caja, productos: [{ recetaId: 'brownie', cantidad: 0 }] }, datos),
    ).toContain('cantidad')
    expect(
      validarPresentacion({ ...caja, productos: [{ recetaId: 'brownie', cantidad: 1.5 }] }, datos),
    ).toContain('cantidad')
    expect(
      validarPresentacion({
        ...caja,
        productos: [
          { recetaId: 'brownie', cantidad: 1 },
          { recetaId: 'brownie', cantidad: 2 },
        ],
      }, datos),
    ).toContain('una vez')
    expect(
      validarPresentacion({ ...caja, empaques: [{ insumoId: 'cinta', cantidad: 0 }] }, datos),
    ).toContain('cantidad')
  })

  it('rechaza productos inexistentes y empaques que no son de tipo empaque', () => {
    expect(
      validarPresentacion({ ...caja, productos: [{ recetaId: 'torta', cantidad: 1 }] }, datos),
    ).toContain('productos')
    expect(
      validarPresentacion({ ...caja, empaques: [{ insumoId: 'harina', cantidad: 1 }] }, datos),
    ).toContain('empaques')
  })

  it('valida el precio real', () => {
    expect(validarPresentacion({ ...caja, precioVentaReal: 40_000 }, datos)).toBeNull()
    expect(validarPresentacion({ ...caja, precioVentaReal: -1 }, datos)).toContain('precio')
  })
})
