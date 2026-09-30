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

export interface Receta {
  id: string
  nombre: string
  ingredientes: IngredienteReceta[]
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
  recetas: Receta[]
  presentaciones: PresentacionVenta[]
  configuracion: Configuracion
  historialVentas: VentaHistorial[]
}
