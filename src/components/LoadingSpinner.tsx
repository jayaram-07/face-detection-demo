import { motion } from 'framer-motion';
import { ScrambleText } from './ScrambleText';

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-12 font-mono">
      <div className="relative w-24 h-24">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 border-2 border-transparent border-t-cyan-500 border-b-cyan-500 rounded-full opacity-50"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        {/* Inner ring */}
        <motion.div
          className="absolute inset-4 border-2 border-transparent border-l-blue-500 border-r-blue-500 rounded-full opacity-70"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        {/* Center dot */}
        <motion.div
          className="absolute inset-[40%] bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(0,255,255,0.8)]"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <p className="text-cyan-400 font-bold tracking-widest uppercase text-sm">
        <ScrambleText text="INITIALIZING NEURAL NETWORKS..." />
      </p>
    </div>
  );
}
