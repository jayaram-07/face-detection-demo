import { useState } from 'react';
import { Hero } from './components/Hero';
import { ModeTabs } from './components/ModeTabs';
import { DetectionCard } from './components/DetectionCard';
import { StatsPanel } from './components/StatsPanel';
import { LoadingSpinner } from './components/LoadingSpinner';
import { FaceMatch } from './components/FaceMatch';
import { useFaceDetection } from './hooks/useFaceDetection';
import { StudioBackdrop } from './components/StudioBackdrop';
import { MagneticButton } from './components/MagneticButton';

const slugForMode = { upload: 'Sheet 01 · Upload', camera: 'Sheet 02 · Live', match: 'Sheet 03 · Compare' } as const;

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
      a.download = 'marked-sheet.png';
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

  const primaryBtn =
    'inline-flex items-center justify-center bg-ink px-7 py-3 font-display text-sm font-semibold text-paper transition-colors hover:bg-ultra focus:outline-none';

  return (
    <div className="relative min-h-screen overflow-hidden bg-paper pb-24 text-ink">
      <StudioBackdrop />

      <div className="relative z-10">
        <Hero />

        <main className="mx-auto max-w-6xl px-6 lg:px-8">
          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <div className="mx-auto max-w-2xl border-l-2 border-grease bg-panel p-6 text-sm text-ink">
              {error}
            </div>
          ) : (
            <>
              <ModeTabs mode={mode} setMode={setMode} />

              <DetectionCard slug={slugForMode[mode]}>
                {mode === 'upload' && (
                  <div
                    className={`relative flex w-full flex-col items-center transition-colors duration-200 ${
                      isDragging ? 'bg-ultra/5' : ''
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {isDragging && (
                      <div className="absolute inset-0 z-50 flex items-center justify-center border-2 border-dashed border-ultra bg-panel/85 backdrop-blur-sm">
                        <span className="label-caption text-lg text-ultra">Drop to place on the sheet</span>
                      </div>
                    )}

                    <MagneticButton as="label" className={`mb-5 cursor-pointer ${primaryBtn}`}>
                      <span>Choose a photograph</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </MagneticButton>

                    <div className="mb-7 flex flex-col items-center gap-2">
                      <span className="label-caption text-[11px] text-graphite">or pull a proof</span>
                      <div className="flex gap-3">
                        <button
                          onClick={() => loadImageFromUrl('/samples/portrait.jpg')}
                          className="h-16 w-16 overflow-hidden border border-rule transition-colors hover:border-ink"
                        >
                          <img src="/samples/portrait.jpg" alt="Portrait sample" className="h-full w-full object-cover" />
                        </button>
                        <button
                          onClick={() => loadImageFromUrl('/samples/group.jpg')}
                          className="h-16 w-16 overflow-hidden border border-rule transition-colors hover:border-ink"
                        >
                          <img src="/samples/group.jpg" alt="Group sample" className="h-full w-full object-cover" />
                        </button>
                      </div>
                    </div>

                    {imageError && (
                      <div className="mx-auto mb-6 max-w-md border-l-2 border-grease bg-paper p-4 text-center text-sm text-ink">
                        {imageError}
                      </div>
                    )}

                    <div className="relative flex w-full justify-center">
                      {imageUrl && (
                        <img
                          ref={imageRef}
                          src={imageUrl}
                          alt="Upload preview"
                          className="max-h-[60vh] max-w-full object-contain"
                          onLoad={onImageLoad}
                          onError={onImageError}
                        />
                      )}
                      <canvas
                        ref={canvasRef}
                        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
                      />
                    </div>

                    {hasDetected && stats.count > 0 && imageUrl && (
                      <button
                        onClick={exportScan}
                        className="mt-7 border border-ink px-6 py-2.5 font-display text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
                      >
                        Export marked sheet
                      </button>
                    )}
                  </div>
                )}

                {mode === 'camera' && (
                  <div className="flex w-full flex-col items-center">
                    <MagneticButton
                      onClick={toggleCamera}
                      className={
                        isCameraActive
                          ? 'mb-5 inline-flex items-center justify-center border border-grease px-7 py-3 font-display text-sm font-semibold text-grease transition-colors hover:bg-grease hover:text-paper'
                          : `mb-5 ${primaryBtn}`
                      }
                    >
                      {isCameraActive ? 'Close camera' : 'Open camera'}
                    </MagneticButton>

                    {isCameraActive && (
                      <div className="mb-4 border border-rule bg-paper px-4 py-1.5 font-data text-[11px] text-graphite">
                        {telemetry.fps} fps · {telemetry.detectMs} ms/frame
                      </div>
                    )}

                    <div className="relative flex min-h-[300px] w-full justify-center overflow-hidden bg-ink/90">
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        onPlay={onVideoPlay}
                        className={`max-h-[60vh] max-w-full object-contain ${!isCameraActive ? 'hidden' : ''}`}
                      />
                      {!isCameraActive && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="label-caption text-xs text-paper/50">Camera closed</span>
                        </div>
                      )}
                      <canvas
                        ref={canvasRef}
                        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
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
