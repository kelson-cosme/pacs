import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const ORTHANC_URL = Deno.env.get("ORTHANC_URL") || "https://orthanc.kemax.com.br";
const ORTHANC_USER = Deno.env.get("ORTHANC_USER") || "admin";
const ORTHANC_PASSWORD = Deno.env.get("ORTHANC_PASSWORD") || "admin123";

function getAuthHeader() {
  const token = btoa(`${ORTHANC_USER}:${ORTHANC_PASSWORD}`);
  return { Authorization: `Basic ${token}` };
}

serve(async (req) => {
  try {
    const { accessionNumber, birthDate } = await req.json();

    if (!accessionNumber || !birthDate) {
      return new Response(
        JSON.stringify({ error: "Número de acesso e data de nascimento são obrigatórios." }),
        { status: 400 }
      );
    }

    const studiesResp = await fetch(`${ORTHANC_URL}/studies`, {
      headers: getAuthHeader(),
    });

    const studiesIDs: string[] = await studiesResp.json();
    let foundStudy = null;

    for (const id of studiesIDs) {
      const studyResp = await fetch(`${ORTHANC_URL}/studies/${id}`, {
        headers: getAuthHeader(),
      });

      if (!studyResp.ok) continue;
      const studyData = await studyResp.json();
      const tags = studyData.MainDicomTags;
      const formattedBirthDate = birthDate.replaceAll("-", "");

      if (
        tags.AccessionNumber === accessionNumber &&
        tags.PatientBirthDate === formattedBirthDate
      ) {
        foundStudy = studyData;
        break;
      }
    }

    if (!foundStudy) {
      return new Response(
        JSON.stringify({ error: "Nenhum exame encontrado com esses dados." }),
        { status: 404 }
      );
    }

    const tokenResp = await fetch(`${ORTHANC_URL}/authorization/token`, {
      method: "POST",
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "Resources": [foundStudy.ID],
        "ValiditySeconds": 60 * 30,
        "Access": "ReadOnly",
      }),
    });

    const tokenData = await tokenResp.json();

    const responseBody = {
      ...foundStudy,
      TemporaryToken: tokenData.Token || tokenData.Id || null,
    };

    return new Response(JSON.stringify(responseBody), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Erro na function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
