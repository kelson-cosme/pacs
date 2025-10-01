// supabase/functions/get-study-by-accession/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Função CORS para permitir que o seu site chame a função
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Responde a pedidos OPTIONS para o CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Extrai os dados enviados pelo frontend
    const { accessionNumber, birthDate } = await req.json();
    if (!accessionNumber || !birthDate) {
      throw new Error("Número de Acesso e Data de Nascimento são obrigatórios.");
    }

    // Formata a data para o padrão DICOM (AAAAMMDD)
    const formattedBirthDate = birthDate.replace(/-/g, '');

    // 2. Prepara a chamada para a API do Orthanc
    const ORTHANC_URL = Deno.env.get('ORTHANC_API_URL')!
    const ORTHANC_USER = Deno.env.get('ORTHANC_USER')!
    const ORTHANC_PASS = Deno.env.get('ORTHANC_PASS')!
    const orthancAuth = 'Basic ' + btoa(`${ORTHANC_USER}:${ORTHANC_PASS}`);

    const orthancFindPayload = {
      "Level": "Study",
      "Query": {
        "AccessionNumber": accessionNumber,
        "PatientBirthDate": formattedBirthDate
      }
    };

    // 3. Executa a busca no Orthanc (/tools/find)
    const findResponse = await fetch(`${ORTHANC_URL}/tools/find`, {
      method: 'POST',
      headers: {
        'Authorization': orthancAuth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orthancFindPayload)
    });

    if (!findResponse.ok) {
      throw new Error('Falha na comunicação com o servidor de exames.');
    }

    const searchResults = await findResponse.json();

    // 4. Valida o resultado e busca os detalhes do estudo
    if (searchResults.length === 1) {
      const studyId = searchResults[0];

      // Busca os detalhes completos do estudo encontrado
      const studyDetailsResponse = await fetch(`${ORTHANC_URL}/studies/${studyId}`, { 
        headers: { 'Authorization': orthancAuth }
      });

      if (!studyDetailsResponse.ok) {
        throw new Error('Não foi possível obter os detalhes do exame.');
      }

      const studyDetails = await studyDetailsResponse.json();

      // 5. Retorna os detalhes do exame para o frontend
      return new Response(JSON.stringify(studyDetails), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else {
      // Se não encontrou exatamente 1 resultado, retorna erro 404
      return new Response(JSON.stringify({ error: "Exame não encontrado ou dados incorretos." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

  } catch (err) {
    return new Response(String(err?.message ?? err), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})