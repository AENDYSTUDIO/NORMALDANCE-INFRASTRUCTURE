"use client";

import React, { Suspense } from "react";

interface LazyPageProps {
  import: () => Promise<{
    default: React.ComponentType<Record<string, unknown>>;
  }>;
  loading?: React.ComponentType<Record<string, unknown>>;
  fallback?: React.ReactElement;
  error?: React.ComponentType<Record<string, unknown>>;
  loadingText?: string;
  skeletonConfig?: {
    className?: string;
    lineCount?: number;
  };
  preload?: boolean;
}

const DEFAULT_LOADING_COMPONENT = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="text-center p-4">
      <div className="text-2xl font-bold text-blue-50 mb-2">Loading...</div>
      <p className="text-gray-700">Please wait</p>
    </div>
  </div>
);

const DEFAULT_ERROR_COMPONENT = () => (
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
  import: ComponentImport,
  loading,
  fallback,
  error: ErrorComponent,
  loadingText = "Loading...",
  skeletonConfig = {
    className: "w-full h-64 bg-muted rounded-lg",
    lineCount: 8,
  },
  preload = false,
}) => {
  // Dynamically import the component
  const LazyComponent = React.lazy(ComponentImport);

  return (
    <div className="min-h-screen">
      <Suspense
        fallback={
          loading
            ? React.createElement(loading)
            : fallback || <DEFAULT_LOADING_COMPONENT />
        }
      >
        <LazyComponent />
      </Suspense>
      {ErrorComponent && <ErrorComponent />}
    </div>
  );
};

interface AsyncLazyPageProps extends LazyPageProps {
  timeout?: number;
}

/**
 * Enhanced async loading component with timeout and performance tracking
 */
const AsyncLazyPage: React.FC<AsyncLazyPageProps> = ({
  import: ComponentImport,
  timeout = 10000, // 10 seconds default timeout
  loading,
  fallback,
  loadingText = "Loading...",
  error: ErrorComponent,
  skeletonConfig = {
    className: "w-full h-64 bg-muted rounded-lg",
    lineCount: 12,
  },
}) => {
  const LazyComponent = React.lazy(ComponentImport);

  return (
    <div className="min-h-screen">
      <Suspense
        fallback={
          loading
            ? React.createElement(loading)
            : fallback || <DEFAULT_LOADING_COMPONENT />
        }
      >
        <LazyComponent />
      </Suspense>
      {ErrorComponent && <ErrorComponent />}
    </div>
  );
};

export { AsyncLazyPage, LazyPage };
