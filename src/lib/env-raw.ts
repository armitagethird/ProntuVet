/**
 * env-raw.ts
 *
 * Lê o arquivo .env.local diretamente via `fs` sem passar pelo
 * dotenv-expand do Next.js, que quebra chaves que começam com `$`.
 *
 * Use somente em código server-side (API Routes, Server Actions, lib).
 */

import fs from 'fs'
import path from 'path'

let cache: Record<string, string> | null = null

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {}

  const content = fs.readFileSync(filePath, 'utf-8')
  const result: Record<string, string> = {}

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const eqIdx = line.indexOf('=')
    if (eqIdx === -1) continue

    const key = line.slice(0, eqIdx).trim()
    let value = line.slice(eqIdx + 1).trim()

    // Remove aspas envolventes simples ou duplas, se existirem
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    result[key] = value
  }

  return result
}

function getRawEnv(): Record<string, string> {
  if (cache) return cache

  const envPath = path.resolve(process.cwd(), '.env.local')
  cache = parseEnvFile(envPath)
  return cache
}

/**
 * Retorna o valor de uma variável de ambiente lida diretamente do
 * `.env.local` sem expansão de variáveis.
 *
 * Faz fallback para `process.env` se a chave não estiver no arquivo.
 */
export function getRawEnvVar(key: string): string | undefined {
  // Primeiro tenta o arquivo raw (evita expansão do dotenv)
  const raw = getRawEnv()
  if (key in raw) return raw[key]

  // Fallback para process.env (variáveis de sistema / CI / produção)
  return process.env[key]
}
