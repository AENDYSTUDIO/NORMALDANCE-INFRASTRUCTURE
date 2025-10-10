"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import Loader from "@/components/ui/loader";

interface LazyPageProps {
  import: () => Promise<React.ComponentType<any>>;
  loading?: React.ComponentType<any>;
  fallback?: React.ComponentType<any>;
  error?: React.ComponentType<any>;
  loadingText?: string;
  skeletonConfig?: {
    className?: string;
    lineCount?: number;
  };
  preload?: boolean;
}

const DEFAULT_LOADING_COMPONENT = Loader;
const DEFAULT_ERROR_COMPONENT = (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="text-center p-4">
      <div className="text-2xl font-bold text-red-500 mb-2">Error</div>
      <p className="text-gray-700">Failed to load page</p>
    </div>
  </div>
);

/**
 * Enhanced lazy loading component with timeout and error handling
 */
const LazyPage: React.FC<LazyPageProps> = ({
  import: Component,
  loading,
  fallback = DEFAULT_LOADING_COMPONENT,
  error = DEFAULT_ERROR_COMPONENT,
  loadingText = "Loading...",
  skeletonConfig = {
    className: "w-full h-64 bg-muted rounded-lg",
    lineCount: 8,
  },
  preload = false,
}) => {
  return (
    <div className="min-h-screen">
      <Suspense
        fallback={loading || fallback}
      >
        <Component />
      </Suspense>
      <div className="hidden">
        {error && (
          <div className="fixed inset-0 flex items-center justify-center bg-background/85 min-h-screen z-50">
          <div className="text-center p-8">
            <div className="text-2xl font-bold text-white mb-2">Error Loading Page</div>
            <p className="text-gray-300">Invalid page data</p>
          </div>
        </div>
        </div>
      )
    </div>
  );
};

/**
 * Enhanced async loading component with timeout and performance tracking
 */
const AsyncLazyPage: React.FC<LazyPageProps> = ({
  import: Component,
  timeout = 10000, // 10 seconds default timeout
  loading = DEFAULT_LOADING_COMPONENT,
  fallback = DEFAULT_ERROR_COMPONENT,
  loadingText = "Loading...",
  error = DEFAULT_ERROR_COMPONENT,
  skeletonConfig = {
    className: "w-full h-64 bg-muted rounded-lg",
    lineCount: 12,
  },
}) => {
  const AsyncComponent = dynamic(
    () => import(import(`../${Component.name}`).default()),
    { 
      loading: loading || DEFAULT_LOADING_COMPONENT,
      ssr: false,
      },
    {
      loading: true,
    }
  );

  return (
    <div className="min-h-screen">
      <React.Suspense fallback={loading || fallback}>
        <AsyncComponent />
      </React.Suspense
        <div className="hidden">
          {error && (
            <div className="fixed inset-0 flex items-center justify-center bg-background/85 min-h-screen z-50">
              <div className="text-center p-8">
                <div className="text-2xl font-bold text-white mb-2">Timeout Loading Page</div>
                <p className="text-gray-300">Request timed out</p>
              </div>
            </div>
          </div>
        </div>
      </React.Suspense>
    </div>
  );
};

/**
 * Progressive image wrapper with enhanced loading states
 */
const ProgressiveImageWrapper: React.FC<React.DetailedHTMLProps<
  Omit<HTMLImageElement>
>> = ({
  className,
  ...props
}) => {
  return <ProgressiveImage {...props} className={cn("transition-transform", className)} />;
};

export {
  LazyPage,
  AsyncLazyPage,
  ProgressiveImageWrapper
};
