# Proyecto: Calculadora de Costos y Sobres para Repostería (PWA)

## 👤 Tu rol

Actúa como Desarrollador Full Stack Senior y Arquitecto de Software. Vas a construir conmigo, paso a paso, una PWA para calcular costos, precios de venta y la distribución del dinero en tres sobres para un negocio de repostería artesanal de alta gama.

---

## 🚦 REGLAS DE TRABAJO (OBLIGATORIAS)

Estas reglas tienen prioridad sobre cualquier otra cosa en este documento.

1. **Nunca hagas nada sin mi confirmación.** Antes de crear archivos, instalar dependencias, ejecutar comandos, hacer commits o push, explícame qué vas a hacer y espera a que yo responda "ok", "dale" o "confirmo".
2. **Pregunta antes de asumir.** Si algo no está claro o hay varias opciones razonables, pregúntame y dame tu recomendación con una razón breve. No inventes requisitos.
3. **Trabaja por fases.** Sigue el plan de fases de abajo. Termina una fase completa antes de proponer la siguiente. No adelantes trabajo de fases futuras.
4. **Explica cada cambio.** Antes de cada cambio dime: qué archivos vas a crear o modificar, para qué sirve cada uno y por qué lo haces así. Después del cambio, resume lo que quedó hecho.
5. **Commits por cada parte importante.** Al terminar cada fase (o sub-parte relevante), propón el mensaje de commit usando Conventional Commits en español (ej: `feat: agregar módulo de insumos`) y espera mi confirmación antes de ejecutarlo.
6. **Nada de sobre-ingeniería.** Prefiere la solución más simple que funcione. Si propones una librería, justifica por qué no basta con algo más simple.
7. **Si te falta información, detente.** Dime explícitamente qué te falta y no continúes hasta que yo responda.
8. **Idioma:** toda la comunicación, la UI, los comentarios de código y los commits van en español.

---

## 🎯 Objetivo de la aplicación

La app debe permitir:

1. Registrar insumos (ingredientes y empaques) con su precio de compra y cantidad total comprada.
2. Crear recetas (fichas técnicas) seleccionando insumos y la cantidad exacta usada por tanda.
3. Calcular el costo real de producción (insumos + empaque + costos indirectos).
4. Sugerir precios de venta con dos niveles de margen (Estándar y Premium).
5. Calcular cuánto dinero va a cada uno de los tres sobres por cada venta.

Uso principal: desde el celular, instalable en la pantalla de inicio y 100% offline.

---

## 🧮 Lógica financiera (fórmulas exactas)

Todos los montos son en pesos colombianos (COP), enteros, formateados con `Intl.NumberFormat('es-CO')`.

### A. Costo de insumos directos (por tanda)

```
Costo_Insumo      = (Precio_Compra / Cantidad_Total_Comprada) * Cantidad_Usada
Insumos_Directos  = Σ Costo_Ingredientes + Σ Costo_Empaques
```

### B. Costos indirectos (gas, luz, agua, mermas)

```
Gastos_Extras     = Insumos_Directos * Porcentaje_Indirectos   (por defecto 10%, configurable)
Costo_Base_Total  = Insumos_Directos + Gastos_Extras
Costo_Por_Unidad  = Costo_Base_Total / Rendimiento             (unidades que salen de la tanda)
```

### C. Precios de venta sugeridos (por unidad)

```
Precio_Estandar = redondear(Costo_Por_Unidad * 2.2)   (multiplicador configurable)
Precio_Premium  = redondear(Costo_Por_Unidad * 2.5)   (multiplicador configurable)
Precio_Real     = valor que el usuario ingresa manualmente
```

Los precios sugeridos se redondean al millar más cercano; los empates exactos se redondean hacia arriba.

### D. Sistema de tres sobres (sobre el precio de venta usado, `P_venta`)

```
Sobre_Reposicion = Costo_Por_Unidad
Sobre_Sueldo     = P_venta * Porcentaje_Mano_Obra
                   (Rápida = 20%, Elaborada/Moldeada = 25%; rango permitido 20%–30%)
Sobre_Ganancia   = P_venta - (Sobre_Reposicion + Sobre_Sueldo)
Dinero_Libre     = Sobre_Sueldo + Sobre_Ganancia
```

> **Nomenclatura:** en la interfaz y en el README los sobres se llaman **bolsillos** ("Bolsillo 1 · Reposición de insumos", etc.) y el total se llama **"Dinero libre"**. En el código se mantienen los nombres `sobre…` (`calcularSobres`, `sobreReposicion`, etc.).

### E. Validaciones y alertas

- Si `P_venta < Costo_Por_Unidad` → alerta roja: se está vendiendo a pérdida.
- Si `Sobre_Ganancia < 0` → alerta amarilla: el precio no alcanza para cubrir el sueldo completo.
- No permitir cantidades negativas, cero en cantidad comprada ni rendimiento cero.

