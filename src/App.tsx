// src/App.tsx
import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import Login from './components/login'
import AcessoRapido from './pages/AcessoRapido' 
import Exams from './pages/Exames'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    // Retorna um ecrã de carregamento simples para evitar piscar de ecrã
    return <div className="min-h-screen bg-gray-900"></div>
  }

  return (
    <BrowserRouter>
      {/* Este div já não tem classes que limitam o tamanho */}
      <div>
        <Routes>
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          <Route path="/acesso-rapido" element={<AcessoRapido />} />
          <Route path="/" element={session ? <Exams /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App