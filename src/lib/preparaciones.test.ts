import { describe, expect, it } from 'vitest'
import type { ArticuloInventario, PreparacionBase, Receta } from './modelos'
import {
  calcularCostoPreparacion,
  preparacionEstaEnUso,
  validarPreparacion,
} from './preparaciones'

const inventario: ArticuloInventario[] = [
  {
    id: 'harina',
    nombre: 'Harina',
    tipo: 'ingrediente',
    precioCompra: 10_000,
    cantidadTotalComprada: 1_000,
    unidad: 'g',
  },
  {
    id: 'leche-condensada',
    nombre: 'Leche condensada',
    tipo: 'ingrediente',
    precioCompra: 20_000,
    cantidadTotalComprada: 1_000,
    unidad: 'g',
  },
  {
    id: 'palito',
    nombre: 'Palito',
    tipo: 'empaque',
    precioCompra: 10_000,
    cantidadTotalComprada: 100,
    unidad: 'unidad',
  },
]

// Masa: $10.000 de harina + $20.000 de leche condensada = $30.000; pesa 1.500 g.
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

const datos = { inventario, preparaciones: [masa] }

describe('calcularCostoPreparacion', () => {
  it('suma sus ingredientes y reparte el costo por gramo, sin indirectos', () => {
    const resultado = calcularCostoPreparacion(masa, inventario)

    expect(resultado.ok).toBe(true)
    if (resultado.ok) {
      expect(resultado.costoTotal).toBeCloseTo(30_000)
      expect(resultado.costoPorUnidad).toBeCloseTo(20)
    }
  })

  it('refleja el precio actual del inventario', () => {
    const inventarioCaro = inventario.map((articulo) =>
      articulo.id === 'harina' ? { ...articulo, precioCompra: 16_000 } : articulo,
    )
    const resultado = calcularCostoPreparacion(masa, inventarioCaro)

    expect(resultado.ok && resultado.costoPorUnidad).toBeCloseTo(24)
  })

  it('devuelve un error claro si falta un ingrediente del inventario', () => {
    const resultado = calcularCostoPreparacion(
      masa,
      inventario.filter((articulo) => articulo.id !== 'harina'),
    )

    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      expect(resultado.error).toContain('inventario')
    }
  })
})

describe('validarPreparacion', () => {
  it('acepta una preparación válida', () => {
    expect(validarPreparacion(masa, datos)).toBeNull()
    expect(validarPreparacion({ ...masa, unidad: 'ml' }, datos)).toBeNull()
  })

  it('requiere nombre único y al menos un ingrediente', () => {
    expect(validarPreparacion({ ...masa, nombre: ' ' }, datos)).toContain('nombre')
    expect(
      validarPreparacion({ ...masa, id: 'otra', nombre: 'masa de PASTEL con leche condensada' }, datos),
    ).toContain('nombre')
    expect(validarPreparacion({ ...masa, ingredientes: [] }, datos)).toContain('ingrediente')
  })

  it('solo acepta ingredientes del inventario, con cantidad positiva y sin repetir', () => {
    expect(
      validarPreparacion({ ...masa, ingredientes: [{ insumoId: 'palito', cantidadUsada: 1 }] }, datos),
    ).toContain('ingredientes')
    expect(
      validarPreparacion({ ...masa, ingredientes: [{ insumoId: 'harina', cantidadUsada: 0 }] }, datos),
    ).toContain('positiva')
    expect(
      validarPreparacion({
        ...masa,
        ingredientes: [
          { insumoId: 'harina', cantidadUsada: 100 },
          { insumoId: 'harina', cantidadUsada: 200 },
        ],
      }, datos),
    ).toContain('una vez')
  })

  it('exige cuánto pesa o mide lo que sale', () => {
    expect(validarPreparacion({ ...masa, rendimientoTotal: 0 }, datos)).toContain('pesa')
    expect(validarPreparacion({ ...masa, rendimientoTotal: Number.NaN }, datos)).toContain('pesa')
  })
})

describe('preparacionEstaEnUso', () => {
  const cakecicle: Receta = {
    id: 'cakecicle',
    nombre: 'Cakecicle',
    ingredientes: [],
    preparaciones: [{ preparacionId: 'masa', cantidadUsada: 75 }],
    empaques: [],
    rendimiento: 1,
    tipoElaboracion: 'elaborada',
  }

  it('detecta si un producto usa la preparación', () => {
    expect(preparacionEstaEnUso('masa', [cakecicle])).toBe(true)
    expect(preparacionEstaEnUso('masa', [{ ...cakecicle, preparaciones: undefined }])).toBe(false)
    expect(preparacionEstaEnUso('otra', [cakecicle])).toBe(false)
  })
})
