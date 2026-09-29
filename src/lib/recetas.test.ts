import { describe, expect, it } from 'vitest'
import type { ArticuloInventario, Receta } from './modelos'
import { validarReceta } from './recetas'

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
})
