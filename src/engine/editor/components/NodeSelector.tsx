import React, { useState } from 'react';
import { getAvailableNodeTypes, createNode } from '../logic/NodeManager';
import { 
  setNodeSelectorOpen, 
  setSelectedNodeType, 
  setNodeNameInput, 
  getNodeNameInput
} from '../states/useEditorState';

/**
 * 节点选择器组件
 */
export const NodeSelector: React.FC = () => {
  // 本地状态
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // 获取所有可用节点类型
  const nodeTypes = getAvailableNodeTypes();
  
  // 获取所有分类
  const categories = ['全部', ...Array.from(new Set(nodeTypes.map(t => t.category)))];
  
  // 根据分类和搜索过滤节点类型
  const filteredNodeTypes = nodeTypes.filter(type => {
    const matchesCategory = selectedCategory === '全部' || type.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
                        type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        type.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  // 处理节点创建
  const handleCreateNode = (nodeTypeId: string) => {
    // 保存选择的节点类型
    setSelectedNodeType(nodeTypeId);
    
    // 创建节点
    const node = createNode();
    
    // 关闭选择器
    if (node) {
      handleClose();
    }
  };
  
  // 处理关闭
  const handleClose = () => {
    setNodeSelectorOpen(false);
    setSelectedNodeType(null);
  };
  
  // 处理节点名称变更
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNodeNameInput(e.target.value);
  };
  
  return (
    <div className="node-selector-overlay">
      <div className="node-selector-container">
        <div className="node-selector-header">
          <h3>选择节点类型</h3>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <div className="node-selector-search">
          <input 
            type="text" 
            placeholder="搜索节点类型..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="node-selector-categories">
          {categories.map(category => (
            <button 
              key={category}
              className={`category-button ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        
        <div className="node-selector-name">
          <label htmlFor="node-name">节点名称:</label>
          <input 
            id="node-name" 
            type="text" 
            placeholder="输入节点名称..." 
            value={getNodeNameInput()}
            onChange={handleNameChange}
          />
        </div>
        
        <div className="node-selector-types">
          {filteredNodeTypes.map(nodeType => (
            <div 
              key={nodeType.id} 
              className="node-type-card"
              onClick={() => handleCreateNode(nodeType.id)}
            >
              <div className="node-type-icon">
                {nodeType.icon ? <span className="material-icon">{nodeType.icon}</span> : null}
              </div>
              <div className="node-type-info">
                <h4>{nodeType.name}</h4>
                <p>{nodeType.description}</p>
              </div>
            </div>
          ))}
          
          {filteredNodeTypes.length === 0 && (
            <div className="no-results">未找到匹配的节点类型</div>
          )}
        </div>
      </div>
    </div>
  );
}; 