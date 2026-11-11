import { useEffect, useMemo, useRef, useState } from 'react';
import { listarEstados, buscarEstados, carregarMunicipios, type ApiMunicipios } from 'municipios-brasil';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase, brl, fmtDate, fmtDur, errMsg } from '../supabase';
import { useAuth } from '../session';
import { MAX_UPLOAD_BYTES, SUPABASE_KEY, SUPABASE_URL, TERMS_VERSION } from '../config';

export const STATUS_LABEL: Record<string, [string, string]> = {
  pending: ['Em análise', 'warn'], approved: ['Aprovado', 'ok'], rejected: ['Recusado', 'bad'],
  requested: ['Solicitado', 'warn'], paid: ['Pago', 'ok'], blocked: ['Bloqueado', 'bad'],
};
export const Pill = ({ s }: { s: string }) => { const [t, c] = STATUS_LABEL[s] || [s, 'neutral']; return <span className={`pill ${c}`}>{t}</span>; };
const CAT: Record<string, string> = { household: 'Doméstica', workplace: 'Local de trabalho', other: 'Outra' };

const lines = (t: string) => String(t || '').split('\n').map((x) => x.trim()).filter(Boolean);

function profileComplete(p: any) { return !!(p?.full_name && p?.phone && p?.city && p?.state && p?.device); }

