import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as faceapi from 'face-api.js';

const MODELS_URL = '/models';

let recognitionModelLoaded = false;

async function ensureRecognitionModel() {
  if (!recognitionModelLoaded) {
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL);
    recognitionModelLoaded = true;
  }
}

type SlotId = 'A' | 'B';

interface SlotState {
  url: string | null;
  error: string | null;
}

interface Verdict {
  distance: number;
  similarity: number;
  label: string;
  tone: 'match' | 'probable' | 'nomatch';
}

const toneStyles: Record<Verdict['tone'], { text: string; bar: string; border: string }> = {
  match: { text: 'text-emerald-400', bar: 'bg-emerald-400', border: 'border-emerald-500/50' },
  probable: { text: 'text-amber-400', bar: 'bg-amber-400', border: 'border-amber-500/50' },
  nomatch: { text: 'text-red-400', bar: 'bg-red-400', border: 'border-red-500/50' },
};

function verdictFromDistance(distance: number): Verdict {
  const similarity = Math.max(0, Math.min(100, (1 - distance) * 100));
  if (distance < 0.4) {
    return { distance, similarity, label: 'MATCH: SAME PERSON (HIGH CONFIDENCE)', tone: 'match' };
  }
  if (distance <= 0.6) {
    return { distance, similarity, label: 'PROBABLE MATCH', tone: 'probable' };
  }
  return { distance, similarity, label: 'NO MATCH: DIFFERENT PEOPLE', tone: 'nomatch' };
}

