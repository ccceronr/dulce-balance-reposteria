import { describe, expect, it } from 'vitest'
import type { ArticuloInventario, PreparacionBase, PresentacionVenta, Receta } from './modelos'
import { articuloEstaEnUso, cambiaUnidadEnUso, validarArticulo } from './inventario'

const mantequilla: ArticuloInventario = {
  id: 'mantequilla',
  nombre: 'Mantequilla',
  tipo: 'ingrediente',
  precioCompra: 13_000,
  cantidadTotalComprada: 500,
  unidad: 'g',
}

const cinta: ArticuloInventario = {
  id: 'cinta',
  nombre: 'Cinta',
  tipo: 'empaque',
  precioCompra: 5_000,
  cantidadTotalComprada: 10,
  unidad: 'unidad',
}

const receta: Receta = {
  id: 'galletas',
  nombre: 'Galletas',
  ingredientes: [{ insumoId: 'mantequilla', cantidadUsada: 100 }],
  empaques: [],
  rendimiento: 12,
  tipoElaboracion: 'rapida',
}

const presentacion: PresentacionVenta = {
  id: 'caja-regalo',
  nombre: 'Caja regalo',
  productos: [],
  empaques: [{ insumoId: 'cinta', cantidad: 1 }],
  tipoElaboracion: 'elaborada',
}

const datos = {
  inventario: [mantequilla, cinta],
  recetas: [receta],
  presentaciones: [presentacion],
  preparaciones: [] as PreparacionBase[],
}

describe('articuloEstaEnUso', () => {
  it('detecta insumos usados en recetas o presentaciones', () => {
    expect(articuloEstaEnUso('mantequilla', datos)).toBe(true)
    expect(articuloEstaEnUso('cinta', datos)).toBe(true)
    expect(articuloEstaEnUso('azucar', datos)).toBe(false)
  })

  it('detecta insumos usados solo en una preparación base', () => {
    const masa: PreparacionBase = {
      id: 'masa',
      nombre: 'Masa',
      ingredientes: [{ insumoId: 'azucar', cantidadUsada: 100 }],
      rendimientoTotal: 500,
      unidad: 'g',
    }

    expect(articuloEstaEnUso('azucar', { ...datos, preparaciones: [masa] })).toBe(true)
  })
})

describe('validarArticulo', () => {
  it('acepta un artículo válido', () => {
    expect(validarArticulo(mantequilla, datos)).toBeNull()
    expect(validarArticulo({ ...mantequilla, id: 'nuevo' }, datos)).toBeNull()
  })

  it('requiere nombre, precio entero no negativo y cantidad positiva', () => {
    expect(validarArticulo({ ...mantequilla, nombre: ' ' }, datos)).toContain('nombre')
    expect(validarArticulo({ ...mantequilla, precioCompra: -1 }, datos)).toContain('precio')
    expect(validarArticulo({ ...mantequilla, precioCompra: 10.5 }, datos)).toContain('precio')
    expect(validarArticulo({ ...mantequilla, cantidadTotalComprada: 0 }, datos)).toContain('cantidad')
  })

  it('exige cantidades enteras para empaques', () => {
    expect(validarArticulo({ ...cinta, cantidadTotalComprada: 2.5 }, datos)).toContain('entero')
  })

  it('impide cambiar el tipo de un artículo que está en uso', () => {
    expect(
      validarArticulo({ ...mantequilla, tipo: 'empaque', unidad: 'unidad' }, datos),
    ).toContain('tipo')
    expect(
      validarArticulo(
        { ...mantequilla, tipo: 'empaque', unidad: 'unidad' },
        { ...datos, recetas: [] },
      ),
    ).toBeNull()
  })
})

describe('unidades de medida', () => {
  it('acepta ingredientes en g, ml o unidad, con decimales', () => {
    expect(validarArticulo({ ...mantequilla, unidad: 'ml' }, datos)).toBeNull()
    expect(
      validarArticulo({ ...mantequilla, id: 'huevos', unidad: 'unidad', cantidadTotalComprada: 30 }, datos),
    ).toBeNull()
    expect(
      validarArticulo({ ...mantequilla, id: 'huevos', unidad: 'unidad', cantidadTotalComprada: 7.5 }, datos),
    ).toBeNull()
  })

  it('exige que los empaques se midan por unidad', () => {
    expect(validarArticulo({ ...cinta, unidad: 'g' }, datos)).toContain('unidad')
  })

  it('avisa cuando cambia la unidad de un ingrediente usado en recetas', () => {
    expect(cambiaUnidadEnUso({ ...mantequilla, unidad: 'unidad' }, datos)).toBe(true)
    expect(cambiaUnidadEnUso(mantequilla, datos)).toBe(false)
    expect(cambiaUnidadEnUso({ ...mantequilla, unidad: 'unidad' }, { ...datos, recetas: [] })).toBe(false)
    expect(cambiaUnidadEnUso({ ...mantequilla, id: 'nuevo', unidad: 'ml' }, datos)).toBe(false)
  })
})
