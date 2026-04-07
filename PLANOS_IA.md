# 📋 Planos & IA - ProntuVet

Este documento centraliza as regras de negócio, limites técnicos e a arquitetura da IA implementada. **Mantenha este arquivo atualizado ao alterar constantes ou modelos no código.**

---

## 💎 Planos e Limites Atuais (Plano Platinum)

| Recurso | Limite | Descrição |
| :--- | :--- | :--- |
| **Preço Mensal** | R$ 97,00 | Valor base para veterinários autônomos. |
| **Cota Mensal** | 200 consultas | Limite total de processamentos IA (Reset todo dia 1). |
| **Cota Diária** | 20 consultas | Trava de segurança para proteção de infraestrutura. |
| **Duração Áudio** | 10 minutos | Tempo máximo por consulta (600 segundos). |
| **Precisão Clínica** | Alta | Uso do modelo **Gemini 2.5 Flash-Lite** (Nativo Multimodal). |

---

## 🤖 Arquitetura da IA (Economia e Precisão)

Saímos de uma arquitetura de 3 passos para uma extração atômica, visando **lucro máximo** e **zero alucinação**.

### 1. Extração Nativa Multimodal
- **Modelo**: `gemini-2.5-flash-lite` (Google DeepMind).
- **Processo**: O áudio bruto é enviado junto com o modelo de prontuário em uma **única chamada**.
- **Impacto em Tokens**: Economia de ~66% em tokens de texto (evita o re-envio da transcrição para validação e estruturação separadas).
- **Transcrição**: O texto completo é gerado na mesma chamada, sem custo extra de API de Speech-to-Text dedicada.

### 2. Blindagem contra Silêncio e Fraude (Zero-Waste)
- **Gatekeeper**: A IA "ouve" o silêncio nos dados binários. Se não houver voz humana clínica, ela retorna um erro JSON nativo.
- **Score Clínico**: Filtro final de 30 caracteres significativos para garantir que dados inúteis não consumam as 20 consultas diárias do usuário.
- **Anti-Fraude (CPF)**: O CPF é obrigatório e único por conta. Isso impede múltiplos trials gratuitos por CPF, garantindo a sustentabilidade do modelo de negócios.

---

## 🛠️ Onde Alterar (Manutenção)

### Limites de Consultas (Backend)
- **Arquivo**: `src/app/api/process-consultation/route.ts`
- **Lógica**: Buscas no Supabase com `gte` baseadas em `today` e `firstDayOfMonth`.

### Motor da IA (Prompt & Modelo)
- **Arquivo**: `src/lib/gemini.ts`
- **Lógica**: Função `generateProntuario` com `system_instruction` rígida e `temperature: 0.0`.

### Cronômetro e Reset (Frontend)
- **Arquivo**: `src/components/audio-recorder.tsx`
- **Lógica**: `resetRecorder()` limpa o estado, zera o tempo e remove alertas de erro para nova tentativa.

---
*Última atualização: 2026-04-06 | Versão IA: 4.0 (Atomic Multimodal)*
