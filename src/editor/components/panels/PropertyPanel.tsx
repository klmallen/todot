import React, { useEffect, useRef, useState } from 'react';
import { useEditor } from '../../state/EditorContext';
import { EditablePropertyInfo } from '../../types';

/**
 * 属性组件
 */
interface PropertyProps {
  property: EditablePropertyInfo;
  value: any;
  onChange: (value: any) => void;
}

/**
 * 属性编辑组件
 */
const PropertyEditor: React.FC<PropertyProps> = ({ property, value, onChange }) => {
  // 处理属性变更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let newValue: any = e.target.value;
    
    // 根据类型转换值
    switch (property.type) {
      case 'number':
        newValue = parseFloat(newValue);
        break;
      case 'boolean':
        newValue = e.target.checked;
        break;
      // 其他类型转换...
    }
    
    onChange(newValue);
  };
  
  // 渲染不同类型的属性编辑器
  switch (property.type) {
    case 'number':
      return (
        <input
          type="number"
          value={value}
          min={property.min}
          max={property.max}
          step={property.step || 0.1}
          onChange={handleChange}
          style={{
            width: '100%',
            backgroundColor: '#333',
            color: '#ddd',
            border: '1px solid #444',
            padding: '4px 8px',
            borderRadius: '3px',
            fontSize: '12px'
          }}
        />
      );
      
    case 'string':
      return (
        <input
          type="text"
          value={value}
          onChange={handleChange}
          style={{
            width: '100%',
            backgroundColor: '#333',
            color: '#ddd',
            border: '1px solid #444',
            padding: '4px 8px',
            borderRadius: '3px',
            fontSize: '12px'
          }}
        />
      );
      
    case 'boolean':
      return (
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={value}
            onChange={handleChange}
            style={{ marginRight: '8px' }}
          />
          <span style={{ fontSize: '12px', color: '#ddd' }}>
            {value ? '是' : '否'}
          </span>
        </label>
      );
      
    case 'enum':
      return (
        <select
          value={value}
          onChange={handleChange}
          style={{
            width: '100%',
            backgroundColor: '#333',
            color: '#ddd',
            border: '1px solid #444',
            padding: '4px 8px',
            borderRadius: '3px',
            fontSize: '12px'
          }}
        >
          {property.options?.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
      
    case 'color':
      return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="color"
            value={value}
            onChange={handleChange}
            style={{
              width: '30px',
              height: '20px',
              border: 'none',
              padding: 0,
              backgroundColor: 'transparent'
            }}
          />
          <input
            type="text"
            value={value}
            onChange={handleChange}
            style={{
              flex: 1,
              marginLeft: '8px',
              backgroundColor: '#333',
              color: '#ddd',
              border: '1px solid #444',
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '12px'
            }}
          />
        </div>
      );
      
    case 'vector3':
      return (
        <div style={{ display: 'flex', gap: '4px' }}>
          <input
            type="number"
            value={value.x}
            step={0.1}
            onChange={(e) => onChange({ ...value, x: parseFloat(e.target.value) })}
            style={{
              flex: 1,
              backgroundColor: '#333',
              color: '#ddd',
              border: '1px solid #444',
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '12px'
            }}
            placeholder="X"
          />
          <input
            type="number"
            value={value.y}
            step={0.1}
            onChange={(e) => onChange({ ...value, y: parseFloat(e.target.value) })}
            style={{
              flex: 1,
              backgroundColor: '#333',
              color: '#ddd',
              border: '1px solid #444',
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '12px'
            }}
            placeholder="Y"
          />
          <input
            type="number"
            value={value.z}
            step={0.1}
            onChange={(e) => onChange({ ...value, z: parseFloat(e.target.value) })}
            style={{
              flex: 1,
              backgroundColor: '#333',
              color: '#ddd',
              border: '1px solid #444',
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '12px'
            }}
            placeholder="Z"
          />
        </div>
      );
      
    default:
      return (
        <div style={{ color: '#999', fontSize: '12px', fontStyle: 'italic' }}>
          不支持编辑该类型: {property.type}
        </div>
      );
  }
};

