import React, { useState, useRef, useEffect } from 'react';
import { Paper, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

interface DockablePanelProps {
  title: string;
  children: React.ReactNode;
  initialPosition?: { x: number, y: number };
  initialSize?: { width: number, height: number };
  onClose?: () => void;
  id: string;
}

export const DockablePanel: React.FC<DockablePanelProps> = ({
  title,
  children,
  initialPosition = { x: 0, y: 0 },
  initialSize = { width: 300, height: 300 },
  onClose,
  id
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // 处理拖拽开始
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // 处理调整大小开始
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  // 全局鼠标移动事件
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      } else if (isResizing) {
        const panel = panelRef.current?.getBoundingClientRect();
        if (panel) {
          setSize({
            width: e.clientX - panel.left,
            height: e.clientY - panel.top
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset]);

  return (
    <Paper
      ref={panelRef}
      elevation={3}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: isDragging || isResizing ? 1000 : 1
      }}
    >
      <div
        style={{
          padding: '8px',
          backgroundColor: '#2a2a2a',
          display: 'flex',
          alignItems: 'center',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleDragStart}
      >
        <DragIndicatorIcon style={{ color: '#aaa', marginRight: 8 }} />
        <Typography variant="subtitle2" style={{ flexGrow: 1, color: '#eee' }}>
          {title}
        </Typography>
        {onClose && (
          <IconButton size="small" onClick={onClose} sx={{ color: '#ddd' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </div>
      
      <div style={{ flexGrow: 1, overflow: 'auto', position: 'relative' }}>
        {children}
      </div>
      
      <div
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: '14px',
          height: '14px',
          cursor: 'nwse-resize',
          backgroundColor: '#2a2a2a'
        }}
        onMouseDown={handleResizeStart}
      />
    </Paper>
  );
}; 