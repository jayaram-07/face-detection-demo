import { motion } from 'framer-motion';

export function Hero() {
  return (
    <div className="relative overflow-hidden py-16 sm:py-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950"></div>
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 pb-2">
            Real-Time Face Detection
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300 max-w-2xl mx-auto">
            Experience high-performance, client-side face detection powered by face-api.js. 
            Upload an image or use your webcam for live tracking and landmark analysis.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
