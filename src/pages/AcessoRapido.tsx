// src/pages/AcessoRapido.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import DicomViewer from './DicomViewer';

// Tipos para os dados do estudo e da resposta da função
interface StudyData {
  ID: string;
  MainDicomTags: {
    StudyDescription: string;
    StudyDate: string;
    PatientName: string;
    PatientID: string;
    PatientBirthDate: string;
    AccessionNumber: string;
    StudyInstanceUID: string;
  };
}

interface ApiResponse {
  studyData: StudyData;
  viewerUrl: string;
}

export default function AcessoRapido() {
  const [accessionNumber, setAccessionNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // O estado agora armazena a resposta completa da API
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setApiResponse(null);

    try {
      const { data, error } = await supabase.functions.invoke('get-study-by-accession', {
        body: { accessionNumber, birthDate },
      });

      if (error) {
        // Erros da própria chamada da função (ex: 500, 401)
        throw new Error(error.message);
      }
      
      if (data.error) {
        // Erros de negócio retornados pela nossa lógica (ex: "Exame não encontrado")
        throw new Error(data.error);
      }

      setApiResponse(data as ApiResponse);

    } catch (error: any) {
      console.error(error);
      setErrorMsg(`Erro: ${error.message || 'Falha ao buscar o exame.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Se tivermos uma resposta da API, renderizamos o DicomViewer
  if (apiResponse) {
    return (
        <DicomViewer 
            study={apiResponse.studyData} 
            viewerUrl={apiResponse.viewerUrl}
            onClose={() => setApiResponse(null)} 
        />
    );
  }

  // Senão, mostramos o formulário de busca
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Aceder ao meu Exame</h1>
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
              required
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
              required
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-bold transition duration-300 disabled:bg-gray-500"
            >
              {loading ? 'A procurar...' : 'Procurar Exame'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
