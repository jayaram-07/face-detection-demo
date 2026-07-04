import { motion, AnimatePresence } from 'framer-motion';
import type { FaceStats } from '../hooks/useFaceDetection';

interface StatsPanelProps {
  stats: FaceStats;
  hasDetected: boolean;
}

export function StatsPanel({ stats, hasDetected }: StatsPanelProps) {
  return (
    <div className="mx-auto mt-10 flex w-full max-w-3xl flex-col items-center gap-4">
      <AnimatePresence mode="wait">
        {hasDetected && stats.count === 0 && (
          <motion.div
            key="no-faces"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full border-l-2 border-amber bg-panel p-6 text-center"
          >
            <h3 className="label-caption mb-1 text-sm text-ink">Nothing on this sheet</h3>
            <p className="text-sm text-graphite">
              No faces found. Try a clearer, front-facing photograph or better light.
            </p>
          </motion.div>
        )}

        {stats.count > 0 && (
          <motion.div
            key="faces-detected"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full"
          >
            <div className="mb-4 flex items-baseline justify-between border-b border-rule pb-2">
              <h3 className="label-caption text-sm text-ink">Subjects on sheet</h3>
              <span className="font-data text-sm text-grease">{stats.count.toString().padStart(2, '0')}</span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {stats.faces.map((face, idx) => (
                <div key={idx} className="border border-rule bg-panel p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="label-caption bg-ink px-2 py-0.5 text-[10px] text-paper">
                      Frame {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="font-data text-xs text-graphite">
                      {(face.score * 100).toFixed(0)}% conf
                    </span>
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <Stat label="Expression" value={cap(face.dominantExpression)} />
                    <Stat label="Est. age" value={`~${face.age}`} />
                    <Stat label="Read" value={`${cap(face.gender)} · ${(face.genderProbability * 100).toFixed(0)}%`} />
                    <Stat
                      label="Frame"
                      value={`${Math.round(face.box.width)}×${Math.round(face.box.height)}`}
                      mono
                    />
                  </div>

                  <div className="border-t border-rule pt-3">
                    <div className="label-caption mb-2 text-[10px] text-graphite">Expression exposure</div>
                    <div className="space-y-1.5">
                      {Object.entries(face.expressions)
                        .sort((a, b) => b[1] - a[1])
                        .map(([emotion, prob]) => (
                          <div key={emotion} className="flex items-center gap-2 text-[11px]">
                            <div className="w-9 text-graphite">{cap(emotion.substring(0, 4))}</div>
                            <div className="relative h-1.5 flex-1 bg-paper">
                              <div
                                className="absolute left-0 top-0 h-full bg-ink transition-all duration-500 ease-out"
                                style={{ width: `${prob * 100}%` }}
                              />
                            </div>
                            <div className="w-8 text-right font-data text-graphite">
                              {(prob * 100).toFixed(0)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="label-caption text-[9px] text-graphite">{label}</span>
      <span className={mono ? 'font-data text-sm text-ink' : 'text-sm text-ink'}>{value}</span>
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
