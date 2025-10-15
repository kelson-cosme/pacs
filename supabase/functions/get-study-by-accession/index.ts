// supabase/functions/get-study-by-accession/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("Função 'get-study-by-accession' foi chamada.");

  if (req.method === 'OPTIONS') {
    console.log("A responder ao pedido OPTIONS (CORS).");
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // LOG 1: Vamos ver o que o frontend está a enviar
    const body = await req.json();
    console.log("Corpo (body) do pedido recebido:", body);

    const { accessionNumber, birthDate } = body;

    // LOG 2: Verificar se os dados foram extraídos corretamente
    console.log(`Dados extraídos: AccessionNumber = ${accessionNumber}, BirthDate = ${birthDate}`);

    if (!accessionNumber || !birthDate) {
      throw new Error("Número de Acesso e Data de Nascimento são obrigatórios.");
    }

    const formattedBirthDate = birthDate.replace(/-/g, '');

    // LOG 3: Verificar a data formatada
    console.log("Data de Nascimento formatada para o padrão DICOM:", formattedBirthDate);

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

    // LOG 4: Verificar o que vamos enviar para o Orthanc
    console.log("A enviar o seguinte pedido para o Orthanc:", JSON.stringify(orthancFindPayload, null, 2));

    const findResponse = await fetch(`${ORTHANC_URL}/tools/find`, {
      method: 'POST',
      headers: { 'Authorization': orthancAuth, 'Content-Type': 'application/json' },
      body: JSON.stringify(orthancFindPayload)
    });

    if (!findResponse.ok) {
      throw new Error(`Falha na comunicação com o servidor de exames. Status: ${findResponse.status}`);
    }

    const searchResults = await findResponse.json();
    console.log("Resultados da busca no Orthanc:", searchResults);

    if (searchResults.length === 1) {
      const studyId = searchResults[0];
      const studyDetailsResponse = await fetch(`${ORTHANC_URL}/studies/${studyId}`, { 
        headers: { 'Authorization': orthancAuth }
      });

      if (!studyDetailsResponse.ok) {
        throw new Error('Não foi possível obter os detalhes do exame.');
      }

      const studyDetails = await studyDetailsResponse.json();
      console.log("Exame encontrado. A devolver detalhes.");

      return new Response(JSON.stringify(studyDetails), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else {
      console.log("Nenhum exame correspondente encontrado.");
      return new Response(JSON.stringify({ error: "Exame não encontrado ou dados incorretos." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

  } catch (err) {
    // LOG 5: Capturar e mostrar qualquer erro que aconteça
    console.error("ERRO DENTRO DA FUNÇÃO:", err);
    return new Response(String(err?.message ?? err), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Retorna 400 em caso de erro no processamento
    })
  }
})