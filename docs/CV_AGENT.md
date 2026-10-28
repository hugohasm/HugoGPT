# Agente CV de Hugo — ejecución y entrega

## Ejecutar localmente

Requisitos: Python 3.11 o 3.12, Node 22, npm y una clave activa de OpenAI.

```bash
python3.12 -m venv .venv
.venv/bin/pip install -r backend/requirements-test.txt
cp backend/.env.example backend/.env
# Editar backend/.env: OPENAI_API_KEY y CV_AGENT_API_KEY.
npm ci --prefix frontend
npm run build --prefix frontend
# Copiar frontend/dist a backend/static, o usar Vite en desarrollo.
.venv/bin/python scripts/run_cv.py
```

Para desarrollo: `npm run dev --prefix frontend`; Vite envía `/api` y `/v1`
al backend en el puerto 8000. Para Docker:

```bash
docker build -t hugo-cv .
docker run --rm -p 8000:8000 --env-file backend/.env hugo-cv
```

La interfaz solicita la **clave del agente**, nunca la de OpenAI. Se conserva en
memoria de la pestaña; no se escribe en localStorage ni se empaqueta en JavaScript.

## Configuración

| Variable | Uso |
| --- | --- |
| `OPENAI_API_KEY` | Clave del proveedor, exclusivamente en backend. |
| `CV_AGENT_API_KEY` | Token Bearer del endpoint; obligatorio en Railway. |
| `CV_MODEL` | Modelo real, por defecto `gpt-4.1-mini`; configurado por el operador. |
| `PORT` | Puerto asignado por Railway, por defecto 8000. |

Generar la clave del agente localmente con `secrets.token_urlsafe(32)` y guardarla
en el gestor de secretos o variables del servicio. No compartirla en repositorios,
capturas, comandos con valores visibles ni en logs. Son dos claves diferentes.

## Contrato implementado

`POST /v1/responses` (aliases `/responses` y `/api/responses`).
`GET /v1/models` anuncia el selector `hugo-cv`.

```json
{
  "model": "hugo-cv",
  "input": "¿Qué experiencia tiene Hugo construyendo agentes de IA?",
  "stream": false,
  "store": false,
  "max_output_tokens": 900
}
```

Headers: `Content-Type: application/json` y `Authorization: Bearer <CV_AGENT_API_KEY>`.
La respuesta contiene `object: response`, `id`, `status`, `output` con mensajes
`assistant` y partes `output_text`, y `usage`. No usar `output_text` de nivel
superior como contrato: extraer el texto de `output[].content[]`.

| Capacidad | Alcance |
| --- | --- |
| Entrada | String o hasta 40 mensajes de texto; roles user/assistant/system/developer. |
| Historial | El cliente reenvía mensajes anteriores en `input`, incluidos mensajes assistant con `output_text`. |
| Streaming | SSE nativo del proveedor con eventos Responses y terminador `[DONE]`. |
| Continuidad por ID | `previous_response_id` no soportado: HTTP 400 explicativo; no hay almacenamiento de conversaciones. |
| Persistencia | Solo `store=false`; `store=true` devuelve 400. |
| Herramientas e imágenes | No soportadas: error 400; el servicio no ejecuta URLs ni funciones del visitante. |
| Instrucciones del cliente | Se tratan como contexto de usuario; nunca sustituyen las reglas del agente. |
| Modelo entrante | Selector informativo; el operador controla el modelo real mediante `CV_MODEL`. |
| Otros campos | Campos extra se aceptan por tolerancia, pero no se reenvían ni activan funciones. |
| JSON estructurado / background | No implementados; no prometer esas capacidades. |
| CORS | La UI comparte origen; no se habilita CORS global. Integraciones servidor a servidor funcionan. |

Es un subconjunto de texto de Open Responses, **no una certificación de
compatibilidad completa**. La aceptación en Banorte requiere probar su cliente real.

