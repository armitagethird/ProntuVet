import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";

// Helper para garantir a chave API e inicializar o cliente sob demanda
function getGenAI() {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        throw new Error(
            '[Config] GEMINI_API_KEY não está configurada. ' +
            'Defina-a no .env.local (desenvolvimento) e nas variáveis de ambiente do Vercel (produção).'
        );
    }

    if (API_KEY.startsWith('sk-')) {
        throw new Error(
            '[Config] A GEMINI_API_KEY configurada parece ser uma chave da OpenAI (prefixo sk-). ' +
            'Por favor, use uma chave válida do Google Gemini (prefixo AIza) obtida no Google AI Studio.'
        );
    }

    return new GoogleGenerativeAI(API_KEY);
}

// Modelo configurável via env para facilitar trocas sem alterar código
const MODEL_NAME = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";


/**
 * Extrai dados estruturados diretamente do áudio (Nativo Multimodal).
 * @param audioBase64 O conteúdo do áudio em base64.
 * @param mimeType O tipo mime do áudio.
 * @param template A estrutura de chaves desejada.
 * @returns O JSON estruturado do prontuário ou um objeto com erro.
 */
export async function generateProntuario(audioBase64: string, mimeType: string, template: string): Promise<string> {
    try {
        console.log(`[Gemini] Processando Áudio Multimodal com ${MODEL_NAME} (${mimeType})...`);
        
        // Configuração rídiga de sistema para evitar alucinações
        const systemInstruction = `Você é um assistente veterinário de elite.
Sua tarefa é OUVIR o áudio e extrair informações para um prontuário médico.

REGRA DE OURO (SILÊNCIO/RUÍDO):
- Se o áudio estiver em silêncio, contiver apenas ruídos de fundo, ou não houver nenhuma fala humana que descreva uma consulta ou ditado médico, você DEVE retornar obrigatoriamente este JSON:
{ "error": "Conteúdo clínico não identificado. O áudio parece estar em silêncio ou contém apenas ruído." }

REGRAS DE ESTRUTURAÇÃO:
1. Mantenha tom estritamente técnico e veterinário.
2. Extraia: animal_name, animal_species, tutor_name, tutor_summary (amigável), vet_summary (técnico), tags.
3. Resumo da Trilha: Gere obrigatoriamente "resumo_trilha" como um texto de no máximo 2 linhas (150 caracteres) resumindo a queixa principal e o diagnóstico/conduta para uma linha do tempo vertical.
4. Transcreva o áudio e coloque o texto completo no campo "transcription".
5. Use o MODELO DE PRONTUÁRIO abaixo para a chave "prontuario":
${template}

Formate a saída como um único objeto JSON:
{
  "animal_name": "...",
  "animal_species": "...",
  "tutor_name": "...",
  "tutor_summary": "...",
  "vet_summary": "...",
  "resumo_trilha": "...",
  "transcription": "...",
  "tags": ["...", "..."],
  "prontuario": { ... baseados no modelo ... }
}
Retorne APENAS o JSON, sem explicações.`;

        const model = getGenAI().getGenerativeModel({ 
            model: MODEL_NAME,
            systemInstruction: systemInstruction 
        });



        const generationConfig: GenerationConfig = {
            temperature: 0.0,
            responseMimeType: "application/json",
        };

        const result = await model.generateContent({
            contents: [{ 
                role: "user", 
                parts: [
                    { inlineData: { data: audioBase64, mimeType: mimeType } },
                    { text: "Analise o áudio e gere o prontuário estruturado conforme as instruções de sistema." }
                ] 
            }],
            generationConfig,
        });

        const response = await result.response;
        return response.text();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido'
        console.error("[Gemini] Erro no processamento multimodal:", error);
        throw new Error(`Falha ao processar áudio: ${message}`);
    }
}

/**
 * Analisa uma query de busca em linguagem natural e a traduz para filtros estruturados.
 * @param query A busca do usuário (ex: "Rex em março", "cirurgias do ano passado")
 * @returns Um objeto JSON com filtros para o Supabase.
 */
export async function analyzeHistoryQuery(query: string): Promise<string> {
    const now = new Date().toISOString();
    try {
        const systemInstruction = `Você é um tradutor de buscas clínicas. 
Sua tarefa é converter uma frase do usuário em um objeto JSON de filtros de pesquisa.
DATA ATUAL: ${now}

REGRAS:
1. Extraia: animal (nome), tutor (nome), startDate (ISO), endDate (ISO), e keywords (outros termos).
2. Se o usuário disser "mês passado", calcule as datas baseadas na DATA ATUAL.
3. Se não houver data, retorne null para startDate/endDate.
4. Keywords deve conter termos clínicos (ex: "vômito", "coceira", "vacina").

Retorne APENAS o JSON:
{
  "animal": "...",
  "tutor": "...",
  "startDate": "...",
  "endDate": "...",
  "keywords": "..."
}
`;

        const model = getGenAI().getGenerativeModel({ 
            model: MODEL_NAME,
            systemInstruction: systemInstruction 
        });


        const result = await model.generateContent(query);
        const response = await result.response;
        return response.text();
    } catch (error: unknown) {
        console.error("[Gemini] Erro na análise de busca:", error);
        return JSON.stringify({ animal: query, tutor: null, startDate: null, endDate: null, keywords: query });
    }
}
