export type TipoElaboracion = 'rapida' | 'elaborada'
export type TipoInventario = 'ingrediente' | 'empaque'
export type UnidadInventario = 'g' | 'ml' | 'unidad'

export interface ArticuloInventario {
  id: string
  nombre: string
  tipo: TipoInventario
  precioCompra: number
  cantidadTotalComprada: number
  unidad: UnidadInventario
}

export interface IngredienteReceta {
  insumoId: string
  cantidadUsada: number
}

// Cantidad de una preparación base usada en una receta, en la unidad de la preparación.
export interface LineaPreparacion {
  preparacionId: string
  cantidadUsada: number
}

export type UnidadPreparacion = 'g' | 'ml'

// Algo que se prepara para usar dentro de varios productos (p. ej., masa de pastel).
export interface PreparacionBase {
  id: string
  nombre: string
  ingredientes: IngredienteReceta[]
  // Cuánto pesa o mide lo que sale de la preparación.
  rendimientoTotal: number
  unidad: UnidadPreparacion
}

export interface Receta {
  id: string
  nombre: string
  ingredientes: IngredienteReceta[]
  // Opcional: las recetas guardadas antes de existir las preparaciones no lo tienen.
  preparaciones?: LineaPreparacion[]
  empaques: IngredienteReceta[]
  rendimiento: number
  tipoElaboracion: TipoElaboracion
  precioVentaReal?: number
}

export interface ArticuloPresentacion {
  recetaId: string
  cantidad: number
}

export interface EmpaquePresentacion {
  insumoId: string
  cantidad: number
}

// En la interfaz se llama "caja": combina productos y empaques exteriores.
export interface PresentacionVenta {
  id: string
  nombre: string
  productos: ArticuloPresentacion[]
  empaques: EmpaquePresentacion[]
  tipoElaboracion: TipoElaboracion
  precioVentaReal?: number
}

export interface Configuracion {
  porcentajeIndirectos: number
  multiplicadorEstandar: number
  multiplicadorPremium: number
  porcentajeManoObraRapida: number
  porcentajeManoObraElaborada: number
  // Los precios sugeridos se redondean a este valor: 1.000, 500, 100 o 1 (al peso).
  valorRedondeo: number
}

export interface DetalleSobreVenta {
  sobreReposicion: number
  sobreSueldo: number
  sobreGanancia: number
  dineroLibre: number
}

export type TipoVenta = 'producto' | 'caja'

// Copia de los valores al momento de la venta: no cambia si después cambian los costos.
export interface VentaHistorial {
  id: string
  // Fecha de la venta en formato AAAA-MM-DD.
  fecha: string
  tipo: TipoVenta
  // Id de la receta (producto) o de la presentación (caja) vendida.
  referenciaId: string
  nombre: string
  cantidad: number
  precioUnitario: number
  costoUnitario: number
  sobresUnitarios: DetalleSobreVenta
  totalVenta: number
  costoTotal: number
  sobresTotales: DetalleSobreVenta
}

export interface DatosAplicacion {
  inventario: ArticuloInventario[]
  preparaciones: PreparacionBase[]
  recetas: Receta[]
  presentaciones: PresentacionVenta[]
  configuracion: Configuracion
  historialVentas: VentaHistorial[]
}
