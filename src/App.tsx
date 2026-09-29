import { useEffect, useState, type FormEvent } from 'react'
import IconoChocolates from './IconoChocolates'
import Recetas from './Recetas'
import type { ArticuloInventario, DatosAplicacion, Receta, TipoInventario } from './lib/modelos'
import { cargarDatos, guardarDatos } from './lib/persistencia'

type FiltroInventario = 'todos' | TipoInventario
type VistaPrincipal = 'inventario' | 'recetas'

interface FormularioInventario {
  nombre: string
  tipo: TipoInventario
  precioCompra: string
  cantidadTotalComprada: string
}

const FORMULARIO_VACIO: FormularioInventario = {
  nombre: '',
  tipo: 'ingrediente',
  precioCompra: '',
  cantidadTotalComprada: '',
}

const FORMATO_COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})
const FORMATO_CANTIDAD = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 2,
})

function App() {
  const [datos, setDatos] = useState<DatosAplicacion>(() => cargarDatos())
  const [vistaPrincipal, setVistaPrincipal] = useState<VistaPrincipal>('inventario')
  const [filtro, setFiltro] = useState<FiltroInventario>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [formulario, setFormulario] = useState<FormularioInventario>(FORMULARIO_VACIO)
  const [articuloEditando, setArticuloEditando] = useState<string | null>(null)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [error, setError] = useState('')
  const [avisoGuardado, setAvisoGuardado] = useState('')

  useEffect(() => {
    try {
      guardarDatos(datos)
      setError('')
      setAvisoGuardado('Guardado localmente')
    } catch {
      setError('No se pudieron guardar los cambios en este dispositivo.')
      setAvisoGuardado('')
    }
  }, [datos])

  function articuloEstaEnUso(articuloId: string): boolean {
    const usadoEnReceta = datos.recetas.some((receta) =>
      [...receta.ingredientes, ...receta.empaques].some(
        (linea) => linea.insumoId === articuloId,
      ),
    )
    const usadoEnPresentacion = datos.presentaciones.some((presentacion) =>
      presentacion.empaques.some((empaque) => empaque.insumoId === articuloId),
    )

    return usadoEnReceta || usadoEnPresentacion
  }

  const articulosFiltrados = datos.inventario.filter((articulo) => {
    const coincideTipo = filtro === 'todos' || articulo.tipo === filtro
    const coincideNombre = articulo.nombre
      .toLocaleLowerCase('es-CO')
      .includes(busqueda.trim().toLocaleLowerCase('es-CO'))

    return coincideTipo && coincideNombre
  })

  function limpiarFormulario() {
    setFormulario(FORMULARIO_VACIO)
    setArticuloEditando(null)
    setFormularioAbierto(false)
    setError('')
  }

  function abrirFormularioNuevo() {
    setFormulario(FORMULARIO_VACIO)
    setArticuloEditando(null)
    setFormularioAbierto(true)
    setError('')
  }

  function editarArticulo(articulo: ArticuloInventario) {
    setFormulario({
      nombre: articulo.nombre,
      tipo: articulo.tipo,
      precioCompra: String(articulo.precioCompra),
      cantidadTotalComprada: String(articulo.cantidadTotalComprada),
    })
    setArticuloEditando(articulo.id)
    setFormularioAbierto(true)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function guardarArticulo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    const nombre = formulario.nombre.trim()
    const precioCompra = Number(formulario.precioCompra)
    const cantidadTotalComprada = Number(formulario.cantidadTotalComprada)

    if (!nombre) {
      setError('Escribe el nombre del ingrediente o empaque.')
      return
    }

    if (!Number.isInteger(precioCompra) || precioCompra < 0) {
      setError('El precio pagado debe ser un monto entero igual o mayor que cero.')
      return
    }

    if (!Number.isFinite(cantidadTotalComprada) || cantidadTotalComprada <= 0) {
      setError('La cantidad comprada debe ser mayor que cero.')
      return
    }

    if (formulario.tipo === 'empaque' && !Number.isInteger(cantidadTotalComprada)) {
      setError('La cantidad de empaques debe ser un número entero.')
      return
    }

    const articuloActual = datos.inventario.find(
      (articulo) => articulo.id === articuloEditando,
    )
    if (
      articuloActual &&
      articuloActual.tipo !== formulario.tipo &&
      articuloEstaEnUso(articuloActual.id)
    ) {
      setError('No puedes cambiar el tipo de un ingrediente o empaque asociado a una receta o presentación.')
      return
    }

    const articulo: ArticuloInventario = {
      id: articuloEditando ?? crypto.randomUUID(),
      nombre,
      tipo: formulario.tipo,
      precioCompra,
      cantidadTotalComprada,
      unidad: formulario.tipo === 'ingrediente' ? 'g' : 'unidad',
    }

    setDatos((actuales) => ({
      ...actuales,
      inventario: articuloEditando
        ? actuales.inventario.map((actual) =>
            actual.id === articuloEditando ? articulo : actual,
          )
        : [...actuales.inventario, articulo],
    }))
    limpiarFormulario()
  }

  function eliminarArticulo(articulo: ArticuloInventario) {
    if (articuloEstaEnUso(articulo.id)) {
      setError(`No puedes eliminar “${articulo.nombre}” porque está asociado a una receta o presentación.`)
      return
    }

    if (!window.confirm(`¿Eliminar “${articulo.nombre}” del inventario?`)) {
      return
    }

    setDatos((actuales) => ({
      ...actuales,
      inventario: actuales.inventario.filter((actual) => actual.id !== articulo.id),
    }))
    setError('')
  }

  function guardarReceta(receta: Receta) {
    setDatos((actuales) => ({
      ...actuales,
      recetas: actuales.recetas.some((actual) => actual.id === receta.id)
        ? actuales.recetas.map((actual) => actual.id === receta.id ? receta : actual)
        : [...actuales.recetas, receta],
    }))
    setError('')
  }

  function eliminarReceta(recetaId: string) {
    setDatos((actuales) => ({
      ...actuales,
      recetas: actuales.recetas.filter((receta) => receta.id !== recetaId),
    }))
    setError('')
  }

  const cantidadIngredientes = datos.inventario.filter(
    (articulo) => articulo.tipo === 'ingrediente',
  ).length
  const cantidadEmpaques = datos.inventario.filter(
    (articulo) => articulo.tipo === 'empaque',
  ).length

  return (
    <div className="app-shell">
      <header className="topbar">
        <a aria-label="Dulce Balance, inicio" className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">db</span>
          <span className="brand-name">
            Dulce Balance
            <small>REPOSTERÍA ARTESANAL</small>
          </span>
        </a>
        <div className="topbar-status">
          <span className={`status-dot${error ? ' has-error' : ''}`} />
          {error ? 'Error al guardar' : 'Guardado local'}
        </div>
      </header>

      <main className="inventory-page">
        <nav aria-label="Secciones principales" className="section-tabs" role="tablist">
          <button
            aria-selected={vistaPrincipal === 'inventario'}
            className={vistaPrincipal === 'inventario' ? 'is-active' : ''}
            onClick={() => {
              setVistaPrincipal('inventario')
              setError('')
            }}
            role="tab"
            type="button"
          >
            Inventario
          </button>
          <button
            aria-selected={vistaPrincipal === 'recetas'}
            className={vistaPrincipal === 'recetas' ? 'is-active' : ''}
            onClick={() => {
              setVistaPrincipal('recetas')
              setError('')
            }}
            role="tab"
            type="button"
          >
            Recetas
          </button>
        </nav>

        {vistaPrincipal === 'inventario' ? (
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
            <span className="summary-number">{datos.inventario.length}</span>
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
            {error || avisoGuardado}
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
                  disabled={Boolean(articuloEditando && articuloEstaEnUso(articuloEditando))}
                  onChange={(evento) =>
                    setFormulario({ ...formulario, tipo: evento.target.value as TipoInventario })
                  }
                  value={formulario.tipo}
                >
                  <option value="ingrediente">Ingrediente</option>
                  <option value="empaque">Empaque</option>
                </select>
                {articuloEditando && articuloEstaEnUso(articuloEditando) && (
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
                <span>Cantidad comprada <small>({formulario.tipo === 'ingrediente' ? 'g' : 'unidades'})</small></span>
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
                  <span>{formulario.tipo === 'ingrediente' ? 'g' : 'und.'}</span>
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
                  <span>{valor === 'todos' ? datos.inventario.length : valor === 'ingrediente' ? cantidadIngredientes : cantidadEmpaques}</span>
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
                        {FORMATO_CANTIDAD.format(articulo.cantidadTotalComprada)} {articulo.unidad}
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
        ) : (
          <Recetas
            inventario={datos.inventario}
            onEliminar={eliminarReceta}
            onGuardar={guardarReceta}
            onIrAInventario={() => setVistaPrincipal('inventario')}
            presentaciones={datos.presentaciones}
            recetas={datos.recetas}
          />
        )}
      </main>

      <footer className="footer">
        <span>COLOMBIA · COP</span>
        <span className="footer-flower" aria-hidden="true">✳</span>
        <span>VERSIÓN 0.1</span>
      </footer>
    </div>
  )
}

export default App
