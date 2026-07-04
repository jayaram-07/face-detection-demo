import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { CropFrame } from './CropFrame';

interface DetectionCardProps {
  children: ReactNode;
  slug?: string;
}

export function DetectionCard({ children, slug = 'The sheet' }: DetectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-3xl"
    >
      <CropFrame slug={slug} note="ƒ / vision">
        <div className="flex min-h-[420px] flex-col items-center justify-center bg-panel p-6 shadow-[0_1px_0_rgba(23,21,15,0.06),0_18px_40px_-24px_rgba(23,21,15,0.35)] sm:p-8">
          {children}
        </div>
      </CropFrame>
    </motion.div>
  );
}