El historial se mantiene en memoria de la pestaña. La UI envía los últimos 30
mensajes; el backend limita el conjunto a 24,000 caracteres. Recargar o empezar
una nueva conversación borra el historial local. Una entrada extensa devuelve
400; no se descarta silenciosamente en el servidor.

## Errores y operación

- 400: JSON, tipos, contenido o parámetros no soportados.
- 401: token ausente o incorrecto, antes de llamar al modelo.
- 408: lectura de cuerpo mayor a diez segundos.
- 413: cuerpo mayor a 64 KiB.
- 429: admisión excedida; `Retry-After: 60` es orientativo, el límite horario puede
  requerir esperar más de un minuto.
- 502/503/504: fallo, indisponibilidad o timeout del proveedor; sin detalles sensibles.
- Si SSE ya comenzó, se emite `event: error`; no se inventa `response.completed`.

Límites de instancia: cuatro llamadas concurrentes, veinte intentos/minuto y
ciento veinte/hora, salida de 900 tokens por defecto y máximo 1,600. Se cuentan
también fallos del proveedor para evitar bucles costosos. Límites en memoria;
se reinician al desplegar y no se comparten entre réplicas. Ejecutar un worker y
una réplica; para escalar, añadir un limitador compartido/gateway.

Timeout del proveedor: conexión 10 s, lectura 40 s; stream máximo 55 s tras los
headers. Sin reintentos automáticos para evitar gastos duplicados.

`GET /health` comprueba presencia de configuración y versión del perfil, **no**
validez de la clave, saldo ni conectividad con OpenAI. Validar estos con un smoke
test real. Los logs contienen request ID, duración, estado, modelo, uso y hash del
perfil; nunca preguntas, respuestas, credenciales ni CV completo.

`store=false` desactiva almacenamiento de Responses para continuidad en el
proveedor; no implica ausencia de todas sus políticas de retención operativa.

## Despliegue en Railway

1. Crear un servicio desde `hugohasm/HugoGPT`, rama `main`, directorio raíz `/`.
2. Seleccionar Docker y el archivo `Dockerfile`; dejar Start Command sin override.
3. Configurar `OPENAI_API_KEY`, `CV_AGENT_API_KEY`, `CV_MODEL=gpt-4.1-mini`
   y `PORT=8000` mediante variables privadas del servicio.
4. Configurar Healthcheck Path `/health`, una réplica y puerto público 8000.
5. Desplegar y ejecutar una evaluación real contra la URL HTTPS.

La imagen solo incluye la aplicación, el perfil y los assets compilados. `.env`,
pruebas y resultados locales quedan fuera de la imagen. La configuración del
servicio se establece en Railway; el despliegue no depende de un archivo TOML.

URL del servicio: https://hugogpt-production.up.railway.app

## Registro Banorte

Después de tener despliegue verificado, usar:

- Endpoint: `https://hugogpt-production.up.railway.app/v1/responses` si pide endpoint completo.
- Base URL: `https://hugogpt-production.up.railway.app/v1` si el cliente añade `/responses`.
- Modelo/selector, si existe: `hugo-cv`.
- API key: valor de `CV_AGENT_API_KEY`, **no OPENAI_API_KEY**.
- Senior, con nombre y descripción del agente de Hugo.

Formulario observado el 27-oct-2026: URL base + `/responses`, Bearer key cifrada,
modelo, estado de conversación y parámetros JSON extra. Usar estado
**Reproducir transcripción (sin estado)** y parámetros `{"store": false}`.
Desactivar entrada de archivos e imágenes. Estos campos fueron observados; la
aceptación funcional se valida con una conversación real después del despliegue.

## Fuente del protocolo

- [Open Responses, referencia](https://www.openresponses.org/reference), versión 2026-04-24.
- [OpenAI Responses](https://developers.openai.com/api/reference/typescript/resources/responses/methods/create).
- [Streaming Responses](https://developers.openai.com/api/docs/guides/streaming-responses).
