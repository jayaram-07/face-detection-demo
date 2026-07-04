import { motion } from 'framer-motion';

export function Hero() {
  return (
    <header className="relative z-10 mx-auto max-w-6xl px-6 lg:px-8">
      {/* masthead */}
      <div className="flex items-center justify-between border-b border-rule py-4">
        <span className="label-caption text-[11px] text-ink">Face Studio</span>
        <span className="label-caption text-[11px] text-graphite">Computer-vision proofing</span>
      </div>

      <div className="pt-14 pb-10 sm:pt-20 sm:pb-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="font-data text-xs text-grease">01</span>
            <span className="h-px w-10 bg-ink" />
            <span className="label-caption text-[11px] text-graphite">The proof sheet</span>
          </div>

          <h1 className="font-display text-5xl font-extrabold leading-[0.92] tracking-tight text-ink sm:text-7xl">
            Face
            <br />
            Detection
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-graphite">
            A proofing table for computer vision. Drop a photograph, open the camera, or lay
            two frames side by side — every face on the sheet gets found, measured and marked.
          </p>
        </motion.div>
      </div>
    </header>
  );
}