/**
 * 属性组接口
 */
interface PropertyGroup {
  name: string;
  properties: EditablePropertyInfo[];
}

/**
 * 属性面板组件
 */
export const PropertyPanel: React.FC = () => {
  const { state } = useEditor();
  
  // 示例属性数据 - 实际应用中应从选中节点获取
  const [propertyGroups] = useState<PropertyGroup[]>([
    {
      name: '基本属性',
      properties: [
        {
          name: 'name',
          displayName: '名称',
          description: '节点名称',
          type: 'string',
        },
        {
          name: 'visible',
          displayName: '可见性',
          description: '节点是否可见',
          type: 'boolean',
        },
        {
          name: 'position',
          displayName: '位置',
          description: '节点位置',
          type: 'vector3',
        },
        {
          name: 'rotation',
          displayName: '旋转',
          description: '节点旋转',
          type: 'vector3',
        },
        {
          name: 'scale',
          displayName: '缩放',
          description: '节点缩放',
          type: 'vector3',
        }
      ]
    },
    {
      name: '粒子系统属性',
      properties: [
        {
          name: 'duration',
          displayName: '持续时间',
          description: '粒子系统持续时间',
          type: 'number',
          min: 0.1,
          max: 100,
          step: 0.1,
        },
        {
          name: 'loop',
          displayName: '循环',
          description: '粒子系统是否循环播放',
          type: 'boolean',
        },
        {
          name: 'prewarm',
          displayName: '预热',
          description: '是否在开始时预热粒子系统',
          type: 'boolean',
        },
        {
          name: 'playbackSpeed',
          displayName: '播放速度',
          description: '粒子系统的播放速度',
          type: 'number',
          min: 0.1,
          max: 10,
          step: 0.1,
        },
        {
          name: 'maxParticles',
          displayName: '最大粒子数',
          description: '粒子系统中的最大粒子数',
          type: 'number',
          min: 10,
          max: 10000,
          step: 10,
        },
        {
          name: 'simulationSpace',
          displayName: '模拟空间',
          description: '粒子系统的模拟空间',
          type: 'enum',
          options: ['Local', 'World'],
        }
      ]
    }
  ]);
  
  // 示例属性值
  const [propertyValues, setPropertyValues] = useState({
    name: '粒子系统',
    visible: true,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    duration: 5.0,
    loop: true,
    prewarm: false,
    playbackSpeed: 1.0,
    maxParticles: 1000,
    simulationSpace: 'Local'
  });
  
  // 处理属性变更
  const handlePropertyChange = (name: string, value: any) => {
    setPropertyValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 在实际应用中，这里应该更新场景中的节点属性
    console.log(`属性已更新: ${name} = `, value);
  };
  
  return (
    <div className="property-panel" style={{ padding: '10px' }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#ddd' }}>属性面板</h3>
      
      {state.selectedNodeId ? (
        <div>
          {propertyGroups.map(group => (
            <div key={group.name} style={{ marginBottom: '16px' }}>
              <div style={{
                backgroundColor: '#333',
                padding: '6px 10px',
                borderRadius: '3px',
                marginBottom: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#ddd'
              }}>
                {group.name}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {group.properties.map(property => (
                  <div key={property.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: '#aaa' }}>
                      {property.displayName}
                      {property.description && (
                        <span title={property.description} style={{ marginLeft: '4px', cursor: 'help' }}>ℹ️</span>
                      )}
                    </label>
                    <PropertyEditor
                      property={property}
                      value={propertyValues[property.name as keyof typeof propertyValues]}
                      onChange={(value) => handlePropertyChange(property.name, value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: '#999', fontSize: '12px', fontStyle: 'italic' }}>
          请选择一个节点以查看其属性
        </div>
      )}
    </div>
  );
}; 