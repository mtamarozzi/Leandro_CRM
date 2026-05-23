// scripts/dorinda-brain/build-n8n-code.cjs
// Gera o jsCode self-contained pro Code Node do n8n (modo: Run Once for Each Item).
// Inlina helpers + tools + orchestrate (sem require/module.exports) + prompt + secrets do .env.local.
// httpFn é defensivo: usa this.helpers.httpRequest e cai pra fetch se indisponível (cobre a Fase 0).
const fs = require('node:fs');
const path = require('node:path');

const dir = __dirname;
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
const stripExports = (s) => s.replace(/^\s*module\.exports\b.*$/gm, '');
const stripRequires = (s) => s.replace(/^\s*const\s*\{[^}]*\}\s*=\s*require\([^)]*\);\s*$/gm, '');

const env = {};
for (const line of fs.readFileSync(path.resolve(dir, '../../.env.local'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const { loadPrompt, nowPtBr } = require('./prompt.cjs');
const prompt = loadPrompt(nowPtBr());

const helpers = stripExports(read('helpers.cjs'));
const tools = stripExports(read('tools.cjs'));
const orchestrate = stripExports(stripRequires(read('orchestrate.cjs')));

// httpFn defensivo: detecta this.helpers.httpRequest, senão fetch. Grava o método em _httpMethod.
const HTTP_FN = `
const __self = this;
const __hasHelpers = !!(__self && __self.helpers && typeof __self.helpers.httpRequest === 'function');
async function httpFn(opts) {
  if (__hasHelpers) {
    return await __self.helpers.httpRequest({
      method: opts.method, url: opts.url, headers: opts.headers, body: opts.body, json: true,
    });
  }
  const res = await fetch(opts.url, {
    method: opts.method, headers: opts.headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const txt = await res.text();
  if (!res.ok) { const e = new Error(txt); e.statusCode = res.status; throw e; }
  return txt ? JSON.parse(txt) : null;
}
`;

const jsCode = `
// ===== GERADO por build-n8n-code.cjs — NÃO editar à mão. Fonte: scripts/dorinda-brain/ =====
${helpers.trim()}

${tools.trim()}

${orchestrate.trim()}
${HTTP_FN}
const SYSTEM_PROMPT = ${JSON.stringify(prompt)};
const cfg = {
  geminiKey: ($env.GEMINI_API_KEY || ${JSON.stringify(env.GEMINI_API_KEY)}),
  supabaseUrl: ${JSON.stringify(env.VITE_SUPABASE_URL)},
  anon: ($env.SUPABASE_LEANDRO_ANON_KEY || ${JSON.stringify(env.VITE_SUPABASE_ANON_KEY)}),
  model: 'models/gemini-2.5-flash',
  maxIter: 6,
  systemPrompt: SYSTEM_PROMPT,
  conversationId: $('Extrair Dados').item.json.conversation_id,
  httpFn: httpFn,
};
const result = await runConversation(cfg);
result._httpMethod = __hasHelpers ? 'helpers' : 'fetch';
return { json: result };
`.trim();

const outFile = path.join(dir, 'dorinda-brain.n8n.js');
fs.writeFileSync(outFile, jsCode);
console.log('Gerado: ' + outFile + ' (' + jsCode.length + ' chars)');
