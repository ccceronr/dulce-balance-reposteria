import { useState, type FormEvent } from 'react'
import DetalleCaja from './DetalleCaja'
import IconoChocolates from './IconoChocolates'
import { obtenerPorcentajeManoObra } from '../lib/configuracion'
import { FORMATO_PORCENTAJE } from '../lib/formato'
import type {
  ArticuloInventario,
  Configuracion,
  PreparacionBase,
  PresentacionVenta,
  Receta,
  TipoElaboracion,
} from '../lib/modelos'
import { validarPresentacion } from '../lib/presentaciones'

type TipoLinea = 'productos' | 'empaques'

interface LineaFormulario {
  id: string
  elementoId: string
  cantidad: string
}

interface FormularioCaja {
  nombre: string
  tipoElaboracion: TipoElaboracion
  productos: LineaFormulario[]
  empaques: LineaFormulario[]
}

interface CajasProps {
  inventario: ArticuloInventario[]
  preparaciones: PreparacionBase[]
  recetas: Receta[]
  presentaciones: PresentacionVenta[]
  configuracion: Configuracion
  onGuardar: (presentacion: PresentacionVenta) => void
  onEliminar: (presentacionId: string) => void
  onIrARecetas: () => void
}

function lineaVacia(): LineaFormulario {
  return { id: crypto.randomUUID(), elementoId: '', cantidad: '1' }
}

function formularioVacio(): FormularioCaja {
  return {
    nombre: '',
    tipoElaboracion: 'elaborada',
    productos: [lineaVacia()],
    empaques: [],
  }
}

