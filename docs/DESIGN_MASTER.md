# UMBRAL DE ACERO — Documento maestro de diseño

Versión 2 (migración a HTML5). Fuente: directiva del proyecto. Este documento es la referencia de diseño; `ROADMAP.md` define el orden de trabajo y `ARCHITECTURE.md` la implementación.

## 1. Identidad

- Título: **UMBRAL DE ACERO**.
- Género: estrategia táctica militar isométrica 3D, gestión de escuadra y campaña persistente.
- Plataforma objetivo: **navegador moderno** (HTML5). Versión de escritorio posterior, si se decide.
- Tecnología: HTML5, CSS3, TypeScript, Three.js, Vite, Vitest, Playwright. **No se usa Godot.**
- Fantasía central: una compañía de mercenarios independientes en un territorio industrial fragmentado. Cada operación afecta personal, equipo, finanzas, reputación, facciones, territorio y contratos futuros.

## 2. Principios no negociables

1. Originalidad: todo el contenido es original o tiene licencia comercial documentada. PaybackTime 2 es solo referencia mecánica e histórica; no se copia código, sprites, modelos, audio, mapas, nombres, diálogos ni interfaces.
2. Prioridad: jugabilidad funcional > estabilidad técnica > integración > UX clara > calidad visual > rendimiento > expansión de contenido.
3. Ninguna funcionalidad decorativa: todo control debe hacer algo real. Ninguna característica se declara terminada sin pruebas.
4. Separación: simulación (sin dependencia de render), render (Three.js) e interfaz (DOM) son capas distintas.
5. Verificación honesta: se distingue entre implementado, integrado, probado automáticamente, probado manualmente y bloqueado.

## 3. Arte y estilo

- Ciencia ficción militar realista: arquitectura industrial, equipo militar creíble, uniformes funcionales, siluetas reconocibles, materiales físicamente plausibles, legibilidad del combate.
- Sin pixel art, sin estética retro copiada, sin decoración futurista excesiva.
- Detalle en `ART_BIBLE.md`.

## 4. Cámara y controles

- Cámara isométrica 3D con rotación, zoom y controles de visibilidad táctica.
- Teclado y ratón completos. Preparación de entrada para gamepad (no verificado en hardware).
- Interfaz adaptable a distintas resoluciones.

## 5. Sistemas núcleo (lista completa de la directiva)

- **Core:** estado del juego, bus de eventos, guardado y carga, ajustes, gestión de escenas.
- **Tactical:** reloj de simulación, pausa táctica, selección de unidades, movimiento, órdenes, navegación, combate, línea de visión, cobertura, destrucción, IA enemiga.
- **Characters:** datos de personaje, atributos, especializaciones, lesiones, experiencia, relaciones, muerte permanente.
- **Equipment:** armas, munición, armaduras, accesorios, inventario, reparaciones.
- **Campaign:** contratos, facciones, economía, eventos, control territorial, consecuencias.
- **Headquarters:** instalaciones, reclutamiento, recuperación, mejoras, logística.
- **UI:** menú principal, campaña, HUD táctico, plantilla, inventario, contratos, briefing, resultados, ajustes.
- **Tests:** unitarias, integración, gameplay, rendimiento, guardado y carga.

## 6. Requisitos de simulación

- Tiempo real con pausa táctica; velocidades configurables.
- Varias órdenes simultáneas y colas de órdenes; interrupción y actualización dinámica.
- Resultados deterministas donde sea posible, con semillas controlables en pruebas.
- Combate transparente: el jugador debe entender por qué una acción tiene éxito o fallo.
- Los enemigos no conocen posiciones ocultas sin un evento de detección válido.
- IA por estados: Idle, Patrol, Investigate, Detect, Engage, Suppress, Flank, Defend, Retreat, Incapacitated.

## 7. Contenido objetivo del MVP

| Elemento | Objetivo |
|---|---|
| Mapas | 1 |
| Personajes reclutables | 6 (4 desplegables simultáneamente) |
| Arquetipos enemigos | 4 |
| Armas | 12 |
| Accesorios | 8 |
| Especializaciones | 4: Asalto, Reconocimiento, Ingeniería, Medicina |
| Materiales destructibles | 4 |
| Instalaciones | 3: Armería, Enfermería, Taller |
| Operaciones | 3 |
| Facciones | 3: Autoridad Varda, Consorcio Helix, Frente de Reconstrucción |

Si un objetivo no puede alcanzarse sin comprometer la jugabilidad, se informa y se propone un hito verificado más pequeño.

## 8. Fases

Orden obligatorio: 01 base web → 02 prototipo táctico → 03 combate → 04 destrucción → 05 campaña persistente → 06 vertical slice → 07 contenido y pulido. No se saltan fases.

## 9. Calidad

- Código TypeScript tipado; responsabilidades separadas; sin dependencias innecesarias.
- Sin sistemas duplicados ni datos de prueba mezclados con producción.
- Errores controlados y estados de carga visibles.
- Recursos de Three.js liberados al cambiar de pantalla.
- Medición de rendimiento real, con el entorno documentado.
