import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Box,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';

// 菜单项类型
interface MenuItem {
  label: string;
  action?: () => void;
  shortcut?: string;
  icon?: React.ReactNode;
  divider?: boolean;
  subMenuItems?: MenuItem[];
}

// 菜单类型
interface MenuGroup {
  label: string;
  items: MenuItem[];
}

interface MenuBarProps {
  onAction?: (action: string, data?: any) => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({ onAction }) => {
  const [anchorEls, setAnchorEls] = useState<Record<string, HTMLElement | null>>({});

  // 菜单配置
  const menus: MenuGroup[] = [
    {
      label: '文件',
      items: [
        {
          label: '新建项目',
          action: () => onAction?.('new_project'),
          shortcut: 'Ctrl+N',
          icon: <AddIcon fontSize="small" />,
        },
        {
          label: '打开项目',
          action: () => onAction?.('open_project'),
          shortcut: 'Ctrl+O',
          icon: <FolderOpenIcon fontSize="small" />,
        },
        {
          label: '保存',
          action: () => onAction?.('save'),
          shortcut: 'Ctrl+S',
          icon: <SaveIcon fontSize="small" />,
        },
        {
          label: '另存为',
          action: () => onAction?.('save_as'),
          shortcut: 'Ctrl+Shift+S',
        },
        { divider: true },
        {
          label: '导出',
          subMenuItems: [
            { label: '导出为GLTF', action: () => onAction?.('export', { format: 'gltf' }) },
            { label: '导出为OBJ', action: () => onAction?.('export', { format: 'obj' }) },
            { label: '导出为FBX', action: () => onAction?.('export', { format: 'fbx' }) },
          ],
        },
        { divider: true },
        {
          label: '关闭项目',
          action: () => onAction?.('close_project'),
        },
        {
          label: '退出',
          action: () => onAction?.('exit'),
          shortcut: 'Alt+F4',
        },
      ],
    },
    {
      label: '编辑',
      items: [
        {
          label: '撤销',
          action: () => onAction?.('undo'),
          shortcut: 'Ctrl+Z',
          icon: <UndoIcon fontSize="small" />,
        },
        {
          label: '重做',
          action: () => onAction?.('redo'),
          shortcut: 'Ctrl+Y',
          icon: <RedoIcon fontSize="small" />,
        },
        { divider: true },
        {
          label: '剪切',
          action: () => onAction?.('cut'),
          shortcut: 'Ctrl+X',
          icon: <ContentCutIcon fontSize="small" />,
        },
        {
          label: '复制',
          action: () => onAction?.('copy'),
          shortcut: 'Ctrl+C',
          icon: <ContentCopyIcon fontSize="small" />,
        },
        {
          label: '粘贴',
          action: () => onAction?.('paste'),
          shortcut: 'Ctrl+V',
          icon: <ContentPasteIcon fontSize="small" />,
        },
        {
          label: '删除',
          action: () => onAction?.('delete'),
          shortcut: 'Delete',
          icon: <DeleteIcon fontSize="small" />,
        },
      ],
    },
    {
      label: '视图',
      items: [
        {
          label: '场景树',
          action: () => onAction?.('toggle_panel', { panel: 'sceneTree' }),
          shortcut: 'Ctrl+1',
        },
        {
          label: '属性面板',
          action: () => onAction?.('toggle_panel', { panel: 'properties' }),
          shortcut: 'Ctrl+2',
        },
        {
          label: '资源浏览器',
          action: () => onAction?.('toggle_panel', { panel: 'assets' }),
          shortcut: 'Ctrl+3',
        },
        {
          label: '控制台',
          action: () => onAction?.('toggle_panel', { panel: 'console' }),
          shortcut: 'Ctrl+4',
        },
      ],
    },
    {
      label: '项目',
      items: [
        {
          label: '运行',
          action: () => onAction?.('run'),
          shortcut: 'F5',
          icon: <PlayArrowIcon fontSize="small" />,
        },
        {
          label: '停止',
          action: () => onAction?.('stop'),
          shortcut: 'Shift+F5',
          icon: <StopIcon fontSize="small" />,
        },
        { divider: true },
        {
          label: '构建',
          action: () => onAction?.('build'),
          shortcut: 'Ctrl+B',
        },
      ],
    },
    {
      label: '帮助',
      items: [
        {
          label: '文档',
          action: () => onAction?.('documentation'),
          icon: <HelpIcon fontSize="small" />,
        },
        {
          label: '关于',
          action: () => onAction?.('about'),
        },
      ],
    },
  ];

  // 打开菜单
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, menuLabel: string) => {
    setAnchorEls({
      ...anchorEls,
      [menuLabel]: event.currentTarget,
    });
  };

