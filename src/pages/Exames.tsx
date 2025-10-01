// src/pages/Exams.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Definimos um tipo para os dados do estudo para usar com TypeScript
interface Study {
  ID: string;
  MainDicomTags: {
    StudyDescription: string;
    StudyDate: string;
    PatientName: string;
  }
}

export default function Exams() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudies = async () => {
      // Pega a sessão do utilizador logado
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log("Sessão encontrada. A chamar a Edge Function...");

        const { data, error } = await supabase.functions.invoke('get-orthanc-studies');

        if (error) {
          console.error("Erro ao chamar a Edge Function:", error);
          setErrorMsg(`Falha ao carregar exames: ${error.message}`);
        } else {
          console.log("Dados recebidos com sucesso do Orthanc:", data);
          setStudies(data);
        }
      } else {
        setErrorMsg("Nenhum utilizador logado. Por favor, faça o login.");
        console.log("Nenhuma sessão encontrada.");
      }
      setLoading(false);
    };

    fetchStudies();
  }, []);

  if (loading) return <p className="text-center p-4">A carregar exames...</p>;
  if (errorMsg) return <p className="text-center p-4 text-red-500">{errorMsg}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Meus Exames</h1>
      {studies.length > 0 ? (
        <ul className="space-y-4">
          {studies.map(study => (
            <li key={study.ID} className="p-4 border rounded-lg shadow-sm">
              <p><strong>Paciente:</strong> {study.MainDicomTags.PatientName}</p>
              <p><strong>Descrição:</strong> {study.MainDicomTags.StudyDescription}</p>
              <p><strong>Data:</strong> {study.MainDicomTags.StudyDate}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhum exame encontrado para este utilizador.</p>
      )}
    </div>
  );
}