// src/components/Login.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) {
      alert('Erro no login: ' + error.message);
    } else {
      alert('Login bem-sucedido!');
      // Redirecionar para a página de exames
    }
  };

  // ... seu formulário com inputs para email, password e o botão de submit
}