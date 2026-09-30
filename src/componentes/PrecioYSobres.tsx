import { useState } from 'react'
import type { ResultadoPrecioVenta } from '../lib/calculos'
import { obtenerPorcentajeManoObra } from '../lib/configuracion'
import { FORMATO_COP, FORMATO_PORCENTAJE } from '../lib/formato'
import type { Configuracion, DetalleSobreVenta, TipoElaboracion } from '../lib/modelos'

interface PrecioYSobresProps {
  venta: ResultadoPrecioVenta
  costo: number
  precioVentaReal: number | undefined
  tipoElaboracion: TipoElaboracion
  configuracion: Configuracion
  unidad: 'unidad' | 'caja'
  // Solo para recetas: muestra también el reparto de la tanda completa.
  tanda?: { rendimiento: number; sobres: DetalleSobreVenta }
  onCambiarPrecio: (precioVentaReal: number | undefined) => void
}

// Precios sugeridos, precio real editable, alertas y tarjetas de bolsillos; lo comparten recetas y cajas.
function PrecioYSobres({
  venta,
  costo,
  precioVentaReal,
  tipoElaboracion,
  configuracion,
  unidad,
  tanda,
  onCambiarPrecio,
}: PrecioYSobresProps) {
  const [precioTexto, setPrecioTexto] = useState(
    precioVentaReal === undefined ? '' : String(precioVentaReal),
  )
  const [errorPrecio, setErrorPrecio] = useState('')

  const porcentajeManoObra = obtenerPorcentajeManoObra(tipoElaboracion, configuracion)
  const premiumSeleccionado = venta.usaPrecioReal && venta.precioUsado === venta.precioPremium

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

  function usarPrecioPremium() {
    setPrecioTexto(String(venta.precioPremium))
    setErrorPrecio('')
    onCambiarPrecio(venta.precioPremium)
  }

  const sobres = [
    {
      icono: '📦',
      titulo: 'Bolsillo 1 · Reposición de insumos',
      valor: venta.sobres.sobreReposicion,
      tanda: tanda?.sobres.sobreReposicion,
    },
    {
      icono: '🔨',
      titulo: `Bolsillo 2 · Sueldo mano de obra (${FORMATO_PORCENTAJE.format(porcentajeManoObra)})`,
      valor: venta.sobres.sobreSueldo,
      tanda: tanda?.sobres.sobreSueldo,
    },
    {
      icono: '💰',
      titulo: 'Bolsillo 3 · Ganancia limpia empresa',
      valor: venta.sobres.sobreGanancia,
      tanda: tanda?.sobres.sobreGanancia,
    },
    {
      icono: '💡',
      titulo: 'Dinero libre',
      valor: venta.sobres.dineroLibre,
      tanda: tanda?.sobres.dineroLibre,
      destacado: true,
    },
  ]

  return (
    <>
      <section aria-labelledby="prices-title" className="detail-block">
        <h2 id="prices-title">Precio de venta por {unidad}</h2>
        <div className="price-options">
          <button
            aria-pressed={!venta.usaPrecioReal}
            className={`price-option${!venta.usaPrecioReal ? ' is-selected' : ''}`}
            onClick={usarPrecioEstandar}
            type="button"
          >
            <span>Estándar · ×{configuracion.multiplicadorEstandar}</span>
            <strong>{FORMATO_COP.format(venta.precioEstandar)}</strong>
          </button>
          <button
            aria-pressed={premiumSeleccionado}
            className={`price-option${premiumSeleccionado ? ' is-selected' : ''}`}
            onClick={usarPrecioPremium}
            type="button"
          >
            <span>Premium · ×{configuracion.multiplicadorPremium}</span>
            <strong>{FORMATO_COP.format(venta.precioPremium)}</strong>
          </button>
        </div>

        <label className="field real-price-field">
          <span>Precio final de venta real</span>
          <div className="input-with-suffix">
            <input
              inputMode="numeric"
              min="0"
              onChange={(evento) => cambiarPrecio(evento.target.value)}
              placeholder={String(venta.precioEstandar)}
              step="1"
              type="number"
              value={precioTexto}
            />
            <span>COP</span>
          </div>
          <small className="field-hint">
            {errorPrecio || (venta.usaPrecioReal
              ? 'Se guarda automáticamente. Déjalo vacío para usar el Estándar.'
              : 'Vacío: se usa el precio Estándar.')}
          </small>
        </label>
      </section>

      {venta.sobres.alertaPerdida ? (
        <p className="detail-alert is-danger" role="alert">
          Estás vendiendo a pérdida: el precio no cubre el costo de producción
          ({FORMATO_COP.format(costo)} por {unidad}).
        </p>
      ) : venta.sobres.alertaSueldo ? (
        <p className="detail-alert is-warning" role="alert">
          El precio no alcanza para cubrir el sueldo completo de mano de obra.
        </p>
      ) : null}

      <section aria-labelledby="envelopes-title" className="detail-block">
        <h2 id="envelopes-title">
          Reparto en bolsillos · {FORMATO_COP.format(venta.precioUsado)} por {unidad}
        </h2>
        <div className="envelopes">
          {sobres.map((sobre) => (
            <article
              className={`envelope${sobre.destacado ? ' is-highlighted' : ''}${sobre.valor < 0 ? ' is-negative' : ''}`}
              key={sobre.titulo}
            >
              <h3><span aria-hidden="true">{sobre.icono}</span> {sobre.titulo}</h3>
              <strong>{FORMATO_COP.format(sobre.valor)}</strong>
              {tanda && sobre.tanda !== undefined && (
                <span className="envelope-batch">
                  Tanda ({tanda.rendimiento} u.): {FORMATO_COP.format(sobre.tanda)}
                </span>
              )}
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

export default PrecioYSobres
