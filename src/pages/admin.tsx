import { useEffect, useState } from 'react';
import { supabase, brl, fmtDate, fmtDur, errMsg } from '../supabase';
import { useAuth } from '../session';
import { Pill } from './collector';

type Tab = 'review' | 'tasks' | 'people' | 'payouts' | 'leads' | 'export';
const TABS: [Tab, string][] = [['review', 'Revisão'], ['tasks', 'Tarefas'], ['people', 'Colaboradores'], ['payouts', 'Saques'], ['leads', 'Pedidos de piloto'], ['export', 'Exportar']];

export function Admin() {
  const [tab, setTab] = useState<Tab>('review');
  return (
    <>
      <div className="page-head"><div><h1>Painel admin</h1><p>Revise envios, publique tarefas, aprove colaboradores e registre pagamentos.</p></div></div>
      <div className="tabs" role="tablist">{TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === 'review' && <Review />}
      {tab === 'tasks' && <TasksAdmin />}
      {tab === 'people' && <People />}
      {tab === 'payouts' && <Payouts />}
      {tab === 'leads' && <Leads />}
      {tab === 'export' && <Export />}
    </>
  );
}

function Review() {
  const { profile } = useAuth();
  const [queue, setQueue] = useState<any[] | null>(null);
  const [cur, setCur] = useState<any>(null); const [url, setUrl] = useState('');
  const [hands, setHands] = useState('unknown'); const [notes, setNotes] = useState(''); const [reason, setReason] = useState(''); const [pay, setPay] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function load() {
    const { data } = await supabase.from('submissions').select('*, tasks(title,pay_cents,instructions), profiles!submissions_user_id_fkey(full_name,city,state)').eq('status', 'pending').order('created_at');
    setQueue(data || []); open((data || [])[0] || null);
  }
  async function open(s: any) {
    setCur(s); setUrl(''); setErr(''); setReason(''); setNotes(''); setHands('unknown');
    if (!s) return;
    setPay(((s.tasks?.pay_cents || 0) / 100).toFixed(2).replace('.', ','));
    const { data, error } = await supabase.storage.from('videos').createSignedUrl(s.storage_path, 3600);
    if (error) setErr('Não foi possível abrir o vídeo: ' + error.message); else setUrl(data.signedUrl);
  }
  useEffect(() => { load(); }, []);
  async function decide(approve: boolean) {
    if (!approve && !reason.trim()) { setErr('Escreva o motivo da recusa. O colaborador verá esse texto.'); return; }
    const cents = Math.round(parseFloat(pay.replace(/\./g, '').replace(',', '.')) * 100);
    if (approve && (isNaN(cents) || cents < 0)) { setErr('Valor inválido.'); return; }
    setBusy(true); setErr('');
    const { error } = await supabase.from('submissions').update({
      status: approve ? 'approved' : 'rejected', payout_cents: approve ? cents : 0, reject_reason: approve ? null : reason.trim(),
      meta: { hands_visible: hands, reviewer_notes: notes.trim() || null, resolution: cur.width && cur.height ? `${cur.width}x${cur.height}` : 'unknown' },
      reviewer_id: profile!.id, reviewed_at: new Date().toISOString(),
    }).eq('id', cur.id).eq('status', 'pending');
    setBusy(false); if (error) { setErr(errMsg(error)); return; }
    load();
  }
  if (queue === null) return <p className="muted">Carregando…</p>;
  if (queue.length === 0) return <div className="empty">Nenhum envio esperando revisão.</div>;
  return (
    <div className="stack">
      <p className="muted small num">{queue.length} envio(s) na fila.</p>
      {cur && (
        <div className="review">
          <div className="card stack">
            {url ? <video key={url} src={url} controls playsInline preload="metadata" /> : <div className="empty">Carregando vídeo…</div>}
            <div className="meta"><span>{cur.tasks?.title}</span><span className="num">{fmtDur(cur.duration_seconds)}</span><span className="num">{cur.width}×{cur.height}</span><span className="num">{((cur.file_size || 0) / 1048576).toFixed(1)} MB</span>{cur.capture?.source === 'app_camera' && <span className="pill neutral" title="Verificação feita no aparelho do colaborador">Gravado no app · mãos no quadro {cur.capture.hands_in_frame_pct}% · {cur.capture.pauses} pausa(s)</span>}</div>
            <p className="small">Enviado por <b>{cur.profiles?.full_name || 'sem nome'}</b> ({[cur.profiles?.city, cur.profiles?.state].filter(Boolean).join(', ') || 'local não informado'}) em {fmtDate(cur.created_at)}.</p>
            {cur.note && <div className="alert info small">Observação do colaborador: {cur.note}</div>}
          </div>
          <div className="card stack">
            <h2>Decisão</h2>
            {err && <div className="alert error" role="alert">{err}</div>}
            <label>Mãos visíveis<select id="rv-hands" value={hands} onChange={(e) => setHands(e.target.value)}><option value="unknown">Não conferido</option><option value="true">Sim, na maior parte</option><option value="partial">Parcialmente</option><option value="false">Não</option></select></label>
            <label>Notas internas<textarea id="rv-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Só a equipe vê" /></label>
            <label>Valor a pagar (R$)<input id="rv-pay" inputMode="decimal" value={pay} onChange={(e) => setPay(e.target.value)} /></label>
            <button className="btn" disabled={busy} onClick={() => decide(true)}>Aprovar</button>
            <label>Motivo da recusa<span className="hint">Obrigatório para recusar. O colaborador vê este texto.</span><textarea id="rv-reason" value={reason} onChange={(e) => setReason(e.target.value)} /></label>
            <button className="btn danger" disabled={busy} onClick={() => decide(false)}>Recusar</button>
          </div>
        </div>
      )}
      {queue.length > 1 && (
        <div className="table-wrap"><table><thead><tr><th>Tarefa</th><th>Colaborador</th><th>Enviado</th><th></th></tr></thead>
          <tbody>{queue.map((s) => <tr key={s.id}><td>{s.tasks?.title}</td><td>{s.profiles?.full_name}</td><td className="num">{fmtDate(s.created_at)}</td><td><button className="btn sm ghost" onClick={() => open(s)}>{cur?.id === s.id ? 'Aberto' : 'Abrir'}</button></td></tr>)}</tbody></table></div>
      )}
    </div>
  );
}

