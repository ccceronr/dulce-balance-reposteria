import { useState, type FormEvent } from 'react'
import {
  CONFIGURACION_PREDETERMINADA,
  OPCIONES_REDONDEO,
  validarConfiguracion,
} from '../lib/configuracion'
import { FORMATO_COP } from '../lib/formato'
import type { Configuracion } from '../lib/modelos'

interface FormularioAjustes {
  porcentajeIndirectos: string
  multiplicadorEstandar: string
  multiplicadorPremium: string
  porcentajeManoObraRapida: string
  porcentajeManoObraElaborada: string
  valorRedondeo: string
}

interface AjustesProps {
  configuracion: Configuracion
  onGuardarConfiguracion: (configuracion: Configuracion) => void
  onVolver: () => void
}

// En pantalla los porcentajes se escriben como 10, 20, 25; se guardan como fracción.
function aPorcentaje(fraccion: number): string {
  return String(Math.round(fraccion * 10_000) / 100)
}

function aFormulario(configuracion: Configuracion): FormularioAjustes {
  return {
    porcentajeIndirectos: aPorcentaje(configuracion.porcentajeIndirectos),
    multiplicadorEstandar: String(configuracion.multiplicadorEstandar),
    multiplicadorPremium: String(configuracion.multiplicadorPremium),
    porcentajeManoObraRapida: aPorcentaje(configuracion.porcentajeManoObraRapida),
    porcentajeManoObraElaborada: aPorcentaje(configuracion.porcentajeManoObraElaborada),
    valorRedondeo: String(configuracion.valorRedondeo),
  }
}

function aConfiguracion(formulario: FormularioAjustes): Configuracion {
  return {
    porcentajeIndirectos: Number(formulario.porcentajeIndirectos) / 100,
    multiplicadorEstandar: Number(formulario.multiplicadorEstandar),
    multiplicadorPremium: Number(formulario.multiplicadorPremium),
    porcentajeManoObraRapida: Number(formulario.porcentajeManoObraRapida) / 100,
    porcentajeManoObraElaborada: Number(formulario.porcentajeManoObraElaborada) / 100,
    valorRedondeo: Number(formulario.valorRedondeo),
  }
}

function etiquetaRedondeo(valor: number): string {
  return valor === 1 ? 'Sin redondeo (al peso)' : `Al ${FORMATO_COP.format(valor)} más cercano`
}

function Ajustes({ configuracion, onGuardarConfiguracion, onVolver }: AjustesProps) {
  const [formulario, setFormulario] = useState<FormularioAjustes>(() => aFormulario(configuracion))
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  function cambiar(campo: keyof FormularioAjustes, valor: string) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
    setError('')
    setAviso('')
  }

  function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    const nuevaConfiguracion = aConfiguracion(formulario)
    const errorValidacion = validarConfiguracion(nuevaConfiguracion)
    if (errorValidacion) {
      setError(errorValidacion)
      return
    }

    onGuardarConfiguracion(nuevaConfiguracion)
    setAviso('Ajustes guardados. Los costos y precios sugeridos ya usan los nuevos valores.')
  }

  function restaurar() {
    if (!window.confirm('¿Restaurar todos los parámetros a sus valores por defecto?')) {
      return
    }

    const predeterminada = { ...CONFIGURACION_PREDETERMINADA }
    setFormulario(aFormulario(predeterminada))
    onGuardarConfiguracion(predeterminada)
    setError('')
    setAviso('Se restauraron los valores por defecto.')
  }

  function campoPorcentaje(
    campo: keyof FormularioAjustes,
    etiqueta: string,
    ayuda: string,
    minimo: number,
    maximo: number,
  ) {
    return (
      <label className="field">
        <span>{etiqueta}</span>
        <div className="input-with-suffix">
          <input
            inputMode="decimal"
            max={maximo}
            min={minimo}
            onChange={(evento) => cambiar(campo, evento.target.value)}
            required
            step="any"
            type="number"
            value={formulario[campo]}
          />
          <span>%</span>
        </div>
        <small className="field-hint">{ayuda}</small>
      </label>
    )
  }

  return (
    <section aria-labelledby="settings-title" className="recipe-detail">
      <div className="page-heading">
        <div>
          <button className="text-action detail-back" onClick={onVolver} type="button">
            ← Volver
          </button>
          <p className="eyebrow"><span /> Configuración</p>
          <h1 id="settings-title">Ajustes</h1>
          <p className="page-description">Parámetros que usa la app para calcular costos y precios.</p>
        </div>
      </div>

      <section aria-labelledby="parameters-title" className="editor-panel settings-panel">
        <div className="editor-heading">
          <div>
            <p className="eyebrow"><span /> Cálculo</p>
            <h2 id="parameters-title">Parámetros de cálculo</h2>
          </div>
        </div>

        <form className="settings-form" onSubmit={guardar}>
          {campoPorcentaje(
            'porcentajeIndirectos',
            'Costos indirectos',
            'Gas, luz, agua y mermas, sobre los insumos.',
            0,
            100,
          )}

          <label className="field">
            <span>Multiplicador Estándar</span>
            <div className="input-with-suffix">
              <input
                inputMode="decimal"
                min="1"
                onChange={(evento) => cambiar('multiplicadorEstandar', evento.target.value)}
                required
                step="any"
                type="number"
                value={formulario.multiplicadorEstandar}
              />
              <span>×</span>
            </div>
            <small className="field-hint">Precio sugerido = costo × este valor.</small>
          </label>

          <label className="field">
            <span>Multiplicador Premium</span>
            <div className="input-with-suffix">
              <input
                inputMode="decimal"
                min="1"
                onChange={(evento) => cambiar('multiplicadorPremium', evento.target.value)}
                required
                step="any"
                type="number"
                value={formulario.multiplicadorPremium}
              />
              <span>×</span>
            </div>
            <small className="field-hint">Igual o mayor que el Estándar.</small>
          </label>

          {campoPorcentaje(
            'porcentajeManoObraRapida',
            'Mano de obra · Rápida',
            'Entre 20% y 30% del precio de venta.',
            20,
            30,
          )}
          {campoPorcentaje(
            'porcentajeManoObraElaborada',
            'Mano de obra · Elaborada',
            'Entre 20% y 30% del precio de venta.',
            20,
            30,
          )}

          <label className="field">
            <span>Redondeo de precios sugeridos</span>
            <select
              onChange={(evento) => cambiar('valorRedondeo', evento.target.value)}
              value={formulario.valorRedondeo}
            >
              {OPCIONES_REDONDEO.map((opcion) => (
                <option key={opcion} value={opcion}>{etiquetaRedondeo(opcion)}</option>
              ))}
            </select>
            <small className="field-hint">Los empates se redondean hacia arriba.</small>
          </label>

          <p className="settings-note">
            Los precios reales que ya guardaste y las ventas registradas no cambian.
          </p>

          {error && <p aria-live="assertive" className="inline-error settings-message">{error}</p>}
          {aviso && <p aria-live="polite" className="inline-notice settings-message is-success">{aviso}</p>}

          <div className="form-actions">
            <button className="button button-quiet" onClick={restaurar} type="button">
              Restaurar valores por defecto
            </button>
            <button className="button button-primary" type="submit">
              Guardar ajustes
            </button>
          </div>
        </form>
      </section>
    </section>
  )
}

export default Ajustes
