# Dulce Balance Repostería

Aplicación web mobile-first para calcular costos, precios de venta y la distribución del dinero en tres bolsillos para un negocio de repostería artesanal. Funciona en el navegador y guarda los datos solo en el dispositivo. Las fórmulas y decisiones del producto están documentadas en [CLAUDE.md](CLAUDE.md).

## Funcionalidades

- **Inventario**: ingredientes (en g, ml o unidades) y empaques (por unidad), con su precio de compra y la cantidad comprada.
- **Recetas**: ingredientes por tanda, empaques individuales por unidad, rendimiento y tipo de elaboración (rápida o elaborada). Se pueden duplicar.
- **Costos y precios**: costo de la tanda y por unidad, con costos indirectos; precios sugeridos Estándar y Premium con redondeo configurable, y un precio real editable.
- **Tres bolsillos**: reposición de insumos, sueldo de mano de obra y ganancia limpia, más el dinero libre. Alertas si se vende a pérdida o si no alcanza para el sueldo.
- **Cajas mixtas**: combinan productos y empaques exteriores, con su propio tipo de elaboración, precios y bolsillos.
- **Historial de ventas**: productos sueltos y cajas, con el precio cobrado en cada venta y un resumen mensual por bolsillo.
- **Ajustes**: porcentajes, multiplicadores y redondeo editables, además de la exportación e importación de un respaldo en JSON.

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

## Estructura

```
src/
  lib/           Lógica de negocio: funciones puras, sin React
  componentes/   Pantallas y componentes de la interfaz
  App.tsx        Estado global, guardado local y navegación
```

## Tecnologías

Vite, React, TypeScript, Tailwind CSS, Vitest y localStorage.

## Estado

Fases completadas: estructura base, cálculos, persistencia, inventario, recetas, resultados y bolsillos, cajas mixtas, historial de ventas, configuración y respaldo.

Pendiente: convertirla en una PWA instalable y con funcionamiento sin conexión (Fase 8) y desplegarla en Vercel (Fase 9).
