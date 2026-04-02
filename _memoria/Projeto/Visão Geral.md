# Visão Geral — ProntuVet

## O que é

**ProntuVet** é um copiloto clínico com IA para médicos veterinários. O sistema escuta a consulta em tempo real e gera automaticamente um prontuário médico estruturado — economizando tempo de documentação e permitindo que o veterinário foque no animal.

## Problema que resolve

Veterinários perdem tempo significativo digitando prontuários após cada consulta. O ProntuVet elimina essa fricção: o veterinário fala normalmente durante o atendimento e o sistema cuida de toda a documentação.

## Como funciona (resumo)

1. Veterinário inicia gravação de áudio durante a consulta
2. Áudio enviado para OpenAI Whisper → transcrição em português
3. Transcrição + template de prontuário → GPT-4o-mini → estrutura o conteúdo
4. Sistema salva prontuário completo no Supabase
5. Histórico organizado por animal e tutor fica disponível no dashboard

## Funcionalidades principais

- Gravação de áudio em tempo real (pausa/retomada)
- Geração automática de prontuário estruturado
- Templates de prontuário customizáveis por clínica
- Histórico completo de consultas por animal
- Resumo para tutor (linguagem simples) e para veterinário (técnico)
- Sistema de tags para categorizar consultas
- Dashboard com métricas e acesso rápido

## Público-alvo

Veterinários e clínicas veterinárias que querem modernizar e agilizar a documentação clínica.

## Origem

Projeto criado como SaaS para resolver uma dor real identificada no mercado veterinário. Desenvolvido como parte do portfólio Antigravity.
