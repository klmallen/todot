import React, { useState } from 'react';
import { ResourceInfo, ResourceType } from '../../types';

/**
 * 资源面板组件
 */
export const ResourcePanel: React.FC = () => {
  // 示例资源数据
  const [resources, setResources] = useState<ResourceInfo[]>([
    {
      id: '1',
      name: 'particle_texture.png',
      type: ResourceType.Texture,
      path: '/assets/textures/particle.png',
      preview: '/assets/textures/particle.png'
    },
    {
      id: '2',
      name: 'fire_material',
      type: ResourceType.Material,
      path: '/materials/fire_material',
      preview: '/assets/previews/fire_material.png'
    },
    {
      id: '3',
      name: 'cube.obj',
      type: ResourceType.Mesh,
      path: '/assets/models/cube.obj',
      preview: '/assets/previews/cube.png'
    },
    {
      id: '4',
      name: 'explosion.mp3',
      type: ResourceType.Audio,
      path: '/assets/audio/explosion.mp3'
    },
    {
      id: '5',
      name: 'fire_particles',
      type: ResourceType.ParticleSystem,
      path: '/particle_systems/fire_particles',
      preview: '/assets/previews/fire_particles.png'
    }
  ]);
  
  // 当前选中的资源分类
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all');
  
  // 当前选中的资源
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  
  // 过滤资源
  const filteredResources = selectedType === 'all'
    ? resources
    : resources.filter(resource => resource.type === selectedType);
  
  // 获取资源图标
  const getResourceIcon = (type: ResourceType): string => {
    switch (type) {
      case ResourceType.Texture:
        return '🖼️';
      case ResourceType.Material:
        return '🎨';
      case ResourceType.Mesh:
        return '📦';
      case ResourceType.Audio:
        return '🔊';
      case ResourceType.ParticleSystem:
        return '✨';
      default:
        return '📄';
    }
  };
  
  return (
    <div className="resource-panel" style={{ padding: '10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', color: '#ddd' }}>资源面板</h3>
        
        <div className="resource-actions" style={{ display: 'flex', gap: '5px' }}>
          <button style={{
            backgroundColor: '#333',
            border: 'none',
            color: '#ddd',
            padding: '2px 6px',
            fontSize: '12px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}>
            导入
          </button>
          <button style={{
            backgroundColor: '#333',
            border: 'none',
            color: '#ddd',
            padding: '2px 6px',
            fontSize: '12px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}>
            新建
          </button>
        </div>
      </div>
      
      {/* 资源类型过滤器 */}
      <div className="resource-filters" style={{ 
        display: 'flex', 
        gap: '5px',
        marginBottom: '10px',
        overflowX: 'auto',
        padding: '0 0 5px 0'
      }}>
        <button 
          onClick={() => setSelectedType('all')}
          style={{
            backgroundColor: selectedType === 'all' ? '#444' : '#333',
            border: 'none',
            color: '#ddd',
            padding: '4px 8px',
            fontSize: '12px',
            borderRadius: '3px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          全部
        </button>
        
        <button 
          onClick={() => setSelectedType(ResourceType.Texture)}
          style={{
            backgroundColor: selectedType === ResourceType.Texture ? '#444' : '#333',
            border: 'none',
            color: '#ddd',
            padding: '4px 8px',
            fontSize: '12px',
            borderRadius: '3px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          🖼️ 纹理
        </button>
        
        <button 
          onClick={() => setSelectedType(ResourceType.Material)}
          style={{
            backgroundColor: selectedType === ResourceType.Material ? '#444' : '#333',
            border: 'none',
            color: '#ddd',
            padding: '4px 8px',
            fontSize: '12px',
            borderRadius: '3px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          🎨 材质
        </button>
        
        <button 
          onClick={() => setSelectedType(ResourceType.Mesh)}
          style={{
            backgroundColor: selectedType === ResourceType.Mesh ? '#444' : '#333',
            border: 'none',
            color: '#ddd',
            padding: '4px 8px',
            fontSize: '12px',
            borderRadius: '3px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          📦 网格
        </button>
        
        <button 
          onClick={() => setSelectedType(ResourceType.Audio)}
          style={{
            backgroundColor: selectedType === ResourceType.Audio ? '#444' : '#333',
            border: 'none',
            color: '#ddd',
            padding: '4px 8px',
            fontSize: '12px',
            borderRadius: '3px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          🔊 音频
        </button>
        
        <button 
          onClick={() => setSelectedType(ResourceType.ParticleSystem)}
          style={{
            backgroundColor: selectedType === ResourceType.ParticleSystem ? '#444' : '#333',
            border: 'none',
            color: '#ddd',
            padding: '4px 8px',
            fontSize: '12px',
            borderRadius: '3px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          ✨ 粒子
        </button>
      </div>
      
      {/* 资源列表 */}
      <div className="resource-list" style={{ 
        flex: 1,
        backgroundColor: '#222',
        borderRadius: '3px',
        padding: '10px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        overflowY: 'auto'
      }}>
        {filteredResources.length > 0 ? (
          filteredResources.map(resource => (
            <div 
              key={resource.id}
              className={`resource-item ${selectedResourceId === resource.id ? 'selected' : ''}`}
              onClick={() => setSelectedResourceId(resource.id)}
              style={{
                width: '80px',
                height: '90px',
                backgroundColor: selectedResourceId === resource.id ? '#444' : '#333',
                borderRadius: '3px',
                padding: '5px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              <div style={{ 
                width: '60px', 
                height: '60px', 
                backgroundColor: '#2a2a2a',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginBottom: '5px'
              }}>
                {resource.preview ? (
                  <img 
                    src={resource.preview} 
                    alt={resource.name}
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%', 
                      borderRadius: '2px' 
                    }}
                  />
                ) : (
                  <span>{getResourceIcon(resource.type)}</span>
                )}
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: '#ddd',
                textAlign: 'center',
                width: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {resource.name}
              </div>
            </div>
          ))
        ) : (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '12px',
            fontStyle: 'italic'
          }}>
            没有找到资源
          </div>
        )}
      </div>
    </div>
  );
}; 