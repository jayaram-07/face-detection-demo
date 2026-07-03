import { motion } from 'framer-motion';

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-12">
      <div className="relative w-16 h-16">
        <motion.div
          className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-2 border-4 border-transparent border-t-purple-500 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <p className="text-slate-400 font-medium animate-pulse">Loading AI Models...</p>
    </div>
  );
}
