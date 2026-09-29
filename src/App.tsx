import { useEffect, useState } from 'react'
import Inventario from './componentes/Inventario'
import Recetas from './componentes/Recetas'
import type { ArticuloInventario, DatosAplicacion, Receta } from './lib/modelos'
import { cargarDatos, guardarDatos } from './lib/persistencia'

type VistaPrincipal = 'inventario' | 'recetas'

function reemplazarOAgregar<T extends { id: string }>(lista: T[], elemento: T): T[] {
  return lista.some((actual) => actual.id === elemento.id)
    ? lista.map((actual) => actual.id === elemento.id ? elemento : actual)
    : [...lista, elemento]
}

function App() {
  const [datos, setDatos] = useState<DatosAplicacion>(() => cargarDatos())
  const [vistaPrincipal, setVistaPrincipal] = useState<VistaPrincipal>('inventario')
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
          <span className={`status-dot${errorGuardado ? ' has-error' : ''}`} />
          {errorGuardado ? 'Error al guardar' : 'Guardado local'}
        </div>
      </header>

      <main className="inventory-page">
        <nav aria-label="Secciones principales" className="section-tabs" role="tablist">
          <button
            aria-selected={vistaPrincipal === 'inventario'}
            className={vistaPrincipal === 'inventario' ? 'is-active' : ''}
            onClick={() => setVistaPrincipal('inventario')}
            role="tab"
            type="button"
          >
            Inventario
          </button>
          <button
            aria-selected={vistaPrincipal === 'recetas'}
            className={vistaPrincipal === 'recetas' ? 'is-active' : ''}
            onClick={() => setVistaPrincipal('recetas')}
            role="tab"
            type="button"
          >
            Recetas
          </button>
        </nav>

        {vistaPrincipal === 'inventario' ? (
          <Inventario
            estadoGuardado={errorGuardado || 'Guardado localmente'}
            inventario={datos.inventario}
            onEliminar={eliminarArticulo}
            onGuardar={guardarArticulo}
            presentaciones={datos.presentaciones}
            recetas={datos.recetas}
          />
        ) : (
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
