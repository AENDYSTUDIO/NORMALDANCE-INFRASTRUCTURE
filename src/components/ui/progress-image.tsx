import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

interface ProgressiveImageProps {
  src: string;
  alt?: string;
  className?: string;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: string;
  blurDataURL?: string;
  unoptimizedLoad?: boolean;
  threshold?: number;
  rootMargin?: string;
  sizes?: string;
  priority?: boolean;
  fetchPriority?: "high" | "low" | "auto";
  decoding?: "async" | "sync";
  loading?: "lazy";
  onLoadClassName?: string;
  quality?: number;
}

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt = "",
  className,
  fallbackSrc,
  onLoad,
  onError,
  placeholder,
  blurDataURL = 'data:image/svg+xml,<svg><rect width="40" height="40" fill="%23979f"/><rect width="20" height="20" fill="%23979f"/></svg>', // Placeholder blur
  unoptimizedLoad,
  threshold,
  rootMargin,
  sizes,
  priority = false,
  loading = "lazy",
  quality = 75,
  fetchPriority = "auto",
  decoding = "async",
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [hasBlur, setHasBlur] = useState(true);
  const [blurValue, setBlurValue] = useState(10);
  const ref = useRef<HTMLImageElement>(null);

  const handleLoad = () => {
    setIsLoaded(true);
    setShowPlaceholder(false);
    setHasBlur(false);
    setBlurValue(0);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setShowPlaceholder(true);
    setHasBlur(true);
    onError?.();
  };

  // Fallback src for errors
  const defaultSrc =
    hasError && fallbackSrc ? fallbackSrc : src || placeholder || blurDataURL;

  // Load image when component mounts or when src changes
  useEffect(() => {
    if (!src) return;

    const img = new window.Image();
    img.onload = () => {
      handleLoad();
    };
    img.onerror = () => {
      handleError();
    };
    img.src = src;
  }, [src, hasError, fallbackSrc, placeholder, blurDataURL]);

  return (
    <>
      {/* Lazy loaded image with progressive enhancement */}
      <div className={cn("relative overflow-hidden", "group", className)}>
        <Image
          ref={ref}
          src={defaultSrc}
          alt={alt}
          className={cn(
            "transition-opacity duration-500",
            isLoaded ? "opacity-100" : "opacity-0",
            hasBlur ? "blur-xl" : ""
          )}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            filter: `blur(${blurValue}px)`,
            transition: "filter 500ms, opacity 500ms",
          }}
          priority={priority}
          fetchPriority={fetchPriority}
          loading={loading}
          quality={quality}
          decoding={decoding}
          sizes={sizes}
        />

        {/* Loading placeholder */}
        {showPlaceholder && !isLoaded && (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm",
              "image-node-layer",
              "transition-all duration-500"
            )}
          >
            <Skeleton className="w-full h-full min-h-full" />
          </div>
        )}

        {/* Error placeholder */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/50 backdrop-blur-sm">
            <div className="text-destructive text-sm p-4 text-center">
              <div className="h-6 w-6 text-red-500 mb-2">⚠️</div>
              <div className="text-red-400 text-sm">Failed to load image</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export { ProgressiveImage };
