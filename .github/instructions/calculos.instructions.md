---
name: "Cálculos financieros"
description: "Usa estas reglas al implementar o revisar cálculos financieros, costos de recetas, precios sugeridos, sobres, validaciones y pruebas de Vitest."
applyTo: ["src/lib/calculos.ts", "src/lib/calculos.test.ts"]
---

# Instrucciones para cálculos financieros

- Usa [CLAUDE.md](../../CLAUDE.md) como fuente de verdad para fórmulas, validaciones y decisiones confirmadas. No dupliques ni contradigas sus requisitos.
- Mantén la lógica financiera en funciones puras, separada de la interfaz y la persistencia.
- Antes de cambiar una regla financiera, agrega o actualiza pruebas de Vitest que describan el comportamiento esperado.
- Cubre los casos límite relevantes además del caso normal. Conserva el ejemplo de referencia: usar 100 g de una compra de mantequilla de $13.000 por 500 g cuesta $2.600.
- Rechaza cantidades negativas, cantidad comprada igual a cero y rendimiento igual a cero.
- Conserva las alertas definidas: pérdida cuando el precio de venta es menor que el costo por unidad; alerta de sueldo cuando la ganancia del sobre 3 es negativa.
- No inventes la regla de redondeo, conversiones de unidades ni convenciones para contar empaques: consulta [CLAUDE.md](../../CLAUDE.md) y pregunta si la decisión sigue pendiente.
- Formatea los montos en COP según lo acordado en el proyecto; no conviertas las funciones de cálculo en funciones de presentación.
