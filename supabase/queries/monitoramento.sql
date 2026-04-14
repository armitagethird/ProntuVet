-- ==========================================================
-- PRONTUVET MONITORING QUERIES (SÃO PAULO PROJECT)
-- Use estas queries no SQL Editor do Supabase para auditoria.
-- ==========================================================

-- 1. Usuários com uso suspeito (mais de 15 consultas na última hora)
-- Identifica bots ou compartilhamento indevido de conta.
select 
  u.user_id,
  p.first_name || ' ' || p.last_name as veterinario,
  count(*) as consultas_ultima_hora,
  sum(u.custo_estimado_usd) as custo_hora_usd,
  max(u.ip_origem) as ultimo_ip
from uso_consultas u
join profiles p on p.id = u.user_id
where u.data_consulta > now() - interval '1 hour'
and u.sucesso = true
group by u.user_id, p.first_name, p.last_name
having count(*) > 15
order by consultas_ultima_hora desc;

-- 2. Custo total de IA por usuário no mês atual (USD -> BRL)
-- Ajuda a entender a lucratividade por cliente.
select 
  p.first_name || ' ' || p.last_name as veterinario,
  count(*) as total_consultas,
  sum(u.custo_estimado_usd) as custo_total_usd,
  sum(u.custo_estimado_usd) * 5.75 as custo_total_brl, -- Estimativa dólar a 5.75
  round(avg(u.duracao_audio_segundos), 2) as media_duracao_segundos
from uso_consultas u
join profiles p on p.id = u.user_id
where date_trunc('month', u.data_consulta) = date_trunc('month', now())
and u.sucesso = true
group by p.first_name, p.last_name
order by custo_total_usd desc;

-- 3. Tentativas de abuso ou falhas técnicas (muitos erros seguidos)
-- Monitoramento de estabilidade e tentativas de bypass.
select 
  p.first_name || ' ' || p.last_name as veterinario,
  u.ip_origem,
  count(*) as total_erros,
  max(u.erro) as ultimo_erro_msg,
  max(u.data_consulta) as data_ultimo_erro
from uso_consultas u
join profiles p on p.id = u.user_id
where u.sucesso = false
and u.data_consulta > now() - interval '24 hours'
group by p.first_name, p.last_name, u.ip_origem
having count(*) > 5
order by total_erros desc;

-- 4. Resumo Geral do Dia (Clinical Dashboard)
-- Visão macro da operação.
select
  count(*) as total_consultas_hoje,
  count(distinct user_id) as usuarios_ativos_hoje,
  sum(custo_estimado_usd) as custo_ia_hoje_usd,
  (sum(custo_estimado_usd) * 5.75) as custo_ia_hoje_brl,
  avg(duracao_audio_segundos) as media_duracao_atendimentos
from uso_consultas
where data_consulta > current_date
and sucesso = true;
