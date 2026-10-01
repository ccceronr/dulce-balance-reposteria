# Dulce Balance Repostería

Aplicación web mobile-first para calcular costos, precios de venta y la distribución del dinero en tres bolsillos para un negocio de repostería artesanal. Funciona en el navegador y guarda los datos solo en el dispositivo. Las fórmulas y decisiones del producto están documentadas en [CLAUDE.md](CLAUDE.md).

**App publicada:** https://dulce-balance-reposteria.vercel.app

## Instalar en el celular

La app es una PWA: se instala en la pantalla de inicio y funciona sin conexión.

- **Android (Chrome):** abrir la dirección y tocar **⋮ → Instalar app**.
- **iPhone (Safari):** abrir la dirección y tocar **Compartir → Agregar a pantalla de inicio**.

Los datos se guardan solo en el dispositivo. Para pasarlos a otro teléfono o protegerlos, usa **Ajustes → Exportar respaldo** e **Importar respaldo**.

## Funcionalidades

- **Inventario**: ingredientes (en g, ml o unidades) y empaques (por unidad), con su precio de compra y la cantidad comprada.
- **Recetas**: ingredientes por tanda, empaques individuales por unidad, rendimiento y tipo de elaboración (rápida o elaborada). Se pueden duplicar.
- **Preparaciones base**: masas, rellenos o cremas (por ejemplo, la masa de pastel con leche condensada) que se registran una vez, con lo que pesan al terminar, y se usan por gramos dentro de varios productos. Si cambia la preparación, se actualizan todos los productos que la usan.
- **Costos y precios**: costo de la tanda y por unidad, con costos indirectos; precios sugeridos Estándar y Premium con redondeo configurable, y un precio real editable.
- **Tres bolsillos**: reposición de insumos, sueldo de mano de obra y ganancia limpia, más el dinero libre. Alertas si se vende a pérdida o si no alcanza para el sueldo.
- **Cajas mixtas**: combinan productos y empaques exteriores, con su propio tipo de elaboración, precios y bolsillos.
- **Historial de ventas**: productos sueltos y cajas, con el precio cobrado en cada venta y un resumen mensual por bolsillo.
- **Ajustes**: porcentajes, multiplicadores y redondeo editables, además de la exportación e importación de un respaldo en JSON.
- **Modo claro y oscuro**: por defecto sigue la configuración del dispositivo; en **Ajustes → Apariencia** se puede fijar en Claro u Oscuro. La preferencia se guarda en cada dispositivo.

Todos los montos están en pesos colombianos (COP). Si cambia el precio de un insumo, las recetas y cajas se recalculan automáticamente. Las ventas registradas conservan los valores del momento en que se hicieron.

## Requisitos

- Node.js 22 o superior
- npm

## Desarrollo local

```bash
npm install
npm run dev
```

## Pruebas

```bash
npm test
```

Las pruebas (Vitest) cubren la lógica de negocio en `src/lib`: cálculos, recetas, cajas, ventas, inventario, configuración y persistencia.

## Validación de producción

```bash
npm run build
npm run preview
```

## Íconos

El ícono se genera a partir de `public/icono.svg`:

```bash
npm run iconos
```

Solo hace falta ejecutarlo si cambia el ícono; los PNG generados se guardan en el repositorio.

## Despliegue

Vercel publica automáticamente cada push a `main`. La app instalada recibe la versión nueva sola: la descarga en la siguiente apertura con internet.

## Estructura

```
src/
  lib/           Lógica de negocio: funciones puras, sin React
  componentes/   Pantallas y componentes de la interfaz
  App.tsx        Estado global, guardado local y navegación
```

## Tecnologías

Vite, React, TypeScript, Tailwind CSS, Vitest, vite-plugin-pwa (service worker y manifest), localStorage y Vercel.

## Estado

Fases completadas: estructura base, cálculos, persistencia, inventario, recetas, resultados y bolsillos, cajas mixtas, historial de ventas, configuración y respaldo, PWA instalable sin conexión, despliegue en Vercel, modo claro y oscuro, y preparaciones base.
