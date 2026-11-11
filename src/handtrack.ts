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
