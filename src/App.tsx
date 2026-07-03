import { Hero } from './components/Hero';
import { ModeTabs } from './components/ModeTabs';
import { DetectionCard } from './components/DetectionCard';
import { StatsPanel } from './components/StatsPanel';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useFaceDetection } from './hooks/useFaceDetection';

function App() {
  const {
    isLoading,
    error,
    mode,
    setMode,
    isCameraActive,
    toggleCamera,
    handleImageUpload,
    videoRef,
    imageRef,
    canvasRef,
    onVideoPlay,
    onImageLoad,
    stats
  } = useFaceDetection();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-20">
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
                  <label className="mb-6 cursor-pointer group relative inline-flex items-center justify-center px-8 py-3 font-bold text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 focus:ring-offset-slate-900 shadow-lg shadow-blue-500/30">
                    <span>Choose Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                  
                  <div className="relative w-full flex justify-center">
                    <img
                      ref={imageRef}
                      alt="Upload preview"
                      className="max-w-full max-h-[60vh] rounded-lg object-contain"
                      onLoad={onImageLoad}
                      crossOrigin="anonymous"
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
                    />
                  </div>
                </div>
              )}

              {mode === 'camera' && (
                <div className="w-full flex flex-col items-center">
                  <button
                    onClick={toggleCamera}
                    className={`mb-6 relative inline-flex items-center justify-center px-8 py-3 font-bold text-white transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-lg ${
                      isCameraActive 
                        ? 'bg-red-500 hover:bg-red-400 focus:ring-red-500 shadow-red-500/30' 
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:ring-blue-600 shadow-blue-500/30'
                    }`}
                  >
                    {isCameraActive ? 'Stop Camera' : 'Start Camera'}
                  </button>

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
  );
}

export default App;
