function App() {
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
        <span className="topbar-note">Hecho con detalle</span>
      </header>

      <main className="workspace">
        <div aria-hidden="true" className="workspace-index">01 <span>/</span> 09</div>
        <section className="welcome" aria-labelledby="welcome-title">
          <p className="eyebrow"><span /> Tu espacio de trabajo</p>
          <h1 id="welcome-title">Dulce<br /><em>Balance.</em></h1>
          <p className="welcome-note">Repostería artesanal</p>
          <div aria-hidden="true" className="welcome-rule">
            <span />
            <span />
            <span />
          </div>
        </section>
        <div aria-hidden="true" className="side-caption">COSTOS CON CARIÑO</div>
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
