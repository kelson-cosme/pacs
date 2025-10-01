// src/App.tsx
import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabaseClient'
import Login from './components/login' // Assumindo que o seu componente de login está aqui
import Exams from './pages/Exames'   // A sua página de exames
import AcessoRapido from './pages/AcessoRapido';

function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <div className="container" style={{ padding: '50px 0 100px 0' }}>
        <Routes>
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={session ? <Exams /> : <Navigate to="/login" />} />
            <Route path="/acesso-rapido" element={<AcessoRapido />} />

        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App