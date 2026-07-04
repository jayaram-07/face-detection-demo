import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';

const MODELS_URL = '/models';

export type DetectionMode = 'upload' | 'camera' | 'match';

export interface FaceDetail {
  box: { x: number; y: number; width: number; height: number };
  score: number;
  dominantExpression: string;
  age: number;
  gender: string;
  genderProbability: number;
  expressions: Record<string, number>;
}

export interface FaceStats {
  count: number;
  expressions: Record<string, number>;
  faces: FaceDetail[];
}

export function useFaceDetection() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [mode, setMode] = useState<DetectionMode>('upload');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<FaceStats>({ count: 0, expressions: {}, faces: [] });
  const [hasDetected, setHasDetected] = useState(false);
  const [telemetry, setTelemetry] = useState<{ fps: number; detectMs: number }>({ fps: 0, detectMs: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousScoresRef = useRef<number[]>([]);
  const previousAgesRef = useRef<number[]>([]);

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODELS_URL),
        ]);
        setIsLoaded(true);
      } catch (err: any) {
        console.error('Failed to load face-api models:', err);
        setError(`Failed to load detection models: ${err.message || err}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
    
    return () => {
      stopCamera();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startCamera = async () => {
    if (!videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setIsCameraActive(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please grant permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    setStats({ count: 0, expressions: {}, faces: [] });
    setHasDetected(false);
  };

  const toggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const processImageFile = (file: File) => {
    setImageError(null);
    setHasDetected(false);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const loadImageFromUrl = async (url: string) => {
    try {
      setImageError(null);
      setHasDetected(false);
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setImageUrl(objectUrl);
    } catch (err) {
      console.error('Failed to load sample image:', err);
      setImageError('Failed to load sample image.');
    }
  };

  const detectFaces = useCallback(async (element: HTMLVideoElement | HTMLImageElement) => {
    if (!isLoaded || !canvasRef.current) return;

    const detections = await faceapi
      .detectAllFaces(element, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();

    const displaySize = {
      width: element.width || element.clientWidth,
      height: element.height || element.clientHeight,
    };

    if (displaySize.width === 0 || displaySize.height === 0) return;

    faceapi.matchDimensions(canvasRef.current, displaySize);
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      const INK = '#17150f';
      const GREASE = '#da2a1e';
      const PAPER = '#e9e5dc';

      resizedDetections.forEach((det, index) => {
        const { x, y, width, height } = det.detection.box;
        const num = String(index + 1).padStart(2, '0');

        // Landmarks — static retouch dots, quiet
        ctx.fillStyle = 'rgba(23, 21, 15, 0.35)';
        det.landmarks.positions.forEach(pt => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1, 0, 2 * Math.PI);
          ctx.fill();
        });

        // Proof frame — clean ink rectangle
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, width, height);

        // Printer's crop marks — offset registration ticks in grease red
        const tick = 11;
        const off = 5;
        ctx.strokeStyle = GREASE;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        // top-left
        ctx.moveTo(x - off, y - off + tick); ctx.lineTo(x - off, y - off); ctx.lineTo(x - off + tick, y - off);
        // top-right
        ctx.moveTo(x + width + off - tick, y - off); ctx.lineTo(x + width + off, y - off); ctx.lineTo(x + width + off, y - off + tick);
        // bottom-right
        ctx.moveTo(x + width + off, y + height + off - tick); ctx.lineTo(x + width + off, y + height + off); ctx.lineTo(x + width + off - tick, y + height + off);
        // bottom-left
        ctx.moveTo(x - off + tick, y + height + off); ctx.lineTo(x - off, y + height + off); ctx.lineTo(x - off, y + height + off - tick);
        ctx.stroke();

        // Caption slug — solid ink tab riding the top edge
        ctx.font = '600 12px "Spline Sans Mono", ui-monospace, monospace';
        const label = num;
        const padX = 6;
        const tabH = 18;
        const tabW = ctx.measureText(label).width + padX * 2;
        ctx.fillStyle = INK;
        ctx.fillRect(x, y - tabH, tabW, tabH);
        ctx.fillStyle = PAPER;
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + padX, y - tabH / 2 + 1);
        ctx.textBaseline = 'alphabetic';
      });
    }

    // Aggregate stats
    let dominantExpressions: Record<string, number> = {};
    const faces: FaceDetail[] = [];

    if (detections.length > 0) {
      detections.forEach((det, index) => {
        const sorted = Object.entries(det.expressions).sort((a, b) => b[1] - a[1]);
        const dominant = sorted[0][0];
        dominantExpressions[dominant] = (dominantExpressions[dominant] || 0) + 1;
        
        let smoothedScore = det.detection.score;
        if (previousScoresRef.current[index] !== undefined) {
          smoothedScore = (previousScoresRef.current[index] + det.detection.score) / 2;
        }
        previousScoresRef.current[index] = smoothedScore;

        let smoothedAge = det.age;
        if (previousAgesRef.current[index] !== undefined) {
          smoothedAge = (previousAgesRef.current[index] + det.age) / 2;
        }
        previousAgesRef.current[index] = smoothedAge;

        faces.push({
          box: {
            x: det.detection.box.x,
            y: det.detection.box.y,
            width: det.detection.box.width,
            height: det.detection.box.height
          },
          score: smoothedScore,
          dominantExpression: dominant,
          age: Math.round(smoothedAge),
          gender: det.gender,
          genderProbability: det.genderProbability,
          expressions: det.expressions as unknown as Record<string, number>
        });
      });
      previousScoresRef.current = previousScoresRef.current.slice(0, detections.length);
      previousAgesRef.current = previousAgesRef.current.slice(0, detections.length);
    } else {
      previousScoresRef.current = [];
      previousAgesRef.current = [];
    }

    setStats({
      count: detections.length,
      expressions: dominantExpressions,
      faces
    });
    setHasDetected(true);
  }, [isLoaded]);

  // Loop for camera
  const onVideoPlay = useCallback(() => {
    if (!videoRef.current || !isCameraActive) return;

    let lastDetectionTime = 0;
    let isDetecting = false;
    let frameCount = 0;
    let lastTelemetryTime = performance.now();
    let lastDetectMs = 0;

    const loop = async () => {
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        const now = performance.now();
        frameCount++;

        // Publish telemetry at most twice per second
        if (now - lastTelemetryTime >= 500) {
          const fps = Math.round((frameCount * 1000) / (now - lastTelemetryTime));
          setTelemetry({ fps, detectMs: Math.round(lastDetectMs) });
          frameCount = 0;
          lastTelemetryTime = now;
        }

        if (now - lastDetectionTime >= 150 && !isDetecting) {
          lastDetectionTime = now;
          isDetecting = true;
          const detectStart = performance.now();
          detectFaces(videoRef.current).finally(() => {
            lastDetectMs = performance.now() - detectStart;
            isDetecting = false;
          });
        }
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    };
    loop();
  }, [detectFaces, isCameraActive]);

  // Single detection for image
  const onImageLoad = useCallback(() => {
    if (imageRef.current) {
      detectFaces(imageRef.current);
    }
  }, [detectFaces]);

  const onImageError = useCallback(() => {
    setImageError("Couldn't load this image — HEIC/HEIF photos aren't supported by browsers. Please use a JPG, PNG, or WebP image instead.");
    setImageUrl(null);
  }, []);

  // Handle mode switch
  useEffect(() => {
    setHasDetected(false);
    setImageError(null);
    if (mode !== 'camera') {
      stopCamera();
    }
    if (mode === 'camera' || mode === 'match') {
      // Clear image canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      setStats({ count: 0, expressions: {}, faces: [] });
    }
  }, [mode]);

  return {
    isLoaded,
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
  };
}
