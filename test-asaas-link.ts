import { config } from 'dotenv';
import path from 'path';

// Load .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

const ASAAS_URL = process.env.ASAAS_BASE_URL;
const ASAAS_KEY = process.env.ASAAS_API_KEY;

console.log('ASAAS_URL:', ASAAS_URL);

async function testAsaasLink() {
  if (!ASAAS_URL || !ASAAS_KEY) {
    console.error('Variáveis de ambiente do Asaas faltando!');
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'access_token': ASAAS_KEY
  };

    const body = {
      name: 'ProntuVet Platinum',
      description: 'Copiloto clínico com IA — 200 consultas/mês',
      billingType: 'UNDEFINED',
      chargeType: 'RECURRENT',
      value: 59.90,
      subscriptionCycle: 'MONTHLY',
      dueDateLimit: 1
    };

  try {
    console.log('Testando POST /v3/paymentLinks');
    const res = await fetch(`${ASAAS_URL}/paymentLinks`, { 
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Resposta:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erro no fetch:', error);
  }
}

testAsaasLink();
