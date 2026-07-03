import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';

const MODELS_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

export type DetectionMode = 'upload' | 'camera';

export interface FaceDetail {
  box: { x: number; y: number; width: number; height: number };
  score: number;
  dominantExpression: string;
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousScoresRef = useRef<number[]>([]);

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL),
        ]);
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to load face-api models:', err);
        setError('Failed to load detection models. Please check your connection.');
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const detectFaces = useCallback(async (element: HTMLVideoElement | HTMLImageElement) => {
    if (!isLoaded || !canvasRef.current) return;

    const detections = await faceapi
      .detectAllFaces(element, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 }))
      .withFaceLandmarks()
      .withFaceExpressions();

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

      const time = Date.now() / 1000;

      resizedDetections.forEach(det => {
        const { x, y, width, height } = det.detection.box;
        
        // Draw corner brackets
        const length = Math.min(width, height) * 0.2;
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        // Top-left
        ctx.moveTo(x, y + length);
        ctx.lineTo(x, y);
        ctx.lineTo(x + length, y);
        // Top-right
        ctx.moveTo(x + width - length, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + length);
        // Bottom-right
        ctx.moveTo(x + width, y + height - length);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x + width - length, y + height);
        // Bottom-left
        ctx.moveTo(x + length, y + height);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x, y + height - length);
        ctx.stroke();

        // Draw scan line
        const scanY = y + (time % 2) / 2 * height;
        ctx.beginPath();
        ctx.moveTo(x, scanY);
        ctx.lineTo(x + width, scanY);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.stroke();

        // Draw landmarks
        const landmarks = det.landmarks.positions;
        ctx.fillStyle = `rgba(0, 255, 255, ${0.5 + Math.sin(time * 5) * 0.5})`;
        landmarks.forEach(pt => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1.5, 0, 2 * Math.PI);
          ctx.fill();
        });
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

        faces.push({
          box: {
            x: det.detection.box.x,
            y: det.detection.box.y,
            width: det.detection.box.width,
            height: det.detection.box.height
          },
          score: smoothedScore,
          dominantExpression: dominant
        });
      });
      previousScoresRef.current = previousScoresRef.current.slice(0, detections.length);
    } else {
      previousScoresRef.current = [];
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

    const loop = async () => {
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        const now = performance.now();
        if (now - lastDetectionTime >= 150 && !isDetecting) {
          lastDetectionTime = now;
          isDetecting = true;
          detectFaces(videoRef.current).finally(() => {
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
    if (mode === 'upload') {
      stopCamera();
    } else {
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
    imageUrl,
    videoRef,
    imageRef,
    canvasRef,
    onVideoPlay,
    onImageLoad,
    onImageError,
    stats,
    hasDetected
  };
}
