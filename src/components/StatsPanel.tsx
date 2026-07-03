import { motion, AnimatePresence } from 'framer-motion';
import type { FaceStats } from '../hooks/useFaceDetection';
import { ScrambleText } from './ScrambleText';

interface StatsPanelProps {
  stats: FaceStats;
}

export function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div className="mt-8 flex flex-col items-center gap-4 w-full max-w-4xl mx-auto">
      <AnimatePresence>
        {stats.count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 p-6 shadow-[0_0_20px_rgba(0,255,255,0.1)] font-mono text-cyan-400 relative overflow-hidden"
          >
            {/* Scanline effect */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,255,0.05)_50%)] bg-[length:100%_4px] pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center border-b border-cyan-500/30 pb-2 mb-4">
                <h3 className="text-lg font-bold tracking-widest uppercase">
                  <ScrambleText text="[ BIOMETRIC SCAN RESULTS ]" />
                </h3>
                <div className="text-sm">
                  FACES DETECTED: <ScrambleText text={stats.count.toString().padStart(2, '0')} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.faces.map((face, idx) => (
                  <div key={idx} className="border border-cyan-500/20 p-3 bg-cyan-950/20">
                    <div className="text-xs text-cyan-500 mb-2">SUBJECT_ID: #{String(idx + 1).padStart(4, '0')}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-cyan-600">CONFIDENCE:</span>{' '}
                        <ScrambleText text={`${(face.score * 100).toFixed(1)}%`} />
                      </div>
                      <div>
                        <span className="text-cyan-600">EXPRESSION:</span>{' '}
                        <ScrambleText text={face.dominantExpression.toUpperCase()} />
                      </div>
                      <div className="col-span-2">
                        <span className="text-cyan-600">BOUNDING_BOX:</span>{' '}
                        <ScrambleText text={`X:${Math.round(face.box.x)} Y:${Math.round(face.box.y)} W:${Math.round(face.box.width)} H:${Math.round(face.box.height)}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
