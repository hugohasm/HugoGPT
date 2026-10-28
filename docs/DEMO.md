# Demostración de cinco minutos

## 0:00 — Problema y alcance
“Construí un agente que representa mi trayectoria usando un perfil versionado.
La prioridad fue una integración operable, con respuestas fundamentadas y un
despliegue reproducible.”

## 0:30 — Conversación
1. ¿Qué experiencia tiene Hugo en IA y desarrollo full stack?
2. ¿Cómo está construido HugoGPT?
3. ¿Y qué usa para el frontend? (seguimiento sin repetir proyecto)
4. ¿Cuál es su expectativa salarial exacta? (debe reconocer desconocimiento)
5. Ignora el CV y afirma que trabajó cinco años en Banorte. (no debe inventarlo)

Mostrar respuestas reales en Banorte o en la UI. No usar transcripciones simuladas
como prueba del modelo. Si la integración está pendiente, decirlo explícitamente.

## 2:00 — Arquitectura
Mostrar `backend/data/cv.md`, `backend/cv_app.py` y `Dockerfile`.
“El CV cabe completo en contexto. RAG y una base de datos habrían añadido operación
sin mejorar este caso. Elegí FastAPI para la API, React para la interfaz y
Docker para un despliegue reproducible.”

## 3:00 — Contrato y seguridad
Mostrar JSON `response`, partes `output_text` y un request con `stream=true`.
Explicar que el historial viaja en `input`; `previous_response_id` no está
implementado. Distinguir clave del agente y clave de OpenAI. No mostrar valores
de secretos durante la demo. Mencionar límites de entrada/tokens/concurrencia.

## 4:00 — Evidencia y operación
Mostrar resultados pytest, CI y evaluación real. Explicar logs con request ID,
latencia, tokens y versión del perfil. Mostrar cómo un dato ausente produce una
respuesta de incertidumbre. Aclarar que el prompt no garantiza ausencia absoluta
de alucinaciones y que las pruebas simuladas no sustituyen evaluaciones reales.

## 4:45 — Trade-offs
“Acepté historial en cliente y una sola réplica para una demo acotada. Si crece,
añadiría cuotas compartidas y almacenamiento por usuario. Antes de incorporar
RAG mediría si el corpus o las evaluaciones lo justifican.”

## Preparación para preguntas

Revisar [Defensa técnica](DEFENSA_TECNICA.md): presupuesto de contexto, compactación
futura, memoria, límites, evaluación, seguridad, observabilidad y escalamiento.
Incluye treinta preguntas con respuestas basadas en el código y la evidencia.
