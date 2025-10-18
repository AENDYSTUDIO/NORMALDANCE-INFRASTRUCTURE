/**
 * Утилита для мониторинга производительности компонентов
 */

// Функция для измерения времени рендеринга компонента
export const measureRenderTime = (componentName: string) => {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    console.log(`[Performance] ${componentName} render time: ${endTime - startTime}ms`);
  };
};

// Функция для отслеживания количества ререндеров компонента
export const trackRenders = (componentName: string) => {
  let renderCount = 0;
  
  return () => {
    renderCount++;
    console.log(`[Performance] ${componentName} render count: ${renderCount}`);
  };
};

// Функция для измерения времени выполнения функции
export const measureFunctionTime = <T extends (...args: any[]) => any>(
  fn: T,
  fnName: string
): ((...args: Parameters<T>) => ReturnType<T>) => {
  return (...args: Parameters<T>): ReturnType<T> => {
    const startTime = performance.now();
    const result = fn(...args);
    const endTime = performance.now();
    
    console.log(`[Performance] ${fnName} execution time: ${endTime - startTime}ms`);
    
    return result;
  };
};

// Функция для мониторинга использования памяти
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    // @ts-ignore - Свойство memory не определено в типах TS, но существует в Chrome
    const memoryInfo = performance.memory;
    console.log(`[Performance] Memory usage:`, {
      totalJSHeapSize: `${Math.round(memoryInfo.totalJSHeapSize / (1024 * 1024))} MB`,
      usedJSHeapSize: `${Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024))} MB`,
      jsHeapSizeLimit: `${Math.round(memoryInfo.jsHeapSizeLimit / (1024 * 1024))} MB`,
    });
  } else {
    console.log('[Performance] Memory API not available in this browser');
  }
};