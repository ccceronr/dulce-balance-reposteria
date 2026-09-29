import { CONFIGURACION_PREDETERMINADA } from './configuracion'
import type { DatosAplicacion } from './modelos'

export const CLAVE_DATOS = 'dulce-balance:datos'
const VERSION_ESQUEMA = 1

interface DatosAlmacenados {
  version: number
  datos: DatosAplicacion
}

export function crearDatosIniciales(): DatosAplicacion {
  return {
    inventario: [],
    recetas: [],
    presentaciones: [],
    configuracion: { ...CONFIGURACION_PREDETERMINADA },
    historialVentas: [],
  }
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function esDatosAplicacion(valor: unknown): valor is DatosAplicacion {
  if (!esObjeto(valor) || !esObjeto(valor.configuracion)) {
    return false
  }

  return (
    Array.isArray(valor.inventario) &&
    Array.isArray(valor.recetas) &&
    Array.isArray(valor.presentaciones) &&
    Array.isArray(valor.historialVentas) &&
    typeof valor.configuracion.porcentajeIndirectos === 'number' &&
    typeof valor.configuracion.multiplicadorEstandar === 'number' &&
    typeof valor.configuracion.multiplicadorPremium === 'number' &&
    typeof valor.configuracion.porcentajeManoObraRapida === 'number' &&
    typeof valor.configuracion.porcentajeManoObraElaborada === 'number'
  )
}

function obtenerAlmacenamiento(almacenamiento?: Storage): Storage {
  if (almacenamiento) {
    return almacenamiento
  }

  if (typeof window === 'undefined') {
    throw new Error('El almacenamiento local solo está disponible en el navegador.')
  }

  return window.localStorage
}

export function cargarDatos(almacenamiento?: Storage): DatosAplicacion {
  try {
    const contenido = obtenerAlmacenamiento(almacenamiento).getItem(CLAVE_DATOS)
    if (!contenido) {
      return crearDatosIniciales()
    }

    const almacenado: unknown = JSON.parse(contenido)
    if (
      !esObjeto(almacenado) ||
      almacenado.version !== VERSION_ESQUEMA ||
      !esDatosAplicacion(almacenado.datos)
    ) {
      return crearDatosIniciales()
    }

    return almacenado.datos
  } catch {
    return crearDatosIniciales()
  }
}

export function guardarDatos(datos: DatosAplicacion, almacenamiento?: Storage): void {
  const envoltura: DatosAlmacenados = {
    version: VERSION_ESQUEMA,
    datos,
  }

  try {
    obtenerAlmacenamiento(almacenamiento).setItem(
      CLAVE_DATOS,
      JSON.stringify(envoltura),
    )
  } catch {
    throw new Error('No fue posible guardar los datos en este dispositivo.')
  }
}
