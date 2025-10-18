'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'

interface VirtualListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  itemHeight: number
  className?: string
  overscan?: number
  onEndReached?: () => void
  endReachedThreshold?: number
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  className = '',
  overscan = 5,
  onEndReached,
  endReachedThreshold = 0.8
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  // Обновляем высоту контейнера при монтировании и изменении размера окна
  useEffect(() => {
    const updateContainerHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight)
      }
    }

    updateContainerHeight()
    window.addEventListener('resize', updateContainerHeight)
    
    return () => {
      window.removeEventListener('resize', updateContainerHeight)
    }
  }, [])

  // Вычисляем видимый диапазон элементов
  const visibleRange = React.useMemo(() => {
    if (containerHeight === 0) return { start: 0, end: 10 }

    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const end = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )

    return { start, end }
  }, [scrollTop, containerHeight, items.length, itemHeight, overscan])

  // Обработчик прокрутки
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    setScrollTop(newScrollTop)
    
    // Проверяем, достигли ли мы конца списка
    if (onEndReached) {
      const scrollHeight = e.currentTarget.scrollHeight
      const scrollPosition = newScrollTop + containerHeight
      const threshold = scrollHeight * endReachedThreshold
      
      if (scrollPosition >= threshold) {
        onEndReached()
      }
    }
  }, [containerHeight, onEndReached, endReachedThreshold])

  // Общая высота всех элементов
  const totalHeight = items.length * itemHeight
  
  // Смещение для видимых элементов
  const offsetY = visibleRange.start * itemHeight
  
  // Видимые элементы
  const visibleItems = items.slice(visibleRange.start, visibleRange.end)

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      onScroll={handleScroll}
      data-testid="virtual-list-container"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            width: '100%'
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.start + index}
              style={{ height: itemHeight }}
              data-index={visibleRange.start + index}
            >
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}