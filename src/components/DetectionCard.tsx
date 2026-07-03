import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface DetectionCardProps {
  children: ReactNode;
}

export function DetectionCard({ children }: DetectionCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative group mx-auto max-w-4xl w-full"
    >
      {/* Glowing background effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
      
      {/* Card content */}
      <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl min-h-[400px] flex flex-col items-center justify-center p-4">
        {children}
      </div>
    </motion.div>
  );
}
