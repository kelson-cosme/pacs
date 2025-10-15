// src/pages/AcessoRapido.tsx

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import DicomViewer from './DicomViewer'; // Importe o novo componente

// O tipo Study pode ser movido para um ficheiro de tipos separado se preferir
interface Study {
  ID: string;
  MainDicomTags: {
    StudyDescription: string;
    StudyDate: string;
    PatientName: string;
    PatientID: string;
    PatientBirthDate: string;
    AccessionNumber: string;
  };
  Series: string[];
}

export default function AcessoRapido() {
  const [accessionNumber, setAccessionNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [foundStudy, setFoundStudy] = useState<Study | null>(null);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setFoundStudy(null);

    try {
      const { data, error } = await supabase.functions.invoke('get-study-by-accession', {
        body: JSON.stringify({ accessionNumber, birthDate }),
      });
      if (error) {
        throw new Error(data?.error || error.message);
      }

      setFoundStudy(data);

    } catch (error: any) {
      setErrorMsg(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Se um exame foi encontrado, renderize o DicomViewer
  if (foundStudy) {
    return <DicomViewer study={foundStudy} onClose={() => setFoundStudy(null)} />;
  }

  // Se não, mostre o formulário de busca
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-lg">
        {/* ... o código do formulário continua o mesmo de antes ... */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">
            Aceder ao meu Exame
          </h1>
          <p className="mt-2 text-gray-400">
            Insira o número do protocolo e a sua data de nascimento.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSearch}>
          <div>
            <label htmlFor="accession" className="block text-sm font-medium text-gray-300 mb-1">
              Número de Acesso / Protocolo
            </label>
            <input
              id="accession"
              type="text"
              placeholder="Ex: 123456"
              value={accessionNumber}
              required={true}
              onChange={(e) => setAccessionNumber(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="birthdate" className="block text-sm font-medium text-gray-300 mb-1">
              Data de Nascimento
            </label>
            <input
              id="birthdate"
              type="date"
              value={birthDate}
              required={true}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}

          <div>
            <button 
              type="submit" 
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-bold transition duration-300 disabled:bg-gray-500" 
              disabled={loading}
            >
              {loading ? 'A procurar...' : 'Procurar Exame'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 