function InstallBanner() {
  const [evt, setEvt] = useState<any>(null);
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem('borgs-install-dismissed') === '1'; } catch { return false; } });
  const standalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true);
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const ios = /iPhone|iPad|iPod/.test(ua);
  useEffect(() => {
    const h = (e: any) => { e.preventDefault(); setEvt(e); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);
  if (standalone || hidden || (!evt && !ios)) return null;
  const close = () => { setHidden(true); try { localStorage.setItem('borgs-install-dismissed', '1'); } catch { /* ignora */ } };
  return (
    <div className="card install" role="region" aria-label="Instalar o app">
      <img src="/icon-192.png" alt="" width="44" height="44" />
      <div className="stack" style={{ gap: 4, flex: 1, minWidth: 0 }}>
        <b>Instale o app Borgs</b>
        {evt
          ? <span className="small muted">Abre direto da tela inicial, sem barra do navegador.</span>
          : <span className="small muted">No Safari, toque em Compartilhar e depois em <b>Adicionar à Tela de Início</b>.</span>}
      </div>
      {evt && <button className="btn sm" onClick={async () => { evt.prompt(); await evt.userChoice.catch(() => null); setEvt(null); }}>Instalar</button>}
      <button className="btn sm ghost" onClick={close} aria-label="Fechar">Agora não</button>
    </div>
  );
}

export function Home() {
  const { profile, consented } = useAuth();
  const [bal, setBal] = useState<any>(null);
  const [counts, setCounts] = useState<{ pending: number; approved: number; rejected: number }>({ pending: 0, approved: 0, rejected: 0 });
  useEffect(() => {
    supabase.rpc('balance_for', { uid: profile!.id }).then(({ data }) => setBal(data?.[0] || null));
    supabase.from('submissions').select('status').eq('user_id', profile!.id).then(({ data }) => {
      const c = { pending: 0, approved: 0, rejected: 0 } as any; (data || []).forEach((r: any) => c[r.status]++); setCounts(c);
    });
  }, [profile]);
  return (
    <>
      <div className="page-head"><div><h1>Olá{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}</h1>
        <p>Grave tarefas em primeira pessoa e receba por vídeo aprovado.</p></div></div>
      <InstallBanner />
      {(() => {
        const total = counts.pending + counts.approved + counts.rejected;
        const steps: { label: string; done: boolean; to?: string; cta?: string }[] = [
          { label: 'Criar cadastro', done: true },
          { label: 'Completar perfil', done: profileComplete(profile), to: '/perfil', cta: 'Completar perfil' },
          { label: 'Aceitar o termo de participação', done: consented || profile?.role === 'admin', to: '/termo', cta: 'Ler e aceitar o termo' },
          { label: 'Cadastro aprovado pela equipe', done: profile?.status === 'approved' },
          { label: 'Enviar o primeiro vídeo', done: total > 0, to: '/tarefas', cta: 'Ver tarefas' },
        ];
        const done = steps.filter((x) => x.done).length;
        if (done === steps.length) return null;
        const next = steps.find((x) => !x.done)!;
        return (
          <div className="card stack mission" aria-label="Primeira missão">
            <div className="row" style={{ justifyContent: 'space-between' }}><span className="eyebrow">Primeira missão</span><span className="small muted num">{done} de {steps.length}</span></div>
            <h2>{next.label}</h2>
            <div className="steps" role="list">{steps.map((x) => <span key={x.label} role="listitem" className={x.done ? 'on' : x === next ? 'now' : ''} title={x.label} />)}</div>
            <ul className="mission-list">{steps.map((x) => <li key={x.label} className={x.done ? 'done' : ''}>{x.label}</li>)}</ul>
            {next.to ? <div className="row"><Link className="btn" to={next.to}>{next.cta}</Link></div> : <p className="small muted">Estamos revisando seu cadastro. Você será liberado assim que for aprovado.</p>}
          </div>
        );
      })()}
      {profile?.status === 'pending' && (
        <div className="alert warn">Seu cadastro está em análise. Você verá as tarefas assim que for aprovado. {profileComplete(profile) ? '' : 'Complete seu perfil para agilizar a aprovação.'}</div>
      )}
      {!profileComplete(profile) && <div className="alert info">Faltam dados no seu perfil. <Link to="/perfil">Completar perfil</Link></div>}
      <div className="grid3">
        <div className="card stat"><span>Saldo disponível</span><b>{brl(bal?.available_cents)}</b></div>
        <div className="card stat"><span>Envios em análise</span><b>{counts.pending}</b></div>
        <div className="card stat"><span>Envios aprovados</span><b>{counts.approved}</b></div>
      </div>
      <div className="card stack">
        <h2>Como funciona</h2>
        <ol className="stack" style={{ margin: 0, paddingLeft: '1.2em' }}>
          <li>Escolha uma tarefa e leia as instruções. O valor por vídeo aprovado aparece antes de você gravar.</li>
          <li>Grave com o celular na altura dos olhos, mostrando as mãos. Não grave rostos de outras pessoas, telas ou documentos.</li>
          <li>Envie o vídeo. Nossa equipe revisa cada envio e aprova ou recusa com o motivo.</li>
          <li>O valor dos vídeos aprovados entra na sua carteira. Peça o saque por Pix quando quiser.</li>
        </ol>
        <div className="row"><Link className="btn" to="/tarefas">Ver tarefas</Link></div>
      </div>
    </>
  );
}

export function Consent() {
  const { profile, refresh, consented } = useAuth();
  const nav = useNavigate();
  const [ok, setOk] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function accept() {
    setBusy(true); setErr('');
    const { error } = await supabase.from('consents').insert({ user_id: profile!.id, terms_version: TERMS_VERSION });
    if (error && !/duplicate/i.test(error.message)) { setErr(errMsg(error)); setBusy(false); return; }
    await refresh(); setBusy(false); nav('/', { replace: true });
  }
  return (
    <div className="card stack" style={{ maxWidth: 760 }}>
      <h1>Termo de participação e consentimento</h1>
      <p className="muted small">Versão {TERMS_VERSION}. Leia antes de continuar.</p>
      <div className="stack small" style={{ maxHeight: 420, overflow: 'auto', paddingRight: 8 }}>
        <p><b>1. O que é.</b> A Borgs Store organiza a gravação de vídeos em primeira pessoa de atividades do dia a dia. Os vídeos são usados para treinar e avaliar sistemas de inteligência artificial e robótica, e podem ser licenciados a empresas compradoras no Brasil e no exterior.</p>
        <p><b>2. O que você grava.</b> Apenas as atividades descritas em cada tarefa, com foco nas suas mãos e nos objetos. Você não deve gravar o rosto de outras pessoas, crianças, telas, documentos, placas de carro ou qualquer informação pessoal de terceiros. Gravar em local de trabalho ou casa de outra pessoa exige autorização do responsável.</p>
        <p><b>3. Dados tratados.</b> Tratamos seu nome, e-mail, telefone, cidade, aparelho usado, chave Pix e os vídeos enviados, incluindo imagem das suas mãos e, se houver, sua voz e o ambiente. A base legal é o seu consentimento e a execução deste termo, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
        <p><b>4. Transferência internacional.</b> Os vídeos aprovados podem ser entregues a empresas fora do Brasil. Faremos essa transferência apenas com contrato que exija proteção dos dados.</p>
        <p><b>5. Pagamento.</b> Cada tarefa mostra o valor por vídeo aprovado. Vídeos recusados não são pagos, e o motivo da recusa aparece em "Meus envios". O valor aprovado entra na sua carteira e é pago por Pix depois que você pede o saque. Não há garantia de quantidade de tarefas.</p>
        <p><b>6. Direitos sobre os vídeos.</b> Ao receber o pagamento de um vídeo aprovado, você autoriza a Borgs Store a usar, editar e licenciar esse vídeo para treinamento de IA e robótica, sem pagamento adicional. Vídeos recusados e não pagos não são licenciados.</p>
        <p><b>7. Seus direitos.</b> Você pode pedir acesso, correção ou exclusão dos seus dados e revogar este consentimento a qualquer momento, escrevendo para contato@borgsstore.com.br. A revogação impede novos usos a partir do pedido. Vídeos que já foram entregues a compradores antes do pedido podem não ser removíveis dos sistemas deles; nesse caso, informaremos o comprador sobre a revogação.</p>
        <p><b>8. Relação.</b> A participação é voluntária e não cria vínculo de emprego. Você é responsável pelos tributos sobre o que receber. O cadastro é apenas para maiores de 18 anos.</p>
      </div>
      {err && <div className="alert error">{err}</div>}
      {consented ? <div className="alert ok">Você já aceitou esta versão do termo.</div> : (<>
        <label className="check"><input id="consent-ok" type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />Li e concordo com o termo de participação e consentimento.</label>
        <div className="row"><button className="btn" disabled={!ok || busy} onClick={accept}>{busy ? 'Salvando…' : 'Aceitar e continuar'}</button></div>
      </>)}
    </div>
  );
}

function toUf(v: string): string {
  if (!v) return '';
  const t = v.trim();
  const byUf = listarEstados().find((u: any) => u.uf === t.toUpperCase());
  if (byUf) return byUf.uf;
  try { return (buscarEstados(t)[0] as any)?.uf || ''; } catch { return ''; }
}

export function Profile() {
  const { profile, refresh } = useAuth();
  const [muni, setMuni] = useState<ApiMunicipios | null>(null);
  useEffect(() => { carregarMunicipios().then(setMuni).catch(() => setMuni(null)); }, []);
  const [f, setF] = useState<any>({ full_name: '', phone: '', city: '', state: '', device: '', pix_key: '' });
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  useEffect(() => { if (profile) setF({ full_name: profile.full_name || '', phone: profile.phone || '', city: profile.city || '', state: toUf(profile.state || '') || '', device: profile.device || '', pix_key: profile.pix_key || '' }); }, [profile?.id]);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const cities = useMemo(() => (muni && f.state ? muni.porEstado(f.state as any).map((m: any) => m.nome) : []), [muni, f.state]);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(''); setErr('');
    if (muni && f.state) {
      const ok = cities.some((c: string) => c.toLowerCase() === String(f.city).trim().toLowerCase());
      if (!ok) { setErr('Escolha uma cidade da lista do estado selecionado.'); return; }
    }
    setBusy(true);
    const clean: any = {}; Object.keys(f).forEach((k) => (clean[k] = String(f[k]).trim()));
    const { error } = await supabase.from('profiles').update(clean).eq('id', profile!.id);
    setBusy(false); if (error) setErr(errMsg(error)); else { setMsg('Perfil salvo.'); refresh(); }
  }
  return (
    <>
    <form className="card stack" style={{ maxWidth: 640 }} onSubmit={save}>
      <div className="row" style={{ justifyContent: 'space-between' }}><h1>Perfil</h1><Pill s={profile!.status} /></div>
      {msg && <div className="alert ok" role="status">{msg}</div>}
      {err && <div className="alert error" role="alert">{err}</div>}
      <label>Nome completo<input id="pf-name" required maxLength={120} value={f.full_name} onChange={set('full_name')} /></label>
      <div className="grid2">
        <label>Telefone / WhatsApp<input id="pf-phone" type="tel" autoComplete="tel" maxLength={40} required value={f.phone} onChange={set('phone')} /></label>
        <label>Aparelho de gravação<span className="hint">Ex.: iPhone 12, Galaxy A54</span><input id="pf-device" maxLength={120} required value={f.device} onChange={set('device')} /></label>
        <label>Estado
          <select id="pf-state" required value={f.state} onChange={(e) => setF({ ...f, state: e.target.value, city: '' })}>
            <option value="">Selecione o estado</option>
            {listarEstados().map((u: any) => <option key={u.uf} value={u.uf}>{u.uf} · {u.nome}</option>)}
          </select>
        </label>
        <label>Cidade<span className="hint">{f.state ? 'Comece a digitar e escolha na lista.' : 'Escolha o estado primeiro.'}</span>
          <input id="pf-city" list="pf-city-list" maxLength={80} required disabled={!f.state} autoComplete="off" value={f.city} onChange={set('city')} />
          <datalist id="pf-city-list">{cities.map((c: string) => <option key={c} value={c} />)}</datalist>
        </label>
      </div>
      <label>Chave Pix<span className="hint">Usada apenas para pagar seus saques.</span><input id="pf-pix" maxLength={140} value={f.pix_key} onChange={set('pix_key')} /></label>
      <div className="row"><button className="btn" disabled={busy}>{busy ? 'Salvando…' : 'Salvar perfil'}</button></div>
    </form>
      <div className="card stack" style={{ maxWidth: 640 }}>
        <h2>Conta</h2>
        <div className="row">
          {profile?.role === 'admin' && <Link className="btn ghost" to="/admin">Painel admin</Link>}
          <button type="button" className="btn ghost" onClick={async () => { await supabase.auth.signOut(); }}>Sair da conta</button>
        </div>
      </div>
    </>
  );
}

