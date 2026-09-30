import { CONFIGURACION_PREDETERMINADA, validarConfiguracion } from './configuracion'
import type { DatosAplicacion } from './modelos'

export const CLAVE_DATOS = 'dulce-balance:datos'
const VERSION_ESQUEMA = 1

interface DatosAlmacenados {
  version: number
  datos: DatosAplicacion
}

// El respaldo usa la misma envoltura que el almacenamiento local, más la fecha de exportación.
interface Respaldo extends DatosAlmacenados {
  exportadoEn: string
}

export type ResultadoRespaldo =
  | { ok: true; datos: DatosAplicacion; exportadoEn: string | null }
  | { ok: false; error: string }

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

// Completa con valores por defecto los campos agregados en versiones posteriores de la app.
function completarDatos(datos: DatosAplicacion): DatosAplicacion {
  return {
    ...datos,
    configuracion: { ...CONFIGURACION_PREDETERMINADA, ...datos.configuracion },
  }
}

// Valida una envoltura { version, datos } ya leída de JSON; devuelve null si no es válida.
function leerEnvoltura(valor: unknown): DatosAplicacion | null {
  if (!esObjeto(valor) || valor.version !== VERSION_ESQUEMA || !esDatosAplicacion(valor.datos)) {
    return null
  }

  return completarDatos(valor.datos)
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

    return leerEnvoltura(JSON.parse(contenido)) ?? crearDatosIniciales()
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

export function crearRespaldo(datos: DatosAplicacion, fecha = new Date()): string {
  const respaldo: Respaldo = {
    version: VERSION_ESQUEMA,
    exportadoEn: fecha.toISOString(),
    datos,
  }

  return JSON.stringify(respaldo, null, 2)
}

export function nombreArchivoRespaldo(fecha = new Date()): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `dulce-balance-respaldo-${fecha.getFullYear()}-${mes}-${dia}.json`
}

export function interpretarRespaldo(texto: string): ResultadoRespaldo {
  const errorArchivo = 'El archivo no es un respaldo válido de Dulce Balance.'

  let contenido: unknown
  try {
    contenido = JSON.parse(texto)
  } catch {
    return { ok: false, error: errorArchivo }
  }

  const datos = leerEnvoltura(contenido)
  if (!datos) {
    return { ok: false, error: errorArchivo }
  }

  const errorConfiguracion = validarConfiguracion(datos.configuracion)
  if (errorConfiguracion) {
    return { ok: false, error: `El respaldo tiene una configuración inválida: ${errorConfiguracion}` }
  }

  const exportadoEn = esObjeto(contenido) && typeof contenido.exportadoEn === 'string'
    ? contenido.exportadoEn
    : null

  return { ok: true, datos, exportadoEn }
}
