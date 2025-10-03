'use client';

import Image, { ImageProps } from 'next/image';
import React, { useEffect, useRef, useState } from 'react';

interface ProgressiveImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  placeholderSrc?: string;
  quality?: number;
  onLoad?: () => void;
}

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  placeholderSrc,
  quality = 75,
  onLoad,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || '/placeholder.jpg'); // Use a default placeholder
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) return;

    // Create an image object to preload the actual image
    const image = new window.Image();
    image.src = src;
    
    image.onload = () => {
      setCurrentSrc(src);
      setLoading(false);
      if (onLoad) onLoad();
    };
    
    image.onerror = () => {
      setError(true);
      setLoading(false);
    };
  }, [src, onLoad]);

  return (
    <div className="relative overflow-hidden">
      {error ? (
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-full" />
      ) : (
        <>
          <Image
            {...props}
            src={currentSrc}
            alt={props.alt || ''}
            className={`${loading ? 'blur-sm opacity-80' : 'blur-0 opacity-100'} transition-all duration-300 ${props.className || ''}`}
            quality={quality}
            onLoad={onLoad}
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-pulse bg-gray-200 rounded-full w-10 h-10" />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProgressiveImage;