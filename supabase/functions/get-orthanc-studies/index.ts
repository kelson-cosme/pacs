// supabase/functions/get-orthanc-studies/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0'

serve(async (req) => {
  // 1. Verifica se o usuário está autenticado
  const authHeader = req.headers.get('Authorization')!
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })
  }

  // 2. Busca o ID do Orthanc para este usuário
  const { data: mapping, error: mapError } = await supabase
    .from('patients_mapping')
    .select('orthanc_patient_id')
    .eq('user_id', user.id)
    .single()

  if (mapError || !mapping) {
    return new Response(JSON.stringify({ error: 'Mapeamento de paciente não encontrado' }), { status: 404 })
  }
  
  const orthancPatientId = mapping.orthanc_patient_id

  // 3. Faz a chamada para a API do Orthanc
  // ATENÇÃO: Essas variáveis devem estar nas suas "Secrets" do Supabase
  const ORTHANC_URL = Deno.env.get('ORTHANC_API_URL')! // ex: http://SEU_IP_PUBLICO:8042
  const ORTHANC_USER = Deno.env.get('ORTHANC_USER')!
  const ORTHANC_PASS = Deno.env.get('ORTHANC_PASS')!
  const orthancAuth = 'Basic ' + btoa(`${ORTHANC_USER}:${ORTHANC_PASS}`);

  const orthancResponse = await fetch(`${ORTHANC_URL}/patients/${orthancPatientId}/studies`);
  
  if (!orthancResponse.ok) {
     return new Response(JSON.stringify({ error: 'Falha ao buscar exames no Orthanc' }), { status: 500 })
  }

  const studies = await orthancResponse.json();

  // 4. Retorna os dados para o frontend
  return new Response(JSON.stringify(studies), {
    headers: { 'Content-Type': 'application/json' },
  })
})