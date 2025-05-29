import React, { useState, useRef, useEffect, CSSProperties, ReactNode } from 'react';

/**
 * 面板位置类型
 */
type PanelPosition = 'left' | 'right' | 'top' | 'bottom';

/**
 * 可拖拽面板属性
 */
interface DraggablePanelProps {
  /** 面板位置 */
  position: PanelPosition;
  /** 面板宽度 (仅用于左右面板) */
  width?: number;
  /** 面板高度 (仅用于上下面板) */
  height?: number;
  /** 最小宽度 */
  minWidth?: number;
  /** 最大宽度 */
  maxWidth?: number;
  /** 最小高度 */
  minHeight?: number;
  /** 最大高度 */
  maxHeight?: number;
  /** 调整大小回调 */
  onResize?: (newSize: number) => void;
  /** 面板内容 */
  children: ReactNode;
  /** 自定义样式 */
  style?: CSSProperties;
  /** 自定义类名 */
  className?: string;
}

/**
 * 可拖拽面板组件
 * 支持拖拽调整大小
 */
export const DraggablePanel: React.FC<DraggablePanelProps> = ({
  position,
  width = 250,
  height = 200,
  minWidth = 100,
  maxWidth = 600,
  minHeight = 100,
  maxHeight = 600,
  onResize,
  children,
  style,
  className
}) => {
  // 面板引用
  const panelRef = useRef<HTMLDivElement>(null);
  // 拖动手柄引用
  const handleRef = useRef<HTMLDivElement>(null);
  // 是否正在拖动
  const [isDragging, setIsDragging] = useState(false);
  // 当前大小
  const [currentSize, setCurrentSize] = useState(
    position === 'left' || position === 'right' ? width : height
  );
  
  // 拖动开始位置
  const dragStartRef = useRef({
    x: 0,
    y: 0,
    size: 0
  });
  
  // 处理拖动开始
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      size: currentSize
    };
    
    // 阻止事件冒泡
    e.stopPropagation();
    e.preventDefault();
  };
  
  // 处理拖动
  const handleDrag = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const { x: startX, y: startY, size: startSize } = dragStartRef.current;
    
    let newSize = startSize;
    
    // 根据面板位置计算新尺寸
    switch (position) {
      case 'left':
        newSize = startSize + (e.clientX - startX);
        break;
      case 'right':
        newSize = startSize - (e.clientX - startX);
        break;
      case 'top':
        newSize = startSize + (e.clientY - startY);
        break;
      case 'bottom':
        newSize = startSize - (e.clientY - startY);
        break;
    }
    
    // 应用最小/最大约束
    if (position === 'left' || position === 'right') {
      newSize = Math.max(minWidth, Math.min(maxWidth, newSize));
    } else {
      newSize = Math.max(minHeight, Math.min(maxHeight, newSize));
    }
    
    // 更新尺寸
    setCurrentSize(newSize);
    
    // 调用回调
    if (onResize) {
      onResize(newSize);
    }
  };
  
  // 处理拖动结束
  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  // 设置拖动事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
    } else {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);
  
  // 计算面板样式
  const getPanelStyle = (): CSSProperties => {
    const baseStyle: CSSProperties = {
      position: 'relative',
      overflow: 'hidden',
      ...style
    };
    
    // 根据位置设置尺寸和样式
    switch (position) {
      case 'left':
      case 'right':
        return {
          ...baseStyle,
          width: `${currentSize}px`,
          height: '100%',
        };
      case 'top':
      case 'bottom':
        return {
          ...baseStyle,
          width: '100%',
          height: `${currentSize}px`,
        };
    }
  };
  
  // 计算拖动手柄样式
  const getHandleStyle = (): CSSProperties => {
    const baseStyle: CSSProperties = {
      position: 'absolute',
      backgroundColor: 'transparent',
      transition: 'background-color 0.2s',
      zIndex: 10,
      cursor: position === 'left' || position === 'right' ? 'col-resize' : 'row-resize',
    };
    
    if (isDragging) {
      baseStyle.backgroundColor = 'rgba(0, 120, 215, 0.2)';
    }
    
    // 根据位置设置手柄样式
    switch (position) {
      case 'left':
        return {
          ...baseStyle,
          width: '5px',
          height: '100%',
          top: 0,
          right: 0,
        };
      case 'right':
        return {
          ...baseStyle,
          width: '5px',
          height: '100%',
          top: 0,
          left: 0,
        };
      case 'top':
        return {
          ...baseStyle,
          width: '100%',
          height: '5px',
          bottom: 0,
          left: 0,
        };
      case 'bottom':
        return {
          ...baseStyle,
          width: '100%',
          height: '5px',
          top: 0,
          left: 0,
        };
    }
  };
  
  return (
    <div 
      ref={panelRef}
      className={`draggable-panel ${className || ''}`}
      style={getPanelStyle()}
    >
      {/* 拖动手柄 */}
      <div
        ref={handleRef}
        className="draggable-handle"
        style={getHandleStyle()}
        onMouseDown={handleDragStart}
      />
      
      {/* 面板内容 */}
      <div className="panel-content" style={{ 
        height: '100%',
        overflow: 'auto'
      }}>
        {children}
      </div>
    </div>
  );
}; 