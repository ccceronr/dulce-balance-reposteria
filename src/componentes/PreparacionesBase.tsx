import { useState, type FormEvent } from 'react'
import { ETIQUETA_UNIDAD, FORMATO_CANTIDAD, FORMATO_COP } from '../lib/formato'
import type {
  ArticuloInventario,
  PreparacionBase,
  Receta,
  UnidadPreparacion,
} from '../lib/modelos'
import {
  calcularCostoPreparacion,
  preparacionEstaEnUso,
  validarPreparacion,
} from '../lib/preparaciones'

interface LineaFormulario {
  id: string
  insumoId: string
  cantidadUsada: string
}

interface FormularioPreparacion {
  nombre: string
  rendimientoTotal: string
  unidad: UnidadPreparacion
  ingredientes: LineaFormulario[]
}

interface PreparacionesBaseProps {
  inventario: ArticuloInventario[]
  preparaciones: PreparacionBase[]
  recetas: Receta[]
  onGuardar: (preparacion: PreparacionBase) => void
  onEliminar: (preparacionId: string) => void
  onIrAInventario: () => void
}

function lineaVacia(): LineaFormulario {
  return { id: crypto.randomUUID(), insumoId: '', cantidadUsada: '' }
}

function formularioVacio(): FormularioPreparacion {
  return { nombre: '', rendimientoTotal: '', unidad: 'g', ingredientes: [lineaVacia()] }
}

