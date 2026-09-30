import type { Configuracion, TipoElaboracion } from './modelos'

// Única fuente de los valores por defecto; los cálculos y la persistencia los leen de aquí.
export const CONFIGURACION_PREDETERMINADA: Readonly<Configuracion> = {
  porcentajeIndirectos: 0.1,
  multiplicadorEstandar: 2.2,
  multiplicadorPremium: 2.5,
  porcentajeManoObraRapida: 0.2,
  porcentajeManoObraElaborada: 0.25,
  valorRedondeo: 1_000,
}

export const OPCIONES_REDONDEO = [1_000, 500, 100, 1] as const

export const MANO_OBRA_MINIMA = 0.2
export const MANO_OBRA_MAXIMA = 0.3

export function obtenerPorcentajeManoObra(
  tipoElaboracion: TipoElaboracion,
  configuracion: Pick<Configuracion, 'porcentajeManoObraRapida' | 'porcentajeManoObraElaborada'>,
): number {
  return tipoElaboracion === 'rapida'
    ? configuracion.porcentajeManoObraRapida
    : configuracion.porcentajeManoObraElaborada
}

export function validarConfiguracion(configuracion: Configuracion): string | null {
  const {
    porcentajeIndirectos,
    multiplicadorEstandar,
    multiplicadorPremium,
    porcentajeManoObraRapida,
    porcentajeManoObraElaborada,
    valorRedondeo,
  } = configuracion

  if (!Number.isFinite(porcentajeIndirectos) || porcentajeIndirectos < 0 || porcentajeIndirectos > 1) {
    return 'El porcentaje de costos indirectos debe estar entre 0% y 100%.'
  }

  if (
    !Number.isFinite(multiplicadorEstandar) ||
    !Number.isFinite(multiplicadorPremium) ||
    multiplicadorEstandar < 1 ||
    multiplicadorPremium < 1
  ) {
    return 'Cada multiplicador debe ser mayor o igual a 1.'
  }

  if (multiplicadorPremium < multiplicadorEstandar) {
    return 'El multiplicador Premium no puede ser menor que el Estándar.'
  }

  const manoObraValida = (porcentaje: number) =>
    Number.isFinite(porcentaje) && porcentaje >= MANO_OBRA_MINIMA && porcentaje <= MANO_OBRA_MAXIMA
  if (!manoObraValida(porcentajeManoObraRapida) || !manoObraValida(porcentajeManoObraElaborada)) {
    return 'El porcentaje de mano de obra debe estar entre 20% y 30%.'
  }

  if (!OPCIONES_REDONDEO.some((opcion) => opcion === valorRedondeo)) {
    return 'Elige una opción de redondeo válida.'
  }

  return null
}
