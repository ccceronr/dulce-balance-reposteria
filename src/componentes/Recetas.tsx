import { useState, type FormEvent } from 'react'
import DetalleReceta from './DetalleReceta'
import IconoChocolates from './IconoChocolates'
import type {
  ArticuloInventario,
  Configuracion,
  PresentacionVenta,
  Receta,
  TipoElaboracion,
} from '../lib/modelos'
import { obtenerPorcentajeManoObra } from '../lib/configuracion'
import { FORMATO_PORCENTAJE } from '../lib/formato'
import { validarReceta } from '../lib/recetas'

interface LineaFormulario {
  id: string
  insumoId: string
  cantidadUsada: string
}

interface FormularioReceta {
  nombre: string
  rendimiento: string
  tipoElaboracion: TipoElaboracion
  ingredientes: LineaFormulario[]
  empaques: LineaFormulario[]
}

interface RecetasProps {
  inventario: ArticuloInventario[]
  recetas: Receta[]
  presentaciones: PresentacionVenta[]
  configuracion: Configuracion
  onGuardar: (receta: Receta) => void
  onEliminar: (recetaId: string) => void
  onIrAInventario: () => void
}

function lineaVacia(): LineaFormulario {
  return { id: crypto.randomUUID(), insumoId: '', cantidadUsada: '' }
}

function formularioVacio(): FormularioReceta {
  return {
    nombre: '',
    rendimiento: '',
    tipoElaboracion: 'rapida',
    ingredientes: [lineaVacia()],
    empaques: [],
  }
}

function convertirLineas(lineas: Receta['ingredientes']): LineaFormulario[] {
  return lineas.map((linea) => ({
    id: crypto.randomUUID(),
    insumoId: linea.insumoId,
    cantidadUsada: String(linea.cantidadUsada),
  }))
}

