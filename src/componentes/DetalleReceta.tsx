import { useState } from 'react'
import type { ArticuloInventario, Configuracion, Receta } from '../lib/modelos'
import { obtenerPorcentajeManoObra } from '../lib/configuracion'
import { FORMATO_COP, FORMATO_PORCENTAJE } from '../lib/formato'
import { calcularResultadoReceta } from '../lib/recetas'

interface DetalleRecetaProps {
  receta: Receta
  inventario: ArticuloInventario[]
  configuracion: Configuracion
  onCambiarPrecio: (precioVentaReal: number | undefined) => void
  onEditar: () => void
  onVolver: () => void
}

function DetalleReceta({
  receta,
  inventario,
  configuracion,
  onCambiarPrecio,
  onEditar,
  onVolver,
}: DetalleRecetaProps) {
  const [precioTexto, setPrecioTexto] = useState(
    receta.precioVentaReal === undefined ? '' : String(receta.precioVentaReal),
  )
  const [errorPrecio, setErrorPrecio] = useState('')

  const resultado = calcularResultadoReceta(receta, inventario, configuracion)
  const porcentajeManoObra = obtenerPorcentajeManoObra(receta.tipoElaboracion, configuracion)

  function cambiarPrecio(texto: string) {
    setPrecioTexto(texto)

    // Campo vacío: se vuelve a usar el precio Estándar sugerido.
    if (texto.trim() === '') {
      setErrorPrecio('')
      onCambiarPrecio(undefined)
      return
    }

    const precio = Number(texto)
    if (!Number.isInteger(precio) || precio < 0) {
      setErrorPrecio('Escribe un precio en pesos, sin decimales.')
      return
    }

    setErrorPrecio('')
    onCambiarPrecio(precio)
  }

  function usarPrecioEstandar() {
    setPrecioTexto('')
    setErrorPrecio('')
    onCambiarPrecio(undefined)
  }

  function usarPrecioPremium(precio: number) {
    setPrecioTexto(String(precio))
    setErrorPrecio('')
    onCambiarPrecio(precio)
  }

  return (
    <section aria-labelledby="detail-title" className="recipe-detail">
      <div className="page-heading">
        <div>
          <button className="text-action detail-back" onClick={onVolver} type="button">
            ← Volver a recetas
          </button>
          <p className="eyebrow"><span /> Costos y sobres</p>
          <h1 id="detail-title">{receta.nombre}</h1>
          <p className="page-description">
            {receta.rendimiento} unidades por tanda ·{' '}
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

          <section aria-labelledby="prices-title" className="detail-block">
            <h2 id="prices-title">Precio de venta por unidad</h2>
            <div className="price-options">
              <button
                aria-pressed={!resultado.usaPrecioReal}
                className={`price-option${!resultado.usaPrecioReal ? ' is-selected' : ''}`}
                onClick={usarPrecioEstandar}
                type="button"
              >
                <span>Estándar · ×{configuracion.multiplicadorEstandar}</span>
                <strong>{FORMATO_COP.format(resultado.precioEstandar)}</strong>
              </button>
              <button
                aria-pressed={resultado.usaPrecioReal && resultado.precioUsado === resultado.precioPremium}
                className={`price-option${resultado.usaPrecioReal && resultado.precioUsado === resultado.precioPremium ? ' is-selected' : ''}`}
                onClick={() => usarPrecioPremium(resultado.precioPremium)}
                type="button"
              >
                <span>Premium · ×{configuracion.multiplicadorPremium}</span>
                <strong>{FORMATO_COP.format(resultado.precioPremium)}</strong>
              </button>
            </div>

            <label className="field real-price-field">
              <span>Precio final de venta real</span>
              <div className="input-with-suffix">
                <input
                  inputMode="numeric"
                  min="0"
                  onChange={(evento) => cambiarPrecio(evento.target.value)}
                  placeholder={String(resultado.precioEstandar)}
                  step="1"
                  type="number"
                  value={precioTexto}
                />
                <span>COP</span>
              </div>
              <small className="field-hint">
                {errorPrecio || (resultado.usaPrecioReal
                  ? 'Se guarda en la receta. Déjalo vacío para usar el Estándar.'
                  : 'Vacío: se usa el precio Estándar.')}
              </small>
            </label>
          </section>

          {resultado.sobresUnidad.alertaPerdida ? (
            <p className="detail-alert is-danger" role="alert">
              Estás vendiendo a pérdida: el precio no cubre el costo de producción
              ({FORMATO_COP.format(resultado.costoPorUnidad)} por unidad).
            </p>
          ) : resultado.sobresUnidad.alertaSueldo ? (
            <p className="detail-alert is-warning" role="alert">
              El precio no alcanza para cubrir el sueldo completo de mano de obra.
            </p>
          ) : null}

          <section aria-labelledby="envelopes-title" className="detail-block">
            <h2 id="envelopes-title">
              Reparto en sobres · {FORMATO_COP.format(resultado.precioUsado)} por unidad
            </h2>
            <div className="envelopes">
              {[
                {
                  icono: '📦',
                  titulo: 'Sobre 1 · Reposición de insumos',
                  unidad: resultado.sobresUnidad.sobreReposicion,
                  tanda: resultado.sobresTanda.sobreReposicion,
                },
                {
                  icono: '🔨',
                  titulo: `Sobre 2 · Sueldo mano de obra (${FORMATO_PORCENTAJE.format(porcentajeManoObra)})`,
                  unidad: resultado.sobresUnidad.sobreSueldo,
                  tanda: resultado.sobresTanda.sobreSueldo,
                },
                {
                  icono: '💰',
                  titulo: 'Sobre 3 · Ganancia limpia empresa',
                  unidad: resultado.sobresUnidad.sobreGanancia,
                  tanda: resultado.sobresTanda.sobreGanancia,
                },
                {
                  icono: '💡',
                  titulo: 'Total dinero libre al bolsillo',
                  unidad: resultado.sobresUnidad.dineroLibre,
                  tanda: resultado.sobresTanda.dineroLibre,
                  destacado: true,
                },
              ].map((sobre) => (
                <article
                  className={`envelope${sobre.destacado ? ' is-highlighted' : ''}${sobre.unidad < 0 ? ' is-negative' : ''}`}
                  key={sobre.titulo}
                >
                  <h3><span aria-hidden="true">{sobre.icono}</span> {sobre.titulo}</h3>
                  <strong>{FORMATO_COP.format(sobre.unidad)}</strong>
                  <span className="envelope-batch">
                    Tanda ({receta.rendimiento} u.): {FORMATO_COP.format(sobre.tanda)}
                  </span>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </section>
  )
}

export default DetalleReceta
