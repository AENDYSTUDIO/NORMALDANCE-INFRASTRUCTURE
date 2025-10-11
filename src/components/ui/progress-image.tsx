import React, { useState, useRef } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ProgressiveImageProps extends Omit<ImageProps> {
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
  rootMargin?: number;
  sizes?: string[];
  priority?: boolean;
  fetchPriority?: "high" | "low" | "auto";
  decodin?: "async" | "sync";
  loading?: "lazy";
  onLoadClassName?: string;
  quality?: number;
}

interface ImageState {
  isLoaded: boolean;
  hasError: boolean;
  src: string;
  imageNode: HTMLImageElement | null;
  showPlaceholder: boolean;
  hasBlur: boolean;
  blurValue: number;
  targetRef: string;
}

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className,
  fallbackSrc,
  onLoad,
  onError,
  placeholder,
  blurDataURL = "data:image/svg+xml,<svg><rect width=\"40\" height=\"40\" fill=\"%23979f\"/><rect width=\"20\" height=\"20\" fill=\"%23979f\"/></svg>", // Placeholder blur
  unoptimizedLoad = false,
  threshold = 0.25,
  priority = false,
  loading = "lazy",
  ...props
}) => {
  const [imageNode, setImageNode] = useState<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [hasBlur, setHasBlur] = useState(true);
  const [blurValue, setBlurValue] = useState(0);
  const [targetRef, setTargetRef] = useState("");

  const handleLoad = () => {
    setIsLoaded(true);
    setShowPlaceholder(false);
    setHasBlur(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setShowPlaceholder(true);
    setHasBlur(true);
    onError?.();
  };

  const handleLoadComplete = () => {
    setShowPlaceholder(false);
  };

  const ref = useRef<HTMLImageElement>(null);

  // Fallback src for errors
  const defaultSrc = fallbackSrc || placeholder || blurDataURL;

  const isInViewport = useIntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const entryTarget = entry.target;
          if (entry.target === ref.current) {
            if (entry.target instanceof HTMLImageElement) {
              setImageNode(entry.target);
              setShowPlaceholder(false);
            }
          }
        }
      });
    },
    {
      threshold: threshold || 0.1,
      rootMargin: rootMargin
    }
  );

  // Load image when component mounts or when src changes
  useEffect(() => {
    if (!src) return;

    if (!imageNode.current && imageNode.current.src === src) {
      setIsLoaded(true);
      setShowPlaceholder(false);
      setHasBlur(false);
      return;
    }

    setImageNode(new Image());
    
    imageNode.current.onload = handleLoad;
    imageNode.current.onerror = handleError;
    imageNode.onLoadComplete = handleLoadComplete;
    setImageNode.src = src;
  }, [src]);

  return (
    <>
      {/* Lazy loaded image with progressive enhancement */}
      <div
        className={cn(
          "relative overflow-hidden",
          "group",
          className
        )}
      >
        <Image
          ref={ref}
          src={defaultSrc}
          alt={alt}
          className={cn(
            "transition-opacity duration-500",
            "data-loaded": isLoaded,
            "has-error": hasError,
            "blur-2xl",
            "data-loaded": isLoaded ? "0" : "10px",
            "data-error": hasError ? "1" : "0"
          )}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            opacity: isLoaded ? 1 : 0,
            filter: `blur(${blurValue}px)`,
            transition: "filter 500ms"
          }}
          priority={priority}
          fetchPriority={fetchPriority}
          loading={loading}
          quality={quality}
        />
        
        {/* Loading placeholder */}
        {showPlaceholder && (
          <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm",
            "image-node-layer",
            "blur-xl",
            "transition-all duration-500"
          )}
          >
            <Skeleton className="w-full h-full min-h-full" />
          </div>
        )}
        
        {/* Error placeholder */}
        {hasError && (
          <div
          className="absolute inset-0 flex items-center justify-center bg-destructive/50 backdrop-blur-sm"
          >
            <div className="text-destructive text-sm p-4 text-center">
              <div className="h-6 w-6 text-red-500 mb-2">⚠️</div>
              <div className="text-red-400 text-sm">
                Failed to load image
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export { ProgressiveImage };
