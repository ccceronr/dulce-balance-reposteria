import type { Configuracion, TipoElaboracion } from './modelos'

// Única fuente de los valores por defecto; los cálculos y la persistencia los leen de aquí.
export const CONFIGURACION_PREDETERMINADA: Readonly<Configuracion> = {
  porcentajeIndirectos: 0.1,
  multiplicadorEstandar: 2.2,
  multiplicadorPremium: 2.5,
  porcentajeManoObraRapida: 0.2,
  porcentajeManoObraElaborada: 0.25,
}

export function obtenerPorcentajeManoObra(
  tipoElaboracion: TipoElaboracion,
  configuracion: Pick<Configuracion, 'porcentajeManoObraRapida' | 'porcentajeManoObraElaborada'>,
): number {
  return tipoElaboracion === 'rapida'
    ? configuracion.porcentajeManoObraRapida
    : configuracion.porcentajeManoObraElaborada
}
