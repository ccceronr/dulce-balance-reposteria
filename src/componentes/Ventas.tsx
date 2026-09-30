import { useState, type FormEvent } from 'react'
import IconoChocolates from './IconoChocolates'
import { fechaDeHoy, formatearFecha, FORMATO_COP } from '../lib/formato'
import type {
  ArticuloInventario,
  Configuracion,
  PresentacionVenta,
  Receta,
  TipoVenta,
  VentaHistorial,
} from '../lib/modelos'
import { calcularResultadoPresentacion } from '../lib/presentaciones'
import { calcularResultadoReceta } from '../lib/recetas'
import { crearVenta, resumirMes } from '../lib/ventas'

interface FormularioVenta {
  // "producto:<id>" o "caja:<id>"
  seleccion: string
  cantidad: string
  precioUnitario: string
  fecha: string
}

interface VentasProps {
  inventario: ArticuloInventario[]
  recetas: Receta[]
  presentaciones: PresentacionVenta[]
  configuracion: Configuracion
  historial: VentaHistorial[]
  onRegistrar: (venta: VentaHistorial) => void
  onEliminar: (ventaId: string) => void
}

function formularioVacio(): FormularioVenta {
  return { seleccion: '', cantidad: '1', precioUnitario: '', fecha: fechaDeHoy() }
}

function separarSeleccion(seleccion: string): { tipo: TipoVenta; referenciaId: string } {
  const [tipo, ...resto] = seleccion.split(':')
  return { tipo: tipo === 'caja' ? 'caja' : 'producto', referenciaId: resto.join(':') }
}

