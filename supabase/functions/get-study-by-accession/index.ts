// supabase/functions/get-study-by-accession/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    const { accessionNumber, birthDate } = body;

    if (!accessionNumber || !birthDate) {
      throw new Error("Número de Acesso e Data de Nascimento são obrigatórios.");
    }

    const formattedBirthDate = birthDate.replace(/-/g, '');

    const ORTHANC_URL = Deno.env.get('ORTHANC_API_URL')!
    const ORTHANC_USER = Deno.env.get('ORTHANC_USER')!
    const ORTHANC_PASS = Deno.env.get('ORTHANC_PASS')!
    const orthancAuth = 'Basic ' + btoa(`${ORTHANC_USER}:${ORTHANC_PASS}`);

    // 1. Encontrar o ID do estudo no Orthanc
    console.log("A procurar estudo...");
    const findResponse = await fetch(`${ORTHANC_URL}/tools/find`, {
      method: 'POST',
      headers: { 'Authorization': orthancAuth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "Level": "Study",
        "Query": { "AccessionNumber": accessionNumber, "PatientBirthDate": formattedBirthDate }
      })
    });

    if (!findResponse.ok) {
      throw new Error(`Falha na busca no Orthanc. Status: ${findResponse.status}`);
    }
    const searchResults = await findResponse.json();

    if (searchResults.length !== 1) {
      return new Response(JSON.stringify({ error: "Exame não encontrado." }), { status: 404, headers: corsHeaders });
    }
    const studyId = searchResults[0];
    console.log(`Estudo encontrado: ${studyId}`);

    // 2. Obter detalhes do estudo
    const studyDetailsResponse = await fetch(`${ORTHANC_URL}/studies/${studyId}`, { headers: { 'Authorization': orthancAuth } });
    if (!studyDetailsResponse.ok) {
      throw new Error('Não foi possível obter os detalhes do exame.');
    }
    const studyDetails = await studyDetailsResponse.json();

    // 3. TENTAR GERAR O TOKEN DE ACESSO
    console.log("A tentar gerar o token para o estudo...");
    const shareResponse = await fetch(`${ORTHANC_URL}/studies/${studyId}/share`, {
        method: 'POST',
        headers: { 'Authorization': orthancAuth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ "Expire": 3600 })
    });

    // ***** INÍCIO DA DEPURAÇÃO *****
    console.log(`Resposta do Orthanc para /share: Status = ${shareResponse.status}`);
    const shareData = await shareResponse.json();
    console.log("Corpo (body) da resposta do Orthanc para /share:", JSON.stringify(shareData, null, 2));
    // ***** FIM DA DEPURAÇÃO *****

    if (!shareResponse.ok) {
        throw new Error('O servidor Orthanc não conseguiu gerar o link de visualização.');
    }

    const temporaryToken = shareData.Token; // O problema está aqui, "Token" está a vir como undefined
    console.log(`Token recebido: ${temporaryToken}`);

    const responsePayload = {
        ...studyDetails,
        TemporaryToken: temporaryToken
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error("ERRO DENTRO DA FUNÇÃO SUPABASE:", err);
    return new Response(String(err?.message ?? err), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})