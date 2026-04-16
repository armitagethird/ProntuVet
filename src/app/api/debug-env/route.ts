import { NextResponse } from 'next/server'

export async function GET() {
  const asaasKey = process.env.ASAAS_API_KEY
  const asaasUrl = process.env.ASAAS_BASE_URL
  
  return NextResponse.json({
    keys_found: {
      ASAAS_API_KEY: asaasKey ? `Found (Length: ${asaasKey.length}, Starts with: ${asaasKey.substring(0, 10)}...)` : 'Not Found',
      ASAAS_BASE_URL: asaasUrl || 'Not Found',
      NODE_ENV: process.env.NODE_ENV,
    },
    tip: "Se 'Not Found' aparecer, certifique-se de que o arquivo .env.local está na raiz do projeto e que o servidor foi reiniciado."
  })
}
