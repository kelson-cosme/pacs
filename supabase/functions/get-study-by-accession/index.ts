import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { create, getNumericDate, Header, Payload } from "https://deno.land/x/djwt@v2.9/mod.ts"

const ORTHANC_URL = Deno.env.get("ORTHANC_API_URL")!
const ORTHANC_USER = Deno.env.get("ORTHANC_USER")!
const ORTHANC_PASS = Deno.env.get("ORTHANC_PASS")!
const ORTHANC_SECRET = Deno.env.get("ORTHANC_SHARED_SECRET")!
const ORTHANC_VIEWER_URL = Deno.env.get("ORTHANC_VIEWER_URL")!

serve(async (req) => {
  // 🔹 Trata requisições CORS prévias
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "https://portal-exames.vercel.app",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  }

  try {
    const { access_number, birth_date } = await req.json()

    // 🔍 Consulta o Orthanc
    const findResponse = await fetch(`${ORTHANC_URL}/tools/find`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(`${ORTHANC_USER}:${ORTHANC_PASS}`),
      },
      body: JSON.stringify({
        Level: "Study",
        Query: {
          AccessionNumber: access_number,
          PatientBirthDate: birth_date.replace(/-/g, ""),
        },
      }),
    })

    const studies = await findResponse.json()
    if (!Array.isArray(studies) || studies.length === 0) {
      return new Response(JSON.stringify({ error: "Exame não encontrado" }), {
        status: 404,
        headers: { "Access-Control-Allow-Origin": "https://portal-exames.vercel.app" },
      })
    }

    const studyId = studies[0]
    const studyResp = await fetch(`${ORTHANC_URL}/studies/${studyId}`, {
      headers: { "Authorization": "Basic " + btoa(`${ORTHANC_USER}:${ORTHANC_PASS}`) },
    })
    const studyData = await studyResp.json()
    const studyUID = studyData.MainDicomTags.StudyInstanceUID

    // 🔐 Cria token JWT (djwt, compatível com Deno)
    const header: Header = { alg: "HS256", typ: "JWT" }
    const payload: Payload = {
      study: studyUID,
      exp: getNumericDate(60 * 5), // expira em 5 minutos
    }
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(ORTHANC_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    )

    const token = await create(header, payload, key)
    const viewerUrl = `${ORTHANC_VIEWER_URL}/?token=${token}`

    return new Response(JSON.stringify({ viewerUrl }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://portal-exames.vercel.app",
      },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "https://portal-exames.vercel.app" },
    })
  }
})
