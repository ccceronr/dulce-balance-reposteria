import { describe, expect, it } from 'vitest'
import estilos from './index.css?raw'

// Lee las variables de un bloque `:root { ... }` del CSS.
function leerVariables(bloque: string): Record<string, string> {
  const variables: Record<string, string> = {}
  for (const [, nombre, valor] of bloque.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    variables[nombre] = valor.trim()
  }
  return variables
}

function extraerBloqueRaiz(css: string, desde: number): string {
  const inicio = css.indexOf(':root {', desde)
  const fin = css.indexOf('}', inicio)
  return css.slice(inicio, fin)
}

const inicioOscuro = estilos.indexOf('@media (prefers-color-scheme: dark)')
const claro = leerVariables(extraerBloqueRaiz(estilos, 0))
const soloOscuro = inicioOscuro === -1 ? {} : leerVariables(extraerBloqueRaiz(estilos, inicioOscuro))
const oscuro = { ...claro, ...soloOscuro }

function luminancia(hex: string): number {
  const limpio = hex.replace('#', '')
  const completo = limpio.length === 3 ? [...limpio].map((c) => c + c).join('') : limpio
  const [r, g, b] = [0, 2, 4].map((i) => {
    const canal = parseInt(completo.slice(i, i + 2), 16) / 255
    return canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Relación de contraste WCAG entre dos colores hexadecimales.
function contraste(a: string, b: string): number {
  const [mayor, menor] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (mayor + 0.05) / (menor + 0.05)
}

const TEXTOS = [
  '--color-texto',
  '--color-texto-medio',
  '--color-texto-secundario',
  '--color-acento',
  '--color-enlace',
  '--color-peligro',
]
const FONDOS = [
  '--color-fondo',
  '--color-superficie',
  '--color-superficie-suave',
  '--rosa-claro',
  '--color-rosa-tenue',
]

// [texto o elemento, fondo, contraste mínimo]. 4,5 = texto normal (WCAG AA); 3 = elementos gráficos.
const PARES: [string, string, number][] = [
  ...TEXTOS.flatMap((texto) => FONDOS.map((fondo): [string, string, number] => [texto, fondo, 4.5])),
  ['--rosa-principal', '--color-fondo', 4.5],
  ['--rosa-principal', '--color-superficie', 4.5],
  ['--color-boton-texto', '--color-boton', 4.5],
  ['--color-boton-texto', '--color-boton-hover', 4.5],
  ['--color-peligro-texto', '--color-peligro-fondo', 4.5],
  ['--color-aviso-texto', '--color-aviso-fondo', 4.5],
  ['--color-exito-texto', '--color-exito-fondo', 4.5],
  ['--color-exito-texto', '--color-fondo', 4.5],
  ['--menta', '--color-fondo', 3],
]

describe.each([
  ['claro', claro],
  ['oscuro', oscuro],
])('contraste del modo %s', (_modo, variables) => {
  it.each(PARES)('%s sobre %s alcanza %d:1', (texto, fondo, minimo) => {
    expect(variables[texto], `falta ${texto}`).toMatch(/^#[0-9a-f]{3,6}$/i)
    expect(variables[fondo], `falta ${fondo}`).toMatch(/^#[0-9a-f]{3,6}$/i)
    expect(contraste(variables[texto], variables[fondo])).toBeGreaterThanOrEqual(minimo)
  })
})

describe('modo oscuro', () => {
  it('redefine todas las variables de color', () => {
    const colores = Object.keys(claro).filter((nombre) => nombre !== '--fuente-editorial')
    const faltantes = colores.filter((nombre) => !(nombre in soloOscuro))

    expect(faltantes).toEqual([])
  })
})
