// supabase/functions/get-study-by-accession/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const ORTHANC_URL = Deno.env.get("ORTHANC_URL") || "https://orthanc.kemax.com.br";
const ORTHANC_USER = Deno.env.get("ORTHANC_USER") || "admin";
const ORTHANC_PASSWORD = Deno.env.get("ORTHANC_PASSWORD") || "admin123";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function getAuthHeader() {
  const token = btoa(`${ORTHANC_USER}:${ORTHANC_PASSWORD}`);
  return { Authorization: `Basic ${token}` };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const contentLength = req.headers.get('content-length');
    if (!contentLength || contentLength === '0') {
      return new Response(JSON.stringify({ error: 'O corpo do pedido está vazio.' }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const body = await req.json();
    const { accessionNumber, birthDate } = body;

    if (!accessionNumber || !birthDate) {
      return new Response(JSON.stringify({ error: "Número de acesso e data de nascimento são obrigatórios." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    const formattedBirthDate = birthDate.replaceAll("-", "");
    const findPayload = {
      Level: "Study",
      Query: { AccessionNumber: accessionNumber, PatientBirthDate: formattedBirthDate },
    };

    const findResp = await fetch(`${ORTHANC_URL}/tools/find`, {
      method: "POST",
      headers: { ...getAuthHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(findPayload),
    });
    if (!findResp.ok) throw new Error(`Erro ao procurar no Orthanc: ${findResp.statusText}`);

    const studyIDs: string[] = await findResp.json();
    if (studyIDs.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum exame encontrado com esses dados." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    const studyId = studyIDs[0];
    const studyResp = await fetch(`${ORTHANC_URL}/studies/${studyId}`, { headers: getAuthHeader() });
    if (!studyResp.ok) throw new Error(`Erro ao obter detalhes do estudo ${studyId}`);
    const foundStudy = await studyResp.json();

    const tokenResp = await fetch(`${ORTHANC_URL}/authorization/token`, {
      method: "POST",
      headers: { ...getAuthHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ "Resources": [foundStudy.ID], "ValiditySeconds": 1800, "Access": "ReadOnly" }),
    });

    const tokenData = await tokenResp.json();
    
    // ✅ NOVO: Log para depuração e verificação robusta do token
    console.log("Resposta da geração de token do Orthanc:", tokenData);
    const temporaryToken = tokenData.Token || tokenData.Id;

    if (!temporaryToken) {
      throw new Error("Falha ao gerar o token de acesso no Orthanc. A resposta não continha um token.");
    }

    const responseBody = { ...foundStudy, TemporaryToken: temporaryToken };
    
    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error("Erro na function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});