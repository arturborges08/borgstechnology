import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase, errMsg } from '../supabase';
import { SUPABASE_URL, SUPABASE_KEY } from '../config';
import { useAuth } from '../session';

const appUrl = (path: string) => `${window.location.origin}/app${path}`;


type Provider = 'google';
let providersCache: Promise<Record<string, boolean>> | null = null;
function loadProviders() {
  if (!providersCache) providersCache = fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_KEY } })
    .then((r) => r.json()).then((j) => j.external || {}).catch(() => ({}));
  return providersCache;
}

function oauthErrorFromUrl(): string {
  const q = new URLSearchParams(window.location.search + '&' + window.location.hash.replace(/^#/, ''));
  const d = q.get('error_description') || q.get('error');
  return d ? errMsg(d.replace(/\+/g, ' ')) : '';
}

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
  </svg>
);

function OAuthButtons({ beforeStart, onError }: { beforeStart?: () => boolean; onError: (m: string) => void }) {
  const [enabled, setEnabled] = useState<Record<string, boolean> | null>(null);
  const [busy, setBusy] = useState<Provider | null>(null);
  useEffect(() => { loadProviders().then(setEnabled); }, []);
  async function go(provider: Provider) {
    if (beforeStart && !beforeStart()) return;
    setBusy(provider); onError('');
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: appUrl('/') } });
    if (error) { setBusy(null); onError(errMsg(error)); }
  }
  const btn = (p: Provider, label: string, icon: JSX.Element) => {
    const off = enabled !== null && !enabled[p];
    return (
      <button type="button" className={`btn oauth ${p}`} disabled={off || busy !== null} onClick={() => go(p)}
        title={off ? 'Ainda não ativado' : undefined}>
        {icon}<span>{busy === p ? 'Abrindo…' : label}</span>{off && <em className="soon">em breve</em>}
      </button>
    );
  };
  return (
    <div className="oauth-group">
      {btn('google', 'Continuar com Google', <GoogleIcon />)}
      <div className="or" role="separator"><span>ou com e-mail</span></div>
    </div>
  );
}

export function Login() {
  const { session } = useAuth();
  const loc: any = useLocation();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(oauthErrorFromUrl);
  if (session) return <Navigate to={loc.state?.from || '/'} replace />;
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false); if (error) setErr(errMsg(error));
  }
  return (
    <form className="auth card stack" onSubmit={submit}>
      <h1>Entrar</h1>
      {err && <div className="alert error" role="alert">{err}</div>}
      <OAuthButtons onError={setErr} />
      <label>E-mail<input id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label>Senha<input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <button className="btn" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
      <div className="row small"><Link to="/cadastro">Criar cadastro</Link><span className="muted">·</span><Link to="/recuperar">Esqueci a senha</Link></div>
    </form>
  );
}

export function Signup() {
  const { session } = useAuth();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [sent, setSent] = useState(false);
  if (session) return <Navigate to="/" replace />;
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (!adult) { setErr('O cadastro é apenas para maiores de 18 anos.'); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { full_name: name.trim() }, emailRedirectTo: appUrl('/') },
    });
    setBusy(false);
    if (error) { setErr(errMsg(error)); return; }
    if (!data.session) setSent(true);
  }
  if (sent) return (
    <div className="auth card stack">
      <h1>Confirme seu e-mail</h1>
      <p>Enviamos um link para <b>{email}</b>. Abra o e-mail e clique no link para ativar o cadastro. Se não aparecer, olhe a caixa de spam.</p>
      <Link className="btn ghost" to="/entrar">Ir para Entrar</Link>
    </div>
  );
  return (
    <form className="auth card stack" onSubmit={submit}>
      <h1>Criar cadastro de colaborador</h1>
      <p className="muted small">Você grava tarefas do dia a dia em primeira pessoa e recebe por vídeo aprovado. Cada tarefa mostra o valor antes de você gravar.</p>
      {err && <div className="alert error" role="alert">{err}</div>}
      <label className="check"><input id="su-adult" type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} />Tenho 18 anos ou mais.</label>
      <OAuthButtons onError={setErr} beforeStart={() => { if (!adult) { setErr('Marque que você tem 18 anos ou mais para continuar.'); return false; } return true; }} />
      <label>Nome completo<input id="su-name" autoComplete="name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label>E-mail<input id="su-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label>Senha<span className="hint">Mínimo de 6 caracteres.</span><input id="su-password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <button className="btn" disabled={busy}>{busy ? 'Criando…' : 'Criar cadastro'}</button>
      <p className="small muted">Já tem cadastro? <Link to="/entrar">Entrar</Link></p>
    </form>
  );
}

export function Forgot() {
  const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(''); setMsg('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: appUrl('/nova-senha') });
    setBusy(false);
    if (error) setErr(errMsg(error)); else setMsg('Se este e-mail tiver cadastro, enviamos um link para criar uma nova senha.');
  }
  return (
    <form className="auth card stack" onSubmit={submit}>
      <h1>Recuperar senha</h1>
      {err && <div className="alert error" role="alert">{err}</div>}
      {msg && <div className="alert ok" role="status">{msg}</div>}
      <label>E-mail<input id="fg-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <button className="btn" disabled={busy}>{busy ? 'Enviando…' : 'Enviar link'}</button>
      <Link className="small" to="/entrar">Voltar para Entrar</Link>
    </form>
  );
}

export function ResetPassword() {
  const nav = useNavigate();
  const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setErr(errMsg(error)); else nav('/', { replace: true });
  }
  return (
    <form className="auth card stack" onSubmit={submit}>
      <h1>Nova senha</h1>
      {err && <div className="alert error" role="alert">{err}</div>}
      <label>Nova senha<input id="rp-password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <button className="btn" disabled={busy}>{busy ? 'Salvando…' : 'Salvar senha'}</button>
    </form>
  );
}
