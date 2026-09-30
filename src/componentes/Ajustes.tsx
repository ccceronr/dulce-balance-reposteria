import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  CONFIGURACION_PREDETERMINADA,
  OPCIONES_REDONDEO,
  validarConfiguracion,
} from '../lib/configuracion'
import { FORMATO_COP } from '../lib/formato'
import type { Configuracion, DatosAplicacion } from '../lib/modelos'
import { crearRespaldo, interpretarRespaldo, nombreArchivoRespaldo } from '../lib/persistencia'
import type { PreferenciaTema } from '../lib/tema'

interface FormularioAjustes {
  porcentajeIndirectos: string
  multiplicadorEstandar: string
  multiplicadorPremium: string
  porcentajeManoObraRapida: string
  porcentajeManoObraElaborada: string
  valorRedondeo: string
}

interface AjustesProps {
  datos: DatosAplicacion
  preferenciaTema: PreferenciaTema
  onCambiarTema: (preferencia: PreferenciaTema) => void
  onGuardarConfiguracion: (configuracion: Configuracion) => void
  onImportarDatos: (datos: DatosAplicacion) => void
  onVolver: () => void
}

const OPCIONES_TEMA: { valor: PreferenciaTema; etiqueta: string }[] = [
  { valor: 'automatico', etiqueta: 'Automático' },
  { valor: 'claro', etiqueta: 'Claro' },
  { valor: 'oscuro', etiqueta: 'Oscuro' },
]

const FORMATO_FECHA_RESPALDO = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'long',
  timeStyle: 'short',
})

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

function Ajustes({
  datos,
  preferenciaTema,
  onCambiarTema,
  onGuardarConfiguracion,
  onImportarDatos,
  onVolver,
}: AjustesProps) {
  const [formulario, setFormulario] = useState<FormularioAjustes>(() => aFormulario(datos.configuracion))
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [errorRespaldo, setErrorRespaldo] = useState('')
  const [avisoRespaldo, setAvisoRespaldo] = useState('')
  const selectorArchivo = useRef<HTMLInputElement>(null)

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

  function exportarRespaldo() {
    const archivo = new Blob([crearRespaldo(datos)], { type: 'application/json' })
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(archivo)
    enlace.download = nombreArchivoRespaldo()
    enlace.click()
    URL.revokeObjectURL(enlace.href)
    setErrorRespaldo('')
    setAvisoRespaldo('Respaldo descargado. Guárdalo en un lugar seguro, como tu correo o la nube.')
  }

  async function importarRespaldo(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0]
    // Permite volver a elegir el mismo archivo más adelante.
    evento.target.value = ''
    if (!archivo) {
      return
    }

    setAvisoRespaldo('')
    const resultado = interpretarRespaldo(await archivo.text())
    if (!resultado.ok) {
      setErrorRespaldo(resultado.error)
      return
    }

    const fechaRespaldo = resultado.exportadoEn
      ? ` (${FORMATO_FECHA_RESPALDO.format(new Date(resultado.exportadoEn))})`
      : ''
    const confirmado = window.confirm(
      `Esto reemplazará tu inventario, recetas, cajas, ventas y configuración actuales por los del respaldo${fechaRespaldo}. ¿Continuar?`,
    )
    if (!confirmado) {
      return
    }

    onImportarDatos(resultado.datos)
    setFormulario(aFormulario(resultado.datos.configuracion))
    setError('')
    setAviso('')
    setErrorRespaldo('')
    setAvisoRespaldo('Respaldo importado. Tus datos fueron reemplazados.')
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
          <p className="page-description">Apariencia, parámetros de cálculo y respaldo de tus datos.</p>
        </div>
      </div>

      <section aria-labelledby="appearance-title" className="editor-panel settings-panel">
        <div className="editor-heading">
          <div>
            <p className="eyebrow"><span /> Pantalla</p>
            <h2 id="appearance-title">Apariencia</h2>
          </div>
        </div>

        <fieldset className="elaboration-fieldset">
          <legend>Modo de color</legend>
          <div className="segmented-control theme-control">
            {OPCIONES_TEMA.map(({ valor, etiqueta }) => (
              <button
                aria-pressed={preferenciaTema === valor}
                className={preferenciaTema === valor ? 'is-selected' : ''}
                key={valor}
                onClick={() => onCambiarTema(valor)}
                type="button"
              >
                {etiqueta}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="settings-note theme-note">
          Automático sigue el modo de tu teléfono o computador. Se guarda solo en este dispositivo.
        </p>
      </section>

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

      <section aria-labelledby="backup-title" className="editor-panel settings-panel">
        <div className="editor-heading">
          <div>
            <p className="eyebrow"><span /> Seguridad</p>
            <h2 id="backup-title">Respaldo</h2>
          </div>
        </div>

        <p className="settings-note backup-note">
          Tus datos viven solo en este dispositivo. Si se borra el navegador, se pierden.
          Descarga un respaldo de vez en cuando y guárdalo fuera del teléfono.
        </p>

        {errorRespaldo && <p aria-live="assertive" className="inline-error">{errorRespaldo}</p>}
        {avisoRespaldo && <p aria-live="polite" className="inline-notice is-success">{avisoRespaldo}</p>}

        <div className="form-actions backup-actions">
          <button className="button button-quiet" onClick={() => selectorArchivo.current?.click()} type="button">
            Importar respaldo
          </button>
          <button className="button button-primary" onClick={exportarRespaldo} type="button">
            Exportar respaldo
          </button>
        </div>
        <input
          accept="application/json,.json"
          aria-label="Archivo de respaldo"
          className="visually-hidden"
          onChange={importarRespaldo}
          ref={selectorArchivo}
          tabIndex={-1}
          type="file"
        />
      </section>
    </section>
  )
}

export default Ajustes
