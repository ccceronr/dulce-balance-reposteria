export type PreferenciaTema = 'automatico' | 'claro' | 'oscuro'
export type Modo = 'claro' | 'oscuro'

// La misma clave la lee el script de index.html para aplicar el modo antes de mostrar la app.
// Se guarda aparte de los datos: cada dispositivo tiene su modo y los respaldos no lo cambian.
export const CLAVE_TEMA = 'dulce-balance:tema'
export const CONSULTA_SISTEMA_OSCURO = '(prefers-color-scheme: dark)'

const PREFERENCIAS: PreferenciaTema[] = ['automatico', 'claro', 'oscuro']

function obtenerAlmacenamiento(almacenamiento?: Storage): Storage | null {
  if (almacenamiento) {
    return almacenamiento
  }

  return typeof window === 'undefined' ? null : window.localStorage
}

export function leerPreferenciaTema(almacenamiento?: Storage): PreferenciaTema {
  try {
    const valor = obtenerAlmacenamiento(almacenamiento)?.getItem(CLAVE_TEMA)
    return PREFERENCIAS.find((preferencia) => preferencia === valor) ?? 'automatico'
  } catch {
    return 'automatico'
  }
}

export function guardarPreferenciaTema(
  preferencia: PreferenciaTema,
  almacenamiento?: Storage,
): void {
  try {
    obtenerAlmacenamiento(almacenamiento)?.setItem(CLAVE_TEMA, preferencia)
  } catch {
    // Sin almacenamiento disponible, la preferencia dura mientras la app esté abierta.
  }
}

export function resolverModo(preferencia: PreferenciaTema, sistemaOscuro: boolean): Modo {
  if (preferencia === 'automatico') {
    return sistemaOscuro ? 'oscuro' : 'claro'
  }

  return preferencia
}

// La paleta oscura de index.css depende del atributo data-modo de <html>.
export function aplicarModo(modo: Modo): void {
  const raiz = document.documentElement
  raiz.dataset.modo = modo

  // La barra de estado del teléfono toma el color de fondo del modo activo.
  const fondo = getComputedStyle(raiz).getPropertyValue('--color-fondo').trim()
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', fondo)
}
