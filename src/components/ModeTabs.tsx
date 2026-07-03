import { motion } from 'framer-motion';
import type { DetectionMode } from '../hooks/useFaceDetection';

interface ModeTabsProps {
  mode: DetectionMode;
  setMode: (mode: DetectionMode) => void;
}

export function ModeTabs({ mode, setMode }: ModeTabsProps) {
  const tabs: { id: DetectionMode; label: string }[] = [
    { id: 'upload', label: 'Upload Image' },
    { id: 'camera', label: 'Live Camera' },
  ];

  return (
    <div className="flex space-x-1 bg-slate-800/50 backdrop-blur-md p-1 rounded-xl border border-slate-700/50 w-fit mx-auto mb-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setMode(tab.id)}
          className={`relative px-6 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 outline-none ${
            mode === tab.id ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {mode === tab.id && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg"
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
