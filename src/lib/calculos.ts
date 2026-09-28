export type TipoElaboracion = 'rapida' | 'elaborada'

export interface DatosInsumo {
  precioCompra: number
  cantidadTotalComprada: number
  cantidadUsada: number
}

export interface DatosReceta {
  insumos: DatosInsumo[]
  rendimiento: number
  porcentajeIndirectos?: number
}

export interface ResultadoCostoReceta {
  insumosDirectos: number
  gastosExtras: number
  costoBaseTotal: number
  costoPorUnidad: number
}

export interface OpcionesPreciosSugeridos {
  multiplicadorEstandar?: number
  multiplicadorPremium?: number
}

export interface ResultadoPreciosSugeridos {
  precioEstandar: number
  precioPremium: number
}

export interface DatosSobres {
  costoPorUnidad: number
  precioVenta: number
  tipoElaboracion: TipoElaboracion
  porcentajeManoObra?: number
}

export interface ResultadoSobres {
  sobreReposicion: number
  sobreSueldo: number
  sobreGanancia: number
  dineroLibre: number
  alertaPerdida: boolean
  alertaSueldo: boolean
}

const PORCENTAJE_INDIRECTOS_PREDETERMINADO = 0.1
const MULTIPLICADOR_ESTANDAR_PREDETERMINADO = 2.2
const MULTIPLICADOR_PREMIUM_PREDETERMINADO = 2.5
const PORCENTAJE_MANO_OBRA_RAPIDA = 0.2
const PORCENTAJE_MANO_OBRA_ELABORADA = 0.25
const PORCENTAJE_MANO_OBRA_MINIMO = 0.2
const PORCENTAJE_MANO_OBRA_MAXIMO = 0.3
const VALOR_REDONDEO = 1_000

function validarNumero(nombre: string, valor: number): void {
  if (!Number.isFinite(valor)) {
    throw new Error(`${nombre} debe ser un número finito.`)
  }
}

function validarNoNegativo(nombre: string, valor: number): void {
  validarNumero(nombre, valor)

  if (valor < 0) {
    throw new Error(`${nombre} no puede ser negativo.`)
  }
}

function validarPositivo(nombre: string, valor: number): void {
  validarNumero(nombre, valor)

  if (valor <= 0) {
    throw new Error(`${nombre} debe ser mayor que cero.`)
  }
}

export function calcularCostoInsumo({
  precioCompra,
  cantidadTotalComprada,
  cantidadUsada,
}: DatosInsumo): number {
  validarNoNegativo('El precio de compra', precioCompra)
  validarPositivo('La cantidad total comprada', cantidadTotalComprada)
  validarNoNegativo('La cantidad usada', cantidadUsada)

  return (precioCompra / cantidadTotalComprada) * cantidadUsada
}

export function calcularCostoReceta({
  insumos,
  rendimiento,
  porcentajeIndirectos = PORCENTAJE_INDIRECTOS_PREDETERMINADO,
}: DatosReceta): ResultadoCostoReceta {
  validarPositivo('El rendimiento', rendimiento)
  validarNoNegativo('El porcentaje de costos indirectos', porcentajeIndirectos)

  const insumosDirectos = insumos.reduce(
    (total, insumo) => total + calcularCostoInsumo(insumo),
    0,
  )
  const gastosExtras = insumosDirectos * porcentajeIndirectos
  const costoBaseTotal = insumosDirectos + gastosExtras

  return {
    insumosDirectos,
    gastosExtras,
    costoBaseTotal,
    costoPorUnidad: costoBaseTotal / rendimiento,
  }
}

function redondearAlMillar(valor: number): number {
  return Math.round(valor / VALOR_REDONDEO) * VALOR_REDONDEO
}

export function calcularPreciosSugeridos(
  costoPorUnidad: number,
  {
    multiplicadorEstandar = MULTIPLICADOR_ESTANDAR_PREDETERMINADO,
    multiplicadorPremium = MULTIPLICADOR_PREMIUM_PREDETERMINADO,
  }: OpcionesPreciosSugeridos = {},
): ResultadoPreciosSugeridos {
  validarNoNegativo('El costo por unidad', costoPorUnidad)
  validarPositivo('El multiplicador estándar', multiplicadorEstandar)
  validarPositivo('El multiplicador premium', multiplicadorPremium)

  return {
    precioEstandar: redondearAlMillar(costoPorUnidad * multiplicadorEstandar),
    precioPremium: redondearAlMillar(costoPorUnidad * multiplicadorPremium),
  }
}

export function calcularSobres({
  costoPorUnidad,
  precioVenta,
  tipoElaboracion,
  porcentajeManoObra,
}: DatosSobres): ResultadoSobres {
  validarNoNegativo('El costo por unidad', costoPorUnidad)
  validarNoNegativo('El precio de venta', precioVenta)

  const porcentaje = porcentajeManoObra ??
    (tipoElaboracion === 'rapida'
      ? PORCENTAJE_MANO_OBRA_RAPIDA
      : PORCENTAJE_MANO_OBRA_ELABORADA)

  validarNumero('El porcentaje de mano de obra', porcentaje)
  if (
    porcentaje < PORCENTAJE_MANO_OBRA_MINIMO ||
    porcentaje > PORCENTAJE_MANO_OBRA_MAXIMO
  ) {
    throw new Error('El porcentaje de mano de obra debe estar entre 20% y 30%.')
  }

  const sobreReposicion = costoPorUnidad
  const sobreSueldo = precioVenta * porcentaje
  const sobreGanancia = precioVenta - sobreReposicion - sobreSueldo

  return {
    sobreReposicion,
    sobreSueldo,
    sobreGanancia,
    dineroLibre: sobreSueldo + sobreGanancia,
    alertaPerdida: precioVenta < costoPorUnidad,
    alertaSueldo: sobreGanancia < 0,
  }
}
