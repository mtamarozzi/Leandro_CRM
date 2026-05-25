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

// 4.7: a data NÃO é mais congelada em build-time. Gravamos um sentinel no prompt
// que o Code Node substitui pela data real (America/Sao_Paulo) a cada execução.
const { loadPrompt } = require('./prompt.cjs');
const NOW_SENTINEL = '__DORINDA_NOW__';
const prompt = loadPrompt(NOW_SENTINEL);

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
// 4.7: data resolvida em RUNTIME (America/Sao_Paulo) a cada execução do Code Node,
// substituindo o sentinel __DORINDA_NOW__ baked no prompt em build-time.
const __nowPtBr = () => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'full', timeStyle: 'short' }).format(new Date());
const SYSTEM_PROMPT = ${JSON.stringify(prompt)}.replace(/__DORINDA_NOW__/g, () => __nowPtBr());
// Secrets hardcoded a partir do .env.local em build-time. Este servidor n8n bloqueia o acesso
// a variáveis de ambiente no Code Node (N8N_BLOCK_ENV_ACCESS_IN_NODE), e o acesso lança exceção
// no proxy antes de qualquer try/catch — por isso aqui só usamos consts hardcoded. Pra trocar a
// key (ex.: Gemini do Leandro pré-deploy): edita .env.local, rebuilda e re-injeta.
const cfg = {
  geminiKey: ${JSON.stringify(env.GEMINI_API_KEY)},
  supabaseUrl: ${JSON.stringify(env.VITE_SUPABASE_URL)},
  anon: ${JSON.stringify(env.VITE_SUPABASE_ANON_KEY)},
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