function Recetas({
  inventario,
  recetas,
  presentaciones,
  configuracion,
  onGuardar,
  onEliminar,
  onIrAInventario,
}: RecetasProps) {
  const [formulario, setFormulario] = useState<FormularioReceta>(formularioVacio)
  const [recetaEditando, setRecetaEditando] = useState<string | null>(null)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [recetaDetalle, setRecetaDetalle] = useState<string | null>(null)
  const [error, setError] = useState('')

  const ingredientesDisponibles = inventario.filter((articulo) => articulo.tipo === 'ingrediente')
  const empaquesDisponibles = inventario.filter((articulo) => articulo.tipo === 'empaque')

  function limpiarFormulario() {
    setFormulario(formularioVacio())
    setRecetaEditando(null)
    setFormularioAbierto(false)
    setError('')
  }

  function abrirFormularioNuevo() {
    setFormulario(formularioVacio())
    setRecetaEditando(null)
    setFormularioAbierto(true)
    setError('')
  }

  function editarReceta(receta: Receta) {
    setRecetaDetalle(null)
    setFormulario({
      nombre: receta.nombre,
      rendimiento: String(receta.rendimiento),
      tipoElaboracion: receta.tipoElaboracion,
      ingredientes: convertirLineas(receta.ingredientes),
      empaques: convertirLineas(receta.empaques),
    })
    setRecetaEditando(receta.id)
    setFormularioAbierto(true)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function actualizarLinea(
    tipo: 'ingredientes' | 'empaques',
    lineaId: string,
    campo: 'insumoId' | 'cantidadUsada',
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

  function agregarLinea(tipo: 'ingredientes' | 'empaques') {
    setFormulario((actual) => ({
      ...actual,
      [tipo]: [...actual[tipo], lineaVacia()],
    }))
  }

  function quitarLinea(tipo: 'ingredientes' | 'empaques', lineaId: string) {
    setFormulario((actual) => ({
      ...actual,
      [tipo]: actual[tipo].filter((linea) => linea.id !== lineaId),
    }))
  }

  function guardarReceta(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    const receta: Receta = {
      id: recetaEditando ?? crypto.randomUUID(),
      nombre: formulario.nombre.trim(),
      rendimiento: Number(formulario.rendimiento),
      tipoElaboracion: formulario.tipoElaboracion,
      // Conserva el precio real guardado desde la pantalla de detalle.
      precioVentaReal: recetas.find((existente) => existente.id === recetaEditando)?.precioVentaReal,
      ingredientes: formulario.ingredientes.map((linea) => ({
        insumoId: linea.insumoId,
        cantidadUsada: Number(linea.cantidadUsada),
      })),
      empaques: formulario.empaques.map((linea) => ({
        insumoId: linea.insumoId,
        cantidadUsada: Number(linea.cantidadUsada),
      })),
    }

    const nombreDuplicado = recetas.some(
      (existente) =>
        existente.id !== recetaEditando &&
        existente.nombre.trim().toLocaleLowerCase('es-CO') === receta.nombre.toLocaleLowerCase('es-CO'),
    )
    if (nombreDuplicado) {
      setError('Ya existe una receta con ese nombre.')
      return
    }

    const errorValidacion = validarReceta(receta, inventario)
    if (errorValidacion) {
      setError(errorValidacion)
      return
    }

    onGuardar(receta)
    limpiarFormulario()
  }

  function duplicarReceta(receta: Receta) {
    let nombreCopia = `${receta.nombre} (copia)`
    let numeroCopia = 2
    while (recetas.some((existente) => existente.nombre === nombreCopia)) {
      nombreCopia = `${receta.nombre} (copia ${numeroCopia})`
      numeroCopia += 1
    }

    onGuardar({ ...receta, id: crypto.randomUUID(), nombre: nombreCopia })
    setError('')
  }

  function solicitarEliminar(receta: Receta) {
    const estaEnPresentacion = presentaciones.some((presentacion) =>
      presentacion.productos.some((producto) => producto.recetaId === receta.id),
    )
    if (estaEnPresentacion) {
      setError(`No puedes eliminar “${receta.nombre}” porque está incluida en una presentación.`)
      return
    }

    if (window.confirm(`¿Eliminar la receta “${receta.nombre}”?`)) {
      onEliminar(receta.id)
      setError('')
    }
  }

  function renderSelectorLineas(tipo: 'ingredientes' | 'empaques') {
    const esIngrediente = tipo === 'ingredientes'
    const lineas = formulario[tipo]
    const opciones = esIngrediente ? ingredientesDisponibles : empaquesDisponibles
    const seleccionados = lineas.map((linea) => linea.insumoId).filter(Boolean)

    return (
      <div className="recipe-lines">
        {lineas.map((linea, indice) => {
          const articuloSeleccionado = opciones.find((articulo) => articulo.id === linea.insumoId)
          const unidad = esIngrediente ? 'g' : 'und.'

          return (
            <div className="recipe-line" key={linea.id}>
              <label className="field recipe-line-item">
                <span className="visually-hidden">
                  {esIngrediente ? 'Ingrediente' : 'Empaque'} {indice + 1}
                </span>
                <select
                  onChange={(evento) => actualizarLinea(tipo, linea.id, 'insumoId', evento.target.value)}
                  required
                  value={linea.insumoId}
                >
                  <option value="">Seleccionar {esIngrediente ? 'ingrediente' : 'empaque'}</option>
                  {opciones.map((articulo) => (
                    <option
                      disabled={seleccionados.includes(articulo.id) && articulo.id !== linea.insumoId}
                      key={articulo.id}
                      value={articulo.id}
                    >
                      {articulo.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field recipe-line-quantity">
                <span className="visually-hidden">Cantidad en {unidad}</span>
                <div className="input-with-suffix">
                  <input
                    inputMode="decimal"
                    min={esIngrediente ? '0.01' : '1'}
                    onChange={(evento) => actualizarLinea(tipo, linea.id, 'cantidadUsada', evento.target.value)}
                    placeholder="Cantidad"
                    required
                    step={esIngrediente ? 'any' : '1'}
                    type="number"
                    value={linea.cantidadUsada}
                  />
                  <span>{unidad}</span>
                </div>
                {esIngrediente && articuloSeleccionado && (
                  <small className="field-hint">Por tanda · {articuloSeleccionado.unidad}</small>
                )}
                {!esIngrediente && articuloSeleccionado && (
                  <small className="field-hint">Por cada unidad producida</small>
                )}
              </label>
              <button
                aria-label={`Quitar ${esIngrediente ? 'ingrediente' : 'empaque'} ${indice + 1}`}
                className="remove-line"
                onClick={() => quitarLinea(tipo, linea.id)}
                type="button"
              >
                Quitar
              </button>
            </div>
          )
        })}
        <button
          className="add-line"
          disabled={opciones.length <= seleccionados.length}
          onClick={() => agregarLinea(tipo)}
          type="button"
        >
          + Agregar {esIngrediente ? 'ingrediente' : 'empaque'}
        </button>
      </div>
    )
  }

  const recetaSeleccionada = recetas.find((receta) => receta.id === recetaDetalle)
  if (recetaSeleccionada) {
    return (
      <DetalleReceta
        configuracion={configuracion}
        inventario={inventario}
        key={recetaSeleccionada.id}
        onCambiarPrecio={(precioVentaReal) => onGuardar({ ...recetaSeleccionada, precioVentaReal })}
        onEditar={() => editarReceta(recetaSeleccionada)}
        onVolver={() => setRecetaDetalle(null)}
        receta={recetaSeleccionada}
      />
    )
  }

  return (
    <section aria-labelledby="recipes-title" className="recipes-view">
      <div className="page-heading">
        <div>
          <p className="eyebrow"><span /> Fichas técnicas</p>
          <h1 id="recipes-title">Recetas</h1>
          <p className="page-description">Define lo que lleva cada producto y cuánto rinde una tanda.</p>
        </div>
        <button className="button button-primary" onClick={abrirFormularioNuevo} type="button">
          <span aria-hidden="true">+</span>
          Nueva receta
        </button>
      </div>

      {error && <p aria-live="assertive" className="inline-error">{error}</p>}

      {formularioAbierto && (
        <section aria-labelledby="recipe-form-title" className="editor-panel recipe-editor">
          <div className="editor-heading">
            <div>
              <p className="eyebrow"><span /> Ficha técnica</p>
              <h2 id="recipe-form-title">{recetaEditando ? 'Editar receta' : 'Nueva receta'}</h2>
            </div>
            <button className="button button-quiet button-close" onClick={limpiarFormulario} type="button">
              Cerrar
            </button>
          </div>

          {ingredientesDisponibles.length === 0 ? (
            <div className="recipe-no-ingredients">
              <p>Primero agrega ingredientes al inventario.</p>
              <button className="button button-secondary" onClick={onIrAInventario} type="button">
                Ir al inventario
              </button>
            </div>
          ) : (
            <form className="recipe-form" onSubmit={guardarReceta}>
              <div className="recipe-basics">
                <label className="field recipe-name-field">
                  <span>Nombre del producto</span>
                  <input
                    autoComplete="off"
                    maxLength={80}
                    onChange={(evento) => setFormulario({ ...formulario, nombre: evento.target.value })}
                    placeholder="Ej. Cakecicle de chocolate"
                    required
                    value={formulario.nombre}
                  />
                </label>
                <label className="field">
                  <span>Rendimiento por tanda</span>
                  <div className="input-with-suffix">
                    <input
                      inputMode="numeric"
                      min="1"
                      onChange={(evento) => setFormulario({ ...formulario, rendimiento: evento.target.value })}
                      placeholder="0"
                      required
                      step="1"
                      type="number"
                      value={formulario.rendimiento}
                    />
                    <span>unid.</span>
                  </div>
                </label>
              </div>

              <fieldset className="elaboration-fieldset">
                <legend>Tipo de elaboración</legend>
                <div className="segmented-control">
                  <button
                    aria-pressed={formulario.tipoElaboracion === 'rapida'}
                    className={formulario.tipoElaboracion === 'rapida' ? 'is-selected' : ''}
                    onClick={() => setFormulario({ ...formulario, tipoElaboracion: 'rapida' })}
                    type="button"
                  >
                    Rápida <span>{FORMATO_PORCENTAJE.format(configuracion.porcentajeManoObraRapida)}</span>
                  </button>
                  <button
                    aria-pressed={formulario.tipoElaboracion === 'elaborada'}
                    className={formulario.tipoElaboracion === 'elaborada' ? 'is-selected' : ''}
                    onClick={() => setFormulario({ ...formulario, tipoElaboracion: 'elaborada' })}
                    type="button"
                  >
                    Elaborada <span>{FORMATO_PORCENTAJE.format(configuracion.porcentajeManoObraElaborada)}</span>
                  </button>
                </div>
              </fieldset>

              <section aria-labelledby="ingredients-title" className="recipe-section">
                <div className="recipe-section-heading">
                  <div>
                    <h3 id="ingredients-title">Ingredientes</h3>
                    <p>Cantidades usadas en toda la tanda</p>
                  </div>
                </div>
                {renderSelectorLineas('ingredientes')}
              </section>

              <section aria-labelledby="packaging-title" className="recipe-section">
                <div className="recipe-section-heading">
                  <div>
                    <h3 id="packaging-title">Empaques individuales</h3>
                    <p>Cantidad que acompaña a cada unidad del producto</p>
                  </div>
                </div>
                {renderSelectorLineas('empaques')}
              </section>

              <div className="form-actions">
                <button className="button button-quiet" onClick={limpiarFormulario} type="button">
                  Cancelar
                </button>
                <button className="button button-primary" type="submit">
                  {recetaEditando ? 'Guardar cambios' : 'Guardar receta'}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {recetas.length > 0 ? (
        <div className="recipe-list" aria-label="Recetas guardadas">
          <div className="recipe-list-heading">
            <span>Producto</span>
            <span>Rendimiento</span>
            <span>Elaboración</span>
            <span><span className="visually-hidden">Acciones</span></span>
          </div>
          {recetas.map((receta) => (
            <article className="recipe-row" key={receta.id}>
              <button
                aria-label={`Ver costos y sobres de ${receta.nombre}`}
                className="recipe-row-name"
                onClick={() => setRecetaDetalle(receta.id)}
                type="button"
              >
                <span aria-hidden="true" className="recipe-mark">R</span>
                <span>
                  <span className="recipe-row-title">{receta.nombre}</span>
                  <span className="recipe-row-meta">{receta.ingredientes.length} ingredientes · {receta.empaques.length} empaques individuales</span>
                </span>
              </button>
              <span className="recipe-row-yield">{receta.rendimiento} unidades</span>
              <span className={`recipe-type ${receta.tipoElaboracion}`}>
                {receta.tipoElaboracion === 'rapida' ? 'Rápida' : 'Elaborada'} ·{' '}
                {FORMATO_PORCENTAJE.format(obtenerPorcentajeManoObra(receta.tipoElaboracion, configuracion))}
              </span>
              <div className="recipe-row-actions">
                <button className="text-action" onClick={() => setRecetaDetalle(receta.id)} type="button">Costos</button>
                <button className="text-action" onClick={() => editarReceta(receta)} type="button">Editar</button>
                <button className="text-action" onClick={() => duplicarReceta(receta)} type="button">Duplicar</button>
                <button className="text-action text-action-danger" onClick={() => solicitarEliminar(receta)} type="button">Eliminar</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state recipe-empty-state">
          <IconoChocolates className="empty-illustration" />
          <h2>Aún no tienes recetas</h2>
          <p>Registra un producto y los ingredientes que usas para prepararlo.</p>
          {ingredientesDisponibles.length > 0 ? (
            <button className="button button-secondary" onClick={abrirFormularioNuevo} type="button">
              Crear primera receta
            </button>
          ) : (
            <button className="button button-secondary" onClick={onIrAInventario} type="button">
              Ir al inventario
            </button>
          )}
        </div>
      )}
    </section>
  )
}

export default Recetas
