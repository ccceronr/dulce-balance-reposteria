import PrecioYSobres from './PrecioYSobres'
import { FORMATO_COP, FORMATO_PORCENTAJE } from '../lib/formato'
import type { ArticuloInventario, Configuracion, PreparacionBase, Receta } from '../lib/modelos'
import { calcularResultadoReceta } from '../lib/recetas'

interface DetalleRecetaProps {
  receta: Receta
  inventario: ArticuloInventario[]
  preparaciones: PreparacionBase[]
  configuracion: Configuracion
  onCambiarPrecio: (precioVentaReal: number | undefined) => void
  onEditar: () => void
  onVolver: () => void
}

function DetalleReceta({
  receta,
  inventario,
  preparaciones,
  configuracion,
  onCambiarPrecio,
  onEditar,
  onVolver,
}: DetalleRecetaProps) {
  const resultado = calcularResultadoReceta(receta, { inventario, preparaciones }, configuracion)

  return (
    <section aria-labelledby="detail-title" className="recipe-detail">
      <div className="page-heading">
        <div>
          <button className="text-action detail-back" onClick={onVolver} type="button">
            ← Volver a recetas
          </button>
          <p className="eyebrow"><span /> Costos y bolsillos</p>
          <h1 id="detail-title">{receta.nombre}</h1>
          <p className="page-description">
            {receta.rendimiento} {receta.rendimiento === 1 ? 'unidad' : 'unidades'} por tanda ·{' '}
            {receta.tipoElaboracion === 'rapida' ? 'Elaboración rápida' : 'Elaboración elaborada'}
          </p>
        </div>
        <button className="button button-secondary" onClick={onEditar} type="button">
          Editar receta
        </button>
      </div>

      {!resultado.ok ? (
        <p aria-live="assertive" className="inline-error">{resultado.error}</p>
      ) : (
        <>
          <section aria-label="Costo de producción" className="detail-costs">
            <div className="cost-figure">
              <span>Costo por unidad</span>
              <strong>{FORMATO_COP.format(resultado.costoPorUnidad)}</strong>
            </div>
            <div className="cost-figure">
              <span>Costo de la tanda</span>
              <strong>{FORMATO_COP.format(resultado.costoTanda)}</strong>
            </div>
            <p className="cost-breakdown">
              Insumos {FORMATO_COP.format(resultado.insumosDirectos)} + gastos extras{' '}
              {FORMATO_PORCENTAJE.format(configuracion.porcentajeIndirectos)}{' '}
              {FORMATO_COP.format(resultado.gastosExtras)}
            </p>
          </section>

          <PrecioYSobres
            configuracion={configuracion}
            costo={resultado.costoPorUnidad}
            onCambiarPrecio={onCambiarPrecio}
            precioVentaReal={receta.precioVentaReal}
            tanda={{ rendimiento: receta.rendimiento, sobres: resultado.sobresTanda }}
            tipoElaboracion={receta.tipoElaboracion}
            unidad="unidad"
            venta={{ ...resultado, sobres: resultado.sobresUnidad }}
          />
        </>
      )}
    </section>
  )
}

export default DetalleReceta
