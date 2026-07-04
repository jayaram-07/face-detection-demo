import { motion } from 'framer-motion';

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-16">
      {/* aperture iris: a thin rotating ring with a set of blades */}
      <div className="relative h-16 w-16">
        <motion.div
          className="absolute inset-0 rounded-full border border-rule"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-t-2 border-ultra"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-[38%] rounded-full bg-grease" />
      </div>
      <p className="label-caption text-xs text-graphite">Loading detection models…</p>
    </div>
  );
}
