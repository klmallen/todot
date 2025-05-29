import React, { useEffect, useRef } from 'react';
import { Pane } from 'tweakpane';
import { getSelectedNode } from '../states/useEditorMode';
interface PropertyPanelProps {
  className?: string;
}

/**
 * 属性面板组件，使用Tweakpane显示选中对象的属性
 */
export const PropertyPanel: React.FC<PropertyPanelProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<Pane | null>(null);
  return (
    <div 
      className={`property-panel ${className}`}
      style={{
        position: 'absolute',
        top: '50px',
        right: '10px',
        width: '280px',
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
        overflow: 'auto',
        maxHeight: 'calc(100vh - 100px)'
      }}
    >
      <div ref={containerRef} />
    </div>
  );
}; 