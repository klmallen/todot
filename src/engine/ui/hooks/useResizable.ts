import { useState, useEffect, useRef } from 'react';

interface Size {
  width: number;
  height: number;
}

interface UseResizableOptions {
  initialSize?: Size;
  minSize?: Partial<Size>;
  maxSize?: Partial<Size>;
  aspectRatio?: number; // 宽高比，为undefined时不锁定比例
}

/**
 * 实现可调整大小功能的Hook
 */
export function useResizable({
  initialSize = { width: 300, height: 200 },
  minSize = { width: 100, height: 100 },
  maxSize = { width: Infinity, height: Infinity },
  aspectRatio
}: UseResizableOptions = {}) {
  const [size, setSize] = useState<Size>(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startSize = useRef<Size>({ width: 0, height: 0 });
  
  // 开始调整大小
  const handleResizeStart = (e: React.MouseEvent | MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { ...size };
  };
  
  // 监听调整大小事件
  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;
      
      let newWidth = startSize.current.width + deltaX;
      let newHeight = startSize.current.height + deltaY;
      
      // 应用最小/最大尺寸限制
      if (minSize?.width !== undefined) newWidth = Math.max(minSize.width, newWidth);
      if (maxSize?.width !== undefined) newWidth = Math.min(maxSize.width, newWidth);
      if (minSize?.height !== undefined) newHeight = Math.max(minSize.height, newHeight);
      if (maxSize?.height !== undefined) newHeight = Math.min(maxSize.height, newHeight);
      
      // 处理宽高比
      if (aspectRatio !== undefined) {
        // 基于宽度计算高度
        newHeight = newWidth / aspectRatio;
        
        // 确保高度在限制范围内
        if (minSize?.height !== undefined && newHeight < minSize.height) {
          newHeight = minSize.height;
          newWidth = newHeight * aspectRatio;
        } else if (maxSize?.height !== undefined && newHeight > maxSize.height) {
          newHeight = maxSize.height;
          newWidth = newHeight * aspectRatio;
        }
      }
      
      setSize({ width: newWidth, height: newHeight });
    };
    
    const handleResizeEnd = () => {
      setIsResizing(false);
    };
    
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, minSize, maxSize, aspectRatio]);
  
  return {
    size,
    isResizing,
    handleResizeStart,
    setSize
  };
} 