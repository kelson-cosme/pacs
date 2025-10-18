import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Leitura dos Secrets configurados no painel do Supabase
const ORTHANC_API_URL = Deno.env.get("ORTHANC_API_URL");
const ORTHANC_API_USER = Deno.env.get("ORTHANC_API_USER");
const ORTHANC_API_PASS = Deno.env.get("ORTHANC_API_PASS");
const AUTH_SERVICE_URL = Deno.env.get("ORTHANC_AUTH_SERVICE_URL");
const AUTH_SERVICE_USER = Deno.env.get("ORTHANC_AUTH_SERVICE_USER");
const AUTH_SERVICE_PASS = Deno.env.get("ORTHANC_AUTH_SERVICE_PASS");
const PUBLIC_VIEWER_URL_BASE = Deno.env.get("PUBLIC_VIEWER_URL_BASE");
serve(async (req)=>{
  // Tratamento de CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Bypass-Tunnel-Reminder"
      }
    });
  }
  try {
    const { accessionNumber, birthDate } = await req.json();
    // Passo 1: Encontrar o estudo (está funcionando)
    const findResponse = await fetch(`${ORTHANC_API_URL}/tools/find`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(`${ORTHANC_API_USER}:${ORTHANC_API_PASS}`)
      },
      body: JSON.stringify({
        Level: "Study",
        Query: {
          AccessionNumber: accessionNumber,
          PatientBirthDate: birthDate.replace(/-/g, "")
        }
      })
    });
    if (!findResponse.ok) {
      throw new Error(`Erro ao buscar no Orthanc: ${findResponse.statusText}`);
    }
    const studies = await findResponse.json();
    if (!Array.isArray(studies) || studies.length === 0) {
      return new Response(JSON.stringify({
        error: "Exame não encontrado"
      }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    const studyId = studies[0];
    // Passo 2: Pedir o token (onde o erro ocorre)
    const tokenResponse = await fetch(`${AUTH_SERVICE_URL}/auth/shares`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Authorization": "Basic " + btoa(`${AUTH_SERVICE_USER}:${AUTH_SERVICE_PASS}`),
        // ✅ ADIÇÃO: Cabeçalho para tentar contornar a interferência do túnel
        "Bypass-Tunnel-Reminder": "true"
      },
      body: JSON.stringify({
        "Resources": [
          `/studies/${studyId}`
        ],
        "Validity": 3600
      })
    });
    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      throw new Error(`Falha ao gerar token: ${tokenResponse.statusText} - ${errorBody}`);
    }
    const { Token: token } = await tokenResponse.json();
    const studyDetailsResponse = await fetch(`${ORTHANC_API_URL}/studies/${studyId}`, {
      headers: {
        "Authorization": "Basic " + btoa(`${ORTHANC_API_USER}:${ORTHANC_API_PASS}`)
      }
    });
    const studyData = await studyDetailsResponse.json();
    const viewerUrl = `${PUBLIC_VIEWER_URL_BASE}?token=${token}`;
    return new Response(JSON.stringify({
      studyData,
      viewerUrl
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});
