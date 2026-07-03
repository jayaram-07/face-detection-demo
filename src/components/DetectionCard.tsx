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
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
      
      {/* Card content */}
      <div className="relative bg-slate-950/80 backdrop-blur-xl border border-cyan-500/30 overflow-hidden shadow-2xl min-h-[400px] flex flex-col items-center justify-center p-4">
        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/50"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/50"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/50"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/50"></div>
        
        {children}
      </div>
    </motion.div>
  );
}
