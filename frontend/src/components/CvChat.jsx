import { useEffect, useRef, useState } from 'react'

const suggestions = ['¿Qué experiencia tiene Hugo en IA?', 'Cuéntame sobre sus proyectos full stack.', '¿Cómo ha liderado equipos?', '¿Qué información no puedes confirmar?']

export default function CvChat({ config }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [key, setKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const log = useRef(null)
  const controller = useRef(null)
  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' }) }, [messages, busy])

  async function send(text = input) {
    if (!text.trim() || busy) return
    const history = [...messages, { role: 'user', content: text.trim() }]
    setMessages(history)
    setInput('')
    setError('')
    setBusy(true)
    controller.current = new AbortController()
    const timer = setTimeout(() => controller.current?.abort(), 60000)
    try {
      const response = await fetch('/v1/responses', {
        method: 'POST', signal: controller.current.signal,
        headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
        body: JSON.stringify({ model: 'hugo-cv', input: history.slice(-30), stream: false, store: false }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'No fue posible obtener una respuesta.')
      const answer = data.output?.flatMap(item => item.content || []).filter(part => part.type === 'output_text').map(part => part.text).join('\n')
      if (!answer) throw new Error('El modelo no devolvió una respuesta de texto. Intenta nuevamente.')
      setMessages([...history, { role: 'assistant', content: answer }])
      if (data.status === 'incomplete') setError('La respuesta alcanzó el límite de extensión. Puedes pedir que continúe.')
    } catch (e) {
      setError(e.name === 'AbortError' ? 'La solicitud tardó demasiado. Intenta nuevamente.' : e.message)
      setMessages(history.slice(0, -1))
      setInput(text)
    } finally {
      clearTimeout(timer)
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 px-5 py-5">
        <div className="max-w-5xl mx-auto flex justify-between gap-4 items-center">
          <a href="/" className="font-semibold tracking-tight">Hugo<span className="text-teal-400">GPT</span> <span className="text-xs text-slate-500 ml-2">por Hugo Segoviano</span></a>
          <a href="https://github.com/hugohasm/HugoGPT" target="_blank" rel="noreferrer" className="text-sm text-slate-400 hover:text-white">Ver código ↗</a>
        </div>
      </header>
      <main className="w-full max-w-5xl mx-auto grid md:grid-cols-[260px_1fr] gap-8 px-5 py-8 flex-1">
        <aside>
          <p className="text-xs uppercase tracking-widest text-teal-400 mb-3">Conversaciones sobre mi trayectoria</p>
          <h1 className="text-3xl font-semibold tracking-tight leading-tight mb-4">De una idea a un producto con IA.</h1>
          <p className="text-slate-400 leading-relaxed text-sm">Conoce mi experiencia en arquitectura, desarrollo full stack, automatización y liderazgo técnico.</p>
          <div className="flex flex-wrap gap-2 mt-5">{['IA aplicada', 'Full Stack', 'Tech Lead'].map(s => <span key={s} className="text-xs border border-slate-700 rounded-full px-3 py-1">{s}</span>)}</div>
          <a className="inline-block mt-6 text-teal-300 text-sm" href="https://hugosegoviano.com" target="_blank" rel="noreferrer">Explorar portafolio ↗</a>
          <p className="mt-8 text-xs text-slate-500 leading-relaxed">Este asistente responde a partir de mi perfil profesional. Si falta información, debe decirlo. Puede cometer errores; confirma conmigo los detalles importantes.</p>
        </aside>
        <section className="border border-slate-800 rounded-2xl bg-slate-900/60 flex flex-col min-h-[560px] overflow-hidden" aria-label="Chat sobre el perfil de Hugo">
          <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center">
            <div><h2 className="font-medium">Pregunta sobre mi experiencia</h2><p className="text-xs text-slate-500 mt-1">Asistente de perfil profesional</p></div>
            <button className="text-xs text-slate-400 disabled:opacity-40" disabled={busy} onClick={() => { setMessages([]); setError(''); setInput('') }}>Nueva charla</button>
          </div>
          {config.requires_api_key && <label className="block px-5 py-3 border-b border-slate-800 text-xs text-slate-400">Clave de acceso a la demo
            <input type="password" autoComplete="off" value={key} onChange={e => setKey(e.target.value)} placeholder="Introduce la clave del agente" className="block w-full mt-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100" />
            <span className="block mt-1 text-slate-500">Se conserva únicamente mientras esta página esté abierta.</span>
          </label>}
          <div ref={log} className="flex-1 px-5 py-5 space-y-5 max-h-[55vh] overflow-y-auto" role="log" aria-live="polite">
            {!messages.length && <div className="py-6"><p className="text-slate-300 mb-5">Hola, soy HugoGPT. Puedo contarte sobre los proyectos, habilidades y experiencia de Hugo. ¿Qué te gustaría conocer?</p><div className="grid gap-2">{suggestions.map(s => <button key={s} disabled={busy || (config.requires_api_key && !key)} onClick={() => send(s)} className="text-left text-sm rounded-xl border border-slate-700 p-3 hover:border-teal-500 disabled:opacity-40">{s}</button>)}</div></div>}
            {messages.map((message, i) => <div key={i} className={message.role === 'user' ? 'ml-7 bg-teal-950/60 rounded-xl p-4' : 'mr-3'}><p className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">{message.role === 'user' ? 'Tú' : 'Asistente de Hugo'}</p><p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p></div>)}
            {busy && <p className="text-teal-400 text-sm" role="status">Consultando el perfil…</p>}
          </div>
          <form onSubmit={e => { e.preventDefault(); send() }} className="border-t border-slate-800 p-4">
            {error && <p role="alert" className="mb-3 text-sm text-amber-300">{error}</p>}
            <div className="flex gap-2"><textarea aria-label="Tu pregunta" rows={2} maxLength={4000} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }} placeholder="Pregunta por un proyecto, una tecnología o su experiencia…" disabled={busy} className="flex-1 min-w-0 resize-none rounded-xl bg-slate-950 border border-slate-700 px-3 py-3 text-sm focus:outline-none focus:border-teal-500" /><button disabled={busy || !input.trim() || (config.requires_api_key && !key)} className="self-end rounded-xl px-4 py-3 text-sm font-medium bg-teal-400 text-slate-950 disabled:opacity-30">Enviar</button></div>
            <p className="text-[11px] text-slate-500 mt-2">Enter para enviar · Shift + Enter para nueva línea</p>
          </form>
        </section>
      </main>
    </div>
  )
}
