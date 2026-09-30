import { useState, type FormEvent } from 'react'
import IconoChocolates from './IconoChocolates'
import { ETIQUETA_UNIDAD, FORMATO_CANTIDAD, FORMATO_COP } from '../lib/formato'
import { articuloEstaEnUso, cambiaUnidadEnUso, validarArticulo } from '../lib/inventario'
import type {
  ArticuloInventario,
  PresentacionVenta,
  Receta,
  TipoInventario,
  UnidadInventario,
} from '../lib/modelos'

type FiltroInventario = 'todos' | TipoInventario

interface FormularioInventario {
  nombre: string
  tipo: TipoInventario
  precioCompra: string
  cantidadTotalComprada: string
  unidad: UnidadInventario
}

interface InventarioProps {
  inventario: ArticuloInventario[]
  recetas: Receta[]
  presentaciones: PresentacionVenta[]
  estadoGuardado: string
  onGuardar: (articulo: ArticuloInventario) => void
  onEliminar: (articuloId: string) => void
}

const FORMULARIO_VACIO: FormularioInventario = {
  nombre: '',
  tipo: 'ingrediente',
  precioCompra: '',
  cantidadTotalComprada: '',
  unidad: 'g',
}

const UNIDADES_INGREDIENTE: UnidadInventario[] = ['g', 'ml', 'unidad']

