import fs from 'node:fs'
import path from 'node:path'

function requireEnv(name) {
  const v = process.env[name]
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return v
}

const config = {
  SUPABASE_PROJECT_URL: requireEnv('SUPABASE_PROJECT_URL'),
  SUPABASE_ANON_KEY: requireEnv('SUPABASE_ANON_KEY'),
  APP_PUBLIC_URL: process.env.APP_PUBLIC_URL || '',
}

const distDir = path.resolve(process.cwd(), 'dist')
const outPath = path.join(distDir, 'config.js')

if (!fs.existsSync(distDir)) {
  throw new Error(`dist/ folder not found at ${distDir}. Did the build run?`)
}

fs.writeFileSync(
  outPath,
  `window.__ZEETER_CONFIG__ = ${JSON.stringify(config, null, 2)};\n`,
  'utf8',
)

console.log(`Wrote runtime config to ${outPath}`)
