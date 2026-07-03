import { motion } from 'framer-motion';
import type { DetectionMode } from '../hooks/useFaceDetection';

interface ModeTabsProps {
  mode: DetectionMode;
  setMode: (mode: DetectionMode) => void;
}

export function ModeTabs({ mode, setMode }: ModeTabsProps) {
  const tabs: { id: DetectionMode; label: string }[] = [
    { id: 'upload', label: 'IMAGE_UPLOAD' },
    { id: 'camera', label: 'LIVE_FEED' },
  ];

  return (
    <div className="flex space-x-2 bg-slate-950/80 backdrop-blur-md p-1 border border-cyan-500/30 w-fit mx-auto mb-8 font-mono text-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setMode(tab.id)}
          className={`relative px-6 py-2.5 font-bold tracking-widest transition-colors duration-200 outline-none uppercase ${
            mode === tab.id ? 'text-slate-950' : 'text-cyan-600 hover:text-cyan-400'
          }`}
        >
          {mode === tab.id && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 bg-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.5)]"
              initial={false}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