### Ejemplo de referencia (para tests)

Mantequilla: $13.000 por 500 g → usar 100 g cuesta $2.600.

---

## 📱 Módulos de la interfaz

### 1. Inventario de insumos
- Campos: nombre, tipo (ingrediente / empaque), precio pagado, cantidad total comprada, unidad (g, ml, unidad).
- Crear, editar y eliminar.
- Si cambia el precio de un insumo, las recetas que lo usan se recalculan automáticamente (las recetas guardan referencia al insumo, no una copia del precio).

### 2. Recetas / calculadora
- Nombre de la receta.
- Agregar insumos del inventario con su cantidad usada.
- Agregar empaques (caja craft, viruta, pirotines, celofán, cinta, etc.).
- Rendimiento: cuántas unidades salen de la tanda.
- Selector de tipo de elaboración: Rápida (20%) / Elaborada (25%).
- Guardar, editar, duplicar y eliminar recetas.

### 3. Resultado y sobres
- Costo total de la tanda y costo por unidad.
- Precios sugeridos (Estándar y Premium).
- Campo "Precio final de venta real" (por defecto el Estándar).
- Tarjetas tipo sobre, actualizadas en tiempo real:
  - 📦 Sobre 1: Reposición de insumos
  - 🔨 Sobre 2: Sueldo de mano de obra
  - 💰 Sobre 3: Ganancia limpia empresa
  - 💡 Total dinero libre al bolsillo
- Mostrar también los valores para la tanda completa, no solo por unidad.

### 4. Configuración
- % de costos indirectos, multiplicadores Estándar/Premium, % de sueldo por tipo de elaboración, regla de redondeo.
- **Exportar / importar respaldo en JSON** (los datos locales se pueden perder si se borra el navegador).

---

## 🛠️ Stack propuesto (a confirmar en la Fase 0)

- **Vite + React + TypeScript**
- **Tailwind CSS** para diseño mobile-first
- **vite-plugin-pwa** para manifest y service worker (offline + instalable)
- **localStorage** para persistencia (los datos son pocos; IndexedDB solo si se justifica)
- **Vitest** para probar las funciones de cálculo (son la parte crítica)
- **GitHub** para el repositorio (usando `gh` CLI si está disponible)
- Despliegue gratuito con HTTPS (GitHub Pages o Vercel), necesario para que la PWA sea instalable

La lógica de cálculo debe vivir en funciones puras separadas de la UI (ej: `src/lib/calculos.ts`), con tests.

---

## 🗺️ Plan de fases

Cada fase termina con un resumen, una propuesta de commit y mi confirmación.

- **Fase 0 – Preguntas y decisiones.** Hazme todas las preguntas necesarias (incluidas las de abajo) y confirma el stack. No escribas código todavía.
- **Fase 1 – Repositorio y estructura base.** `git init`, `.gitignore`, README inicial, crear el repo en GitHub, proyecto Vite + React + TS + Tailwind funcionando. Primer commit y push.
- **Fase 2 – Lógica de cálculo.** Tipos de datos y funciones puras de cálculo con tests (Vitest), incluido el ejemplo de la mantequilla.
- **Fase 3 – Persistencia.** Guardar y leer insumos, recetas y configuración en localStorage.
- **Fase 4 – Módulo de insumos.** CRUD completo en la UI.
- **Fase 5 – Módulo de recetas.** Crear/editar recetas con insumos, empaques, rendimiento y tipo de elaboración.
- **Fase 6 – Resultados y sobres.** Pantalla de resultados con precios sugeridos, precio real, tres sobres y alertas.
- **Fase 7 – Configuración y respaldo.** Parámetros editables y exportar/importar JSON.
- **Fase 8 – PWA.** Manifest, íconos, service worker, prueba offline e instalación en el celular.
- **Fase 9 – Despliegue.** Publicar en GitHub Pages o Vercel y probar desde el teléfono.

---

## ❓ Preguntas que debes hacerme en la Fase 0 (como mínimo)

1. ¿Confirmo el stack propuesto o prefiero otro?
2. Confirmado: redondeo de precios al millar más cercano; los empates exactos se redondean hacia arriba.
3. ¿Los empaques se registran en el mismo inventario (con tipo "empaque") o en una lista aparte?
4. ¿Necesito convertir unidades (ej: comprar en kg y usar en g) o siempre registro en g/ml/unidad?
5. ¿El empaque se cuenta por tanda o por unidad?
6. ¿Quiero guardar un historial de ventas realizadas o por ahora solo calcular?
7. Nombre de la app, colores y si tengo logo para los íconos de la PWA.
8. Nombre del repositorio en GitHub y si será público o privado.
9. ¿Dónde lo voy a desplegar: GitHub Pages o Vercel?

---

## ▶️ Cómo empezar
