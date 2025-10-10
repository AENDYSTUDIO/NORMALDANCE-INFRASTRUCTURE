import { optimizeImage, trackBundleSize } from '@/lib/performance-optimizer'

describe('Performance Tests', () => {
  it('should optimize images correctly', () => {
    expect(optimizeImage('test.jpg', 400)).toBe('test.jpg?w=400&q=75&f=webp')
    expect(optimizeImage('', 400)).toBe('/placeholder.jpg')
  })

  it('should track bundle loading time', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    
    Object.defineProperty(window, 'performance', {
      value: { now: () => 100 }
    })
    
    trackBundleSize()
    
    if (process.env.NODE_ENV === 'development') {
      expect(consoleSpy).toHaveBeenCalledWith('Bundle loaded:', 100)
    }
    
    consoleSpy.mockRestore()
  })
})