const emptyTask = { title: '', category: 'household', instructions: '', before_checklist: '', reject_reasons: '', min_seconds: 60, max_seconds: 600, pay: '0,00', max_per_user: 3, active: false };

function TasksAdmin() {
  const [rows, setRows] = useState<any[]>([]); const [f, setF] = useState<any>(emptyTask); const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [msg, setMsg] = useState('');
  async function load() { const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false }); setRows(data || []); }
  useEffect(() => { load(); }, []);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  function edit(t: any) { setEditing(t.id); setMsg(''); setErr(''); setF({ ...t, pay: (t.pay_cents / 100).toFixed(2).replace('.', ',') }); window.scrollTo({ top: 0 }); }
  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setMsg('');
    const row = { title: f.title.trim(), category: f.category, instructions: f.instructions, before_checklist: f.before_checklist || '', reject_reasons: f.reject_reasons || '', min_seconds: Number(f.min_seconds), max_seconds: Number(f.max_seconds),
      pay_cents: Math.round(parseFloat(String(f.pay).replace(/\./g, '').replace(',', '.')) * 100), max_per_user: Number(f.max_per_user), active: !!f.active };
    if (isNaN(row.pay_cents) || row.pay_cents < 0) { setErr('Valor por vídeo inválido.'); return; }
    if (row.max_seconds < row.min_seconds) { setErr('A duração máxima precisa ser maior que a mínima.'); return; }
    setBusy(true);
    const { error } = editing ? await supabase.from('tasks').update(row).eq('id', editing) : await supabase.from('tasks').insert(row);
    setBusy(false); if (error) { setErr(errMsg(error)); return; }
    setMsg(editing ? 'Tarefa atualizada.' : 'Tarefa criada.'); setEditing(null); setF(emptyTask); load();
  }
  async function toggle(t: any) { await supabase.from('tasks').update({ active: !t.active }).eq('id', t.id); load(); }
  return (
    <div className="stack">
      <form className="card stack" onSubmit={save}>
        <h2>{editing ? 'Editar tarefa' : 'Nova tarefa'}</h2>
        {err && <div className="alert error">{err}</div>}{msg && <div className="alert ok">{msg}</div>}
        <label>Título<input id="tk-title" required minLength={3} maxLength={140} value={f.title} onChange={set('title')} /></label>
        <div className="grid3">
          <label>Categoria<select id="tk-cat" value={f.category} onChange={set('category')}><option value="household">Doméstica</option><option value="workplace">Local de trabalho</option><option value="other">Outra</option></select></label>
          <label>Valor por vídeo aprovado (R$)<input id="tk-pay" inputMode="decimal" value={f.pay} onChange={set('pay')} /></label>
          <label>Máx. envios por pessoa<input id="tk-max" type="number" min={1} value={f.max_per_user} onChange={set('max_per_user')} /></label>
          <label>Duração mínima (s)<input id="tk-min" type="number" min={0} value={f.min_seconds} onChange={set('min_seconds')} /></label>
          <label>Duração máxima (s)<input id="tk-maxs" type="number" min={1} value={f.max_seconds} onChange={set('max_seconds')} /></label>
        </div>
        <label>O que gravar<span className="hint">Uma instrução por linha. Aparece numerada para o colaborador.</span><textarea id="tk-inst" value={f.instructions} onChange={set('instructions')} /></label>
        <label>Antes de gravar (checklist)<span className="hint">Uma linha por item. Ex.: Lente limpa e luz suficiente.</span><textarea id="tk-before" value={f.before_checklist} onChange={set('before_checklist')} /></label>
        <label>O que leva a recusa<span className="hint">Uma linha por motivo. Quanto mais claro, menos vídeos recusados.</span><textarea id="tk-reject" value={f.reject_reasons} onChange={set('reject_reasons')} /></label>
        <label className="check"><input id="tk-active" type="checkbox" checked={!!f.active} onChange={set('active')} />Publicada (colaboradores aprovados veem e podem enviar)</label>
        <div className="alert warn small">Só publique uma tarefa paga quando houver comprador ou verba para pagar todos os vídeos aprovados.</div>
        <div className="row"><button className="btn" disabled={busy}>{editing ? 'Salvar alterações' : 'Criar tarefa'}</button>{editing && <button type="button" className="btn ghost" onClick={() => { setEditing(null); setF(emptyTask); }}>Cancelar</button>}</div>
      </form>
      <div className="table-wrap"><table><thead><tr><th>Tarefa</th><th>Valor</th><th>Duração</th><th>Status</th><th></th></tr></thead>
        <tbody>{rows.map((t) => <tr key={t.id}><td>{t.title}</td><td className="num">{brl(t.pay_cents)}</td><td className="num">{fmtDur(t.min_seconds)} a {fmtDur(t.max_seconds)}</td>
          <td>{t.active ? <span className="pill ok">Publicada</span> : <span className="pill neutral">Rascunho</span>}</td>
          <td><div className="row"><button className="btn sm ghost" onClick={() => edit(t)}>Editar</button><button className="btn sm ghost" onClick={() => toggle(t)}>{t.active ? 'Despublicar' : 'Publicar'}</button></div></td></tr>)}</tbody></table></div>
    </div>
  );
}

