import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from './config';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
export const brl = (cents: number | null | undefined) =>
  ((cents ?? 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '');
export const fmtDur = (sec?: number | null) => {
  if (sec == null) return '—';
  const s = Math.round(Number(sec)); return `${Math.floor(s / 60)}min ${String(s % 60).padStart(2, '0')}s`;
};
export function errMsg(e: any): string {
  const m = String(e?.message || e || '');
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
  if (/Email not confirmed/i.test(m)) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
  if (/User already registered/i.test(m)) return 'Este e-mail já tem cadastro. Use "Entrar".';
  if (/Password should be at least/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/email rate limit|over_email_send_rate_limit/i.test(m)) return 'O envio de e-mails de confirmação atingiu o limite agora. Tente de novo mais tarde ou entre com Google/Apple.';
  if (/provider is not enabled|Unsupported provider/i.test(m)) return 'Este método de login ainda não está ativado.';
  if (/rate limit/i.test(m)) return 'Muitas tentativas em pouco tempo. Espere alguns minutos e tente de novo.';
  if (/pix key missing/i.test(m)) return 'Cadastre sua chave Pix no Perfil antes de pedir saque.';
  if (/exceeds available/i.test(m)) return 'O valor é maior que o saldo disponível.';
  if (/row-level security/i.test(m)) return 'Ação não permitida. Verifique se seu cadastro foi aprovado, se você aceitou o termo e se ainda há vagas nesta tarefa.';
  return m || 'Algo deu errado. Tente de novo.';
}
