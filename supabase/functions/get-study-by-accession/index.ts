import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Leitura dos Secrets configurados no painel do Supabase
const ORTHANC_API_URL = Deno.env.get("ORTHANC_API_URL")!;
const ORTHANC_API_USER = Deno.env.get("ORTHANC_API_USER")!;
const ORTHANC_API_PASS = Deno.env.get("ORTHANC_API_PASS")!;
const AUTH_SERVICE_URL = Deno.env.get("ORTHANC_AUTH_SERVICE_URL")!;
const AUTH_SERVICE_USER = Deno.env.get("ORTHANC_AUTH_SERVICE_USER")!;
const AUTH_SERVICE_PASS = Deno.env.get("ORTHANC_AUTH_SERVICE_PASS")!;
const PUBLIC_VIEWER_URL_BASE = Deno.env.get("PUBLIC_VIEWER_URL_BASE")!;

serve(async (req) => {
  // Tratamento de CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, authorization" },
    });
  }

  try {
    const { accessionNumber, birthDate } = await req.json();

    // Passo 1: Encontrar o estudo no Orthanc principal (o "cofre")
    const findResponse = await fetch(`${ORTHANC_API_URL}/tools/find`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(`${ORTHANC_API_USER}:${ORTHANC_API_PASS}`),
      },
      body: JSON.stringify({
        Level: "Study",
        Query: {
          AccessionNumber: accessionNumber,
          PatientBirthDate: birthDate.replace(/-/g, ""),
        },
      }),
    });

    if (!findResponse.ok) {
        throw new Error(`Erro ao buscar no Orthanc: ${findResponse.statusText}`);
    }
    
    const studies = await findResponse.json();
    if (!Array.isArray(studies) || studies.length === 0) {
      return new Response(JSON.stringify({ error: "Exame não encontrado" }), {
        status: 404, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
    const studyId = studies[0];

    // Passo 2: Pedir ao serviço de autenticação para criar um token (o "chaveiro")
    // O endpoint é /tokens/{share-type}. O share-type está no seu docker-compose: "stone-viewer-publication"
    const tokenResponse = await fetch(`${AUTH_SERVICE_URL}/tokens/stone-viewer-publication`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        "Authorization": "Basic " + btoa(`${AUTH_SERVICE_USER}:${AUTH_SERVICE_PASS}`),
      },
      body: JSON.stringify({
        "Resources": [`/studies/${studyId}`], // O recurso que queremos compartilhar
        "Validity": 3600 // Validade do token em segundos (1 hora)
      })
    });

    if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.text();
        throw new Error(`Falha ao gerar token: ${tokenResponse.statusText} - ${errorBody}`);
    }

    const { Token: token } = await tokenResponse.json();

    // Passo 3: Obter detalhes do estudo para exibir no portal
    const studyDetailsResponse = await fetch(`${ORTHANC_API_URL}/studies/${studyId}`, {
        headers: { "Authorization": "Basic " + btoa(`${ORTHANC_API_USER}:${ORTHANC_API_PASS}`) },
    });
    const studyData = await studyDetailsResponse.json();
    
    // Passo 4: Montar a URL final e retornar tudo para o frontend
    const viewerUrl = `${PUBLIC_VIEWER_URL_BASE}?token=${token}`;

    return new Response(JSON.stringify({ studyData, viewerUrl }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