function People() {
  const [rows, setRows] = useState<any[] | null>(null); const [filter, setFilter] = useState('pending');
  async function load() { let q = supabase.from('profiles').select('*').order('created_at', { ascending: false }); if (filter !== 'all') q = q.eq('status', filter); const { data } = await q; setRows(data || []); }
  useEffect(() => { load(); }, [filter]);
  async function setStatus(id: string, status: string) { await supabase.from('profiles').update({ status }).eq('id', id); load(); }
  return (
    <div className="stack">
      <label style={{ maxWidth: 260 }}>Mostrar<select id="pp-filter" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="pending">Em análise</option><option value="approved">Aprovados</option><option value="blocked">Bloqueados</option><option value="all">Todos</option></select></label>
      {rows === null ? <p className="muted">Carregando…</p> : rows.length === 0 ? <div className="empty">Ninguém nesta lista.</div> : (
        <div className="table-wrap"><table><thead><tr><th>Nome</th><th>Local</th><th>Contato</th><th>Aparelho</th><th>Cadastro</th><th>Status</th><th></th></tr></thead>
          <tbody>{rows.map((p) => <tr key={p.id}><td>{p.full_name || '—'}{p.role === 'admin' && <span className="pill neutral" style={{ marginLeft: 6 }}>admin</span>}</td>
            <td>{[p.city, p.state].filter(Boolean).join(', ') || '—'}</td><td>{p.phone || '—'}</td><td>{p.device || '—'}</td><td className="num">{fmtDate(p.created_at)}</td>
            <td>{p.status === 'pending' ? <Pill s="pending" /> : <Pill s={p.status} />}</td>
            <td>{p.role !== 'admin' && <div className="row">
              {p.status !== 'approved' && <button className="btn sm" onClick={() => setStatus(p.id, 'approved')}>Aprovar</button>}
              {p.status !== 'blocked' && <button className="btn sm ghost" onClick={() => setStatus(p.id, 'blocked')}>Bloquear</button>}</div>}</td></tr>)}</tbody></table></div>
      )}
    </div>
  );
}