function Inventario({
  inventario,
  recetas,
  presentaciones,
  estadoGuardado,
  onGuardar,
  onEliminar,
}: InventarioProps) {
  const [filtro, setFiltro] = useState<FiltroInventario>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [formulario, setFormulario] = useState<FormularioInventario>(FORMULARIO_VACIO)
  const [articuloEditando, setArticuloEditando] = useState<string | null>(null)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  function estaEnUso(articuloId: string): boolean {
    return articuloEstaEnUso(articuloId, { recetas, presentaciones })
  }

  const articulosFiltrados = inventario.filter((articulo) => {
    const coincideTipo = filtro === 'todos' || articulo.tipo === filtro
    const coincideNombre = articulo.nombre
      .toLocaleLowerCase('es-CO')
      .includes(busqueda.trim().toLocaleLowerCase('es-CO'))

    return coincideTipo && coincideNombre
  })

  const cantidadIngredientes = inventario.filter(
    (articulo) => articulo.tipo === 'ingrediente',
  ).length
  const cantidadEmpaques = inventario.filter(
    (articulo) => articulo.tipo === 'empaque',
  ).length

  function limpiarFormulario() {
    setFormulario(FORMULARIO_VACIO)
    setArticuloEditando(null)
    setFormularioAbierto(false)
    setError('')
  }

  function abrirFormularioNuevo() {
    setAviso('')
    setFormulario(FORMULARIO_VACIO)
    setArticuloEditando(null)
    setFormularioAbierto(true)
    setError('')
  }

  function editarArticulo(articulo: ArticuloInventario) {
    setAviso('')
    setFormulario({
      nombre: articulo.nombre,
      tipo: articulo.tipo,
      precioCompra: String(articulo.precioCompra),
      cantidadTotalComprada: String(articulo.cantidadTotalComprada),
      unidad: articulo.unidad,
    })
    setArticuloEditando(articulo.id)
    setFormularioAbierto(true)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function guardarArticulo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    const articulo: ArticuloInventario = {
      id: articuloEditando ?? crypto.randomUUID(),
      nombre: formulario.nombre.trim(),
      tipo: formulario.tipo,
      precioCompra: Number(formulario.precioCompra),
      cantidadTotalComprada: Number(formulario.cantidadTotalComprada),
      unidad: formulario.tipo === 'ingrediente' ? formulario.unidad : 'unidad',
    }

    const datos = { inventario, recetas, presentaciones }
    const errorValidacion = validarArticulo(articulo, datos)
    if (errorValidacion) {
      setError(errorValidacion)
      return
    }

    onGuardar(articulo)
    limpiarFormulario()
    setAviso(
      cambiaUnidadEnUso(articulo, datos)
        ? `Cambiaste la unidad de “${articulo.nombre}”. Revisa las recetas que lo usan: sus cantidades ahora se leen en la nueva unidad.`
        : '',
    )
  }

  function eliminarArticulo(articulo: ArticuloInventario) {
    setAviso('')
    if (estaEnUso(articulo.id)) {
      setError(`No puedes eliminar “${articulo.nombre}” porque está asociado a una receta o caja.`)
      return
    }

    if (!window.confirm(`¿Eliminar “${articulo.nombre}” del inventario?`)) {
      return
    }

    onEliminar(articulo.id)
    setError('')
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow"><span /> Tu espacio de trabajo</p>
          <h1>Inventario</h1>
          <p className="page-description">Ingredientes y empaques para tus creaciones.</p>
        </div>
        <button className="button button-primary" onClick={abrirFormularioNuevo} type="button">
          <span aria-hidden="true">+</span>
          Agregar ingrediente o empaque
        </button>
      </div>

      <section aria-label="Resumen del inventario" className="inventory-summary">
        <div className="summary-item">
          <span className="summary-number">{inventario.length}</span>
          <span className="summary-label">En inventario</span>
        </div>
        <div className="summary-item">
          <span className="summary-number">{cantidadIngredientes}</span>
          <span className="summary-label">Ingredientes</span>
        </div>
        <div className="summary-item">
          <span className="summary-number">{cantidadEmpaques}</span>
          <span className="summary-label">Empaques</span>
        </div>
        <span aria-live="polite" className="save-status">
          {error || estadoGuardado}
        </span>
      </section>

      {formularioAbierto && (
        <section aria-labelledby="form-title" className="editor-panel">
          <div className="editor-heading">
            <div>
              <p className="eyebrow"><span /> Inventario</p>
              <h2 id="form-title">{articuloEditando ? 'Editar ingrediente o empaque' : 'Nuevo ingrediente o empaque'}</h2>
            </div>
            <button
              aria-label="Cerrar formulario"
              className="button button-quiet button-close"
              onClick={limpiarFormulario}
              type="button"
            >
              Cerrar
            </button>
          </div>

          <form className="inventory-form" onSubmit={guardarArticulo}>
            <label className="field field-name">
              <span>Nombre</span>
              <input
                autoFocus
                autoComplete="off"
                maxLength={80}
                onChange={(evento) => setFormulario({ ...formulario, nombre: evento.target.value })}
                placeholder="Ej. Chocolate semiamargo"
                required
                value={formulario.nombre}
              />
            </label>

            <label className="field">
              <span>Tipo</span>
              <select
                disabled={Boolean(articuloEditando && estaEnUso(articuloEditando))}
                onChange={(evento) =>
                  setFormulario({ ...formulario, tipo: evento.target.value as TipoInventario })
                }
                value={formulario.tipo}
              >
                <option value="ingrediente">Ingrediente</option>
                <option value="empaque">Empaque</option>
              </select>
              {articuloEditando && estaEnUso(articuloEditando) && (
                <small className="field-hint">El tipo no se puede cambiar mientras esté asociado.</small>
              )}
            </label>

            <label className="field">
              <span>Precio pagado</span>
              <div className="input-with-prefix">
                <span aria-hidden="true">$</span>
                <input
                  inputMode="numeric"
                  min="0"
                  onChange={(evento) => setFormulario({ ...formulario, precioCompra: evento.target.value })}
                  placeholder="0"
                  required
                  type="number"
                  value={formulario.precioCompra}
                />
              </div>
            </label>

            <label className="field">
              <span>Cantidad comprada</span>
              <div className="input-with-suffix">
                <input
                  inputMode="decimal"
                  min={formulario.tipo === 'ingrediente' ? '0.01' : '1'}
                  onChange={(evento) => setFormulario({ ...formulario, cantidadTotalComprada: evento.target.value })}
                  placeholder="0"
                  required
                  step={formulario.tipo === 'ingrediente' ? 'any' : '1'}
                  type="number"
                  value={formulario.cantidadTotalComprada}
                />
                {formulario.tipo === 'ingrediente' ? (
                  <select
                    aria-label="Unidad de medida"
                    className="unit-select"
                    onChange={(evento) =>
                      setFormulario({ ...formulario, unidad: evento.target.value as UnidadInventario })
                    }
                    value={formulario.unidad}
                  >
                    {UNIDADES_INGREDIENTE.map((unidad) => (
                      <option key={unidad} value={unidad}>{ETIQUETA_UNIDAD[unidad]}</option>
                    ))}
                  </select>
                ) : (
                  <span>und.</span>
                )}
              </div>
            </label>

            <div className="form-actions">
              <button className="button button-quiet" onClick={limpiarFormulario} type="button">
                Cancelar
              </button>
              <button className="button button-primary" type="submit">
                {articuloEditando ? 'Guardar cambios' : 'Guardar en inventario'}
              </button>
            </div>
          </form>
        </section>
      )}

      {error && !formularioAbierto && (
        <p aria-live="assertive" className="inline-error">{error}</p>
      )}

      {aviso && !formularioAbierto && (
        <p aria-live="polite" className="inline-notice">{aviso}</p>
      )}

      <section aria-label="Ingredientes y empaques del inventario" className="inventory-section">
        <div className="inventory-toolbar">
          <div aria-label="Filtrar inventario por tipo" className="filter-tabs" role="group">
            {([
              ['todos', 'Todos'],
              ['ingrediente', 'Ingredientes'],
              ['empaque', 'Empaques'],
            ] as const).map(([valor, etiqueta]) => (
              <button
                aria-pressed={filtro === valor}
                className={`filter-tab${filtro === valor ? ' is-active' : ''}`}
                key={valor}
                onClick={() => setFiltro(valor)}
                type="button"
              >
                {etiqueta}
                <span>{valor === 'todos' ? inventario.length : valor === 'ingrediente' ? cantidadIngredientes : cantidadEmpaques}</span>
              </button>
            ))}
          </div>
          <label className="search-field">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="Buscar en el inventario"
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar ingrediente o empaque"
              type="search"
              value={busqueda}
            />
          </label>
        </div>

        {articulosFiltrados.length > 0 ? (
          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th scope="col">Ingrediente o empaque</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Compra</th>
                  <th scope="col">Cantidad</th>
                  <th scope="col"><span className="visually-hidden">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {articulosFiltrados.map((articulo) => (
                  <tr key={articulo.id}>
                    <td data-label="Ingrediente o empaque">
                      <span className={`item-mark ${articulo.tipo}`} aria-hidden="true">
                        {articulo.tipo === 'ingrediente' ? 'I' : 'E'}
                      </span>
                      <strong>{articulo.nombre}</strong>
                    </td>
                    <td data-label="Tipo">
                      <span className={`type-label ${articulo.tipo}`}>
                        {articulo.tipo === 'ingrediente' ? 'Ingrediente' : 'Empaque'}
                      </span>
                    </td>
                    <td className="numeric-cell" data-label="Compra">
                      {FORMATO_COP.format(articulo.precioCompra)}
                    </td>
                    <td className="numeric-cell" data-label="Cantidad">
                      {FORMATO_CANTIDAD.format(articulo.cantidadTotalComprada)} {ETIQUETA_UNIDAD[articulo.unidad]}
                    </td>
                    <td className="actions-cell" data-label="Acciones">
                      <button
                        className="text-action"
                        onClick={() => editarArticulo(articulo)}
                        type="button"
                      >
                        Editar
                      </button>
                      <button
                        className="text-action text-action-danger"
                        onClick={() => eliminarArticulo(articulo)}
                        type="button"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <IconoChocolates className="empty-illustration" />
            <h2>{busqueda || filtro !== 'todos' ? 'No hay coincidencias' : 'Aún no tienes ingredientes ni empaques'}</h2>
            <p>{busqueda || filtro !== 'todos' ? 'Prueba otra búsqueda o cambia el filtro.' : 'Agrega lo que compras para preparar tus productos.'}</p>
            {!busqueda && filtro === 'todos' && (
              <button className="button button-secondary" onClick={abrirFormularioNuevo} type="button">
                Agregar ingrediente o empaque
              </button>
            )}
          </div>
        )}
      </section>
    </>
  )
}

export default Inventario
