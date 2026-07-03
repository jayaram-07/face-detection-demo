import { Hero } from './components/Hero';
import { ModeTabs } from './components/ModeTabs';
import { DetectionCard } from './components/DetectionCard';
import { StatsPanel } from './components/StatsPanel';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useFaceDetection } from './hooks/useFaceDetection';
import { NetworkBackground } from './components/NetworkBackground';
import { CursorSpotlight } from './components/CursorSpotlight';
import { MagneticButton } from './components/MagneticButton';

function App() {
  const {
    isLoading,
    error,
    mode,
    setMode,
    isCameraActive,
    toggleCamera,
    handleImageUpload,
    imageUrl,
    videoRef,
    imageRef,
    canvasRef,
    onVideoPlay,
    onImageLoad,
    stats
  } = useFaceDetection();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-20 relative overflow-hidden">
      <NetworkBackground />
      <CursorSpotlight />
      
      <div className="relative z-10">
        <Hero />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center p-8 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400 max-w-2xl mx-auto">
            {error}
          </div>
        ) : (
          <>
            <ModeTabs mode={mode} setMode={setMode} />

            <DetectionCard>
              {mode === 'upload' && (
                <div className="w-full flex flex-col items-center">
                  <MagneticButton 
                    as="label"
                    className="mb-6 cursor-pointer group relative inline-flex items-center justify-center px-8 py-3 font-bold text-cyan-400 transition-all duration-200 bg-slate-900/80 border border-cyan-500/50 hover:bg-cyan-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-600 focus:ring-offset-slate-900 shadow-[0_0_15px_rgba(0,255,255,0.2)] uppercase tracking-widest font-mono text-sm"
                  >
                    <span>Choose Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </MagneticButton>
                  
                  <div className="relative w-full flex justify-center">
                    {imageUrl && (
                      <img
                        ref={imageRef}
                        src={imageUrl}
                        alt="Upload preview"
                        className="max-w-full max-h-[60vh] rounded-lg object-contain"
                        onLoad={onImageLoad}
                      />
                    )}
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
                    />
                  </div>
                </div>
              )}

              {mode === 'camera' && (
                <div className="w-full flex flex-col items-center">
                  <MagneticButton
                    onClick={toggleCamera}
                    className={`mb-6 relative inline-flex items-center justify-center px-8 py-3 font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-[0_0_15px_rgba(0,255,255,0.2)] uppercase tracking-widest font-mono text-sm border ${
                      isCameraActive 
                        ? 'text-red-400 bg-slate-900/80 border-red-500/50 hover:bg-red-900/30 focus:ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                        : 'text-cyan-400 bg-slate-900/80 border-cyan-500/50 hover:bg-cyan-900/30 focus:ring-cyan-600'
                    }`}
                  >
                    {isCameraActive ? 'Stop Camera' : 'Start Camera'}
                  </MagneticButton>

                  <div className="relative w-full flex justify-center bg-black/50 rounded-lg overflow-hidden min-h-[300px]">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      onPlay={onVideoPlay}
                      className={`max-w-full max-h-[60vh] object-contain ${!isCameraActive ? 'hidden' : ''}`}
                    />
                    {!isCameraActive && (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                        Camera is inactive
                      </div>
                    )}
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
                    />
                  </div>
                </div>
              )}
            </DetectionCard>

            <StatsPanel stats={stats} />
          </>
        )}
        </main>
      </div>
    </div>
  );
}

export default App;