export function Tasks() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<any[] | null>(null);
  const [mine, setMine] = useState<Record<number, number>>({});
  const [q, setQ] = useState(''); const [cat, setCat] = useState('all');
  useEffect(() => {
    supabase.from('tasks').select('*').eq('active', true).order('created_at', { ascending: false }).then(({ data }) => setTasks(data || []));
    supabase.from('submissions').select('task_id,status').eq('user_id', profile!.id).neq('status', 'rejected').then(({ data }) => {
      const m: Record<number, number> = {}; (data || []).forEach((r: any) => (m[r.task_id] = (m[r.task_id] || 0) + 1)); setMine(m);
    });
  }, [profile]);
  if (profile?.status !== 'approved') return <div className="alert warn">As tarefas aparecem depois que seu cadastro for aprovado.</div>;
  return (
    <>
      <div className="page-head"><div><h1>Tarefas disponíveis</h1><p>O valor é pago por vídeo aprovado. Leia as instruções antes de gravar.</p></div></div>
      {tasks && tasks.length > 0 && (
        <div className="filters">
          <input id="tk-search" type="search" placeholder="Buscar tarefa" aria-label="Buscar tarefa" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="chips" role="group" aria-label="Categoria">
            {[['all', 'Todas'], ...Object.entries(CAT)].map(([k, v]) => <button type="button" key={k} className={`chip${cat === k ? ' on' : ''}`} aria-pressed={cat === k} onClick={() => setCat(k)}>{v}</button>)}
          </div>
        </div>
      )}
      {tasks === null ? <p className="muted">Carregando…</p> : tasks.length === 0 ? <div className="empty">Nenhuma tarefa aberta agora. Volte em breve.</div> : (
        <div className="grid2">{tasks.filter((t) => (cat === 'all' || t.category === cat) && t.title.toLowerCase().includes(q.trim().toLowerCase())).map((t) => {
          const used = mine[t.id] || 0; const full = used >= t.max_per_user;
          return (
            <div key={t.id} className="card task">
              <div className="row" style={{ justifyContent: 'space-between' }}><span className="pill neutral">{CAT[t.category]}</span><b className="num">{brl(t.pay_cents)}</b></div>
              <h3>{t.title}</h3>
              <div className="meta"><span>{fmtDur(t.min_seconds)} a {fmtDur(t.max_seconds)}</span><span className="num">Seus envios: {used}/{t.max_per_user}</span></div>
              <div className="row">{full ? <span className="pill neutral">Limite atingido</span> : <Link className="btn sm" to={`/tarefas/${t.id}`}>Abrir tarefa</Link>}</div>
            </div>);
        })}</div>
      )}
    </>
  );
}