function Cajas({
  inventario,
  preparaciones,
  recetas,
  presentaciones,
  configuracion,
  onGuardar,
  onEliminar,
  onIrARecetas,
}: CajasProps) {
  const [formulario, setFormulario] = useState<FormularioCaja>(formularioVacio)
  const [cajaEditando, setCajaEditando] = useState<string | null>(null)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [cajaDetalle, setCajaDetalle] = useState<string | null>(null)
  const [error, setError] = useState('')

  const empaquesDisponibles = inventario.filter((articulo) => articulo.tipo === 'empaque')

  function limpiarFormulario() {
    setFormulario(formularioVacio())
    setCajaEditando(null)
    setFormularioAbierto(false)
    setError('')
  }

  function abrirFormularioNuevo() {
    setFormulario(formularioVacio())
    setCajaEditando(null)
    setFormularioAbierto(true)
    setError('')
  }

  function editarCaja(caja: PresentacionVenta) {
    setCajaDetalle(null)
    setFormulario({
      nombre: caja.nombre,
      tipoElaboracion: caja.tipoElaboracion,
      productos: caja.productos.map((producto) => ({
        id: crypto.randomUUID(),
        elementoId: producto.recetaId,
        cantidad: String(producto.cantidad),
      })),
      empaques: caja.empaques.map((empaque) => ({
        id: crypto.randomUUID(),
        elementoId: empaque.insumoId,
        cantidad: String(empaque.cantidad),
      })),
    })
    setCajaEditando(caja.id)
    setFormularioAbierto(true)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function actualizarLinea(
    tipo: TipoLinea,
    lineaId: string,
    campo: 'elementoId' | 'cantidad',
    valor: string,
  ) {
    setFormulario((actual) => ({
      ...actual,
      [tipo]: actual[tipo].map((linea) =>
        linea.id === lineaId ? { ...linea, [campo]: valor } : linea,
      ),
    }))
    setError('')
  }

  function agregarLinea(tipo: TipoLinea) {
    setFormulario((actual) => ({ ...actual, [tipo]: [...actual[tipo], lineaVacia()] }))
  }

  function quitarLinea(tipo: TipoLinea, lineaId: string) {
    setFormulario((actual) => ({
      ...actual,
      [tipo]: actual[tipo].filter((linea) => linea.id !== lineaId),
    }))
  }

  function guardarCaja(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    const caja: PresentacionVenta = {
      id: cajaEditando ?? crypto.randomUUID(),
      nombre: formulario.nombre.trim(),
      tipoElaboracion: formulario.tipoElaboracion,
      // Conserva el precio real guardado desde la pantalla de detalle.
      precioVentaReal: presentaciones.find((existente) => existente.id === cajaEditando)?.precioVentaReal,
      productos: formulario.productos.map((linea) => ({
        recetaId: linea.elementoId,
        cantidad: Number(linea.cantidad),
      })),
      empaques: formulario.empaques.map((linea) => ({
        insumoId: linea.elementoId,
        cantidad: Number(linea.cantidad),
      })),
    }

    const errorValidacion = validarPresentacion(caja, { inventario, recetas, presentaciones })
    if (errorValidacion) {
      setError(errorValidacion)
      return
    }

    onGuardar(caja)
    limpiarFormulario()
  }

  function duplicarCaja(caja: PresentacionVenta) {
    let nombreCopia = `${caja.nombre} (copia)`
    let numeroCopia = 2
    while (presentaciones.some((existente) => existente.nombre === nombreCopia)) {
      nombreCopia = `${caja.nombre} (copia ${numeroCopia})`
      numeroCopia += 1
    }

    onGuardar({ ...caja, id: crypto.randomUUID(), nombre: nombreCopia })
    setError('')
  }

  function solicitarEliminar(caja: PresentacionVenta) {
    if (window.confirm(`¿Eliminar la caja “${caja.nombre}”?`)) {
      onEliminar(caja.id)
      setError('')
    }
  }

  function renderSelectorLineas(tipo: TipoLinea) {
    const esProducto = tipo === 'productos'
    const lineas = formulario[tipo]
    const opciones = esProducto ? recetas : empaquesDisponibles
    const seleccionados = lineas.map((linea) => linea.elementoId).filter(Boolean)
    const nombreSingular = esProducto ? 'producto' : 'empaque'

    return (
      <div className="recipe-lines">
        {lineas.map((linea, indice) => (
          <div className="recipe-line" key={linea.id}>
            <label className="field recipe-line-item">
              <span className="visually-hidden">
                {esProducto ? 'Producto' : 'Empaque'} {indice + 1}
              </span>
              <select
                onChange={(evento) => actualizarLinea(tipo, linea.id, 'elementoId', evento.target.value)}
                required
                value={linea.elementoId}
              >
                <option value="">Seleccionar {nombreSingular}</option>
                {opciones.map((opcion) => (
                  <option
                    disabled={seleccionados.includes(opcion.id) && opcion.id !== linea.elementoId}
                    key={opcion.id}
                    value={opcion.id}
                  >
                    {opcion.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="field recipe-line-quantity">
              <span className="visually-hidden">Cantidad</span>
              <div className="input-with-suffix">
                <input
                  inputMode="numeric"
                  min="1"
                  onChange={(evento) => actualizarLinea(tipo, linea.id, 'cantidad', evento.target.value)}
                  placeholder="Cantidad"
                  required
                  step="1"
                  type="number"
                  value={linea.cantidad}
                />
                <span>und.</span>
              </div>
            </label>
            <button
              aria-label={`Quitar ${nombreSingular} ${indice + 1}`}
              className="remove-line"
              onClick={() => quitarLinea(tipo, linea.id)}
              type="button"
            >
              Quitar
            </button>
          </div>
        ))}
        <button
          className="add-line"
          disabled={opciones.length <= seleccionados.length}
          onClick={() => agregarLinea(tipo)}
          type="button"
        >
          + Agregar {nombreSingular}
        </button>
      </div>
    )
  }

  const cajaSeleccionada = presentaciones.find((caja) => caja.id === cajaDetalle)
  if (cajaSeleccionada) {
    return (
      <DetalleCaja
        caja={cajaSeleccionada}
        configuracion={configuracion}
        inventario={inventario}
        key={cajaSeleccionada.id}
        preparaciones={preparaciones}
        onCambiarPrecio={(precioVentaReal) => onGuardar({ ...cajaSeleccionada, precioVentaReal })}
        onEditar={() => editarCaja(cajaSeleccionada)}
        onVolver={() => setCajaDetalle(null)}
        recetas={recetas}
      />
    )
  }

  return (
    <section aria-labelledby="boxes-title" className="recipes-view">
      <div className="page-heading">
        <div>
          <p className="eyebrow"><span /> Presentaciones</p>
          <h1 id="boxes-title">Cajas</h1>
          <p className="page-description">Combina productos en una caja con su empaque de regalo.</p>
        </div>
        <button className="button button-primary" onClick={abrirFormularioNuevo} type="button">
          <span aria-hidden="true">+</span>
          Nueva caja
        </button>
      </div>

      {error && <p aria-live="assertive" className="inline-error">{error}</p>}

      {formularioAbierto && (
        <section aria-labelledby="box-form-title" className="editor-panel recipe-editor">
          <div className="editor-heading">
            <div>
              <p className="eyebrow"><span /> Caja mixta</p>
              <h2 id="box-form-title">{cajaEditando ? 'Editar caja' : 'Nueva caja'}</h2>
            </div>
            <button className="button button-quiet button-close" onClick={limpiarFormulario} type="button">
              Cerrar
            </button>
          </div>

          {recetas.length === 0 ? (
            <div className="recipe-no-ingredients">
              <p>Primero crea al menos una receta.</p>
              <button className="button button-secondary" onClick={onIrARecetas} type="button">
                Ir a recetas
              </button>
            </div>
          ) : (
            <form className="recipe-form" onSubmit={guardarCaja}>
              <label className="field recipe-name-field">
                <span>Nombre de la caja</span>
                <input
                  autoComplete="off"
                  maxLength={80}
                  onChange={(evento) => setFormulario({ ...formulario, nombre: evento.target.value })}
                  placeholder="Ej. Caja regalo x6"
                  required
                  value={formulario.nombre}
                />
              </label>

              <fieldset className="elaboration-fieldset">
                <legend>Tipo de elaboración de la caja</legend>
                <div className="segmented-control">
                  {(['rapida', 'elaborada'] as const).map((tipo) => (
                    <button
                      aria-pressed={formulario.tipoElaboracion === tipo}
                      className={formulario.tipoElaboracion === tipo ? 'is-selected' : ''}
                      key={tipo}
                      onClick={() => setFormulario({ ...formulario, tipoElaboracion: tipo })}
                      type="button"
                    >
                      {tipo === 'rapida' ? 'Rápida' : 'Elaborada'}{' '}
                      <span>{FORMATO_PORCENTAJE.format(obtenerPorcentajeManoObra(tipo, configuracion))}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <section aria-labelledby="box-products-title" className="recipe-section">
                <div className="recipe-section-heading">
                  <div>
                    <h3 id="box-products-title">Productos</h3>
                    <p>Unidades de cada producto dentro de la caja</p>
                  </div>
                </div>
                {renderSelectorLineas('productos')}
              </section>

              <section aria-labelledby="box-packaging-title" className="recipe-section">
                <div className="recipe-section-heading">
                  <div>
                    <h3 id="box-packaging-title">Empaques exteriores</h3>
                    <p>Caja, cinta, viruta y demás para presentar la caja completa</p>
                  </div>
                </div>
                {renderSelectorLineas('empaques')}
              </section>

              <div className="form-actions">
                <button className="button button-quiet" onClick={limpiarFormulario} type="button">
                  Cancelar
                </button>
                <button className="button button-primary" type="submit">
                  {cajaEditando ? 'Guardar cambios' : 'Guardar caja'}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {presentaciones.length > 0 ? (
        <div className="recipe-list" aria-label="Cajas guardadas">
          <div className="recipe-list-heading">
            <span>Caja</span>
            <span>Contenido</span>
            <span>Elaboración</span>
            <span><span className="visually-hidden">Acciones</span></span>
          </div>
          {presentaciones.map((caja) => {
            const unidades = caja.productos.reduce((total, producto) => total + producto.cantidad, 0)

            return (
              <article className="recipe-row" key={caja.id}>
                <button
                  aria-label={`Ver costos y bolsillos de ${caja.nombre}`}
                  className="recipe-row-name"
                  onClick={() => setCajaDetalle(caja.id)}
                  type="button"
                >
                  <span aria-hidden="true" className="recipe-mark">C</span>
                  <span>
                    <span className="recipe-row-title">{caja.nombre}</span>
                    <span className="recipe-row-meta">
                      {caja.productos.length} productos · {caja.empaques.length} empaques exteriores
                    </span>
                  </span>
                </button>
                <span className="recipe-row-yield">{unidades} unidades</span>
                <span className={`recipe-type ${caja.tipoElaboracion}`}>
                  {caja.tipoElaboracion === 'rapida' ? 'Rápida' : 'Elaborada'} ·{' '}
                  {FORMATO_PORCENTAJE.format(obtenerPorcentajeManoObra(caja.tipoElaboracion, configuracion))}
                </span>
                <div className="recipe-row-actions">
                  <button className="text-action" onClick={() => setCajaDetalle(caja.id)} type="button">Costos</button>
                  <button className="text-action" onClick={() => editarCaja(caja)} type="button">Editar</button>
                  <button className="text-action" onClick={() => duplicarCaja(caja)} type="button">Duplicar</button>
                  <button className="text-action text-action-danger" onClick={() => solicitarEliminar(caja)} type="button">Eliminar</button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="empty-state recipe-empty-state">
          <IconoChocolates className="empty-illustration" />
          <h2>Aún no tienes cajas</h2>
          <p>Arma una caja combinando tus productos y su empaque de regalo.</p>
          {recetas.length > 0 ? (
            <button className="button button-secondary" onClick={abrirFormularioNuevo} type="button">
              Crear primera caja
            </button>
          ) : (
            <button className="button button-secondary" onClick={onIrARecetas} type="button">
              Ir a recetas
            </button>
          )}
        </div>
      )}
    </section>
  )
}

export default Cajas
