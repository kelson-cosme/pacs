// src/components/login.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';


export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      alert('Erro no login: ' + error.message);
    }
    // O redirecionamento é tratado automaticamente pelo App.tsx
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 w-full flex flex-col justify-center items-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">
            Portal de Pacientes
          </h1>
          <p className="mt-2 text-gray-400">
            Faça o login com seu email e senha
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="seu.email@exemplo.com"
              value={email}
              required={true}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              required={true}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <button 
              type="submit" 
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-bold transition duration-300 disabled:bg-gray-500" 
              disabled={loading}
            >
              {loading ? 'A carregar...' : 'Entrar'}
            </button>

            <div className="text-center mt-4">
                <p className="text-sm text-gray-400">
                    Ou aceda a um exame específico.
                    <Link to="/acesso-rapido" className="font-medium text-blue-500 hover:text-blue-400 ml-1">
                    Acesso Rápido
                    </Link>
                </p>
                </div>
          </div>
        </form>
      </div>
    </div>
  );
}