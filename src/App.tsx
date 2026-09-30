import { useEffect, useState } from 'react'
import Ajustes from './componentes/Ajustes'
import Cajas from './componentes/Cajas'
import Inventario from './componentes/Inventario'
import Recetas from './componentes/Recetas'
import Ventas from './componentes/Ventas'
import type {
  ArticuloInventario,
  Configuracion,
  DatosAplicacion,
  PresentacionVenta,
  Receta,
  VentaHistorial,
} from './lib/modelos'
import { cargarDatos, guardarDatos } from './lib/persistencia'

type VistaPrincipal = 'inventario' | 'recetas' | 'cajas' | 'ventas'
// Ajustes no es una pestaña: se abre desde la barra superior.
type Vista = VistaPrincipal | 'ajustes'

const PESTANAS: { vista: VistaPrincipal; etiqueta: string }[] = [
  { vista: 'inventario', etiqueta: 'Inventario' },
  { vista: 'recetas', etiqueta: 'Recetas' },
  { vista: 'cajas', etiqueta: 'Cajas' },
  { vista: 'ventas', etiqueta: 'Ventas' },
]

function reemplazarOAgregar<T extends { id: string }>(lista: T[], elemento: T): T[] {
  return lista.some((actual) => actual.id === elemento.id)
    ? lista.map((actual) => actual.id === elemento.id ? elemento : actual)
    : [...lista, elemento]
}

function App() {
  const [datos, setDatos] = useState<DatosAplicacion>(() => cargarDatos())
  const [vistaPrincipal, setVistaPrincipal] = useState<Vista>('inventario')
  const [vistaAnterior, setVistaAnterior] = useState<VistaPrincipal>('inventario')
  const [errorGuardado, setErrorGuardado] = useState('')

  useEffect(() => {
    try {
      guardarDatos(datos)
      setErrorGuardado('')
    } catch {
      setErrorGuardado('No se pudieron guardar los cambios en este dispositivo.')
    }
  }, [datos])

  function guardarArticulo(articulo: ArticuloInventario) {
    setDatos((actuales) => ({
      ...actuales,
      inventario: reemplazarOAgregar(actuales.inventario, articulo),
    }))
  }

  function eliminarArticulo(articuloId: string) {
    setDatos((actuales) => ({
      ...actuales,
      inventario: actuales.inventario.filter((articulo) => articulo.id !== articuloId),
    }))
  }

  function guardarReceta(receta: Receta) {
    setDatos((actuales) => ({
      ...actuales,
      recetas: reemplazarOAgregar(actuales.recetas, receta),
    }))
  }

  function eliminarReceta(recetaId: string) {
    setDatos((actuales) => ({
      ...actuales,
      recetas: actuales.recetas.filter((receta) => receta.id !== recetaId),
    }))
  }

  function guardarPresentacion(presentacion: PresentacionVenta) {
    setDatos((actuales) => ({
      ...actuales,
      presentaciones: reemplazarOAgregar(actuales.presentaciones, presentacion),
    }))
  }

  function eliminarPresentacion(presentacionId: string) {
    setDatos((actuales) => ({
      ...actuales,
      presentaciones: actuales.presentaciones.filter(
        (presentacion) => presentacion.id !== presentacionId,
      ),
    }))
  }

  function registrarVenta(venta: VentaHistorial) {
    setDatos((actuales) => ({
      ...actuales,
      historialVentas: [...actuales.historialVentas, venta],
    }))
  }

  function eliminarVenta(ventaId: string) {
    setDatos((actuales) => ({
      ...actuales,
      historialVentas: actuales.historialVentas.filter((venta) => venta.id !== ventaId),
    }))
  }

  function guardarConfiguracion(configuracion: Configuracion) {
    setDatos((actuales) => ({ ...actuales, configuracion }))
  }

  function abrirAjustes() {
    if (vistaPrincipal !== 'ajustes') {
      setVistaAnterior(vistaPrincipal)
      setVistaPrincipal('ajustes')
    }
  }

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
        <div className="topbar-actions">
          <div className="topbar-status">
            <span className={`status-dot${errorGuardado ? ' has-error' : ''}`} />
            <span className="topbar-status-text">
              {errorGuardado ? 'Error al guardar' : 'Guardado local'}
            </span>
          </div>
          <button
            aria-pressed={vistaPrincipal === 'ajustes'}
            className="button button-quiet settings-button"
            onClick={abrirAjustes}
            type="button"
          >
            <span aria-hidden="true">⚙</span> Ajustes
          </button>
        </div>
      </header>

      <main className="inventory-page">
        <nav aria-label="Secciones principales" className="section-tabs" role="tablist">
          {PESTANAS.map(({ vista, etiqueta }) => (
            <button
              aria-selected={vistaPrincipal === vista}
              className={vistaPrincipal === vista ? 'is-active' : ''}
              key={vista}
              onClick={() => setVistaPrincipal(vista)}
              role="tab"
              type="button"
            >
              {etiqueta}
            </button>
          ))}
        </nav>

        {vistaPrincipal === 'inventario' && (
          <Inventario
            estadoGuardado={errorGuardado || 'Guardado localmente'}
            inventario={datos.inventario}
            onEliminar={eliminarArticulo}
            onGuardar={guardarArticulo}
            presentaciones={datos.presentaciones}
            recetas={datos.recetas}
          />
        )}
        {vistaPrincipal === 'recetas' && (
          <Recetas
            configuracion={datos.configuracion}
            inventario={datos.inventario}
            onEliminar={eliminarReceta}
            onGuardar={guardarReceta}
            onIrAInventario={() => setVistaPrincipal('inventario')}
            presentaciones={datos.presentaciones}
            recetas={datos.recetas}
          />
        )}
        {vistaPrincipal === 'cajas' && (
          <Cajas
            configuracion={datos.configuracion}
            inventario={datos.inventario}
            onEliminar={eliminarPresentacion}
            onGuardar={guardarPresentacion}
            onIrARecetas={() => setVistaPrincipal('recetas')}
            presentaciones={datos.presentaciones}
            recetas={datos.recetas}
          />
        )}
        {vistaPrincipal === 'ajustes' && (
          <Ajustes
            configuracion={datos.configuracion}
            onGuardarConfiguracion={guardarConfiguracion}
            onVolver={() => setVistaPrincipal(vistaAnterior)}
          />
        )}
        {vistaPrincipal === 'ventas' && (
          <Ventas
            configuracion={datos.configuracion}
            historial={datos.historialVentas}
            inventario={datos.inventario}
            onEliminar={eliminarVenta}
            onRegistrar={registrarVenta}
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
