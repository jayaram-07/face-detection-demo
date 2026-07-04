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
  match: { text: 'text-ultra', bar: 'bg-ultra', border: 'border-ultra' },
  probable: { text: 'text-amber', bar: 'bg-amber', border: 'border-amber' },
  nomatch: { text: 'text-grease', bar: 'bg-grease', border: 'border-grease' },
};

function verdictFromDistance(distance: number): Verdict {
  const similarity = Math.max(0, Math.min(100, (1 - distance) * 100));
  if (distance < 0.4) {
    return { distance, similarity, label: 'Same person', tone: 'match' };
  }
  if (distance <= 0.6) {
    return { distance, similarity, label: 'Likely the same person', tone: 'probable' };
  }
  return { distance, similarity, label: 'Different people', tone: 'nomatch' };
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
    <div className="flex min-w-0 flex-1 flex-col items-center gap-3">
      <span className="label-caption text-[11px] text-graphite">Subject {id}</span>
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
        className={`relative flex aspect-square w-full max-w-[280px] cursor-pointer items-center justify-center overflow-hidden border bg-paper transition-colors ${
          dragging ? 'border-ultra' : 'border-rule hover:border-ink'
        }`}
      >
        {slot.url ? (
          <img src={slot.url} alt={`Subject ${id}`} className="h-full w-full object-cover" />
        ) : (
          <div className="px-4 text-center">
            <div className="mb-1 font-display text-3xl text-graphite/50">+</div>
            <div className="label-caption text-[10px] text-graphite">Click or drop a photograph</div>
          </div>
        )}
        {/* crop ticks */}
        <span className="pointer-events-none absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-ink/60" />
        <span className="pointer-events-none absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-ink/60" />
        <span className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-ink/60" />
        <span className="pointer-events-none absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-ink/60" />
      </div>
      {slot.error && <div className="font-data text-[11px] text-grease">{slot.error}</div>}
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
        setSlots((prev) => ({ ...prev, A: { ...prev.A, error: 'No face found in Subject A' } }));
        failed = true;
      }
      if (!descB) {
        setSlots((prev) => ({ ...prev, B: { ...prev.B, error: 'No face found in Subject B' } }));
        failed = true;
      }
      if (failed || !descA || !descB) return;

      const distance = faceapi.euclideanDistance(descA, descB);
      setVerdict(verdictFromDistance(distance));
    } catch (err) {
      console.error('face match error', err);
      setSlots((prev) => ({
        ...prev,
        A: { ...prev.A, error: 'Comparison failed — try again' },
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
    <div className="flex w-full flex-col items-center gap-6">
      {/* hidden full-size images used for detection */}
      {slots.A.url && <img ref={imgARef} src={slots.A.url} alt="" className="hidden" crossOrigin="anonymous" />}
      {slots.B.url && <img ref={imgBRef} src={slots.B.url} alt="" className="hidden" crossOrigin="anonymous" />}

      <div className="flex w-full flex-col items-start justify-center gap-6 sm:flex-row">
        <UploadSlot id="A" slot={slots.A} onFile={handleFile} disabled={analyzing} />
        <div className="hidden self-center px-2 sm:flex">
          <span className="font-display text-2xl text-graphite">/</span>
        </div>
        <UploadSlot id="B" slot={slots.B} onFile={handleFile} disabled={analyzing} />
      </div>

      <div className="flex gap-3">
        <button
          onClick={runComparison}
          disabled={!bothSet || analyzing}
          className={`px-7 py-3 font-display text-sm font-semibold transition-colors ${
            bothSet && !analyzing
              ? 'bg-ink text-paper hover:bg-ultra'
              : 'cursor-not-allowed bg-rule/50 text-graphite'
          }`}
        >
          {analyzing ? 'Comparing…' : 'Compare frames'}
        </button>
        <button
          onClick={reset}
          className="border border-rule px-6 py-3 font-display text-sm font-semibold text-graphite transition-colors hover:border-ink hover:text-ink"
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
            className="label-caption text-sm text-ultra"
          >
            Reading biometric signatures…
          </motion.div>
        )}

        {verdict && styles && (
          <motion.div
            key="verdict"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`w-full max-w-xl border-l-2 ${styles.border} bg-paper p-6`}
          >
            <div className="flex flex-col items-center gap-4">
              <div className={`text-center font-display text-2xl font-extrabold tracking-tight ${styles.text}`}>
                {verdict.label}
              </div>
              <div className="w-full">
                <div className="mb-1 flex justify-between font-data text-[11px] text-graphite">
                  <span>SIMILARITY</span>
                  <span>{verdict.similarity.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden bg-panel">
                  <motion.div
                    className={`h-full ${styles.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${verdict.similarity}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                  />
                </div>
              </div>
              <div className="font-data text-[11px] text-graphite">
                euclidean distance · {verdict.distance.toFixed(4)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
