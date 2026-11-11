import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase, errMsg } from '../supabase';
import { useAuth } from '../session';

const appUrl = (path: string) => `${window.location.origin}/app${path}`;

export function Login() {
  const { session } = useAuth();
  const loc: any = useLocation();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
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
      <label>Nome completo<input id="su-name" autoComplete="name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label>E-mail<input id="su-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label>Senha<span className="hint">Mínimo de 6 caracteres.</span><input id="su-password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <label className="check"><input id="su-adult" type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} />Tenho 18 anos ou mais.</label>
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
