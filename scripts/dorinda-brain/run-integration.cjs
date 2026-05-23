// scripts/dorinda-brain/run-integration.cjs
// Uso: node scripts/dorinda-brain/run-integration.cjs <conversation_id>
// Lê GEMINI_API_KEY e VITE_SUPABASE_* do .env.local. Roda o loop real contra Gemini+Supabase.
const fs = require('node:fs');
const path = require('node:path');
const { runConversation } = require('./orchestrate.cjs');
const { loadPrompt, nowPtBr } = require('./prompt.cjs');

function readEnvLocal() {
  const file = path.resolve(__dirname, '../../.env.local');
  const env = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

async function httpFn(opts) {
  const res = await fetch(opts.url, {
    method: opts.method,
    headers: opts.headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const txt = await res.text();
  if (!res.ok) { const e = new Error(txt); e.statusCode = res.status; throw e; }
  return txt ? JSON.parse(txt) : null;
}

(async () => {
  const conversationId = process.argv[2];
  if (!conversationId) { console.error('uso: node run-integration.cjs <conversation_id>'); process.exit(1); }
  const env = readEnvLocal();
  const cfg = {
    geminiKey: env.GEMINI_API_KEY,
    supabaseUrl: env.VITE_SUPABASE_URL,
    anon: env.VITE_SUPABASE_ANON_KEY,
    model: 'models/gemini-2.5-flash',
    maxIter: 6,
    systemPrompt: loadPrompt(nowPtBr()),
    conversationId,
    httpFn,
  };
  const out = await runConversation(cfg);
  console.log('\n=== OUTPUT DA DORINDA ===\n' + out.output);
  if (out._fallback) console.log('\n[FALLBACK acionado: ' + out._fallback + ']');
})();