function readVideoMeta(file: File): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file); const v = document.createElement('video');
    v.preload = 'metadata'; v.muted = true;
    v.onloadedmetadata = () => { const r = { duration: v.duration, width: v.videoWidth, height: v.videoHeight }; URL.revokeObjectURL(url); resolve(r); };
    v.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não conseguimos ler este vídeo. Tente MP4 ou MOV.')); };
    v.src = url;
  });
}

function uploadWithProgress(path: string, file: File, token: string, onProgress: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/videos/${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', SUPABASE_KEY);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.status === 413 ? 'Arquivo grande demais (máximo 50 MB).' : `Falha no envio (${xhr.status}). ${xhr.responseText.slice(0, 160)}`)));
    xhr.onerror = () => reject(new Error('Falha de conexão durante o envio. Verifique a internet e tente de novo.'));
    xhr.send(file);
  });
}

export function TaskDetail() {
  const { id } = useParams(); const { session, profile } = useAuth(); const nav = useNavigate();
  const [task, setTask] = useState<any>(null); const [loadErr, setLoadErr] = useState('');
  const [file, setFile] = useState<File | null>(null); const [meta, setMeta] = useState<any>(null);
  const [note, setNote] = useState(''); const [rules, setRules] = useState(false);
  const [progress, setProgress] = useState(0); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { supabase.from('tasks').select('*').eq('id', id).maybeSingle().then(({ data, error }) => { if (error || !data) setLoadErr('Tarefa não encontrada ou encerrada.'); setTask(data); }); }, [id]);

  const problems = useMemo(() => {
    if (!file || !meta || !task) return [] as string[];
    const p: string[] = [];
    if (file.size > MAX_UPLOAD_BYTES) p.push(`O arquivo tem ${(file.size / 1048576).toFixed(1)} MB. O máximo é 50 MB. Grave um vídeo mais curto ou em 1080p.`);
    if (meta.duration < task.min_seconds) p.push(`O vídeo tem ${fmtDur(meta.duration)}. O mínimo desta tarefa é ${fmtDur(task.min_seconds)}.`);
    if (meta.duration > task.max_seconds) p.push(`O vídeo tem ${fmtDur(meta.duration)}. O máximo desta tarefa é ${fmtDur(task.max_seconds)}.`);
    return p;
  }, [file, meta, task]);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    setErr(''); setMeta(null); const f = e.target.files?.[0] || null; setFile(f);
    if (f) { try { setMeta(await readVideoMeta(f)); } catch (x: any) { setErr(x.message); } }
  }
  async function send() {
    if (!file || !meta || problems.length) return;
    setBusy(true); setErr(''); setProgress(0);
    const ext = (file.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'mp4';
    const path = `${profile!.id}/${task.id}/${Date.now()}.${ext}`;
    try {
      const { data: s } = await supabase.auth.getSession();
      await uploadWithProgress(path, file, s.session?.access_token || session.access_token, setProgress);
      const { error } = await supabase.from('submissions').insert({
        task_id: task.id, user_id: profile!.id, storage_path: path, file_size: file.size,
        duration_seconds: Math.round(meta.duration * 10) / 10, width: meta.width || null, height: meta.height || null, note: note.trim() || null,
      });
      if (error) throw error;
      nav('/envios', { replace: true, state: { sent: true } });
    } catch (x: any) { setErr(errMsg(x)); setBusy(false); }
  }

  if (loadErr) return <div className="alert error">{loadErr} <Link to="/tarefas">Voltar</Link></div>;
  if (!task) return <p className="muted">Carregando…</p>;
  return (
    <div className="grid2" style={{ alignItems: 'start' }}>
      <div className="card stack">
        <Link className="small" to="/tarefas">← Tarefas</Link>
        <h1>{task.title}</h1>
        <div className="meta"><b className="num" style={{ color: 'var(--fg)' }}>{brl(task.pay_cents)} por vídeo aprovado</b><span>{fmtDur(task.min_seconds)} a {fmtDur(task.max_seconds)}</span></div>
        <h2>O que gravar</h2>
        {lines(task.instructions).length > 1
          ? <ol className="guide">{lines(task.instructions).map((l, i) => <li key={i}><span className="num">{String(i + 1).padStart(2, '0')}</span>{l}</li>)}</ol>
          : <p className="pre">{task.instructions || 'Sem instruções adicionais.'}</p>}
        <h2>Antes de gravar</h2>
        <ul className="check-list">{(lines(task.before_checklist).length ? lines(task.before_checklist) : ['Celular na altura dos olhos', 'Mãos visíveis no enquadramento', 'Lente limpa e boa luz', 'Sem rostos de outras pessoas, telas ou documentos aparecendo']).map((l, i) => <li key={i}>{l}</li>)}</ul>
        {lines(task.reject_reasons).length > 0 && (
          <details className="reject"><summary>O que pode levar a uma recusa</summary>
            <ul>{lines(task.reject_reasons).map((l, i) => <li key={i}>{l}</li>)}</ul></details>
        )}
      </div>
      <div className="card stack">
        <h2>Enviar vídeo</h2>
        <label>Arquivo de vídeo<span className="hint">MP4 ou MOV, até 50 MB.</span>
          <input ref={inputRef} id="td-file" type="file" accept="video/mp4,video/quicktime,video/webm,video/*" onChange={pick} disabled={busy} />
        </label>
        {meta && <div className="meta"><span className="num">Duração {fmtDur(meta.duration)}</span><span className="num">{meta.width}×{meta.height}</span><span className="num">{(file!.size / 1048576).toFixed(1)} MB</span></div>}
        {problems.map((p) => <div key={p} className="alert error">{p}</div>)}
        <label>Observação (opcional)<textarea id="td-note" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Algo que o revisor deve saber" /></label>
        <label className="check"><input id="td-rules" type="checkbox" checked={rules} onChange={(e) => setRules(e.target.checked)} />O vídeo segue as instruções e não mostra rostos de outras pessoas, telas ou documentos.</label>
        {busy && <div className="stack"><div className="progress" aria-label="Progresso do envio"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div><span className="small muted num">{Math.round(progress * 100)}% enviado. Não feche esta página.</span></div>}
        {err && <div className="alert error" role="alert">{err}</div>}
        <div className="row"><button className="btn" disabled={!file || !meta || !rules || problems.length > 0 || busy} onClick={send}>{busy ? 'Enviando…' : 'Enviar para revisão'}</button></div>
      </div>
    </div>
  );
}

