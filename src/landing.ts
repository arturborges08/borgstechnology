import { SUPABASE_URL, SUPABASE_KEY } from './config';

const body = document.body;
const bEn = document.getElementById('b-en')!;
const bPt = document.getElementById('b-pt')!;
const msg = document.getElementById('pl-msg')!;
const isPt = () => body.getAttribute('data-lang') === 'pt';

function setLang(l: 'en' | 'pt') {
  body.setAttribute('data-lang', l);
  document.documentElement.lang = l === 'pt' ? 'pt-BR' : 'en';
  bEn.setAttribute('aria-pressed', String(l === 'en'));
  bPt.setAttribute('aria-pressed', String(l === 'pt'));
  msg.textContent = '';
  const hours = document.getElementById('pl-hours') as HTMLInputElement | null;
  if (hours) hours.placeholder = l === 'pt' ? 'ex.: 10' : 'e.g. 10';
  try { localStorage.setItem('bs-lang', l); } catch { /* storage unavailable */ }
}
bEn.addEventListener('click', () => setLang('en'));
bPt.addEventListener('click', () => setLang('pt'));
let saved: string | null = null;
try { saved = localStorage.getItem('bs-lang'); } catch { /* storage unavailable */ }
const first = (navigator.languages && navigator.languages[0]) || navigator.language || '';
if (saved === 'pt' || saved === 'en') setLang(saved);
else if (first.toLowerCase().startsWith('pt')) setLang('pt');

const form = document.getElementById('pilot') as HTMLFormElement;
const btn = document.getElementById('pl-submit') as HTMLButtonElement;
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const data: Record<string, string> = {};
  fd.forEach((v, k) => { const s = String(v).trim(); if (s) data[k] = s; });
  const bad: string[] = [];
  if (!data.company) bad.push('pl-company');
  if (!data.contact_name) bad.push('pl-name');
  if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) bad.push('pl-email');
  ['pl-company', 'pl-name', 'pl-email'].forEach((id) => document.getElementById(id)!.setAttribute('aria-invalid', String(bad.includes(id))));
  if (bad.length) {
    (document.getElementById(bad[0]) as HTMLInputElement).focus();
    msg.textContent = isPt() ? 'Preencha empresa, nome e um e-mail válido.' : 'Fill in company, name and a valid email.';
    return;
  }
  btn.disabled = true;
  msg.textContent = isPt() ? 'Enviando…' : 'Sending…';
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(String(res.status));
    form.reset();
    form.classList.remove('sent'); void form.offsetWidth; form.classList.add('sent');
    msg.textContent = isPt() ? 'Pedido recebido. Respondemos por e-mail.' : 'Request received. We will reply by email.';
  } catch {
    msg.textContent = isPt() ? 'Não foi possível enviar agora. Tente de novo ou escreva para contato@borgsstore.com.br.' : 'Could not send right now. Try again or email contato@borgsstore.com.br.';
  } finally {
    btn.disabled = false;
  }
});