function Payouts() {
  const [rows, setRows] = useState<any[] | null>(null); const [notes, setNotes] = useState<Record<number, string>>({});
  async function load() { const { data } = await supabase.from('payouts').select('*, profiles(full_name)').order('requested_at', { ascending: false }); setRows(data || []); }
  useEffect(() => { load(); }, []);
  async function mark(id: number, status: 'paid' | 'rejected') {
    await supabase.from('payouts').update({ status, paid_at: status === 'paid' ? new Date().toISOString() : null, admin_note: notes[id] || null }).eq('id', id).eq('status', 'requested'); load();
  }
  if (rows === null) return <p className="muted">Carregando…</p>;
  if (rows.length === 0) return <div className="empty">Nenhum saque solicitado.</div>;
  return (
    <div className="stack">
      <div className="alert info small">Faça o Pix pelo seu banco usando a chave mostrada e depois clique em "Marcar como pago". O sistema não envia dinheiro sozinho.</div>
      <div className="table-wrap"><table><thead><tr><th>Colaborador</th><th>Valor</th><th>Chave Pix</th><th>Pedido</th><th>Status</th><th>Observação</th><th></th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}><td>{r.profiles?.full_name}</td><td className="num">{brl(r.amount_cents)}</td><td className="mono">{r.pix_key}</td><td className="num">{fmtDate(r.requested_at)}</td><td><Pill s={r.status} /></td>
          <td>{r.status === 'requested' ? <input aria-label="Observação" value={notes[r.id] || ''} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} placeholder="Ex.: ID do Pix" /> : (r.admin_note || '')}</td>
          <td>{r.status === 'requested' && <div className="row"><button className="btn sm" onClick={() => mark(r.id, 'paid')}>Marcar como pago</button><button className="btn sm ghost" onClick={() => mark(r.id, 'rejected')}>Recusar</button></div>}</td></tr>)}</tbody></table></div>
    </div>
  );
}

function Leads() {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => { supabase.from('leads').select('*').order('created_at', { ascending: false }).then(({ data }) => setRows(data || [])); }, []);
  if (rows === null) return <p className="muted">Carregando…</p>;
  if (rows.length === 0) return <div className="empty">Nenhum pedido de piloto ainda. Eles chegam pelo formulário do site.</div>;
  return (
    <div className="table-wrap"><table><thead><tr><th>Recebido</th><th>Empresa</th><th>Contato</th><th>País</th><th>Horas</th><th>Necessidade</th></tr></thead>
      <tbody>{rows.map((l) => <tr key={l.id}><td className="num">{fmtDate(l.created_at)}</td><td>{l.company}</td><td>{l.contact_name}<br /><span className="mono">{l.email}</span></td><td>{l.country || '—'}</td><td>{l.hours_wanted || '—'}</td><td className="pre" style={{ minWidth: 260 }}>{l.use_case}</td></tr>)}</tbody></table></div>
  );
}

function Export() {
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(''); const [csv, setCsv] = useState('');
  async function build() {
    setBusy(true); setMsg('');
    const { data, error } = await supabase.from('submissions').select('id, storage_path, duration_seconds, width, height, file_size, meta, payout_cents, reviewed_at, created_at, tasks(title,category)').eq('status', 'approved').order('id');
    setBusy(false); if (error) { setMsg(errMsg(error)); return; }
    const head = ['clip_id', 'task', 'category', 'storage_path', 'duration_s', 'resolution', 'file_mb', 'hands_visible', 'country', 'language', 'perspective', 'consent', 'review', 'reviewed_at'];
    const esc = (v: any) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const lines = (data || []).map((r: any) => [`BS-BR-${String(r.id).padStart(5, '0')}`, r.tasks?.title, r.tasks?.category, r.storage_path, r.duration_seconds,
      r.width && r.height ? `${r.width}x${r.height}` : 'unknown', ((r.file_size || 0) / 1048576).toFixed(1), r.meta?.hands_visible || 'unknown', 'BR', 'pt-BR', 'first_person', 'signed_terms_v1', 'human_pass', r.reviewed_at].map(esc).join(','));
    setCsv([head.join(','), ...lines].join('\n')); setMsg(`${lines.length} clipe(s) aprovado(s).`);
  }
  function download() {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' }); const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `borgsstore-clips-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }
  return (
    <div className="card stack">
      <h2>Exportar ficha dos clipes aprovados</h2>
      <p className="muted small">Gera um CSV com os metadados de cada clipe aprovado, no formato da ficha técnica. Os vídeos ficam no armazenamento do Supabase, pasta "videos". Campos não conferidos saem como "unknown".</p>
      <div className="row"><button className="btn" disabled={busy} onClick={build}>{busy ? 'Gerando…' : 'Gerar CSV'}</button>{csv && <button className="btn ghost" onClick={download}>Baixar CSV</button>}</div>
      {msg && <p className="small num">{msg}</p>}
    </div>
  );
}
