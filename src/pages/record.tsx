import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase, brl, fmtDur, errMsg } from '../supabase';
import { useAuth } from '../session';
import { MAX_UPLOAD_BYTES } from '../config';
import { uploadWithProgress } from './collector';
import { bbox, judgeFraming, judgeRecording, loadHands, sampleQuality, type Verdict } from '../handtrack';

type Phase = 'tutorial' | 'starting' | 'aligning' | 'countdown' | 'recording' | 'review' | 'sending';
const CAMERA_PHASES: Phase[] = ['starting', 'aligning', 'countdown', 'recording'];

const STABLE_START_MS = 1200;   // mãos enquadradas por este tempo antes de começar a contagem
const COUNTDOWN_S = 3;
const SIZE_STOP = MAX_UPLOAD_BYTES * 0.94;

function pickMime(): string {
  const MR = (window as any).MediaRecorder;
  if (!MR?.isTypeSupported) return '';
  return ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((t) => MR.isTypeSupported(t)) || '';
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function Illustration() {
  return (
    <svg viewBox="0 0 320 170" role="img" aria-label="Pessoa com o celular preso na cabeça, na altura dos olhos, e as duas mãos à frente" className="rec-illus">
      <rect x="1" y="1" width="318" height="168" rx="16" fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.1)" />
      <circle cx="92" cy="72" r="30" fill="#2A1A12" stroke="#FF9A3D" strokeWidth="2" />
      <path d="M62 150c2-22 16-34 30-34s28 12 30 34" fill="#2A1A12" stroke="#FF9A3D" strokeWidth="2" />
      <rect x="104" y="46" width="30" height="16" rx="4" fill="#FF9A3D" />
      <circle cx="119" cy="54" r="3.4" fill="#120B07" />
      <path d="M92 44h14" stroke="#FF9A3D" strokeWidth="3" strokeLinecap="round" />
      <path d="M62 66c0-14 12-24 30-24" fill="none" stroke="#FF9A3D" strokeWidth="2" strokeDasharray="3 4" />
      <path d="M140 54 L206 54" stroke="#FF9A3D" strokeWidth="1.5" strokeDasharray="4 4" />
      <rect x="196" y="22" width="108" height="124" rx="10" fill="none" stroke="#4ADE80" strokeWidth="2" strokeDasharray="6 5" />
      <path d="M218 118c-6-14-4-28 6-30l4 18" fill="#4ADE80" fillOpacity=".25" stroke="#4ADE80" strokeWidth="2" strokeLinejoin="round" />
      <path d="M282 118c6-14 4-28-6-30l-4 18" fill="#4ADE80" fillOpacity=".25" stroke="#4ADE80" strokeWidth="2" strokeLinejoin="round" />
      <text x="150" y="44" fontSize="10" fill="#BFAE98" fontFamily="Manrope, sans-serif">altura dos olhos</text>
    </svg>
  );
}