  // 关闭菜单
  const handleMenuClose = (menuLabel: string) => {
    setAnchorEls({
      ...anchorEls,
      [menuLabel]: null,
    });
  };

  // 递归渲染子菜单
  const renderMenuItems = (items: MenuItem[], parentLabel: string) => {
    return items.map((item, index) => {
      if (item.divider) {
        return <Divider key={`${parentLabel}-divider-${index}`} />;
      }

      if (item.subMenuItems) {
        return (
          <MenuItem
            key={`${parentLabel}-${item.label}`}
            onClick={(event) => {
              event.stopPropagation();
              handleMenuOpen(event, `${parentLabel}-${item.label}`);
            }}
          >
            {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
            <ListItemText>{item.label}</ListItemText>
            <Typography variant="body2" color="text.secondary">
              ▶
            </Typography>
            <Menu
              anchorEl={anchorEls[`${parentLabel}-${item.label}`]}
              open={Boolean(anchorEls[`${parentLabel}-${item.label}`])}
              onClose={() => handleMenuClose(`${parentLabel}-${item.label}`)}
              onClick={() => handleMenuClose(`${parentLabel}-${item.label}`)}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              PaperProps={{
                sx: {
                  backgroundColor: '#2d2d2d',
                  color: '#ffffff',
                }
              }}
            >
              {renderMenuItems(item.subMenuItems, `${parentLabel}-${item.label}`)}
            </Menu>
          </MenuItem>
        );
      }

      return (
        <MenuItem
          key={`${parentLabel}-${item.label}`}
          sx={{
            '&:hover': {
              backgroundColor: '#3d3d3d',
            }
          }}
          onClick={() => {
            item.action && item.action();
            handleMenuClose(parentLabel);
          }}
        >
          {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
          <ListItemText>{item.label}</ListItemText>
          {item.shortcut && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ ml: 2, fontSize: '0.75rem' }}
            >
              {item.shortcut}
            </Typography>
          )}
        </MenuItem>
      );
    });
  };

  return (
    <AppBar position="static" elevation={0} sx={{ 
      zIndex: 1100, 
      backgroundColor: '#2d2d2d',
      color: '#ffffff'
    }}>
      <Toolbar variant="dense" sx={{ minHeight: 40 }}>
        <Typography
          variant="h6"
          component="div"
          sx={{ mr: 2, display: { xs: 'none', md: 'flex' }, fontSize: '1rem' }}
        >
          VFX编辑器
        </Typography>

        <Box sx={{ flexGrow: 1, display: 'flex' }}>
          {menus.map((menu) => (
            <React.Fragment key={menu.label}>
              <Button
                sx={{ 
                  color: '#ffffff',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#3d3d3d',
                  }
                }}
                onClick={(e) => handleMenuOpen(e, menu.label)}
              >
                {menu.label}
              </Button>
              <Menu
                anchorEl={anchorEls[menu.label]}
                open={Boolean(anchorEls[menu.label])}
                onClose={() => handleMenuClose(menu.label)}
                onClick={() => handleMenuClose(menu.label)}
                MenuListProps={{
                  'aria-labelledby': `menu-button-${menu.label}`,
                  dense: true,
                }}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                PaperProps={{
                  sx: {
                    backgroundColor: '#2d2d2d',
                    color: '#ffffff',
                  }
                }}
              >
                {renderMenuItems(menu.items, menu.label)}
              </Menu>
            </React.Fragment>
          ))}
        </Box>

        <Box sx={{ display: 'flex' }}>
          <Button
            startIcon={<SettingsIcon />}
            color="inherit"
            onClick={() => onAction?.('settings')}
            sx={{ textTransform: 'none' }}
          >
            设置
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}; 