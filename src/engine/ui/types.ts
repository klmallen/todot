export interface SceneResource {
  id: string;
  name: string;
  type: 'model' | 'texture' | 'material' | 'animation' | 'script';
  path: string;
  metadata?: Record<string, any>;
}

export interface GameControl {
  id: string;
  name: string;
  type: 'button' | 'slider' | 'toggle' | 'select';
  value: any;
  options?: {
    min?: number;
    max?: number;
    step?: number;
    choices?: string[];
  };
  onChange?: (value: any) => void;
}

export interface UITheme {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  hoverColor: string;
  activeColor: string;
}

export interface UIConfig {
  theme?: UITheme;
  position?: 'left' | 'right';
  width?: number;
  initialTab?: string;
} 