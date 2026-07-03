import { motion } from 'framer-motion';
import { ScrambleText } from './ScrambleText';

export function Hero() {
  return (
    <div className="relative overflow-hidden py-16 sm:py-24 z-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 pb-2 font-mono uppercase">
            <ScrambleText text="Real-Time Face Detection" />
          </h1>
          <p className="mt-6 text-lg leading-8 text-cyan-100/70 max-w-2xl mx-auto font-mono text-sm">
            [ SYSTEM READY ] INITIALIZING BIOMETRIC SCANNER...
            <br />
            AWAITING VISUAL INPUT FOR NEURAL ANALYSIS.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
