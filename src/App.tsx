import { useState } from 'react';
import { Hero } from './components/Hero';
import { ModeTabs } from './components/ModeTabs';
import { DetectionCard } from './components/DetectionCard';
import { StatsPanel } from './components/StatsPanel';
import { LoadingSpinner } from './components/LoadingSpinner';
import { FaceMatch } from './components/FaceMatch';
import { useFaceDetection } from './hooks/useFaceDetection';
import { NetworkBackground } from './components/NetworkBackground';
import { CursorSpotlight } from './components/CursorSpotlight';
import { MagneticButton } from './components/MagneticButton';

function App() {
  const {
    isLoading,
    error,
    imageError,
    mode,
    setMode,
    isCameraActive,
    toggleCamera,
    handleImageUpload,
    processImageFile,
    loadImageFromUrl,
    imageUrl,
    videoRef,
    imageRef,
    canvasRef,
    onVideoPlay,
    onImageLoad,
    onImageError,
    stats,
    hasDetected,
    telemetry
  } = useFaceDetection();

  const [isDragging, setIsDragging] = useState(false);

  const exportScan = () => {
    const img = imageRef.current;
    const overlay = canvasRef.current;
    if (!img || !overlay) return;

    const out = document.createElement('canvas');
    out.width = overlay.width;
    out.height = overlay.height;
    const ctx = out.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, out.width, out.height);
    ctx.drawImage(overlay, 0, 0);
    out.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'biometric-scan.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, 'image/png');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

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
                <div 
                  className={`w-full flex flex-col items-center relative transition-colors duration-200 ${isDragging ? 'bg-cyan-900/20 rounded-xl' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {isDragging && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center border-2 border-dashed border-cyan-400 bg-slate-950/80 rounded-xl backdrop-blur-sm">
                      <span className="text-2xl font-mono text-cyan-400 font-bold tracking-widest">DROP IMAGE TO SCAN</span>
                    </div>
                  )}
                  <MagneticButton 
                    as="label"
                    className="mb-4 cursor-pointer group relative inline-flex items-center justify-center px-8 py-3 font-bold text-cyan-400 transition-all duration-200 bg-slate-900/80 border border-cyan-500/50 hover:bg-cyan-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-600 focus:ring-offset-slate-900 shadow-[0_0_15px_rgba(0,255,255,0.2)] uppercase tracking-widest font-mono text-sm"
                  >
                    <span>Choose Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </MagneticButton>
                  
                  <div className="mb-6 flex flex-col items-center gap-2">
                    <span className="text-xs font-mono text-cyan-600 tracking-widest">OR TRY A SAMPLE:</span>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => loadImageFromUrl('/samples/portrait.jpg')}
                        className="w-20 h-20 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-all overflow-hidden rounded"
                      >
                        <img src="/samples/portrait.jpg" alt="Portrait sample" className="w-full h-full object-cover" />
                      </button>
                      <button 
                        onClick={() => loadImageFromUrl('/samples/group.jpg')}
                        className="w-20 h-20 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-all overflow-hidden rounded"
                      >
                        <img src="/samples/group.jpg" alt="Group sample" className="w-full h-full object-cover" />
                      </button>
                    </div>
                  </div>
                  
                  {imageError && (
                    <div className="mb-6 text-center p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 max-w-md mx-auto text-sm">
                      {imageError}
                    </div>
                  )}

                  <div className="relative w-full flex justify-center">
                    {imageUrl && (
                      <img
                        ref={imageRef}
                        src={imageUrl}
                        alt="Upload preview"
                        className="max-w-full max-h-[60vh] rounded-lg object-contain"
                        onLoad={onImageLoad}
                        onError={onImageError}
                      />
                    )}
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
                    />
                  </div>

                  {hasDetected && stats.count > 0 && imageUrl && (
                    <button
                      onClick={exportScan}
                      className="mt-6 px-6 py-2.5 font-mono font-bold text-xs uppercase tracking-widest text-cyan-400 border border-cyan-500/50 bg-slate-900/80 hover:bg-cyan-900/30 transition-all shadow-[0_0_15px_rgba(0,255,255,0.15)]"
                    >
                      ⤓ Export Scan
                    </button>
                  )}
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

                  {isCameraActive && (
                    <div className="mb-4 font-mono text-[11px] tracking-widest text-cyan-500 border border-cyan-500/30 bg-slate-950/70 px-4 py-1.5">
                      FPS: {telemetry.fps} | DETECT: {telemetry.detectMs}ms
                    </div>
                  )}

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
              {mode === 'match' && <FaceMatch />}
            </DetectionCard>

            {mode !== 'match' && <StatsPanel stats={stats} hasDetected={hasDetected} />}
          </>
        )}
        </main>
      </div>
    </div>
  );
}

export default App;