async function getDescriptor(imgEl: HTMLImageElement): Promise<Float32Array | null> {
  const result = await faceapi
    .detectSingleFace(imgEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  return result?.descriptor ?? null;
}

function UploadSlot({
  id,
  slot,
  onFile,
  disabled,
}: {
  id: SlotId;
  slot: SlotState;
  onFile: (id: SlotId, file: File) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
      <span className="font-mono text-xs tracking-widest text-cyan-500">SUBJECT_{id}</span>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file && !disabled) onFile(id, file);
        }}
        className={`relative w-full aspect-square max-w-[280px] border cursor-pointer transition-all overflow-hidden flex items-center justify-center bg-slate-950/60 ${
          dragging
            ? 'border-cyan-300 shadow-[0_0_25px_rgba(0,255,255,0.4)]'
            : 'border-cyan-500/40 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,255,255,0.25)]'
        }`}
      >
        {slot.url ? (
          <img src={slot.url} alt={`Subject ${id}`} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center px-4">
            <div className="text-cyan-600 font-mono text-3xl mb-2">+</div>
            <div className="text-cyan-600/80 font-mono text-[11px] tracking-widest uppercase">
              Click or drop image
            </div>
          </div>
        )}
        {/* corner brackets */}
        <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-cyan-500/60 pointer-events-none" />
        <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-cyan-500/60 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-cyan-500/60 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-cyan-500/60 pointer-events-none" />
      </div>
      {slot.error && (
        <div className="font-mono text-[11px] text-red-400 tracking-wider">{slot.error}</div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(id, file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export function FaceMatch() {
  const [slots, setSlots] = useState<Record<SlotId, SlotState>>({
    A: { url: null, error: null },
    B: { url: null, error: null },
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  const imgARef = useRef<HTMLImageElement>(null);
  const imgBRef = useRef<HTMLImageElement>(null);

  const handleFile = (id: SlotId, file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setSlots((prev) => ({ ...prev, [id]: { url, error: null } }));
      setVerdict(null);
    };
    reader.readAsDataURL(file);
  };

  const bothSet = Boolean(slots.A.url && slots.B.url);

  const runComparison = async () => {
    if (!bothSet || analyzing) return;
    setAnalyzing(true);
    setVerdict(null);
    setSlots((prev) => ({
      A: { ...prev.A, error: null },
      B: { ...prev.B, error: null },
    }));

    try {
      await ensureRecognitionModel();

      // Use hidden img elements that are guaranteed loaded
      const [imgA, imgB] = [imgARef.current, imgBRef.current];
      if (!imgA || !imgB) throw new Error('images not ready');

      await Promise.all([imgA.decode(), imgB.decode()]);

      const [descA, descB] = await Promise.all([getDescriptor(imgA), getDescriptor(imgB)]);

      let failed = false;
      if (!descA) {
        setSlots((prev) => ({ ...prev, A: { ...prev.A, error: 'NO FACE DETECTED IN SUBJECT_A' } }));
        failed = true;
      }
      if (!descB) {
        setSlots((prev) => ({ ...prev, B: { ...prev.B, error: 'NO FACE DETECTED IN SUBJECT_B' } }));
        failed = true;
      }
      if (failed || !descA || !descB) return;

      const distance = faceapi.euclideanDistance(descA, descB);
      setVerdict(verdictFromDistance(distance));
    } catch (err) {
      console.error('face match error', err);
      setSlots((prev) => ({
        ...prev,
        A: { ...prev.A, error: 'ANALYSIS FAILED — TRY AGAIN' },
      }));
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setSlots({ A: { url: null, error: null }, B: { url: null, error: null } });
    setVerdict(null);
  };

  const styles = verdict ? toneStyles[verdict.tone] : null;

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* hidden full-size images used for detection */}
      {slots.A.url && <img ref={imgARef} src={slots.A.url} alt="" className="hidden" crossOrigin="anonymous" />}
      {slots.B.url && <img ref={imgBRef} src={slots.B.url} alt="" className="hidden" crossOrigin="anonymous" />}

      <div className="flex flex-col sm:flex-row gap-6 w-full items-start justify-center">
        <UploadSlot id="A" slot={slots.A} onFile={handleFile} disabled={analyzing} />
        <div className="hidden sm:flex flex-col items-center justify-center self-center px-2">
          <span className="font-mono text-cyan-500 text-2xl">⇄</span>
        </div>
        <UploadSlot id="B" slot={slots.B} onFile={handleFile} disabled={analyzing} />
      </div>

      <div className="flex gap-4">
        <button
          onClick={runComparison}
          disabled={!bothSet || analyzing}
          className={`px-8 py-3 font-mono font-bold text-sm uppercase tracking-widest border transition-all ${
            bothSet && !analyzing
              ? 'text-cyan-400 border-cyan-500/50 bg-slate-900/80 hover:bg-cyan-900/30 shadow-[0_0_15px_rgba(0,255,255,0.2)]'
              : 'text-slate-600 border-slate-700 bg-slate-900/40 cursor-not-allowed'
          }`}
        >
          {analyzing ? 'ANALYZING…' : 'COMPARE FACES'}
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 font-mono font-bold text-sm uppercase tracking-widest border border-slate-600 text-slate-400 bg-slate-900/60 hover:text-slate-200 hover:border-slate-400 transition-all"
        >
          Reset
        </button>
      </div>

      <AnimatePresence mode="wait">
        {analyzing && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="font-mono text-cyan-400 text-sm tracking-widest animate-pulse"
          >
            [ ANALYZING BIOMETRIC VECTORS… ]
          </motion.div>
        )}

        {verdict && styles && (
          <motion.div
            key="verdict"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`w-full max-w-xl border ${styles.border} bg-slate-950/80 backdrop-blur-md p-6 font-mono relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,255,0.04)_50%)] bg-[length:100%_4px] pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className={`text-lg sm:text-xl font-bold tracking-widest text-center ${styles.text}`}>
                {verdict.label}
              </div>
              <div className="w-full">
                <div className="flex justify-between text-[11px] text-cyan-600 mb-1 tracking-wider">
                  <span>SIMILARITY</span>
                  <span>{verdict.similarity.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-900 overflow-hidden">
                  <motion.div
                    className={`h-full ${styles.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${verdict.similarity}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                  />
                </div>
              </div>
              <div className="text-[11px] text-cyan-600 tracking-wider">
                EUCLIDEAN_DISTANCE: {verdict.distance.toFixed(4)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
