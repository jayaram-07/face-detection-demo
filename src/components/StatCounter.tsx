import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface StatCounterProps {
  value: number;
  label: string;
}

export function StatCounter({ value, label }: StatCounterProps) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current));
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    return display.on("change", (latest) => {
      setDisplayValue(latest);
    });
  }, [display]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl">
      <motion.div 
        className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-400"
        key={displayValue} // Optional: forces re-render for text shadow pop if desired, but framer-motion handles the value
      >
        {displayValue}
      </motion.div>
      <div className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}
