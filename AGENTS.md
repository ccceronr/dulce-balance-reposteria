# AGENTS.md

Este repositorio corresponde a la app de cálculo de costos y sobres para repostería artesanal de alta gama. La fuente principal de requisitos es [CLAUDE.md](CLAUDE.md).

## Reglas prioritarias

- Sigue el plan de fases definido en [CLAUDE.md](CLAUDE.md). No avances a una fase nueva sin completar la previa y sin confirmación del usuario.
- Antes de crear archivos, instalar dependencias, ejecutar comandos, hacer commits o push, explica qué harás y espera la confirmación.
- Mantén toda la comunicación, UI, comentarios y mensajes de commit en español.
- Prefiere la solución más simple que resuelva el problema. No agregues librerías innecesarias.
- Si faltan requisitos o hay más de una opción razonable, pregunta antes de asumir.

## Objetivo del proyecto

Construir una PWA mobile-first para:

- registrar insumos y empaques con precio de compra y cantidad comprada;
- crear recetas con cantidades por tanda;
- calcular costo real y costo por unidad;
- sugerir precios estándar y premium;
- distribuir el precio de venta en los tres sobres;
- guardar datos localmente y soportar uso offline.

## Stack y arquitectura

- Vite + React + TypeScript
- Tailwind CSS
- vite-plugin-pwa para manifest/service worker
- localStorage para persistencia
- Vitest para pruebas de lógica financiera
- funciones puras de cálculo separadas de la UI, idealmente en `src/lib/calculos.ts`

## Convenciones de desarrollo

- La lógica financiera debe vivir en funciones puras y estar cubierta por tests.
- Los cálculos deben seguir exactamente las fórmulas y validaciones definidas en [CLAUDE.md](CLAUDE.md).
- El redondeo de precios debe respetar la decisión final del usuario en la Fase 0.
- El inventario de insumos y empaques puede manejarse dentro del mismo inventario con tipo `insumo` o `empaque`, salvo que se confirme otra estructura.
- Las recetas deben referenciar insumos por id/relación y no guardar una copia del precio comprado.
- Las cantidades no pueden ser negativas; la cantidad comprada ni el rendimiento no pueden ser cero.
- Si el precio de venta es menor que el costo por unidad, la app debe mostrar alerta roja; si la ganancia del sobre 3 es negativa, mostrar alerta amarilla.

## Workflow recomendado para agentes

1. Lee [CLAUDE.md](CLAUDE.md) antes de modificar el proyecto.
2. Confirma la fase actual y qué parte del producto vas a tocar.
3. Haz cambios pequeños y específicos.
4. Antes de cada cambio, explica:
   - qué archivos crearás o modificarás;
   - para qué sirve cada uno;
   - por qué esa estructura es la apropiada.
5. Después del cambio, resume el resultado y menciona qué quedó listo.
6. Si haces commits, usa Conventional Commits en español (por ejemplo: `feat: agregar módulo de insumos`).

## Archivos clave esperados

- `src/lib/calculos.ts` para lógica financiera pura
- `src/lib/calculos.test.ts` o equivalente para pruebas de Vitest
- `src/store` o `src/data` para persistencia local
- módulos de UI para inventario, recetas, resultados y configuración
- `public` o `src/assets` para recursos de PWA

## Recomendación de trabajo

Cuando el objetivo sea una tarea de implementación, prioriza:

- reproducir la regla de negocio antes de escribir código;
- crear prueba(s) que validen la lógica financiera;
- implementar la menor solución que haga pasar la prueba;
- verificar el comportamiento relevante con la herramienta disponible.

> En esencia: actuar como desarrollador full stack senior, mantener la lógica financiera aislada, respetar el plan por fases y no mover el proyecto más allá de lo que el usuario haya confirmado.
