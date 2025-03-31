import React, { ChangeEvent, useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  IconButton,
  Switch,
  FormGroup,
  InputAdornment,
} from '@mui/material';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// 属性类型
type PropertyType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'vector2' 
  | 'vector3'
  | 'color'
  | 'select'
  | 'enum';

// 定义属性数据结构
export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  value: any;
  options?: any[]; // 用于select和enum类型
  min?: number;
  max?: number;
  step?: number;
}

// 属性类别
export interface PropertyCategory {
  id: string;
  name: string;
  properties: Property[];
}

interface PropertyPanelProps {
  categories: PropertyCategory[];
  onPropertyChange?: (property: Property) => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  categories,
  onPropertyChange
}) => {
  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 1 }}>
      <Typography variant="subtitle2" sx={{ p: 1, mb: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
        属性
      </Typography>

      {categories.map((category) => (
        <Accordion key={category.id} disableGutters defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ bgcolor: 'rgba(0, 0, 0, 0.1)', minHeight: '40px' }}
          >
            <Typography variant="subtitle2">{category.name}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 1 }}>
            {category.properties.map((property) => (
              <Box key={property.id} sx={{ mb: 1 }}>
                <PropertyEditor
                  property={property}
                  onChange={(updatedProperty) => onPropertyChange && onPropertyChange(updatedProperty)}
                />
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

interface PropertyEditorProps {
  property: Property;
  onChange: (property: Property) => void;
}

const PropertyEditor: React.FC<PropertyEditorProps> = ({
  property,
  onChange
}) => {
  const handleValueChange = (newValue: any) => {
    const updatedProperty = { ...property, value: newValue };
    onChange(updatedProperty);
  };

  switch (property.type) {
    case 'string':
      return (
        <TextField
          label={property.name}
          value={property.value}
          onChange={(e) => handleValueChange(e.target.value)}
          variant="outlined"
          size="small"
          fullWidth
          margin="dense"
        />
      );
      
    case 'number':
      return (
        <Box>
          <Typography variant="caption">{property.name}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Slider
              value={property.value}
              onChange={(_, value) => handleValueChange(value)}
              min={property.min || 0}
              max={property.max || 100}
              step={property.step || 1}
              sx={{ mr: 1, flexGrow: 1 }}
              size="small"
            />
            <TextField
              value={property.value}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (!isNaN(value)) {
                  handleValueChange(value);
                }
              }}
              variant="outlined"
              size="small"
              sx={{ width: '80px' }}
              inputProps={{ 
                step: property.step || 1,
                min: property.min,
                max: property.max,
                type: 'number'
              }}
            />
          </Box>
        </Box>
      );
      
    case 'boolean':
      return (
        <FormGroup>
          <FormControlLabel 
            control={
              <Switch 
                checked={property.value} 
                onChange={(e) => handleValueChange(e.target.checked)}
                size="small"
              />
            } 
            label={property.name}
          />
        </FormGroup>
      );
      
    case 'vector3':
      return (
        <Box>
          <Typography variant="caption">{property.name}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="X"
              value={property.value.x}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (!isNaN(value)) {
                  handleValueChange({ ...property.value, x: value });
                }
              }}
              variant="outlined"
              size="small"
              type="number"
              InputProps={{
                sx: { bgcolor: 'rgba(255, 0, 0, 0.07)' }
              }}
            />
            <TextField
              label="Y"
              value={property.value.y}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (!isNaN(value)) {
                  handleValueChange({ ...property.value, y: value });
                }
              }}
              variant="outlined"
              size="small"
              type="number"
              InputProps={{
                sx: { bgcolor: 'rgba(0, 255, 0, 0.07)' }
              }}
            />
            <TextField
              label="Z"
              value={property.value.z}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (!isNaN(value)) {
                  handleValueChange({ ...property.value, z: value });
                }
              }}
              variant="outlined"
              size="small"
              type="number"
              InputProps={{
                sx: { bgcolor: 'rgba(0, 0, 255, 0.07)' }
              }}
            />
          </Box>
        </Box>
      );
      
    case 'vector2':
      return (
        <Box>
          <Typography variant="caption">{property.name}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="X"
              value={property.value.x}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (!isNaN(value)) {
                  handleValueChange({ ...property.value, x: value });
                }
              }}
              variant="outlined"
              size="small"
              type="number"
            />
            <TextField
              label="Y"
              value={property.value.y}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (!isNaN(value)) {
                  handleValueChange({ ...property.value, y: value });
                }
              }}
              variant="outlined"
              size="small"
              type="number"
            />
          </Box>
        </Box>
      );
      
    case 'color':
      return (
        <TextField
          label={property.name}
          value={property.value}
          onChange={(e) => handleValueChange(e.target.value)}
          variant="outlined"
          size="small"
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Box
                  component="input"
                  type="color"
                  value={property.value}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleValueChange(e.target.value)}
                  sx={{
                    width: 24,
                    height: 24,
                    border: 'none',
                    borderRadius: '50%',
                    p: 0,
                    cursor: 'pointer'
                  }}
                />
              </InputAdornment>
            ),
          }}
        />
      );
      
    case 'select':
    case 'enum':
      return (
        <FormControl fullWidth size="small" margin="dense">
          <InputLabel>{property.name}</InputLabel>
          <Select
            value={property.value}
            label={property.name}
            onChange={(e) => handleValueChange(e.target.value)}
          >
            {property.options?.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
      
    default:
      return (
        <Typography variant="caption">
          未支持的属性类型: {property.type}
        </Typography>
      );
  }
};

// 示例数据 - 实际使用时将替换为所选对象的实际属性
export const exampleProperties: PropertyCategory[] = [
  {
    id: 'transform',
    name: '变换',
    properties: [
      {
        id: 'position',
        name: '位置',
        type: 'vector3',
        value: { x: 0, y: 1, z: 0 }
      },
      {
        id: 'rotation',
        name: '旋转',
        type: 'vector3',
        value: { x: 0, y: 0, z: 0 }
      },
      {
        id: 'scale',
        name: '缩放',
        type: 'vector3',
        value: { x: 1, y: 1, z: 1 }
      }
    ]
  },
  {
    id: 'appearance',
    name: '外观',
    properties: [
      {
        id: 'color',
        name: '颜色',
        type: 'color',
        value: '#ff0000'
      },
      {
        id: 'opacity',
        name: '不透明度',
        type: 'number',
        value: 1,
        min: 0,
        max: 1,
        step: 0.01
      },
      {
        id: 'visible',
        name: '可见',
        type: 'boolean',
        value: true
      },
      {
        id: 'material',
        name: '材质',
        type: 'select',
        value: 'standard',
        options: [
          { value: 'standard', label: '标准' },
          { value: 'basic', label: '基础' },
          { value: 'phong', label: '冯氏' },
          { value: 'toon', label: '卡通' }
        ]
      }
    ]
  }
]; 