import { describe, expect, it } from 'vitest'
import {
  CLAVE_DATOS,
  crearDatosIniciales,
  cargarDatos,
  guardarDatos,
} from './persistencia'
import type { DatosAplicacion } from './modelos'

function crearAlmacenamiento(): Storage {
  const valores = new Map<string, string>()

  return {
    get length() {
      return valores.size
    },
    clear: () => valores.clear(),
    getItem: (clave) => valores.get(clave) ?? null,
    key: (indice) => [...valores.keys()][indice] ?? null,
    removeItem: (clave) => valores.delete(clave),
    setItem: (clave, valor) => valores.set(clave, valor),
  }
}

describe('persistencia local', () => {
  it('devuelve datos iniciales cuando no existe información guardada', () => {
    const almacenamiento = crearAlmacenamiento()

    expect(cargarDatos(almacenamiento)).toEqual(crearDatosIniciales())
  })

  it('guarda y recupera todos los datos de la aplicación', () => {
    const almacenamiento = crearAlmacenamiento()
    const datos: DatosAplicacion = {
      ...crearDatosIniciales(),
      inventario: [
        {
          id: 'mantequilla',
          nombre: 'Mantequilla',
          tipo: 'ingrediente',
          precioCompra: 13_000,
          cantidadTotalComprada: 500,
          unidad: 'g',
        },
      ],
      configuracion: {
        ...crearDatosIniciales().configuracion,
        porcentajeIndirectos: 0.15,
      },
    }

    guardarDatos(datos, almacenamiento)

    expect(almacenamiento.getItem(CLAVE_DATOS)).toContain('mantequilla')
    expect(cargarDatos(almacenamiento)).toEqual(datos)
  })

  it('conserva los datos guardados antes de que existiera el redondeo configurable', () => {
    const almacenamiento = crearAlmacenamiento()
    const { valorRedondeo: _omitido, ...configuracionAntigua } = crearDatosIniciales().configuracion
    almacenamiento.setItem(CLAVE_DATOS, JSON.stringify({
      version: 1,
      datos: {
        ...crearDatosIniciales(),
        recetas: [],
        inventario: [
          {
            id: 'huevos',
            nombre: 'Huevos',
            tipo: 'ingrediente',
            precioCompra: 21_000,
            cantidadTotalComprada: 30,
            unidad: 'unidad',
          },
        ],
        configuracion: { ...configuracionAntigua, porcentajeIndirectos: 0.12 },
      },
    }))

    const datos = cargarDatos(almacenamiento)

    expect(datos.inventario).toHaveLength(1)
    expect(datos.configuracion.porcentajeIndirectos).toBe(0.12)
    expect(datos.configuracion.valorRedondeo).toBe(1_000)
  })

  it('recupera datos iniciales si el JSON está dañado o tiene una versión inválida', () => {
    const almacenamiento = crearAlmacenamiento()
    almacenamiento.setItem(CLAVE_DATOS, '{"version":999,"inventario":[]}')

    expect(cargarDatos(almacenamiento)).toEqual(crearDatosIniciales())

    almacenamiento.setItem(CLAVE_DATOS, 'no es json')
    expect(cargarDatos(almacenamiento)).toEqual(crearDatosIniciales())
  })
})
