# Integração OpenAI

## Modelos utilizados

| Modelo | Uso | Custo |
|--------|-----|-------|
| `whisper-1` | Transcrição de áudio → texto | Por minuto de áudio |
| `gpt-4o-mini` | Estruturação do prontuário | Por token (barato) |

## Pipeline no arquivo `process-consultation/route.ts`

### Passo 1 — Transcrição (Whisper)

```typescript
const transcription = await openai.audio.transcriptions.create({
  file: audioFile,
  model: "whisper-1",
  language: "pt",   // forçado português
});
```

### Passo 2 — Estruturação (GPT-4o-mini)

```typescript
const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Transcrição: ${transcription.text}\n\nTemplate: ${templateContent}` }
  ],
  response_format: { type: "json_object" }
});
```

### Output JSON esperado da IA

```json
{
  "animalName": "string",
  "animalSpecies": "string",
  "tutorName": "string",
  "tutorSummary": "string — resumo em linguagem acessível para o tutor",
  "vetSummary": "string — resumo técnico para o veterinário",
  "tags": ["tag1", "tag2"],
  "structuredRecord": "string — prontuário seguindo o template"
}
```

## Configurações importantes

- **Timeout da rota**: 300 segundos (5 minutos) — necessário para áudios longos
- **Formato de áudio aceito**: WebM
- **Variável de ambiente**: `OPENAI_API_KEY`

## Decisão de usar GPT-4o-mini

Escolhido por custo-benefício. GPT-4 seria mais preciso mas o gasto seria muito maior para uso contínuo em clínicas. Pode ser revisto quando houver monetização.
