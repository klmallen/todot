import React, { useState } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Collapse,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CubeIcon from '@mui/icons-material/VisibilityOff';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import TextFieldsIcon from '@mui/icons-material/TextFields';

// 场景节点类型
interface SceneNode {
  id: string;
  name: string;
  type: 'mesh' | 'light' | 'camera' | 'text' | 'group' | 'empty';
  visible: boolean;
  children?: SceneNode[];
}

interface SceneTreeViewProps {
  nodes: SceneNode[];
  onNodeSelect?: (nodeId: string) => void;
  onNodeVisibilityToggle?: (nodeId: string, visible: boolean) => void;
}

export const SceneTreeView: React.FC<SceneTreeViewProps> = ({
  nodes,
  onNodeSelect,
  onNodeVisibilityToggle
}) => {
  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Typography variant="subtitle2" sx={{ p: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
        场景树
      </Typography>
      <List dense disablePadding>
        {nodes.map((node) => (
          <SceneTreeNode 
            key={node.id} 
            node={node} 
            level={0}
            onSelect={onNodeSelect}
            onVisibilityToggle={onNodeVisibilityToggle}
          />
        ))}
      </List>
    </Box>
  );
};

interface SceneTreeNodeProps {
  node: SceneNode;
  level: number;
  onSelect?: (nodeId: string) => void;
  onVisibilityToggle?: (nodeId: string, visible: boolean) => void;
}

const SceneTreeNode: React.FC<SceneTreeNodeProps> = ({
  node,
  level,
  onSelect,
  onVisibilityToggle
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleSelect = () => {
    onSelect && onSelect(node.id);
  };

  const handleVisibilityToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVisibilityToggle && onVisibilityToggle(node.id, !node.visible);
  };

  // 根据节点类型获取图标
  const getNodeIcon = (type: SceneNode['type']) => {
    switch (type) {
      case 'mesh':
        return <CubeIcon fontSize="small" />;
      case 'light':
        return <LightbulbIcon fontSize="small" />;
      case 'camera':
        return <CameraAltIcon fontSize="small" />;
      case 'text':
        return <TextFieldsIcon fontSize="small" />;
      default:
        return <CubeIcon fontSize="small" />;
    }
  };

  return (
    <>
      <ListItem 
        disablePadding 
        sx={{ 
          pl: level * 2,
          borderLeft: (theme) => 
            `2px solid ${node.id === 'selected-node-id' ? theme.palette.primary.main : 'transparent'}`
        }}
        secondaryAction={
          <Tooltip title={node.visible ? "隐藏" : "显示"}>
            <IconButton edge="end" size="small" onClick={handleVisibilityToggle}>
              {node.visible ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
            </IconButton>
          </Tooltip>
        }
      >
        <ListItemButton onClick={handleSelect} dense>
          {hasChildren && (
            <IconButton size="small" onClick={handleToggleExpand} sx={{ mr: 0.5, p: 0 }}>
              {expanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
            </IconButton>
          )}
          {!hasChildren && <Box sx={{ width: 24 }} />}
          <ListItemIcon sx={{ minWidth: 30 }}>
            {getNodeIcon(node.type)}
          </ListItemIcon>
          <ListItemText primary={node.name} />
        </ListItemButton>
      </ListItem>
      
      {hasChildren && expanded && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <List disablePadding>
            {node.children!.map((childNode) => (
              <SceneTreeNode
                key={childNode.id}
                node={childNode}
                level={level + 1}
                onSelect={onSelect}
                onVisibilityToggle={onVisibilityToggle}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

// 示例数据 - 实际使用时会替换为真实场景数据
export const exampleSceneNodes: SceneNode[] = [
  {
    id: 'scene',
    name: '场景',
    type: 'group',
    visible: true,
    children: [
      {
        id: 'camera-1',
        name: '主相机',
        type: 'camera',
        visible: true
      },
      {
        id: 'light-1',
        name: '定向光',
        type: 'light',
        visible: true
      },
      {
        id: 'group-1',
        name: '物体组',
        type: 'group',
        visible: true,
        children: [
          {
            id: 'cube-1',
            name: '立方体',
            type: 'mesh',
            visible: true
          },
          {
            id: 'sphere-1',
            name: '球体',
            type: 'mesh',
            visible: false
          }
        ]
      }
    ]
  }
]; 