export function Record() {
  const { id } = useParams(); const { profile } = useAuth(); const nav = useNavigate();
  const [task, setTask] = useState<any>(null); const [loadErr, setLoadErr] = useState('');
  const [phase, setPhaseState] = useState<Phase>('tutorial');
  const [model, setModel] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState(''); const [ok, setOk] = useState(false);
  const [elapsed, setElapsed] = useState(0); const [sizeMb, setSizeMb] = useState(0); const [count, setCount] = useState(COUNTDOWN_S);
  const [err, setErr] = useState(''); const [portrait, setPortrait] = useState(false); const [noAudio, setNoAudio] = useState(false);
  const [result, setResult] = useState<{ url: string; blob: Blob; seconds: number; w: number; h: number; mime: string; handsPct: number; luma: number | null; sharp: number | null; verdict: Verdict } | null>(null);
  const [progress, setProgress] = useState(0);

  const phaseRef = useRef<Phase>('tutorial');
  const setPhase = (p: Phase) => { phaseRef.current = p; setPhaseState(p); };
  const videoRef = useRef<HTMLVideoElement>(null); const canvasRef = useRef<HTMLCanvasElement>(null); const stageRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null); const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]); const sizeRef = useRef(0);
  const handsRef = useRef<any>(null); const rafRef = useRef(0); const lastDetect = useRef(0);
  const okSince = useRef<number | null>(null); const lostSince = useRef<number | null>(null); const countStart = useRef(0); const countFail = useRef<number | null>(null);
  const recMs = useRef(0); const lastTick = useRef(0); const stats = useRef({ samples: 0, okSamples: 0 });
  const qual = useRef<{ luma: number[]; sharp: number[]; last: number }>({ luma: [], sharp: [], last: 0 }); const qCanvas = useRef<HTMLCanvasElement | null>(null);
  const msgRef = useRef(''); const okRef = useRef(false); const lockRef = useRef<any>(null); const taskRef = useRef<any>(null);
  const resultUrl = useRef('');

  useEffect(() => { supabase.from('tasks').select('*').eq('id', id).maybeSingle().then(({ data, error }) => { if (error || !data) setLoadErr('Tarefa não encontrada ou encerrada.'); setTask(data); taskRef.current = data; }); }, [id]);
  useEffect(() => { loadHands().then((lm) => { handsRef.current = lm; setModel('ready'); }).catch(() => setModel('error')); }, []);
  useEffect(() => { const f = () => setPortrait(window.innerHeight > window.innerWidth); f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  useEffect(() => () => { cleanupCamera(); if (resultUrl.current) URL.revokeObjectURL(resultUrl.current); }, []); // eslint-disable-line

  function say(m: string, good: boolean) {
    if (msgRef.current !== m) { msgRef.current = m; setMsg(m); }
    if (okRef.current !== good) { okRef.current = good; setOk(good); }
  }

  function cleanupCamera() {
    cancelAnimationFrame(rafRef.current);
    try { if (recRef.current && recRef.current.state !== 'inactive') { recRef.current.onstop = null; recRef.current.stop(); } } catch { /* ignora */ }
    streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null;
    try { lockRef.current?.release?.(); } catch { /* ignora */ } lockRef.current = null;
    try { (screen.orientation as any)?.unlock?.(); } catch { /* ignora */ }
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }

  async function openCamera() {
    setErr(''); setNoAudio(false); setPhase('starting'); say('Abrindo a câmera…', false);
    try { await document.documentElement.requestFullscreen?.(); } catch { /* iPhone não permite: segue sem tela cheia */ }
    try { await (screen.orientation as any)?.lock?.('landscape'); } catch { /* só funciona em alguns aparelhos */ }
    try { lockRef.current = await (navigator as any).wakeLock?.request?.('screen'); } catch { /* ignora */ }
    const video = { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } };
    let stream: MediaStream | null = null;
    try { stream = await navigator.mediaDevices.getUserMedia({ video, audio: true }); }
    catch (e: any) {
      if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') { fail('Permita o uso da câmera e do microfone nas configurações do navegador e tente de novo.'); return; }
      try { stream = await navigator.mediaDevices.getUserMedia({ video, audio: false }); setNoAudio(true); }
      catch (e2: any) { fail(e2?.name === 'NotFoundError' ? 'Não encontramos uma câmera neste aparelho.' : 'Não foi possível abrir a câmera. Feche outros apps que usem a câmera e tente de novo.'); return; }
    }
    streamRef.current = stream;
    const v = videoRef.current!; v.srcObject = stream; v.muted = true;
    try { await v.play(); } catch { /* o navegador tenta tocar sozinho */ }
    recMs.current = 0; stats.current = { samples: 0, okSamples: 0 }; qual.current = { luma: [], sharp: [], last: 0 }; sizeRef.current = 0; okSince.current = null; lostSince.current = null;
    setElapsed(0); setSizeMb(0); setPhase('aligning'); say('Preparando o verificador de mãos…', false);
    loop();
  }
  function fail(m: string) { cleanupCamera(); setErr(m); setPhase('tutorial'); }

  function draw(hands: { x: number; y: number }[][], good: boolean) {
    const c = canvasRef.current, v = videoRef.current, st = stageRef.current; if (!c || !v || !st || !v.videoWidth) return;
    const cw = st.clientWidth, ch = st.clientHeight; const sc = Math.min(cw / v.videoWidth, ch / v.videoHeight);
    const w = Math.round(v.videoWidth * sc), h = Math.round(v.videoHeight * sc);
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    c.style.width = `${w}px`; c.style.height = `${h}px`; c.style.left = `${(cw - w) / 2}px`; c.style.top = `${(ch - h) / 2}px`;
    const g = c.getContext('2d')!; g.clearRect(0, 0, w, h);
    const col = good ? '#4ADE80' : '#FF9A3D';
    g.lineWidth = 3; g.strokeStyle = col; g.globalAlpha = 0.9; g.setLineDash([14, 10]);
    g.strokeRect(w * 0.02, h * 0.02, w * 0.96, h * 0.96); g.setLineDash([]);
    for (const hand of hands) {
      const b = bbox(hand); g.globalAlpha = 0.95; g.strokeStyle = col; g.lineWidth = 3;
      g.strokeRect(b.minX * w - 6, b.minY * h - 6, b.w * w + 12, b.h * h + 12);
      g.fillStyle = col; for (const p of hand) { g.beginPath(); g.arc(p.x * w, p.y * h, 3, 0, 6.3); g.fill(); }
    }
  }

  function loop() {
    rafRef.current = requestAnimationFrame(loop);
    const v = videoRef.current, p = phaseRef.current;
    const lm = (import.meta.env.VITE_TEST_HOOK && (window as any).__fakeHands) || handsRef.current; // gancho só existe em build de teste (VITE_TEST_HOOK)
    if (!v || v.readyState < 2 || !v.videoWidth || !CAMERA_PHASES.includes(p)) return;
    if (!lm) { say('Preparando o verificador de mãos…', false); return; }
    const now = performance.now(); if (now - lastDetect.current < 70) return; lastDetect.current = now;
    let res: any; try { res = lm.detectForVideo(v, now); } catch { return; }
    const hands = (res?.landmarks || []) as { x: number; y: number }[][];
    const f = judgeFraming(hands, window.innerHeight > window.innerWidth);
    draw(hands, f.ok);

    if (p === 'aligning') {
      if (f.ok) { okSince.current ??= now; if (now - okSince.current >= STABLE_START_MS) { countStart.current = now; countFail.current = null; setCount(COUNTDOWN_S); setPhase('countdown'); say('Fique assim. Vai começar…', true); } else say('Mãos enquadradas. Fique assim…', true); }
      else { okSince.current = null; say(f.reason, false); }
    } else if (p === 'countdown') {
      if (!f.ok) { countFail.current ??= now; if (now - countFail.current > 400) { okSince.current = null; setPhase('aligning'); say(f.reason, false); return; } } else countFail.current = null;
      const left = COUNTDOWN_S - Math.floor((now - countStart.current) / 1000);
      if (left <= 0) startRecording(); else setCount(left);
    } else if (p === 'recording') {
      // a gravação segue normalmente; as mãos só são conferidas para a validação final
      stats.current.samples++; if (f.ok) stats.current.okSamples++;
      say(f.ok ? 'Gravando' : `Gravando. ${f.reason}`, f.ok);
      if (now - qual.current.last >= 1000) {
        qual.current.last = now; qCanvas.current ??= document.createElement('canvas');
        const q = sampleQuality(v, qCanvas.current); if (q) { qual.current.luma.push(q.luma); qual.current.sharp.push(q.sharp); }
      }
    }
  }

  function startRecording() {
    const stream = streamRef.current; if (!stream) return;
    const mime = pickMime();
    let rec: MediaRecorder;
    try { rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: 2_500_000, audioBitsPerSecond: 96_000 }); }
    catch { fail('Este aparelho não consegue gravar vídeo pelo navegador. Grave com a câmera do celular e use "Enviar vídeo já gravado".'); return; }
    chunksRef.current = []; sizeRef.current = 0; recMs.current = 0; lastTick.current = performance.now();
    rec.ondataavailable = (e) => { if (e.data && e.data.size) { chunksRef.current.push(e.data); sizeRef.current += e.data.size; setSizeMb(sizeRef.current / 1048576); if (sizeRef.current > SIZE_STOP) stopRec(); } };
    rec.onstop = () => finish(rec.mimeType || mime || 'video/webm');
    rec.start(1000); recRef.current = rec; setPhase('recording'); say('Gravando', true);
  }
  function stopRec() { try { if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop(); } catch { /* ignora */ } }

  function finish(mime: string) {
    const settings = streamRef.current?.getVideoTracks()[0]?.getSettings?.() || {};
    const blob = new Blob(chunksRef.current, { type: mime });
    const url = URL.createObjectURL(blob); if (resultUrl.current) URL.revokeObjectURL(resultUrl.current); resultUrl.current = url;
    const s = stats.current;
    const seconds = Math.round((recMs.current / 1000) * 10) / 10; const w = Number(settings.width) || 0, h = Number(settings.height) || 0;
    const handsPct = s.samples ? Math.round((s.okSamples / s.samples) * 100) : 0;
    const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    const luma = avg(qual.current.luma), sharp = avg(qual.current.sharp);
    const verdict = judgeRecording({ handsPct, seconds, minSeconds: taskRef.current?.min_seconds ?? 0, w, h, luma, sharp });
    setResult({ url, blob, seconds, w, h, mime, handsPct, luma, sharp, verdict });
    cleanupCamera(); setPhase('review');
  }

  // cronômetro: só conta o tempo em que a gravação está rodando de fato
  useEffect(() => {
    const t = setInterval(() => {
      if (phaseRef.current !== 'recording') return;
      const now = performance.now(); recMs.current += now - lastTick.current; lastTick.current = now;
      const sec = recMs.current / 1000; setElapsed(sec);
      if (taskRef.current && sec >= taskRef.current.max_seconds) stopRec();
    }, 200);
    return () => clearInterval(t);
  }, []);

  async function send() {
    if (!result || !task) return;
    setPhase('sending'); setErr(''); setProgress(0);
    const ext = result.mime.includes('mp4') ? 'mp4' : 'webm';
    const path = `${profile!.id}/${task.id}/${Date.now()}.${ext}`;
    try {
      const { data: s } = await supabase.auth.getSession();
      const file = new File([result.blob], `gravacao.${ext}`, { type: result.mime.split(';')[0] });
      await uploadWithProgress(path, file, s.session!.access_token, setProgress);
      const { error } = await supabase.from('submissions').insert({
        task_id: task.id, user_id: profile!.id, storage_path: path, file_size: file.size,
        duration_seconds: result.seconds, width: result.w || null, height: result.h || null,
        capture: { source: 'app_camera', hands_in_frame_pct: result.handsPct, mime: result.mime, note: 'verificação feita no aparelho do colaborador', ai_check: { approved: result.verdict.approved, version: result.verdict.version, checks: result.verdict.checks.map((c) => ({ label: c.label, ok: c.ok, detail: c.detail })), luma: result.luma == null ? null : Math.round(result.luma), sharp: result.sharp == null ? null : Math.round(result.sharp) } },
      });
      if (error) throw error;
      nav('/envios', { replace: true, state: { sent: true } });
    } catch (x: any) { setErr(errMsg(x)); setPhase('review'); }
  }
  function again() { if (resultUrl.current) { URL.revokeObjectURL(resultUrl.current); resultUrl.current = ''; } setResult(null); setErr(''); setPhase('tutorial'); }
  function closeCamera() { cleanupCamera(); setPhase('tutorial'); }

  if (loadErr) return <div className="alert error">{loadErr} <Link to="/tarefas">Voltar</Link></div>;
  if (!task) return <p className="muted">Carregando…</p>;

  const canStop = elapsed >= task.min_seconds;
  const inCamera = CAMERA_PHASES.includes(phase);

  return (
    <>
      {/* câmera em tela cheia */}
      <div className="rec-overlay" hidden={!inCamera}>
        <div className="rec-stage" ref={stageRef}>
          <video ref={videoRef} playsInline muted autoPlay />
          <canvas ref={canvasRef} className="rec-canvas" aria-hidden="true" />
        </div>
        <div className="rec-top">
          <button type="button" className="rec-x" onClick={closeCamera} aria-label="Fechar câmera">×</button>
          <span className="rec-title">{task.title}</span>
          <span className={`rec-time num${phase === 'recording' ? ' live' : ''}`}>{phase === 'recording' ? <><i />{mmss(elapsed)} / {mmss(task.max_seconds)} · {sizeMb.toFixed(0)} MB</> : ''}</span>
        </div>
        {phase === 'countdown' && <div className="rec-count" aria-hidden="true">{count}</div>}
        <div className="rec-bottom">
          <div className={`rec-status${ok ? ' ok' : ''}`} role="status" aria-live="polite">{msg}</div>
          {phase === 'recording' && (
            <button type="button" className="btn rec-stop" disabled={!canStop} onClick={stopRec}>{canStop ? 'Parar e revisar' : `Pare a partir de ${fmtDur(task.min_seconds)}`}</button>
          )}
        </div>
        {portrait && <div className="rec-rotate"><svg viewBox="0 0 64 64" width="72" height="72" fill="none" stroke="#FF9A3D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="22" y="8" width="20" height="36" rx="4" /><path d="M14 52a22 22 0 0 0 36 0M50 52l-1-8M50 52l8-2" /></svg><b>Vire o celular de lado</b><span>A gravação só funciona na horizontal.</span></div>}
      </div>

      {phase === 'tutorial' && (
        <div className="stack" style={{ maxWidth: 640 }}>
          <Link className="small" to={`/tarefas/${task.id}`}>← {task.title}</Link>
          <h1>Antes de gravar</h1>
          <Illustration />
          <ol className="guide">
            <li><span className="num">01</span><span><b>Suporte de cabeça.</b> Prenda o celular no suporte, na <b>altura dos olhos</b>, com a câmera de trás apontando para a frente. Sem suporte a imagem balança e o vídeo costuma ser recusado.</span></li>
            <li><span className="num">02</span><span><b>Celular na horizontal.</b> A câmera só abre com o celular deitado.</span></li>
            <li><span className="num">03</span><span><b>As duas mãos no quadro.</b> O app confere sozinho. A gravação <b>só começa</b> quando as duas mãos estão inteiras no quadro. Depois ela segue normalmente, e ao final o app confere se o vídeo ficou bom.</span></li>
            <li><span className="num">04</span><span><b>Boa luz e lente limpa.</b> Sem rostos de outras pessoas, telas ou documentos aparecendo.</span></li>
          </ol>
          <div className="alert info small">Tarefa: <b>{task.title}</b>. Valor: <b>{brl(task.pay_cents)}</b> por vídeo aprovado. Duração: {fmtDur(task.min_seconds)} a {fmtDur(task.max_seconds)}. A conferência das mãos roda no seu aparelho; o vídeo só é enviado quando você tocar em enviar.</div>
          {err && <div className="alert error" role="alert">{err}</div>}
          {model === 'error' && <div className="alert error">Não conseguimos carregar o verificador de enquadramento neste aparelho, então não dá para gravar por aqui. Grave com a câmera do celular e use <Link to={`/tarefas/${task.id}`}>enviar vídeo já gravado</Link>.</div>}
          <div className="row"><button className="btn" onClick={openCamera} disabled={model !== 'ready'}>{model === 'loading' ? 'Preparando verificador…' : 'Abrir câmera'}</button></div>
        </div>
      )}

      {(phase === 'review' || phase === 'sending') && result && (
        <div className="card stack" style={{ maxWidth: 640 }}>
          <h1>Revise sua gravação</h1>
          <video className="rec-review" src={result.url} controls playsInline />
          <div className="meta"><span className="num">Duração {fmtDur(result.seconds)}</span>{result.w > 0 && <span className="num">{result.w}×{result.h}</span>}<span className="num">{(result.blob.size / 1048576).toFixed(1)} MB</span></div>
          <div className={`alert ${result.verdict.approved ? 'ok' : 'error'}`} role="status"><b>{result.verdict.approved ? 'Validação automática: aprovado' : 'Validação automática: reprovado. Grave de novo'}</b>
            <ul className="check-list" style={{ marginTop: 8 }}>{result.verdict.checks.map((c) => <li key={c.label}>{c.ok ? '✓' : '✗'} {c.label}: {c.detail}</li>)}</ul>
            <span className="small">Conferência feita no seu aparelho. Depois do envio, uma pessoa da Borgs ainda revisa o vídeo.</span></div>
          {noAudio && <div className="alert warn small">Esta gravação ficou sem áudio (microfone não liberado).</div>}
          {result.blob.size > MAX_UPLOAD_BYTES && <div className="alert error">O arquivo passou de 50 MB. Grave um trecho mais curto.</div>}
          {err && <div className="alert error" role="alert">{err}</div>}
          {phase === 'sending' && <div className="stack"><div className="progress" aria-label="Progresso do envio"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div><span className="small muted num">{Math.round(progress * 100)}% enviado. Não feche esta página.</span></div>}
          <div className="row">
            <button className="btn" onClick={send} disabled={phase === 'sending' || !result.verdict.approved || result.blob.size > MAX_UPLOAD_BYTES}>{phase === 'sending' ? 'Enviando…' : 'Enviar para revisão'}</button>
            <button className="btn ghost" onClick={again} disabled={phase === 'sending'}>Gravar de novo</button>
          </div>
        </div>
      )}
    </>
  );
}
