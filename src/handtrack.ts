// Detecção das mãos no próprio aparelho (MediaPipe Hand Landmarker). Nenhum quadro de vídeo sai do celular nesta etapa.
import type { HandLandmarker } from '@mediapipe/tasks-vision';

let cached: Promise<HandLandmarker> | null = null;

export function loadHands(): Promise<HandLandmarker> {
  if (!cached) {
    cached = (async () => {
      const { FilesetResolver, HandLandmarker: HL } = await import('@mediapipe/tasks-vision');
      const fileset = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
      const make = (delegate: 'GPU' | 'CPU') => HL.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: '/mediapipe/hand_landmarker.task', delegate },
        runningMode: 'VIDEO', numHands: 2,
        minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5,
      });
      try { return await make('GPU'); } catch { return await make('CPU'); }
    })();
    cached.catch(() => { cached = null; });
  }
  return cached;
}

type Pt = { x: number; y: number };
export type Framing = { ok: boolean; hands: number; reason: string };

const EDGE = 0.02;      // margem mínima até a borda do quadro
const MIN_SIZE = 0.07;  // tamanho mínimo de cada mão em relação ao quadro

export function bbox(h: Pt[]) {
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (const p of h) { if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y; if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y; }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

export function judgeFraming(hands: Pt[][], portrait: boolean): Framing {
  const n = hands.length;
  if (portrait) return { ok: false, hands: n, reason: 'Vire o celular de lado' };
  if (n === 0) return { ok: false, hands: 0, reason: 'Mostre as duas mãos para a câmera' };
  if (n === 1) return { ok: false, hands: 1, reason: 'Falta uma mão. Mostre as duas' };
  const [a, b] = hands;
  if (Math.hypot(a[0].x - b[0].x, a[0].y - b[0].y) < 0.05) return { ok: false, hands: n, reason: 'Separe um pouco as mãos' };
  for (const h of [a, b]) {
    const r = bbox(h);
    if (r.minX < EDGE || r.minY < EDGE || r.maxX > 1 - EDGE || r.maxY > 1 - EDGE) return { ok: false, hands: n, reason: 'Afaste as mãos da borda do quadro' };
    if (Math.max(r.w, r.h) < MIN_SIZE) return { ok: false, hands: n, reason: 'Aproxime as mãos da câmera' };
  }
  return { ok: true, hands: n, reason: 'Mãos enquadradas' };
}

// ---- Validação automática da gravação (roda no aparelho, sem enviar nada) ----
export type Check = { label: string; ok: boolean; detail: string; blocking: boolean };
export type Verdict = { approved: boolean; checks: Check[]; version: string };
export const CHECK_VERSION = 'v1-on-device';

// Limiares iniciais (hipóteses, ainda sem calibração com vídeos reais). Ajustar com os dados da revisão humana.
const MIN_HANDS_PCT = 70, MIN_LUMA = 45, MAX_LUMA = 220, MIN_SHARP = 12, MIN_SIDE = 480;

export function judgeRecording(i: { handsPct: number; seconds: number; minSeconds: number; w: number; h: number; luma: number | null; sharp: number | null }): Verdict {
  const checks: Check[] = [];
  checks.push({ label: 'Duas mãos no quadro', ok: i.handsPct >= MIN_HANDS_PCT, detail: `${i.handsPct}% do tempo (mínimo ${MIN_HANDS_PCT}%)`, blocking: true });
  checks.push({ label: 'Duração', ok: i.seconds >= i.minSeconds, detail: `${Math.round(i.seconds)} s (mínimo ${i.minSeconds} s)`, blocking: true });
  if (i.luma == null) checks.push({ label: 'Iluminação', ok: true, detail: 'não medida', blocking: false });
  else checks.push({ label: 'Iluminação', ok: i.luma >= MIN_LUMA && i.luma <= MAX_LUMA, detail: i.luma < MIN_LUMA ? 'escuro demais, acenda mais luz' : i.luma > MAX_LUMA ? 'claro demais, evite luz direta na lente' : 'adequada', blocking: true });
  if (i.sharp == null) checks.push({ label: 'Nitidez', ok: true, detail: 'não medida', blocking: false });
  else checks.push({ label: 'Nitidez', ok: i.sharp >= MIN_SHARP, detail: i.sharp >= MIN_SHARP ? 'adequada' : 'imagem pode estar borrada, limpe a lente', blocking: false });
  const side = Math.min(i.w, i.h);
  checks.push({ label: 'Resolução', ok: side === 0 || side >= MIN_SIDE, detail: side ? `${i.w}×${i.h}` : 'não informada', blocking: false });
  return { approved: checks.every((c) => c.ok || !c.blocking), checks, version: CHECK_VERSION };
}

// Mede brilho médio e nitidez (variância do laplaciano) de um quadro reduzido.
export function sampleQuality(video: HTMLVideoElement, cv: HTMLCanvasElement): { luma: number; sharp: number } | null {
  const W = 160, H = 90; cv.width = W; cv.height = H;
  const g = cv.getContext('2d', { willReadFrequently: true }); if (!g || !video.videoWidth) return null;
  try { g.drawImage(video, 0, 0, W, H); } catch { return null; }
  const d = g.getImageData(0, 0, W, H).data; const y = new Float32Array(W * H); let sum = 0;
  for (let k = 0; k < W * H; k++) { const v = 0.299 * d[k * 4] + 0.587 * d[k * 4 + 1] + 0.114 * d[k * 4 + 2]; y[k] = v; sum += v; }
  let m = 0, m2 = 0, n = 0;
  for (let r = 1; r < H - 1; r++) for (let c = 1; c < W - 1; c++) { const k = r * W + c; const l = 4 * y[k] - y[k - 1] - y[k + 1] - y[k - W] - y[k + W]; m += l; m2 += l * l; n++; }
  return { luma: sum / (W * H), sharp: m2 / n - (m / n) ** 2 };
}
