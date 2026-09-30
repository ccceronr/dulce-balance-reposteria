import { describe, expect, it } from 'vitest'
import { CONFIGURACION_PREDETERMINADA, validarConfiguracion } from './configuracion'

describe('validarConfiguracion', () => {
  const valida = { ...CONFIGURACION_PREDETERMINADA }

  it('acepta los valores por defecto', () => {
    expect(CONFIGURACION_PREDETERMINADA.valorRedondeo).toBe(1_000)
    expect(validarConfiguracion(valida)).toBeNull()
  })

  it('exige indirectos entre 0% y 100%', () => {
    expect(validarConfiguracion({ ...valida, porcentajeIndirectos: 0 })).toBeNull()
    expect(validarConfiguracion({ ...valida, porcentajeIndirectos: -0.01 })).toContain('indirectos')
    expect(validarConfiguracion({ ...valida, porcentajeIndirectos: 1.01 })).toContain('indirectos')
  })

  it('exige multiplicadores de al menos 1 y Premium no menor que Estándar', () => {
    expect(validarConfiguracion({ ...valida, multiplicadorEstandar: 0.9 })).toContain('multiplicador')
    expect(
      validarConfiguracion({ ...valida, multiplicadorEstandar: 2.5, multiplicadorPremium: 2.2 }),
    ).toContain('Premium')
    expect(
      validarConfiguracion({ ...valida, multiplicadorEstandar: 2.5, multiplicadorPremium: 2.5 }),
    ).toBeNull()
  })

  it('exige mano de obra entre 20% y 30%', () => {
    expect(validarConfiguracion({ ...valida, porcentajeManoObraRapida: 0.3 })).toBeNull()
    expect(validarConfiguracion({ ...valida, porcentajeManoObraRapida: 0.19 })).toContain('mano de obra')
    expect(validarConfiguracion({ ...valida, porcentajeManoObraElaborada: 0.31 })).toContain('mano de obra')
  })

  it('solo acepta las opciones de redondeo permitidas', () => {
    expect(validarConfiguracion({ ...valida, valorRedondeo: 100 })).toBeNull()
    expect(validarConfiguracion({ ...valida, valorRedondeo: 250 })).toContain('redondeo')
  })
})
