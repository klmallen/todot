import React, { useState, useEffect } from 'react';
import {
  Box,
  Toolbar,
  Button,
  Grid,
  TextField,
  Typography,
  Slider,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { ChromePicker } from 'react-color';

interface MaterialEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
}

interface MaterialData {
  id: string;
  name: string;
  type: string;
  parameters: {
    color: string;
    metalness: number;
    roughness: number;
    [key: string]: any;
  };
}

const MaterialEditor: React.FC<MaterialEditorProps> = ({
  content,
  onChange,
  onSave
}) => {
  // 状态
  const [material, setMaterial] = useState<MaterialData>({
    id: '',
    name: '',
    type: 'standard',
    parameters: {
      color: '#ffffff',
      metalness: 0.5,
      roughness: 0.5
    }
  });
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  
  // 初始化材质数据
  useEffect(() => {
    try {
      if (content) {
        const parsedMaterial = JSON.parse(content) as MaterialData;
        setMaterial(parsedMaterial);
      }
    } catch (error) {
      console.error('解析材质数据失败:', error);
    }
  }, [content]);
  
  // 更新材质属性
  const updateMaterial = (path: string, value: any) => {
    const newMaterial = { ...material };
    
    // 处理嵌套属性
    const pathParts = path.split('.');
    let current: any = newMaterial;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]];
    }
    
    current[pathParts[pathParts.length - 1]] = value;
    
    setMaterial(newMaterial);
    onChange(JSON.stringify(newMaterial, null, 2));
  };
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      bgcolor: '#1e1e1e',
      color: '#ffffff'
    }}>
      <Toolbar variant="dense" sx={{ 
        minHeight: 36, 
        bgcolor: '#252525',
        borderBottom: '1px solid #333'
      }}>
        <Button
          size="small"
          onClick={onSave}
          sx={{ 
            textTransform: 'none',
            bgcolor: '#333',
            color: '#fff',
            '&:hover': {
              bgcolor: '#444',
            }
          }}
        >
          保存
        </Button>
      </Toolbar>
      
      <Box sx={{ 
        p: 2, 
        flexGrow: 1, 
        overflow: 'auto'
      }}>
        <Grid container spacing={2}>
          {/* 基本信息 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              基本信息
            </Typography>
            
            <TextField
              label="名称"
              value={material.name}
              onChange={(e) => updateMaterial('name', e.target.value)}
              fullWidth
              margin="dense"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#2a2a2a',
                  color: '#ffffff'
                },
                '& .MuiInputLabel-root': {
                  color: '#9e9e9e'
                }
              }}
            />
            
            <FormControl 
              fullWidth 
              margin="dense"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#2a2a2a',
                  color: '#ffffff'
                },
                '& .MuiInputLabel-root': {
                  color: '#9e9e9e'
                }
              }}
            >
              <InputLabel>材质类型</InputLabel>
              <Select
                value={material.type}
                onChange={(e) => updateMaterial('type', e.target.value)}
                label="材质类型"
              >
                <MenuItem value="standard">标准 (PBR)</MenuItem>
                <MenuItem value="basic">基础</MenuItem>
                <MenuItem value="phong">Phong</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* 材质参数 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              材质参数
            </Typography>
            
            {/* 颜色选择器 */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="body2" sx={{ width: 80 }}>
                颜色
              </Typography>
              
              <Box 
                sx={{ 
                  width: 40, 
                  height: 24, 
                  bgcolor: material.parameters.color,
                  border: '1px solid #444',
                  cursor: 'pointer',
                  mr: 1
                }}
                onClick={() => setColorPickerOpen(!colorPickerOpen)}
              />
              
              <TextField
                value={material.parameters.color}
                onChange={(e) => updateMaterial('parameters.color', e.target.value)}
                size="small"
                sx={{
                  width: 120,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#2a2a2a',
                    color: '#ffffff'
                  }
                }}
              />
              
              {colorPickerOpen && (
                <Box sx={{ position: 'absolute', zIndex: 10, mt: 10 }}>
                  <ChromePicker
                    color={material.parameters.color}
                    onChange={(color) => updateMaterial('parameters.color', color.hex)}
                    disableAlpha
                  />
                  <Box
                    sx={{
                      position: 'fixed',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      left: 0,
                      zIndex: -1
                    }}
                    onClick={() => setColorPickerOpen(false)}
                  />
                </Box>
              )}
            </Box>
            
            {/* 金属度滑块 */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="body2" sx={{ width: 80 }}>
                金属度
              </Typography>
              
              <Slider
                value={material.parameters.metalness}
                onChange={(_, value) => updateMaterial('parameters.metalness', value)}
                min={0}
                max={1}
                step={0.01}
                sx={{ 
                  mx: 2,
                  color: '#0288d1',
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                    bgcolor: '#fff',
                  }
                }}
              />
              
              <TextField
                value={material.parameters.metalness}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 1) {
                    updateMaterial('parameters.metalness', value);
                  }
                }}
                size="small"
                sx={{
                  width: 80,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#2a2a2a',
                    color: '#ffffff'
                  }
                }}
              />
            </Box>
            
            {/* 粗糙度滑块 */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="body2" sx={{ width: 80 }}>
                粗糙度
              </Typography>
              
              <Slider
                value={material.parameters.roughness}
                onChange={(_, value) => updateMaterial('parameters.roughness', value)}
                min={0}
                max={1}
                step={0.01}
                sx={{ 
                  mx: 2,
                  color: '#4caf50',
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                    bgcolor: '#fff',
                  }
                }}
              />
              
              <TextField
                value={material.parameters.roughness}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 1) {
                    updateMaterial('parameters.roughness', value);
                  }
                }}
                size="small"
                sx={{
                  width: 80,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#2a2a2a',
                    color: '#ffffff'
                  }
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default MaterialEditor; 