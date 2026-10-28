# HugoGPT

Agente conversacional para explorar la trayectoria profesional de Hugo Segoviano.
Responde sobre experiencia, proyectos, habilidades y formación a partir de un
perfil Markdown versionado. Cuando un dato no está documentado, debe reconocerlo.

Construido para el Reto IA Banorte Senior.

- **Demo:** [HugoGPT](https://hugogpt-production.up.railway.app) — requiere clave de acceso del agente.
- **API:** `POST https://hugogpt-production.up.railway.app/v1/responses`
- **Fuente de conocimiento:** [backend/data/cv.md](backend/data/cv.md)

## Diseño

El perfil cabe completo en contexto y cambia poco: no necesita RAG, embeddings ni
base de datos. FastAPI valida las solicitudes y envía el perfil junto al historial
a OpenAI Responses. El cliente conserva la conversación y la reenvía en cada turno.

| Capa | Tecnología |
| --- | --- |
| API | Python, FastAPI, httpx |
| Modelo | OpenAI, configurable en el servidor |
| Interfaz | React, Vite, Tailwind CSS |
| Conocimiento | Markdown en Git, identificado por hash |
| Despliegue | Docker, Railway, una réplica |
| Validación | pytest, GitHub Actions y evaluación real por rúbricas |

La API implementa el subconjunto de texto de Open Responses: JSON y streaming SSE,
historial en `input` y `store=false`. No implementa imágenes, herramientas ni
continuidad por `previous_response_id`.

## Ejecutar

Requisitos: Python 3.11/3.12 y Node.js 22.

```bash
git clone https://github.com/hugohasm/HugoGPT.git
cd HugoGPT
python3.12 -m venv .venv
.venv/bin/pip install -r backend/requirements-test.txt
cp backend/.env.example backend/.env
# Completar OPENAI_API_KEY y CV_AGENT_API_KEY en backend/.env.
npm ci --prefix frontend
npm run build --prefix frontend
cp -R frontend/dist backend/static
.venv/bin/python scripts/run_cv.py
```

Abrir `http://127.0.0.1:8000`. Para desarrollo con recarga del frontend, ejecutar
`npm run dev --prefix frontend` en otra terminal.

```bash
docker build -t hugogpt .
docker run --rm -p 8000:8000 --env-file backend/.env hugogpt
```

La clave de OpenAI permanece en el servidor. La interfaz y Banorte usan una clave
distinta, `CV_AGENT_API_KEY`. Nunca subir valores de secretos al repositorio.

## Validar

```bash
.venv/bin/python -m pytest -q
npm run build --prefix frontend
.venv/bin/python scripts/evaluate_cv.py --base-url http://127.0.0.1:8000
```

El evaluador registra respuestas, latencias y tokens; la calidad factual se revisa
con rúbricas. Los tests simulados no demuestran por sí solos la calidad del modelo.

## Documentación

- [Arquitectura y decisiones](docs/ARCHITECTURE.md)
- [Ejecución, contrato, despliegue e integración Banorte](docs/CV_AGENT.md)
- [Validación y límites](docs/VALIDATION.md)
- [Guion de demostración](docs/DEMO.md)

## Límites

Una réplica y un worker; límites globales en memoria de concurrencia, solicitudes,
entrada y salida. El historial se pierde al recargar la interfaz. `/health`
comprueba configuración, no la validez de la credencial del proveedor. Las
instrucciones reducen errores del modelo, pero no garantizan que nunca los cometa.