// Masas, rellenos o cremas que se preparan una vez y se usan en varios productos.
function PreparacionesBase({
  inventario,
  preparaciones,
  recetas,
  onGuardar,
  onEliminar,
  onIrAInventario,
}: PreparacionesBaseProps) {
  const [formulario, setFormulario] = useState<FormularioPreparacion>(formularioVacio)
  const [preparacionEditando, setPreparacionEditando] = useState<string | null>(null)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [error, setError] = useState('')

  const ingredientesDisponibles = inventario.filter((articulo) => articulo.tipo === 'ingrediente')
  const seleccionados = formulario.ingredientes.map((linea) => linea.insumoId).filter(Boolean)

  function limpiarFormulario() {
    setFormulario(formularioVacio())
    setPreparacionEditando(null)
    setFormularioAbierto(false)
    setError('')
  }

  function abrirFormularioNuevo() {
    setFormulario(formularioVacio())
    setPreparacionEditando(null)
    setFormularioAbierto(true)
    setError('')
  }

  function editarPreparacion(preparacion: PreparacionBase) {
    setFormulario({
      nombre: preparacion.nombre,
      rendimientoTotal: String(preparacion.rendimientoTotal),
      unidad: preparacion.unidad,
      ingredientes: preparacion.ingredientes.map((linea) => ({
        id: crypto.randomUUID(),
        insumoId: linea.insumoId,
        cantidadUsada: String(linea.cantidadUsada),
      })),
    })
    setPreparacionEditando(preparacion.id)
    setFormularioAbierto(true)
    setError('')
  }

  function actualizarLinea(lineaId: string, campo: 'insumoId' | 'cantidadUsada', valor: string) {
    setFormulario((actual) => ({
      ...actual,
      ingredientes: actual.ingredientes.map((linea) =>
        linea.id === lineaId ? { ...linea, [campo]: valor } : linea,
      ),
    }))
    setError('')
  }

  function guardarPreparacion(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    const preparacion: PreparacionBase = {
      id: preparacionEditando ?? crypto.randomUUID(),
      nombre: formulario.nombre.trim(),
      rendimientoTotal: Number(formulario.rendimientoTotal),
      unidad: formulario.unidad,
      ingredientes: formulario.ingredientes.map((linea) => ({
        insumoId: linea.insumoId,
        cantidadUsada: Number(linea.cantidadUsada),
      })),
    }

    const errorValidacion = validarPreparacion(preparacion, { inventario, preparaciones })
    if (errorValidacion) {
      setError(errorValidacion)
      return
    }

    onGuardar(preparacion)
    limpiarFormulario()
  }

  function duplicarPreparacion(preparacion: PreparacionBase) {
    let nombreCopia = `${preparacion.nombre} (copia)`
    let numeroCopia = 2
    while (preparaciones.some((existente) => existente.nombre === nombreCopia)) {
      nombreCopia = `${preparacion.nombre} (copia ${numeroCopia})`
      numeroCopia += 1
    }

    onGuardar({ ...preparacion, id: crypto.randomUUID(), nombre: nombreCopia })
    setError('')
  }

  function solicitarEliminar(preparacion: PreparacionBase) {
    if (preparacionEstaEnUso(preparacion.id, recetas)) {
      setError(`No puedes eliminar “${preparacion.nombre}” porque la usa al menos un producto.`)
      return
    }

    if (window.confirm(`¿Eliminar la preparación “${preparacion.nombre}”?`)) {
      onEliminar(preparacion.id)
      setError('')
    }
  }

  return (
    <section aria-labelledby="preparations-title" className="preparations-section">
      <div className="page-heading">
        <div>
          <p className="eyebrow"><span /> Para usar en tus productos</p>
          <h2 id="preparations-title">Preparaciones base</h2>
          <p className="page-description">
            Masas, rellenos o cremas que preparas una vez y usas en varios productos.
          </p>
        </div>
        <button className="button button-secondary" onClick={abrirFormularioNuevo} type="button">
          <span aria-hidden="true">+</span>
          Nueva preparación
        </button>
      </div>

      {error && <p aria-live="assertive" className="inline-error">{error}</p>}

      {formularioAbierto && (
        <section aria-labelledby="preparation-form-title" className="editor-panel recipe-editor">
          <div className="editor-heading">
            <div>
              <p className="eyebrow"><span /> Preparación base</p>
              <h2 id="preparation-form-title">
                {preparacionEditando ? 'Editar preparación' : 'Nueva preparación'}
              </h2>
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
            <form className="recipe-form" onSubmit={guardarPreparacion}>
              <div className="recipe-basics">
                <label className="field recipe-name-field">
                  <span>Nombre de la preparación</span>
                  <input
                    autoComplete="off"
                    maxLength={80}
                    onChange={(evento) => setFormulario({ ...formulario, nombre: evento.target.value })}
                    placeholder="Ej. Masa de pastel con leche condensada"
                    required
                    value={formulario.nombre}
                  />
                </label>
                <label className="field">
                  <span>¿Cuánto pesa lo que sale?</span>
                  <div className="input-with-suffix">
                    <input
                      inputMode="decimal"
                      min="0.01"
                      onChange={(evento) => setFormulario({ ...formulario, rendimientoTotal: evento.target.value })}
                      placeholder="0"
                      required
                      step="any"
                      type="number"
                      value={formulario.rendimientoTotal}
                    />
                    <select
                      aria-label="Unidad de la preparación"
                      className="unit-select"
                      onChange={(evento) =>
                        setFormulario({ ...formulario, unidad: evento.target.value as UnidadPreparacion })
                      }
                      value={formulario.unidad}
                    >
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                    </select>
                  </div>
                  <small className="field-hint">Pesa la preparación terminada una vez.</small>
                </label>
              </div>

              <section aria-labelledby="preparation-ingredients-title" className="recipe-section">
                <div className="recipe-section-heading">
                  <div>
                    <h3 id="preparation-ingredients-title">Ingredientes</h3>
                    <p>Cantidades usadas en toda la preparación</p>
                  </div>
                </div>
                <div className="recipe-lines">
                  {formulario.ingredientes.map((linea, indice) => {
                    const articulo = ingredientesDisponibles.find((item) => item.id === linea.insumoId)
                    const unidad = ETIQUETA_UNIDAD[articulo?.unidad ?? 'g']

                    return (
                      <div className="recipe-line" key={linea.id}>
                        <label className="field recipe-line-item">
                          <span className="visually-hidden">Ingrediente {indice + 1}</span>
                          <select
                            onChange={(evento) => actualizarLinea(linea.id, 'insumoId', evento.target.value)}
                            required
                            value={linea.insumoId}
                          >
                            <option value="">Seleccionar ingrediente</option>
                            {ingredientesDisponibles.map((opcion) => (
                              <option
                                disabled={seleccionados.includes(opcion.id) && opcion.id !== linea.insumoId}
                                key={opcion.id}
                                value={opcion.id}
                              >
                                {opcion.nombre}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="field recipe-line-quantity">
                          <span className="visually-hidden">Cantidad en {unidad}</span>
                          <div className="input-with-suffix">
                            <input
                              inputMode="decimal"
                              min="0.01"
                              onChange={(evento) => actualizarLinea(linea.id, 'cantidadUsada', evento.target.value)}
                              placeholder="Cantidad"
                              required
                              step="any"
                              type="number"
                              value={linea.cantidadUsada}
                            />
                            <span>{unidad}</span>
                          </div>
                        </label>
                        <button
                          aria-label={`Quitar ingrediente ${indice + 1}`}
                          className="remove-line"
                          onClick={() =>
                            setFormulario((actual) => ({
                              ...actual,
                              ingredientes: actual.ingredientes.filter((item) => item.id !== linea.id),
                            }))
                          }
                          type="button"
                        >
                          Quitar
                        </button>
                      </div>
                    )
                  })}
                  <button
                    className="add-line"
                    disabled={ingredientesDisponibles.length <= seleccionados.length}
                    onClick={() =>
                      setFormulario((actual) => ({ ...actual, ingredientes: [...actual.ingredientes, lineaVacia()] }))
                    }
                    type="button"
                  >
                    + Agregar ingrediente
                  </button>
                </div>
              </section>

              <div className="form-actions">
                <button className="button button-quiet" onClick={limpiarFormulario} type="button">
                  Cancelar
                </button>
                <button className="button button-primary" type="submit">
                  {preparacionEditando ? 'Guardar cambios' : 'Guardar preparación'}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {preparaciones.length > 0 ? (
        <div className="recipe-list" aria-label="Preparaciones base guardadas">
          <div className="recipe-list-heading">
            <span>Preparación</span>
            <span>Rinde</span>
            <span>Costo</span>
            <span><span className="visually-hidden">Acciones</span></span>
          </div>
          {preparaciones.map((preparacion) => {
            const costo = calcularCostoPreparacion(preparacion, inventario)

            return (
              <article className="recipe-row" key={preparacion.id}>
                <div className="recipe-row-name">
                  <span aria-hidden="true" className="recipe-mark">P</span>
                  <span>
                    <span className="recipe-row-title">{preparacion.nombre}</span>
                    <span className="recipe-row-meta">{preparacion.ingredientes.length} ingredientes</span>
                  </span>
                </div>
                <span className="recipe-row-yield">
                  {FORMATO_CANTIDAD.format(preparacion.rendimientoTotal)} {preparacion.unidad}
                </span>
                <span className="recipe-row-yield">
                  {costo.ok ? (
                    <>
                      {FORMATO_COP.format(costo.costoTotal)}
                      <span className="recipe-row-meta">
                        {FORMATO_COP.format(costo.costoPorUnidad * 100)} por 100 {preparacion.unidad}
                      </span>
                    </>
                  ) : (
                    <span className="preparation-cost-error">{costo.error}</span>
                  )}
                </span>
                <div className="recipe-row-actions">
                  <button className="text-action" onClick={() => editarPreparacion(preparacion)} type="button">Editar</button>
                  <button className="text-action" onClick={() => duplicarPreparacion(preparacion)} type="button">Duplicar</button>
                  <button className="text-action text-action-danger" onClick={() => solicitarEliminar(preparacion)} type="button">Eliminar</button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <p className="preparations-empty">
          Aún no tienes preparaciones base. Crea una, como tu masa de pastel, y úsala dentro de tus productos.
        </p>
      )}
    </section>
  )
}

export default PreparacionesBase
