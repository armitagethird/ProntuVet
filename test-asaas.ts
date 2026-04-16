import { config } from 'dotenv';
import path from 'path';

// Load .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

const ASAAS_URL = process.env.ASAAS_BASE_URL;
const ASAAS_KEY = process.env.ASAAS_API_KEY;

console.log('ASAAS_URL:', ASAAS_URL);
console.log('ASAAS_KEY (primeiros 10 chars):', ASAAS_KEY?.substring(0, 10));

async function testAsaas() {
  if (!ASAAS_URL || !ASAAS_KEY) {
    console.error('Variáveis de ambiente do Asaas faltando!');
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'access_token': ASAAS_KEY
  };

  const body = {
    billingTypes: ['CREDIT_CARD', 'PIX'],
    chargeTypes: ['RECURRENT'],
    minutesToExpire: 1440,
    callback: {
      successUrl: `https://example.com/sucesso`,
      cancelUrl: `https://example.com/cancelado`,
      expiredUrl: `https://example.com/expirado`
    },
    items: [{
      name: 'ProntuVet Platinum (Teste)',
      description: 'Teste de integração',
      quantity: 1,
      value: 59.90
    }],
    customerData: {
      name: 'Veterinário de Teste',
      email: 'teste@prontuvet.com.br',
      cpfCnpj: '24843393005',
      phone: '11999999999',
      postalCode: '01310-100',
      address: 'Avenida Paulista',
      addressNumber: '1000',
      province: 'Bela Vista'
    },
    subscription: {
      cycle: 'MONTHLY',
      nextDueDate: new Date().toISOString().split('T')[0]
    }
  };

  try {
    const urls = [
      `${ASAAS_URL}/checkouts`,
      `https://api-sandbox.asaas.com/v3/checkouts`
    ];

    for (const url of urls) {
      console.log('Testando URL:', url);
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      const data = await res.json();
      console.log('Status:', res.status);
      console.log('Resposta:', JSON.stringify(data, null, 2));
      if (res.ok) break;
    }
  } catch (error) {
    console.error('Erro no fetch:', error);
  }
}

testAsaas();
