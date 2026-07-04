import { motion } from 'framer-motion';
import type { DetectionMode } from '../hooks/useFaceDetection';

interface ModeTabsProps {
  mode: DetectionMode;
  setMode: (mode: DetectionMode) => void;
}

export function ModeTabs({ mode, setMode }: ModeTabsProps) {
  const tabs: { id: DetectionMode; label: string; n: string }[] = [
    { id: 'upload', label: 'Upload', n: '01' },
    { id: 'camera', label: 'Live', n: '02' },
    { id: 'match', label: 'Compare', n: '03' },
  ];

  return (
    <div className="mx-auto mb-10 flex w-fit items-end gap-8 border-b border-rule">
      {tabs.map((tab) => {
        const active = mode === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id)}
            className="relative flex items-baseline gap-2 pb-3 outline-none"
          >
            <span className={`font-data text-[11px] ${active ? 'text-grease' : 'text-graphite/60'}`}>
              {tab.n}
            </span>
            <span
              className={`label-caption text-sm transition-colors ${
                active ? 'text-ink' : 'text-graphite hover:text-ink'
              }`}
            >
              {tab.label}
            </span>
            {active && (
              <motion.span
                layoutId="tab-underline"
                className="absolute -bottom-px left-0 right-0 h-0.5 bg-ultra"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
