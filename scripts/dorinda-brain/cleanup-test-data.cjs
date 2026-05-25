// scripts/dorinda-brain/cleanup-test-data.cjs
// Limpa dados de teste (conversas de smoke/integração/cenários + mensagens + notifications ligadas).
// Service-role. Uso: node ... --dry (conta) | node ... --apply (deleta).
const fs = require('node:fs');
const path = require('node:path');

const env = {};
for (const l of fs.readFileSync(path.resolve(__dirname, '../../.env.local'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const URL = env.VITE_SUPABASE_URL, SR = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: SR, Authorization: 'Bearer ' + SR, 'Content-Type': 'application/json' };
const EXTRA_CONV = ['866a938e-d0ca-4486-82b1-77bf2efd027d'];

async function get(q) { const r = await fetch(`${URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(`${r.status} ${await r.text()}`); return r.json(); }
async function del(q) { const r = await fetch(`${URL}/rest/v1/${q}`, { method: 'DELETE', headers: { ...H, Prefer: 'return=representation' } }); if (!r.ok) throw new Error(`${r.status} ${await r.text()}`); return r.json(); }

(async () => {
  const apply = process.argv[2] === '--apply';
  // 1) conversas de teste (por prefixo de visitor_id) + extras
  const testConvs = await get(`chat_conversations?select=id,visitor_id&or=(visitor_id.like.v46-*,visitor_id.like.smoke-*,visitor_id.like.int-*)`);
  const ids = [...new Set([...testConvs.map((c) => c.id), ...EXTRA_CONV])];
  console.log('conversas de teste:', ids.length);
  if (!ids.length) { console.log('nada a limpar.'); return; }
  const inList = `(${ids.join(',')})`;

  // 2) notifications ligadas a essas conversas (via metadata.conversation_id)
  const notifs = await get(`notifications?select=id,metadata&metadata->>conversation_id=in.${inList}`);
  console.log('notifications ligadas:', notifs.length);

  // 3) mensagens dessas conversas
  const msgs = await get(`chat_messages?select=id&conversation_id=in.${inList}`);
  console.log('chat_messages:', msgs.length);

  if (!apply) { console.log('\n[DRY] nada deletado. Rode com --apply.'); return; }

  if (notifs.length) { const d = await del(`notifications?metadata->>conversation_id=in.${inList}`); console.log('notifications deletadas:', d.length); }
  const dm = await del(`chat_messages?conversation_id=in.${inList}`); console.log('chat_messages deletadas:', dm.length);
  const dc = await del(`chat_conversations?id=in.${inList}`); console.log('chat_conversations deletadas:', dc.length);
  console.log('\n[OK] limpeza concluída.');
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
