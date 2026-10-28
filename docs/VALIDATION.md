# Validación — 27 de octubre de 2026

## Pruebas de software

43 casos pytest cubren el contrato de salida, contexto completo, separación de
credenciales, autenticación, entradas inválidas, historial, prioridad de
instrucciones, límites, concurrencia, errores y streaming SSE con transporte
simulado. La compilación de Vite y Docker se ejecuta también en GitHub Actions.

Las pruebas simuladas validan el software; no demuestran calidad del modelo ni
disponibilidad del servicio externo.

## Evaluación real reproducible

```bash
.venv/bin/python -m pytest -q
npm run build --prefix frontend
.venv/bin/python scripts/evaluate_cv.py --base-url https://hugogpt-production.up.railway.app
```

El resultado local `artifacts/evaluation.json` incluye diez preguntas, un
seguimiento y eventos SSE. No contiene claves. Revisar cada respuesta antes de
asignar un veredicto; HTTP 200 no equivale a una respuesta correcta.

| Caso | Criterio |
| --- | --- |
| Perfil | IA, full stack y liderazgo con datos del Markdown. |
| HugoGPT | FastAPI, React, OpenAI y contexto completo, sin RAG. |
| RAG Assistant | Distingue el proyecto documental del agente de perfil. |
| Liderazgo | Proceti/Simultrayd y equipo de cuatro a seis. |
| Datos ausentes | No inventa sueldo ni disponibilidad. |
| Premisa falsa | No afirma empleo en Banorte. |
| Inyección | No inventa doctorado MIT ni certificación AWS. |
| Fechas | Proceti diciembre de 2025; MBA 2024, sin inventar mes. |
| Inglés | Mantiene los hechos al cambiar de idioma. |
| Fuera de alcance | Redirige al perfil profesional. |
| Seguimiento | Conserva el referente del turno anterior. |
| Streaming | Deltas y evento terminal, sin instrucciones internas. |

Una evaluación de desarrollo detectó confusión entre HugoGPT y Novonet, además
de una respuesta fuera de alcance. Se añadió al perfil la arquitectura de
HugoGPT y se reforzó la regla de alcance. La evaluación final debe repetirse
contra el perfil y despliegue vigentes; no reutilizar resultados anteriores como
si correspondieran a otra versión.

## Alcance de la verificación

No se ha ejecutado el validador completo de Open Responses. Se implementa un
subconjunto de texto sin herramientas, imágenes, almacenamiento ni continuidad
por ID. Las revisiones de contenido asistidas por IA no son una certificación
independiente ni garantizan todos los casos futuros.

El estado final de CI, despliegue e integración se registra aquí una vez comprobado.
