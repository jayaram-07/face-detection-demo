import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';

const MODELS_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

export type DetectionMode = 'upload' | 'camera';

export interface FaceStats {
  count: number;
  expressions: Record<string, number>;
}

export function useFaceDetection() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<DetectionMode>('upload');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stats, setStats] = useState<FaceStats>({ count: 0, expressions: {} });

  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

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
    setStats({ count: 0, expressions: {} });
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
    if (!file || !imageRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (imageRef.current && event.target?.result) {
        imageRef.current.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const detectFaces = useCallback(async (element: HTMLVideoElement | HTMLImageElement) => {
    if (!isLoaded || !canvasRef.current) return;

    const detections = await faceapi
      .detectAllFaces(element, new faceapi.TinyFaceDetectorOptions())
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
    }

    faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);

    // Aggregate stats
    let dominantExpressions: Record<string, number> = {};
    if (detections.length > 0) {
      detections.forEach(det => {
        const sorted = Object.entries(det.expressions).sort((a, b) => b[1] - a[1]);
        const dominant = sorted[0][0];
        dominantExpressions[dominant] = (dominantExpressions[dominant] || 0) + 1;
      });
    }

    setStats({
      count: detections.length,
      expressions: dominantExpressions
    });
  }, [isLoaded]);

  // Loop for camera
  const onVideoPlay = useCallback(() => {
    if (!videoRef.current || !isCameraActive) return;

    const loop = async () => {
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        await detectFaces(videoRef.current);
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

  // Handle mode switch
  useEffect(() => {
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
      setStats({ count: 0, expressions: {} });
    }
  }, [mode]);

  return {
    isLoaded,
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
  };
}
