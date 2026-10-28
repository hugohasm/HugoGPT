import { useEffect, useState } from 'react'
import CvChat from './components/CvChat'

export default function App() {
  const [config, setConfig] = useState(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    fetch('/api/app-config').then(response => {
      if (!response.ok) throw new Error('Servicio no disponible')
      return response.json()
    }).then(setConfig).catch(() => setError(true))
  }, [])

  if (error) return <p className="p-8 text-slate-400">No se pudo conectar. Recarga la página para intentar nuevamente.</p>
  if (!config) return <p className="p-8 text-slate-400">Cargando…</p>
  return <CvChat config={config} />
}
