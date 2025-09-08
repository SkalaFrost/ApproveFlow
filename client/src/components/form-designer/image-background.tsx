import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';

interface ImageBackgroundProps {
  file: File;
  children?: React.ReactNode;
  componentPalette?: React.ReactNode;
}

export default function ImageBackground({ file, children, componentPalette }: ImageBackgroundProps) {
  const [scale, setScale] = useState<number>(1);
  const [minScale, setMinScale] = useState<number>(1); // Minimum allowed scale
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [error, setError] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate minimum scale to ensure image width matches container width
  const calculateMinScale = useCallback(() => {
    if (containerRef.current && imageDimensions.width && imageDimensions.height) {
      const containerWidth = containerRef.current.clientWidth;
      
      // Minimum scale ensures image width fills container width
      const calculatedMinScale = Math.min(containerWidth / imageDimensions.width, 1); // Never go above 100%
      setMinScale(Math.max(0.1, calculatedMinScale)); // Absolute minimum 10%
      
      // Adjust current scale if it's below the new minimum
      setScale(prev => Math.max(prev, calculatedMinScale));
    }
  }, [imageDimensions.width, imageDimensions.height]);

  // Load image and calculate minimum scale when file changes
  useEffect(() => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      
      const img = new Image();
      img.onload = () => {
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        setImageDimensions({ width: naturalWidth, height: naturalHeight });
        setError('');
      };
      img.onerror = () => {
        setError('Không thể tải ảnh');
      };
      img.src = url;

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  // Recalculate minimum scale when dimensions change
  useEffect(() => {
    calculateMinScale();
  }, [calculateMinScale]);

  // Recalculate on container resize
  useEffect(() => {
    const handleResize = () => {
      calculateMinScale();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateMinScale]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.25, minScale);
      return newScale;
    });
  };

  const handleResetView = () => {
    setScale(minScale);
  };

  // Removed wheel zoom functionality to allow normal scrolling

  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900 rounded-lg relative">
      {/* Scrollable Container for Image and Form */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'auto'
        }}
        data-testid="image-container"
      >
        {/* Content Container with exact image dimensions - forces scrollbars when needed */}
        <div
          className="bg-white shadow-lg inline-block"
          style={{
            width: imageDimensions.width * scale || 800,
            height: imageDimensions.height * scale || 600,
            position: 'relative'
          }}
        >
          {/* Image Background Layer */}
          <div
            className="absolute top-0 left-0"
            style={{
              width: '100%',
              height: '100%',
            }}
          >
            {error ? (
              <div className="w-full h-[600px] bg-red-50 dark:bg-red-900/20 flex items-center justify-center border border-red-200 dark:border-red-800 rounded">
                <div className="text-center p-4">
                  <p className="text-red-600 dark:text-red-400 font-medium mb-2">Lỗi tải ảnh</p>
                  <p className="text-red-500 dark:text-red-300 text-sm">{error}</p>
                </div>
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt="Background Image"
                className="block pointer-events-none select-none"
                style={{ 
                  width: imageDimensions.width * scale,
                  height: imageDimensions.height * scale,
                  maxWidth: 'none'
                }}
                draggable={false}
              />
            ) : (
              <div className="w-full h-[600px] bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Đang tải ảnh...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Form Components Layer - Positioned over the image */}
          <div
            className="absolute top-0 left-0 z-10"
            style={{
              width: '100%',
              height: '100%',
            }}
          >
            {children}
          </div>
        </div>
      </div>
      
      {/* Component Palette - Fixed position over the scroll area */}
      {componentPalette && (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30">
          {componentPalette}
        </div>
      )}

      {/* Controls - Fixed position over the scroll area */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-1 bg-gray-900/90 px-3 py-1.5 rounded-full shadow-lg border border-gray-600">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleZoomOut}
          disabled={scale <= minScale || Math.abs(scale - minScale) < 0.01}
          data-testid="button-zoom-out"
          className="h-8 w-8 p-0"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <span className="text-sm font-medium min-w-[3rem] text-center px-2 text-white">
          {Math.round(scale * 100)}%
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleZoomIn}
          disabled={scale >= 3}
          data-testid="button-zoom-in"
          className="h-8 w-8 p-0"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-4 bg-border mx-1"></div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleResetView}
          data-testid="button-reset-view"
          className="h-8 w-8 p-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}