function Ventas({
  inventario,
  recetas,
  presentaciones,
  configuracion,
  historial,
  onRegistrar,
  onEliminar,
}: VentasProps) {
  const [formulario, setFormulario] = useState<FormularioVenta>(formularioVacio)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [mes, setMes] = useState(() => fechaDeHoy().slice(0, 7))
  const [error, setError] = useState('')

  const datos = { inventario, recetas, presentaciones }
  const hayCatalogo = recetas.length > 0 || presentaciones.length > 0
  const resumen = resumirMes(historial, mes)

  // Vista previa con los valores escritos, usando la misma función que guarda la venta.
  const vistaPrevia = formulario.seleccion && formulario.precioUnitario.trim() !== ''
    ? crearVenta(
        {
          ...separarSeleccion(formulario.seleccion),
          cantidad: Number(formulario.cantidad),
          precioUnitario: Number(formulario.precioUnitario),
          fecha: formulario.fecha,
        },
        datos,
        configuracion,
      )
    : null

  function precioGuardado(seleccion: string): string {
    const { tipo, referenciaId } = separarSeleccion(seleccion)
    const receta = tipo === 'producto' ? recetas.find((item) => item.id === referenciaId) : undefined
    const caja = tipo === 'caja' ? presentaciones.find((item) => item.id === referenciaId) : undefined

    const resultado = receta
      ? calcularResultadoReceta(receta, inventario, configuracion)
      : caja
        ? calcularResultadoPresentacion(caja, datos, configuracion)
        : null

    return resultado?.ok ? String(resultado.precioUsado) : ''
  }

  function abrirFormulario() {
    setFormulario(formularioVacio())
    setFormularioAbierto(true)
    setError('')
  }

  function cerrarFormulario() {
    setFormulario(formularioVacio())
    setFormularioAbierto(false)
    setError('')
  }

  function elegir(seleccion: string) {
    setFormulario({ ...formulario, seleccion, precioUnitario: precioGuardado(seleccion) })
    setError('')
  }

  function registrarVenta(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (!formulario.seleccion) {
      setError('Elige qué vendiste.')
      return
    }

    const resultado = crearVenta(
      {
        ...separarSeleccion(formulario.seleccion),
        cantidad: Number(formulario.cantidad),
        precioUnitario: Number(formulario.precioUnitario),
        fecha: formulario.fecha,
      },
      datos,
      configuracion,
    )
    if (!resultado.ok) {
      setError(resultado.error)
      return
    }

    onRegistrar(resultado.venta)
    setMes(resultado.venta.fecha.slice(0, 7))
    cerrarFormulario()
  }

  function solicitarEliminar(venta: VentaHistorial) {
    const descripcion = `${venta.cantidad} × ${venta.nombre} del ${formatearFecha(venta.fecha)}`
    if (window.confirm(`¿Eliminar la venta de ${descripcion}?`)) {
      onEliminar(venta.id)
    }
  }

  const tarjetasResumen = [
    { icono: '📦', titulo: 'Reposición de insumos', valor: resumen.sobres.sobreReposicion },
    { icono: '🔨', titulo: 'Sueldo mano de obra', valor: resumen.sobres.sobreSueldo },
    { icono: '💰', titulo: 'Ganancia limpia empresa', valor: resumen.sobres.sobreGanancia },
    { icono: '💡', titulo: 'Dinero libre al bolsillo', valor: resumen.sobres.dineroLibre, destacado: true },
  ]

  return (
    <section aria-labelledby="sales-title" className="recipes-view">
      <div className="page-heading">
        <div>
          <p className="eyebrow"><span /> Historial</p>
          <h1 id="sales-title">Ventas</h1>
          <p className="page-description">Registra lo que vendes y cuánto va a cada sobre.</p>
        </div>
        <button
          className="button button-primary"
          disabled={!hayCatalogo}
          onClick={abrirFormulario}
          type="button"
        >
          <span aria-hidden="true">+</span>
          Registrar venta
        </button>
      </div>

      {formularioAbierto && (
        <section aria-labelledby="sale-form-title" className="editor-panel">
          <div className="editor-heading">
            <div>
              <p className="eyebrow"><span /> Nueva venta</p>
              <h2 id="sale-form-title">Registrar venta</h2>
            </div>
            <button className="button button-quiet button-close" onClick={cerrarFormulario} type="button">
              Cerrar
            </button>
          </div>

          <form className="sale-form" onSubmit={registrarVenta}>
            <label className="field sale-item-field">
              <span>¿Qué vendiste?</span>
              <select onChange={(evento) => elegir(evento.target.value)} required value={formulario.seleccion}>
                <option value="">Seleccionar producto o caja</option>
                {recetas.length > 0 && (
                  <optgroup label="Productos">
                    {recetas.map((receta) => (
                      <option key={receta.id} value={`producto:${receta.id}`}>{receta.nombre}</option>
                    ))}
                  </optgroup>
                )}
                {presentaciones.length > 0 && (
                  <optgroup label="Cajas">
                    {presentaciones.map((caja) => (
                      <option key={caja.id} value={`caja:${caja.id}`}>{caja.nombre}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>

            <label className="field">
              <span>Cantidad</span>
              <div className="input-with-suffix">
                <input
                  inputMode="numeric"
                  min="1"
                  onChange={(evento) => setFormulario({ ...formulario, cantidad: evento.target.value })}
                  required
                  step="1"
                  type="number"
                  value={formulario.cantidad}
                />
                <span>und.</span>
              </div>
            </label>

            <label className="field">
              <span>Precio por unidad</span>
              <div className="input-with-prefix">
                <span aria-hidden="true">$</span>
                <input
                  inputMode="numeric"
                  min="0"
                  onChange={(evento) => setFormulario({ ...formulario, precioUnitario: evento.target.value })}
                  placeholder="0"
                  required
                  step="1"
                  type="number"
                  value={formulario.precioUnitario}
                />
              </div>
              <small className="field-hint">Solo cambia para esta venta.</small>
            </label>

            <label className="field">
              <span>Fecha</span>
              <input
                onChange={(evento) => setFormulario({ ...formulario, fecha: evento.target.value })}
                required
                type="date"
                value={formulario.fecha}
              />
            </label>

            {vistaPrevia?.ok && (
              <div className="sale-preview" aria-live="polite">
                <p>
                  Total <strong>{FORMATO_COP.format(vistaPrevia.venta.totalVenta)}</strong>
                </p>
                <p>
                  📦 {FORMATO_COP.format(vistaPrevia.venta.sobresTotales.sobreReposicion)} ·
                  🔨 {FORMATO_COP.format(vistaPrevia.venta.sobresTotales.sobreSueldo)} ·
                  💰 {FORMATO_COP.format(vistaPrevia.venta.sobresTotales.sobreGanancia)} ·
                  💡 {FORMATO_COP.format(vistaPrevia.venta.sobresTotales.dineroLibre)}
                </p>
                {vistaPrevia.venta.precioUnitario < vistaPrevia.venta.costoUnitario ? (
                  <p className="detail-alert is-danger" role="alert">
                    Estás vendiendo a pérdida: el costo es {FORMATO_COP.format(vistaPrevia.venta.costoUnitario)} por unidad.
                  </p>
                ) : vistaPrevia.venta.sobresUnitarios.sobreGanancia < 0 ? (
                  <p className="detail-alert is-warning" role="alert">
                    El precio no alcanza para cubrir el sueldo completo de mano de obra.
                  </p>
                ) : null}
              </div>
            )}

            {error && <p aria-live="assertive" className="inline-error sale-error">{error}</p>}

            <div className="form-actions">
              <button className="button button-quiet" onClick={cerrarFormulario} type="button">
                Cancelar
              </button>
              <button className="button button-primary" type="submit">
                Guardar venta
              </button>
            </div>
          </form>
        </section>
      )}

      <section aria-labelledby="month-summary-title" className="detail-block">
        <div className="sales-month">
          <h2 id="month-summary-title">Resumen del mes</h2>
          <label className="field sales-month-field">
            <span className="visually-hidden">Mes</span>
            <input onChange={(evento) => evento.target.value && setMes(evento.target.value)} type="month" value={mes} />
          </label>
        </div>

        <div className="detail-costs">
          <div className="cost-figure">
            <span>Total vendido</span>
            <strong>{FORMATO_COP.format(resumen.totalVendido)}</strong>
          </div>
          <div className="cost-figure">
            <span>Ventas registradas</span>
            <strong>{resumen.cantidadVentas}</strong>
          </div>
        </div>

        <div className="envelopes sales-envelopes">
          {tarjetasResumen.map((tarjeta) => (
            <article
              className={`envelope${tarjeta.destacado ? ' is-highlighted' : ''}${tarjeta.valor < 0 ? ' is-negative' : ''}`}
              key={tarjeta.titulo}
            >
              <h3><span aria-hidden="true">{tarjeta.icono}</span> {tarjeta.titulo}</h3>
              <strong>{FORMATO_COP.format(tarjeta.valor)}</strong>
            </article>
          ))}
        </div>
      </section>

      {resumen.ventas.length > 0 ? (
        <div className="recipe-list" aria-label="Ventas del mes">
          <div className="recipe-list-heading">
            <span>Venta</span>
            <span>Cantidad</span>
            <span>Total</span>
            <span><span className="visually-hidden">Acciones</span></span>
          </div>
          {resumen.ventas.map((venta) => (
            <article className="recipe-row" key={venta.id}>
              <div className="recipe-row-name">
                <span aria-hidden="true" className="recipe-mark">{venta.tipo === 'caja' ? 'C' : 'P'}</span>
                <span>
                  <span className="recipe-row-title">{venta.nombre}</span>
                  <span className="recipe-row-meta">
                    {formatearFecha(venta.fecha)} · {venta.tipo === 'caja' ? 'Caja' : 'Producto'}
                  </span>
                </span>
              </div>
              <span className="recipe-row-yield">
                {venta.cantidad} × {FORMATO_COP.format(venta.precioUnitario)}
              </span>
              <span className="recipe-row-yield sale-total">{FORMATO_COP.format(venta.totalVenta)}</span>
              <div className="recipe-row-actions">
                <button className="text-action text-action-danger" onClick={() => solicitarEliminar(venta)} type="button">
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state recipe-empty-state">
          <IconoChocolates className="empty-illustration" />
          <h2>Sin ventas este mes</h2>
          <p>
            {hayCatalogo
              ? 'Registra una venta para ver cuánto va a cada sobre.'
              : 'Primero crea una receta o una caja para poder registrar ventas.'}
          </p>
        </div>
      )}
    </section>
  )
}

export default Ventas
