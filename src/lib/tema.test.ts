import { describe, expect, it } from 'vitest'
import {
  CLAVE_TEMA,
  guardarPreferenciaTema,
  leerPreferenciaTema,
  resolverModo,
} from './tema'

function crearAlmacenamiento(inicial: Record<string, string> = {}): Storage {
  const valores = new Map(Object.entries(inicial))

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

describe('preferencia de tema', () => {
  it('es automática si no se ha elegido nada', () => {
    expect(leerPreferenciaTema(crearAlmacenamiento())).toBe('automatico')
  })

  it('guarda y recupera la preferencia elegida', () => {
    const almacenamiento = crearAlmacenamiento()

    guardarPreferenciaTema('oscuro', almacenamiento)

    expect(almacenamiento.getItem(CLAVE_TEMA)).toBe('oscuro')
    expect(leerPreferenciaTema(almacenamiento)).toBe('oscuro')
  })

  it('ignora valores desconocidos', () => {
    expect(leerPreferenciaTema(crearAlmacenamiento({ [CLAVE_TEMA]: 'morado' }))).toBe('automatico')
  })

  it('no falla si el almacenamiento no está disponible', () => {
    const bloqueado = {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('bloqueado')
      },
    } as unknown as Storage

    expect(leerPreferenciaTema(bloqueado)).toBe('automatico')
    expect(() => guardarPreferenciaTema('claro', bloqueado)).not.toThrow()
  })
})

describe('resolverModo', () => {
  it('en automático sigue al sistema', () => {
    expect(resolverModo('automatico', true)).toBe('oscuro')
    expect(resolverModo('automatico', false)).toBe('claro')
  })

  it('claro u oscuro se imponen al sistema', () => {
    expect(resolverModo('claro', true)).toBe('claro')
    expect(resolverModo('oscuro', false)).toBe('oscuro')
  })
})