export function Submissions() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<any[] | null>(null);
  const sent = (useLocation().state as any)?.sent;
  useEffect(() => { supabase.from('submissions').select('*, tasks(title)').eq('user_id', profile!.id).order('created_at', { ascending: false }).then(({ data }) => setRows(data || [])); }, [profile]);
  return (
    <>
      <div className="page-head"><div><h1>Meus envios</h1><p>Acompanhe a revisão de cada vídeo.</p></div></div>
      {sent && <div className="alert ok" role="status">Vídeo enviado. Ele aparece abaixo como "Em análise".</div>}
      {rows === null ? <p className="muted">Carregando…</p> : rows.length === 0 ? <div className="empty">Você ainda não enviou vídeos. <Link to="/tarefas">Ver tarefas</Link></div> : (
        <div className="table-wrap"><table>
          <thead><tr><th>Tarefa</th><th>Enviado</th><th>Duração</th><th>Status</th><th>Valor</th><th>Motivo</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}><td>{r.tasks?.title}</td><td className="num">{fmtDate(r.created_at)}</td><td className="num">{fmtDur(r.duration_seconds)}</td>
              <td><Pill s={r.status} /></td><td className="num">{r.status === 'approved' ? brl(r.payout_cents) : '—'}</td><td>{r.reject_reason || ''}</td></tr>))}
          </tbody></table></div>
      )}
    </>
  );
}

