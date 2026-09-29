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

export interface PresentacionVenta {
  id: string
  nombre: string
  productos: ArticuloPresentacion[]
  empaques: EmpaquePresentacion[]
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

export interface VentaHistorial {
  id: string
  fecha: string
  presentacionId: string
  nombrePresentacion: string
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
