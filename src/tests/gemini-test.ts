import * as fs from 'fs';
import * as dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente antes de qualquer coisa para evitar erros na inicialização do lib
dotenv.config({ path: '.env.local' });

import { generateProntuario } from '../lib/gemini';


const DEFAULT_TEMPLATE = `
- Motivo da Consulta (Queixa principal)
- Anamnese / Histórico
- Exame Físico (Sinais vitais, Achados)
- Suspeita Diagnóstica
- Exames Solicitados
- Tratamento / Prescrição
- Orientações ao Tutor`;

async function runTest() {
    const audioPath = process.argv[2];

    if (!audioPath) {
        console.warn("Aviso: Nenhum arquivo de áudio fornecido. Use: npx tsx src/tests/gemini-test.ts <caminho_do_audio>");
        return;
    }

    if (!fs.existsSync(audioPath)) {
        console.error(`Erro: Arquivo não encontrado em ${audioPath}`);
        return;
    }

    try {
        const buffer = fs.readFileSync(audioPath);
        const base64 = buffer.toString('base64');
        const ext = path.extname(audioPath).toLowerCase();
        let mimeType = 'audio/webm';
        if (ext === '.mp3') mimeType = 'audio/mp3';
        if (ext === '.wav') mimeType = 'audio/wav';
        if (ext === '.ogg') mimeType = 'audio/ogg';

        console.log(`\n[TESTE] Arquivo: ${audioPath} (${mimeType})`);
        console.log("[TESTE] Processando com Gemini (multimodal nativo — 1 call)...");

        const startTime = Date.now();
        const resultJson = await generateProntuario(base64, mimeType, DEFAULT_TEMPLATE);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log("\n--- RESULTADO (JSON) ---");
        console.log(JSON.stringify(JSON.parse(resultJson), null, 2));
        console.log(`\nTempo total: ${elapsed}s`);

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("\n[ERRO NO TESTE]:", message);
        if (error instanceof Error && error.stack) console.error(error.stack);
    }
}

runTest();