export function Wallet() {
  const { profile } = useAuth();
  const [bal, setBal] = useState<any>(null); const [rows, setRows] = useState<any[]>([]); const [review, setReview] = useState(0);
  const [amount, setAmount] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [msg, setMsg] = useState('');
  async function load() {
    const [{ data: b }, { data: p }, { data: sub }] = await Promise.all([
      supabase.rpc('balance_for', { uid: profile!.id }),
      supabase.from('payouts').select('*').eq('user_id', profile!.id).order('requested_at', { ascending: false }),
      supabase.from('submissions').select('tasks(pay_cents)').eq('user_id', profile!.id).eq('status', 'pending'),
    ]);
    setBal(b?.[0] || null); setRows(p || []);
    setReview((sub || []).reduce((a: number, r: any) => a + (r.tasks?.pay_cents || 0), 0));
  }
  useEffect(() => { load(); }, [profile]);
  async function request(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setMsg('');
    const cents = Math.round(parseFloat(amount.replace(/\./g, '').replace(',', '.')) * 100);
    if (!cents || cents <= 0) { setErr('Digite um valor válido.'); return; }
    setBusy(true);
    const { error } = await supabase.rpc('request_payout', { amount: cents });
    setBusy(false);
    if (error) setErr(errMsg(error)); else { setMsg('Saque solicitado. Avisaremos quando o Pix for enviado.'); setAmount(''); load(); }
  }
  return (
    <>
      <div className="page-head"><div><h1>Carteira</h1><p>Valores de vídeos aprovados. Os saques são pagos por Pix, manualmente, depois da solicitação.</p></div></div>
      <div className="grid3">
        <div className="card stat"><span>Disponível para saque</span><b>{brl(bal?.available_cents)}</b></div>
        <div className="card stat"><span>Em análise</span><b>{brl(review)}</b><small className="muted">Só vira saldo se o vídeo for aprovado.</small></div>
        <div className="card stat"><span>Saques solicitados</span><b>{brl(bal?.requested_cents)}</b></div>
        <div className="card stat"><span>Total já pago</span><b>{brl(bal?.paid_cents)}</b></div>
      </div>
      <form className="card stack" onSubmit={request} style={{ maxWidth: 520 }}>
        <h2>Pedir saque</h2>
        {!profile?.pix_key && <div className="alert info">Cadastre sua chave Pix no <Link to="/perfil">Perfil</Link> para pedir saque.</div>}
        {err && <div className="alert error" role="alert">{err}</div>}
        {msg && <div className="alert ok" role="status">{msg}</div>}
        <label>Valor (R$)<input id="wl-amount" inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
        <div className="row"><button className="btn" disabled={busy || !profile?.pix_key || !(bal?.available_cents > 0)}>{busy ? 'Enviando…' : 'Pedir saque'}</button></div>
      </form>
      {rows.length > 0 && (
        <div className="table-wrap"><table>
          <thead><tr><th>Pedido</th><th>Valor</th><th>Status</th><th>Pago em</th><th>Observação</th></tr></thead>
          <tbody>{rows.map((r) => (<tr key={r.id}><td className="num">{fmtDate(r.requested_at)}</td><td className="num">{brl(r.amount_cents)}</td><td><Pill s={r.status} /></td><td className="num">{fmtDate(r.paid_at)}</td><td>{r.admin_note || ''}</td></tr>))}</tbody>
        </table></div>
      )}
    </>
  );
}
