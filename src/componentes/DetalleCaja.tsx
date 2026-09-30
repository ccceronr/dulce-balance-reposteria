import PrecioYSobres from './PrecioYSobres'
import { FORMATO_COP, FORMATO_PORCENTAJE } from '../lib/formato'
import type { ArticuloInventario, Configuracion, PresentacionVenta, Receta } from '../lib/modelos'
import { calcularResultadoPresentacion } from '../lib/presentaciones'

interface DetalleCajaProps {
  caja: PresentacionVenta
  inventario: ArticuloInventario[]
  recetas: Receta[]
  configuracion: Configuracion
  onCambiarPrecio: (precioVentaReal: number | undefined) => void
  onEditar: () => void
  onVolver: () => void
}

function DetalleCaja({
  caja,
  inventario,
  recetas,
  configuracion,
  onCambiarPrecio,
  onEditar,
  onVolver,
}: DetalleCajaProps) {
  const resultado = calcularResultadoPresentacion(caja, { inventario, recetas }, configuracion)
  const unidades = caja.productos.reduce((total, producto) => total + producto.cantidad, 0)

  return (
    <section aria-labelledby="detail-title" className="recipe-detail">
      <div className="page-heading">
        <div>
          <button className="text-action detail-back" onClick={onVolver} type="button">
            ← Volver a cajas
          </button>
          <p className="eyebrow"><span /> Costos y bolsillos</p>
          <h1 id="detail-title">{caja.nombre}</h1>
          <p className="page-description">
            {unidades} unidades ·{' '}
            {caja.tipoElaboracion === 'rapida' ? 'Elaboración rápida' : 'Elaboración elaborada'}
          </p>
        </div>
        <button className="button button-secondary" onClick={onEditar} type="button">
          Editar caja
        </button>
      </div>

      {!resultado.ok ? (
        <p aria-live="assertive" className="inline-error">{resultado.error}</p>
      ) : (
        <>
          <section aria-label="Costo de la caja" className="detail-costs">
            <div className="cost-figure">
              <span>Costo de la caja</span>
              <strong>{FORMATO_COP.format(resultado.costoCaja)}</strong>
            </div>
            <p className="cost-breakdown">
              Productos {FORMATO_COP.format(resultado.costoProductos)} + empaques exteriores{' '}
              {FORMATO_COP.format(resultado.costoEmpaques)} + gastos extras{' '}
              {FORMATO_PORCENTAJE.format(configuracion.porcentajeIndirectos)}{' '}
              {FORMATO_COP.format(resultado.gastosExtras)}
            </p>
          </section>

          <PrecioYSobres
            configuracion={configuracion}
            costo={resultado.costoCaja}
            onCambiarPrecio={onCambiarPrecio}
            precioVentaReal={caja.precioVentaReal}
            tipoElaboracion={caja.tipoElaboracion}
            unidad="caja"
            venta={resultado}
          />
        </>
      )}
    </section>
  )
}

export default DetalleCaja
