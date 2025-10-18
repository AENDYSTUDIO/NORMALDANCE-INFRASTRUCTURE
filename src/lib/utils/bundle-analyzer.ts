/**
 * Bundle size analysis utilities
 * Run: ANALYZE=true npm run build
 */

export interface BundleSizeConfig {
  maxInitialSize: number; // in KB
  maxTotalSize: number; // in KB
  maxChunkSize: number; // in KB
}

export const bundleSizeConfig: BundleSizeConfig = {
  maxInitialSize: 500, // 500KB initial bundle
  maxTotalSize: 2048, // 2MB total bundle
  maxChunkSize: 200, // 200KB per chunk
};

/**
 * Check if bundle size exceeds limits
 */
export function checkBundleSize(
  initialSize: number,
  totalSize: number,
  chunkSizes: number[]
): {
  passed: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (initialSize > bundleSizeConfig.maxInitialSize) {
    errors.push(
      `Initial bundle size (${initialSize}KB) exceeds limit (${bundleSizeConfig.maxInitialSize}KB)`
    );
  }

  if (totalSize > bundleSizeConfig.maxTotalSize) {
    errors.push(
      `Total bundle size (${totalSize}KB) exceeds limit (${bundleSizeConfig.maxTotalSize}KB)`
    );
  }

  chunkSizes.forEach((size, index) => {
    if (size > bundleSizeConfig.maxChunkSize) {
      warnings.push(
        `Chunk ${index} size (${size}KB) exceeds recommended limit (${bundleSizeConfig.maxChunkSize}KB)`
      );
    }
  });

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Optimization recommendations
 */
export const optimizationTips = [
  'Use dynamic imports for heavy components',
  'Implement code splitting at route level',
  'Lazy load images and media',
  'Remove unused dependencies',
  'Use tree-shaking for libraries',
  'Minimize third-party scripts',
  'Compress images and assets',
  'Use modern image formats (WebP, AVIF)',
  'Implement proper caching strategies',
  'Consider using a CDN for static assets',
];