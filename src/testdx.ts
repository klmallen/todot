import Engine from './engine/core/Engine'
import * as THREE from 'three';
import { Scene } from './engine/core/Scene';
import { Node3d } from './engine/core/Node3d';
import { Script } from './engine/core/Script/Script';
import { CameraNode3D } from './engine/core/CameraNode3D';
import { TerrainSystem } from './engine/core/TerrainSystem/TerrainSystem';
import { TerrainEditor } from './engine/core/TerrainSystem/TerrainEditor';
import Stats from 'stats.js';
import { TerrainMaterial } from './engine/core/TerrainSystem/TerrainMaterial';
import { RaiseLowerBrush } from './engine/core/TerrainSystem/editor/brushes/RaiseLowerBrush';
import { SmoothBrush } from './engine/core/TerrainSystem/editor/brushes/SmoothBrush';
import { NoiseBrush } from './engine/core/TerrainSystem/editor/brushes/NoiseBrush';
import { TextureLoader3D } from './engine/core/Texture/TextureLoader3D'
import { TextureTypes } from './engine/core/Texture/TextureTypes';
import { VegetationSystem } from './engine/core/TerrainSystem/VegetationSystem';



// 创建引擎
const engine = await  new Engine().init({
  showDefaultUI: true,
  showHelpers: true,
  addDefaultLights: true,
  useWebGPU: true
});

// 创建测试场景
const terrainScene = new Scene("地形编辑场景");

// 添加场景到引擎
engine.addScene(terrainScene);

// 创建相机
const camera = new CameraNode3D("地形场景相机", 75, 0.1, 1000, {
  position: new THREE.Vector3(0, 100, 200),
  rotation: new THREE.Euler(-0.3, 0, 0)
});

terrainScene.addNode(camera);

// 创建性能监控器
const stats = new Stats();
stats.dom.style.position = 'absolute';
stats.dom.style.top = '0px';
stats.dom.style.left = '0px';
document.body.appendChild(stats.dom);

// 创建信息显示
const createInfoDisplay = () => {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.bottom = '10px';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.textAlign = 'center';
  container.style.color = 'white';
  container.style.backgroundColor = 'rgba(0,0,0,0.5)';
  container.style.padding = '10px';
  container.style.fontSize = '16px';
  document.body.appendChild(container);
  return container;
};

const infoDisplay = createInfoDisplay();
infoDisplay.innerHTML = `
  <div>地形系统测试</div>
  <div>使用鼠标左键编辑地形，右键旋转视图</div>
  <div>在控制面板中调整地形参数和刷子工具</div>
`;

// 创建地形系统
const terrainSystem = new TerrainSystem();
terrainScene.addNode(terrainSystem);

// 创建植被系统
const vegetationSystem = new VegetationSystem('植被系统');
terrainScene.addNode(vegetationSystem);

const textureLoader3D = new TextureLoader3D()
terrainScene.addNode(terrainSystem);
// 初始化地形编辑器

// 地形系统初始化参数
const terrainParams = {
  width: 30,
  length: 30,
  resolution: 256,
  maxHeight: 100,
  noiseScale: 30,
  chunksX:256,
  chunksY:256,
  noiseOctaves: 4,
  noisePersistence: 0.5,
  noiseLacunarity: 2.0,
  seed: Math.random() * 10000
};

// 刷子参数
const brushParams = {
  size: 15,
  strength: 0.5
};

// 全局变量
let terrainEditor;

// 创建控制面板
const createControlPanel = () => {
  const panel = document.createElement('div');
  panel.style.position = 'absolute';
  panel.style.top = '50px';
  panel.style.left = '10px';
  panel.style.backgroundColor = 'rgba(0,0,0,0.7)';
  panel.style.color = 'white';
  panel.style.padding = '10px';
  panel.style.borderRadius = '5px';
  panel.style.width = '250px';
  panel.style.maxHeight = '80vh';
  panel.style.overflowY = 'auto';
  document.body.appendChild(panel);
  
  // 创建标题
  const title = document.createElement('h3');
  title.textContent = '地形系统控制面板';
  title.style.marginTop = '0';
  title.style.marginBottom = '10px';
  panel.appendChild(title);
  
  // 地形生成参数
  const terrainSection = document.createElement('div');
  terrainSection.innerHTML = '<h4 style="margin: 5px 0">地形生成</h4>';
  panel.appendChild(terrainSection);
  
  // 宽度
  addSlider(terrainSection, '宽度', 'width', 100, 1000, 50, terrainParams.width, (value) => {
    terrainParams.width = value;
  });
  
  // 长度
  addSlider(terrainSection, '长度', 'length', 100, 1000, 50, terrainParams.length, (value) => {
    terrainParams.length = value;
  });
  
  // 分辨率
  addSlider(terrainSection, '分辨率', 'resolution', 32, 512, 32, terrainParams.resolution, (value) => {
    terrainParams.resolution = value;
  });
  
  // 最大高度
  addSlider(terrainSection, '最大高度', 'maxHeight', 10, 300, 10, terrainParams.maxHeight, (value) => {
    terrainParams.maxHeight = value;
    if (terrainSystem) {
      terrainSystem.setMaxHeight(value);
    }
  });
  
  // 噪声相关参数
  addSlider(terrainSection, '噪声尺度', 'noiseScale', 5, 100, 5, terrainParams.noiseScale, (value) => {
    terrainParams.noiseScale = value;
  });
  
  addSlider(terrainSection, '噪声八度数', 'noiseOctaves', 1, 8, 1, terrainParams.noiseOctaves, (value) => {
    terrainParams.noiseOctaves = value;
  });
  
  addSlider(terrainSection, '噪声持续度', 'noisePersistence', 0.1, 1, 0.1, terrainParams.noisePersistence, (value) => {
    terrainParams.noisePersistence = value;
  });
  
  // 重新生成地形按钮
  const generateButton = document.createElement('button');
  generateButton.textContent = '重新生成地形';
  generateButton.style.width = '100%';
  generateButton.style.padding = '8px';
  generateButton.style.marginTop = '10px';
  generateButton.style.marginBottom = '10px';
  generateButton.onclick = () => {
    generateTerrain();
  };
  generateButton.addEventListener('click', (e) => {
    generateTerrain();
  }, true); // 使用捕获模式
  terrainSection.appendChild(generateButton);
  
  // 平坦化地形按钮
  const flattenButton = document.createElement('button');
  flattenButton.textContent = '平坦化地形';
  flattenButton.style.width = '100%';
  flattenButton.style.padding = '8px';
  flattenButton.style.marginBottom = '10px';
  flattenButton.onclick = () => {
    initializeTerrain(0); // 使用0高度初始化
  };
  terrainSection.appendChild(flattenButton);
  
  // 地形刷子参数
  const brushSection = document.createElement('div');
  brushSection.innerHTML = '<h4 style="margin: 5px 0">地形编辑器</h4>';
  panel.appendChild(brushSection);
  
  // 刷子类型
  const brushTypeContainer = document.createElement('div');
  brushTypeContainer.innerHTML = '<label>刷子类型:</label>';
  brushTypeContainer.style.marginBottom = '5px';
  brushSection.appendChild(brushTypeContainer);
  
  const brushTypes = ['raiseLower', 'smooth', 'flatten', 'noise', 'material'];
  const brushNames = ['升高/降低', '平滑', '平坦化', '噪声', '材质绘制'];
  
  brushTypes.forEach((type, index) => {
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'brushType';
    radio.id = `brush_${type}`;
    radio.value = type;
    radio.checked = type === brushParams.type;
    radio.onchange = () => {
      if (radio.checked) {
        brushParams.type = type;
        if (terrainEditor) {
          terrainEditor.setBrushType(type);
          
          // 更新UI状态
          if (type === 'raiseLower') {
            raiseLowerOptions.style.display = 'block';
            flattenOptions.style.display = 'none';
            noiseOptions.style.display = 'none';
            materialOptions.style.display = 'none';
          } else if (type === 'flatten') {
            raiseLowerOptions.style.display = 'none';
            flattenOptions.style.display = 'block';
            noiseOptions.style.display = 'none';
            materialOptions.style.display = 'none';
          } else if (type === 'noise') {
            raiseLowerOptions.style.display = 'none';
            flattenOptions.style.display = 'none';
            noiseOptions.style.display = 'block';
            materialOptions.style.display = 'none';
          } else if (type === 'material') {
            raiseLowerOptions.style.display = 'none';
            flattenOptions.style.display = 'none';
            noiseOptions.style.display = 'none';
            materialOptions.style.display = 'block';
          } else {
            raiseLowerOptions.style.display = 'none';
            flattenOptions.style.display = 'none';
            noiseOptions.style.display = 'none';
            materialOptions.style.display = 'none';
          }
        }
      }
    };
    
    const label = document.createElement('label');
    label.htmlFor = `brush_${type}`;
    label.textContent = brushNames[index];
    label.style.marginRight = '10px';
    
    brushTypeContainer.appendChild(radio);
    brushTypeContainer.appendChild(label);
    
    // 换行
    if (index % 2 === 1) {
      brushTypeContainer.appendChild(document.createElement('br'));
    }
  });
  
  // 刷子大小
  addSlider(brushSection, '刷子大小', 'brushSize', 1, 50, 1, brushParams.size, (value) => {
    brushParams.size = value;
    if (terrainEditor) {
      terrainEditor.setBrushSize(value);
    }
  });
  
  // 刷子强度
  addSlider(brushSection, '刷子强度', 'brushStrength', 0.1, 1, 0.1, brushParams.strength, (value) => {
    brushParams.strength = value;
    if (terrainEditor) {
      terrainEditor.setBrushStrength(value);
    }
  });
  
  // 升高/降低选项
  const raiseLowerOptions = document.createElement('div');
  raiseLowerOptions.style.padding = '5px';
  raiseLowerOptions.style.marginTop = '5px';
  raiseLowerOptions.style.backgroundColor = 'rgba(255,255,255,0.1)';
  raiseLowerOptions.style.borderRadius = '3px';
  brushSection.appendChild(raiseLowerOptions);
  
  // 升高/降低模式选择
  const raiseModeContainer = document.createElement('div');
  raiseModeContainer.innerHTML = '<label>模式:</label>';
  raiseLowerOptions.appendChild(raiseModeContainer);
  
  const raiseRadio = document.createElement('input');
  raiseRadio.type = 'radio';
  raiseRadio.name = 'raiseMode';
  raiseRadio.id = 'mode_raise';
  raiseRadio.checked = brushParams.raisingMode;
  raiseRadio.onchange = () => {
    if (raiseRadio.checked) {
      brushParams.raisingMode = true;
      if (terrainEditor) {
        terrainEditor.setRaisingMode(true);
      }
    }
  };
  
  const raiseLabel = document.createElement('label');
  raiseLabel.htmlFor = 'mode_raise';
  raiseLabel.textContent = '升高';
  raiseLabel.style.marginRight = '15px';
  
  const lowerRadio = document.createElement('input');
  lowerRadio.type = 'radio';
  lowerRadio.name = 'raiseMode';
  lowerRadio.id = 'mode_lower';
  lowerRadio.checked = !brushParams.raisingMode;
  lowerRadio.onchange = () => {
    if (lowerRadio.checked) {
      brushParams.raisingMode = false;
      if (terrainEditor) {
        terrainEditor.setRaisingMode(false);
      }
    }
  };
  
  const lowerLabel = document.createElement('label');
  lowerLabel.htmlFor = 'mode_lower';
  lowerLabel.textContent = '降低';
  
  raiseModeContainer.appendChild(raiseRadio);
  raiseModeContainer.appendChild(raiseLabel);
  raiseModeContainer.appendChild(lowerRadio);
  raiseModeContainer.appendChild(lowerLabel);
  
  // 平坦化选项
  const flattenOptions = document.createElement('div');
  flattenOptions.style.padding = '5px';
  flattenOptions.style.marginTop = '5px';
  flattenOptions.style.backgroundColor = 'rgba(255,255,255,0.1)';
  flattenOptions.style.borderRadius = '3px';
  flattenOptions.style.display = 'none';
  brushSection.appendChild(flattenOptions);
  
  // 平坦化高度
  addSlider(flattenOptions, '目标高度', 'flattenHeight', 0, terrainParams.maxHeight, 1, brushParams.flattenHeight, (value) => {
    brushParams.flattenHeight = value;
    brushParams.useCurrentHeight = false;
    if (terrainEditor) {
      terrainEditor.setFlattenTargetHeight(value);
    }
  });
  
  // 使用当前高度
  const useCurrentHeightContainer = document.createElement('div');
  const useCurrentHeightCheckbox = document.createElement('input');
  useCurrentHeightCheckbox.type = 'checkbox';
  useCurrentHeightCheckbox.id = 'useCurrentHeight';
  useCurrentHeightCheckbox.checked = brushParams.useCurrentHeight;
  useCurrentHeightCheckbox.onchange = () => {
    brushParams.useCurrentHeight = useCurrentHeightCheckbox.checked;
    if (terrainEditor && brushParams.useCurrentHeight) {
      terrainEditor.useCurrentHeightForFlatten();
    }
  };
  
  const useCurrentHeightLabel = document.createElement('label');
  useCurrentHeightLabel.htmlFor = 'useCurrentHeight';
  useCurrentHeightLabel.textContent = '使用点击位置的高度';
  
  useCurrentHeightContainer.appendChild(useCurrentHeightCheckbox);
  useCurrentHeightContainer.appendChild(useCurrentHeightLabel);
  flattenOptions.appendChild(useCurrentHeightContainer);
  
  // 噪声选项
  const noiseOptions = document.createElement('div');
  noiseOptions.style.padding = '5px';
  noiseOptions.style.marginTop = '5px';
  noiseOptions.style.backgroundColor = 'rgba(255,255,255,0.1)';
  noiseOptions.style.borderRadius = '3px';
  noiseOptions.style.display = 'none';
  brushSection.appendChild(noiseOptions);
  
  // 刷新噪声种子按钮
  const newSeedButton = document.createElement('button');
  newSeedButton.textContent = '刷新噪声种子';
  newSeedButton.style.width = '100%';
  newSeedButton.style.padding = '5px';
  newSeedButton.onclick = () => {
    const newSeed = Math.random() * 10000;
    if (terrainEditor) {
      terrainEditor.setNoiseParams(newSeed, 30, 3);
    }
  };
  noiseOptions.appendChild(newSeedButton);
  
  // 材质笔刷选项
  const materialOptions = document.createElement('div');
  materialOptions.style.padding = '5px';
  materialOptions.style.marginTop = '5px';
  materialOptions.style.backgroundColor = 'rgba(255,255,255,0.1)';
  materialOptions.style.borderRadius = '3px';
  materialOptions.style.display = 'none';
  brushSection.appendChild(materialOptions);
  
  // 添加材质层选择下拉框
  const materialLayerOptions = [
    { value: '0', label: '第一层材质' },
    { value: '1', label: '第二层材质' },
    { value: '2', label: '第三层材质' },
    { value: '3', label: '第四层材质' }
  ];
  
  // 添加实际下拉选择框
  addSelect(
    materialOptions, 
    '材质层', 
    materialLayerOptions, 
    '0', 
    (value) => {
      // 当选择变化时，更新材质笔刷的layer
      const layerIndex = parseInt(value, 10);
      if (terrainEditor && brushParams.type === 'material') {
        terrainEditor.setMaterialLayer(layerIndex);
      }
    }
  );
  
  // 历史操作
  const historySection = document.createElement('div');
  historySection.innerHTML = '<h4 style="margin: 5px 0">编辑历史</h4>';
  panel.appendChild(historySection);
  
  // 撤销/重做按钮
  const historyButtonsContainer = document.createElement('div');
  historyButtonsContainer.style.display = 'flex';
  historyButtonsContainer.style.justifyContent = 'space-between';
  historySection.appendChild(historyButtonsContainer);
  
  const undoButton = document.createElement('button');
  undoButton.textContent = '撤销';
  undoButton.style.width = '48%';
  undoButton.style.padding = '8px';
  undoButton.onclick = () => {
    if (terrainEditor) {
      terrainEditor.undo();
    }
  };
  
  const redoButton = document.createElement('button');
  redoButton.textContent = '重做';
  redoButton.style.width = '48%';
  redoButton.style.padding = '8px';
  redoButton.onclick = () => {
    if (terrainEditor) {
      terrainEditor.redo();
    }
  };
  
  historyButtonsContainer.appendChild(undoButton);
  historyButtonsContainer.appendChild(redoButton);
  
  // 在材质选项之后添加植被选项
  // 添加植被系统控制区域
  const vegetationSection = document.createElement('div');
  vegetationSection.innerHTML = '<h4 style="margin: 5px 0">植被系统</h4>';
  panel.appendChild(vegetationSection);
  
  // 植被管理控制区
  const vegetationControl = document.createElement('div');
  vegetationControl.style.padding = '5px';
  vegetationControl.style.marginTop = '5px';
  vegetationControl.style.backgroundColor = 'rgba(255,255,255,0.1)';
  vegetationControl.style.borderRadius = '3px';
  vegetationSection.appendChild(vegetationControl);
  
  // 添加植被类型按钮
  const addVegTypeBtn = document.createElement('button');
  addVegTypeBtn.textContent = '添加草类型1';
  addVegTypeBtn.style.width = '100%';
  addVegTypeBtn.style.padding = '5px';
  addVegTypeBtn.style.marginBottom = '5px';
  addVegTypeBtn.onclick = () => {
    vegetationSystem.addVegetationType(
      'grass1', 
      'models/grass1.glb', 
      new THREE.Vector3(1, 1, 1), 
      0.5, // 弯曲因子
      0    // 高度偏移
    );
  };
  vegetationControl.appendChild(addVegTypeBtn);
  
  const addVegTypeBtn2 = document.createElement('button');
  addVegTypeBtn2.textContent = '添加草类型2';
  addVegTypeBtn2.style.width = '100%';
  addVegTypeBtn2.style.padding = '5px';
  addVegTypeBtn2.style.marginBottom = '5px';
  addVegTypeBtn2.onclick = () => {
    vegetationSystem.addVegetationType(
      'grass2', 
      'models/grass2.glb', 
      new THREE.Vector3(0.8, 1.2, 0.8), 
      0.7,
      0
    );
  };
  vegetationControl.appendChild(addVegTypeBtn2);
  
  const addVegTypeBtn3 = document.createElement('button');
  addVegTypeBtn3.textContent = '添加花类型1';
  addVegTypeBtn3.style.width = '100%';
  addVegTypeBtn3.style.padding = '5px';
  addVegTypeBtn3.style.marginBottom = '5px';
  addVegTypeBtn3.onclick = () => {
    vegetationSystem.addVegetationType(
      'flower1', 
      'models/flower1.glb', 
      new THREE.Vector3(1, 1, 1), 
      0.3,
      0
    );
  };
  vegetationControl.appendChild(addVegTypeBtn3);
  
  // 添加植被到材质层
  const layerSelect = document.createElement('div');
  layerSelect.style.marginTop = '10px';
  layerSelect.style.marginBottom = '5px';
  layerSelect.innerHTML = '<label>选择材质层:</label>';
  vegetationControl.appendChild(layerSelect);
  
  const layerSelector = document.createElement('select');
  layerSelector.style.width = '100%';
  layerSelector.style.marginBottom = '5px';
  for (let i = 0; i < 4; i++) {
    const option = document.createElement('option');
    option.value = i.toString();
    option.textContent = `材质层 ${i+1}`;
    layerSelector.appendChild(option);
  }
  vegetationControl.appendChild(layerSelector);
  
  // 植被类型选择
  const vegTypeSelect = document.createElement('div');
  vegTypeSelect.style.marginTop = '5px';
  vegTypeSelect.style.marginBottom = '5px';
  vegTypeSelect.innerHTML = '<label>选择植被类型:</label>';
  vegetationControl.appendChild(vegTypeSelect);
  
  const vegTypeSelector = document.createElement('select');
  vegTypeSelector.style.width = '100%';
  vegTypeSelector.style.marginBottom = '5px';
  
  // 默认添加几个选项，实际应该根据已添加的植被类型动态更新
  ['grass1', 'grass2', 'flower1'].forEach((type, index) => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = ['草类型1', '草类型2', '花类型1'][index];
    vegTypeSelector.appendChild(option);
  });
  vegetationControl.appendChild(vegTypeSelector);
  
  // 添加权重、密度和聚集度控制
  addSlider(vegetationControl, '权重', 'vegWeight', 0, 1, 0.1, 0.6, (value) => {
    // 保存权重值供后续使用
    window.vegParams = window.vegParams || {};
    window.vegParams.weight = value;
  });
  
  addSlider(vegetationControl, '密度', 'vegDensity', 0, 1, 0.1, 0.8, (value) => {
    window.vegParams = window.vegParams || {};
    window.vegParams.density = value;
  });
  
  addSlider(vegetationControl, '聚集度', 'vegClustering', 0, 1, 0.1, 0.5, (value) => {
    window.vegParams = window.vegParams || {};
    window.vegParams.clustering = value;
  });
  
  // 坡度范围控制
  addSlider(vegetationControl, '最小坡度', 'minSlope', 0, 90, 1, 0, (value) => {
    window.vegParams = window.vegParams || {};
    window.vegParams.minSlope = value / 90; // 转换为0-1范围
  });
  
  addSlider(vegetationControl, '最大坡度', 'maxSlope', 0, 90, 1, 30, (value) => {
    window.vegParams = window.vegParams || {};
    window.vegParams.maxSlope = value / 90; // 转换为0-1范围
  });
  
  // 应用到材质层按钮
  const applyToLayerBtn = document.createElement('button');
  applyToLayerBtn.textContent = '应用植被到选定材质层';
  applyToLayerBtn.style.width = '100%';
  applyToLayerBtn.style.padding = '5px';
  applyToLayerBtn.style.marginTop = '10px';
  applyToLayerBtn.onclick = () => {
    const layerIndex = parseInt(layerSelector.value);
    const vegType = vegTypeSelector.value;
    const params = window.vegParams || { weight: 0.6, density: 0.8, clustering: 0.5, minSlope: 0, maxSlope: 0.3 };
   
    vegetationSystem.addVegetationOnTerrain('t1', 100, {
      minHeight: 0,     // 最小高度为10
      maxHeight: 100,    // 最大高度为100
      maxSlope: 10,     // 最大坡度（大约45度）
      avoidOverlap: true, // 避免重叠
      minDistance: 8     // 植被之间的最小距离
    });
    
    // 更新植被分布
    // vegetationSystem.updateVegetationDistribution();
  };
  vegetationControl.appendChild(applyToLayerBtn);
  
  // 风动画控制
  const windSection = document.createElement('div');
  windSection.style.marginTop = '15px';
  windSection.innerHTML = '<h4 style="margin: 5px 0">风动画控制</h4>';
  vegetationSection.appendChild(windSection);
  
  const windControl = document.createElement('div');
  windControl.style.padding = '5px';
  windControl.style.backgroundColor = 'rgba(255,255,255,0.1)';
  windControl.style.borderRadius = '3px';
  windSection.appendChild(windControl);
  
  addSlider(windControl, '风力强度', 'windStrength', 0, 1, 0.05, 0.2, (value) => {
    window.windParams = window.windParams || {};
    window.windParams.strength = value;
  });
  
  addSlider(windControl, '风力频率', 'windFrequency', 0, 2, 0.05, 0.3, (value) => {
    window.windParams = window.windParams || {};
    window.windParams.frequency = value;
  });
  
  // 风向控制
  addSlider(windControl, '风向 X', 'windDirX', -1, 1, 0.1, 1, (value) => {
    window.windParams = window.windParams || { direction: new THREE.Vector2(1, 0) };
    window.windParams.direction.x = value;
  });
  
  addSlider(windControl, '风向 Z', 'windDirZ', -1, 1, 0.1, 0, (value) => {
    window.windParams = window.windParams || { direction: new THREE.Vector2(1, 0) };
    window.windParams.direction.y = value;
  });
  
  // 应用风设置按钮
  const applyWindBtn = document.createElement('button');
  applyWindBtn.textContent = '应用风动画设置';
  applyWindBtn.style.width = '100%';
  applyWindBtn.style.padding = '5px';
  applyWindBtn.style.marginTop = '10px';
  applyWindBtn.onclick = () => {
    const params = window.windParams || { 
      strength: 0.2, 
      frequency: 0.3, 
      direction: new THREE.Vector2(1, 0) 
    };
    
    vegetationSystem.updateWindParameters(
      params.strength,
      params.frequency,
      params.direction
    );
  };
  windControl.appendChild(applyWindBtn);
  
  // 在特定区域添加植被
  const areaSection = document.createElement('div');
  areaSection.style.marginTop = '15px';
  areaSection.innerHTML = '<h4 style="margin: 5px 0">特定区域添加植被</h4>';
  vegetationSection.appendChild(areaSection);
  
  const areaControl = document.createElement('div');
  areaControl.style.padding = '5px';
  areaControl.style.backgroundColor = 'rgba(255,255,255,0.1)';
  areaControl.style.borderRadius = '3px';
  areaSection.appendChild(areaControl);
  
  // 创建坐标和半径输入
  addSlider(areaControl, '中心 X', 'areaX', -500, 500, 10, 0, (value) => {
    window.areaParams = window.areaParams || {};
    window.areaParams.x = value;
  });
  
  addSlider(areaControl, '中心 Z', 'areaZ', -500, 500, 10, 0, (value) => {
    window.areaParams = window.areaParams || {};
    window.areaParams.z = value;
  });
  
  addSlider(areaControl, '半径', 'areaRadius', 10, 200, 5, 50, (value) => {
    window.areaParams = window.areaParams || {};
    window.areaParams.radius = value;
  });
  
  addSlider(areaControl, '密度倍数', 'areaDensity', 0.1, 5, 0.1, 2, (value) => {
    window.areaParams = window.areaParams || {};
    window.areaParams.density = value;
  });
  
  // 应用区域植被按钮
  const applyAreaBtn = document.createElement('button');
  applyAreaBtn.textContent = '在区域添加植被';
  applyAreaBtn.style.width = '100%';
  applyAreaBtn.style.padding = '5px';
  applyAreaBtn.style.marginTop = '10px';
  applyAreaBtn.onclick = () => {
    const layerIndex = parseInt(layerSelector.value);
    const vegType = vegTypeSelector.value;
    const areaParams = window.areaParams || { x: 0, z: 0, radius: 50, density: 2.0 };
    
    vegetationSystem.addVegetationToArea(
      areaParams.x,
      areaParams.z,
      areaParams.radius,
      layerIndex,
      vegType,
      areaParams.density
    );
  };
  areaControl.appendChild(applyAreaBtn);
  
  // 在控制面板中添加场景管理部分
  const sceneSection = document.createElement('div');
  sceneSection.innerHTML = '<h4 style="margin: 5px 0">场景管理</h4>';
  panel.appendChild(sceneSection);
  
  // 场景保存按钮
  const saveButton = document.createElement('button');
  saveButton.textContent = '保存场景';
  saveButton.style.width = '100%';
  saveButton.style.padding = '8px';
  saveButton.style.marginTop = '10px';
  saveButton.onclick = () => {
    engine.saveSceneToFile('地形编辑场景', 'terrain_scene.json');
  };
  sceneSection.appendChild(saveButton);
  
  // 场景加载按钮（先创建一个文件输入框）
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';
  fileInput.onchange = async (e) => {
    const files = e.target?.files;
    if (files && files.length > 0) {
      try {
        const sceneName = await engine.loadSceneFromFile(files[0]);
        console.log(`场景 ${sceneName} 已加载`);
        engine.activateScene(sceneName);
      } catch (error) {
        console.error('加载场景失败:', error);
      }
    }
  };
  document.body.appendChild(fileInput);
  
  // 场景加载按钮
  const loadButton = document.createElement('button');
  loadButton.textContent = '加载场景';
  loadButton.style.width = '100%';
  loadButton.style.padding = '8px';
  loadButton.style.marginTop = '5px';
  loadButton.onclick = () => {
    fileInput.click();
  };
  sceneSection.appendChild(loadButton);
  
  return panel;
};

/**
 * 添加滑块控件
 */
function addSlider(
  container: HTMLElement,
  label: string,
  min: number,
  max: number,
  value: number,
  step: number,
  onChange: (value: number) => void
) {
  const controlDiv = document.createElement('div');
  controlDiv.className = 'control-row';
  
  const labelElement = document.createElement('span');
  labelElement.className = 'control-label';
  labelElement.textContent = label;
  
  const valueDisplay = document.createElement('span');
  valueDisplay.className = 'value-display';
  valueDisplay.textContent = value !== undefined && value !== null ? value.toString() : '0';
  
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = min.toString();
  slider.max = max.toString();
  slider.step = step.toString();
  slider.value = value !== undefined && value !== null ? value.toString() : '0';
  
  slider.oninput = () => {
    const newValue = parseFloat(slider.value);
    if (newValue !== undefined && !isNaN(newValue)) {
      valueDisplay.textContent = newValue.toString();
      if (typeof onChange === 'function') {
        onChange(newValue);
      }
    }
  };
  
  controlDiv.appendChild(labelElement);
  controlDiv.appendChild(slider);
  controlDiv.appendChild(valueDisplay);
  container.appendChild(controlDiv);
}

/**
 * 添加按钮控件
 */
function addButton(
  container: HTMLElement,
  label: string,
  onClick: () => void
) {
  const button = document.createElement('button');
  button.className = 'control-button';
  button.textContent = label;
  
  if (typeof onClick === 'function') {
    button.onclick = onClick;
  }
  
  container.appendChild(button);
}

/**
 * 添加下拉选择框
 */
function addSelect(
  container: HTMLElement,
  label: string,
  options: { value: string; label: string }[],
  defaultValue: string,
  onChange: (value: string) => void
) {
  const controlDiv = document.createElement('div');
  controlDiv.className = 'control-row';
  
  const labelElement = document.createElement('span');
  labelElement.className = 'control-label';
  labelElement.textContent = label;
  
  const select = document.createElement('select');
  select.className = 'control-select';
  
  if (Array.isArray(options)) {
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value || '';
      optionElement.textContent = option.label || '';
      select.appendChild(optionElement);
    });
  }
  
  if (defaultValue !== undefined && defaultValue !== null) {
    select.value = defaultValue;
  }
  
  if (typeof onChange === 'function') {
    select.onchange = () => onChange(select.value);
  }
  
  controlDiv.appendChild(labelElement);
  controlDiv.appendChild(select);
  container.appendChild(controlDiv);
}

// 创建控制面板
const controlPanel = createControlPanel();

// 初始化地形
function initializeTerrain(baseHeight: number = 0) {
  // 设置基本参数
  terrainSystem.terrainSize = new THREE.Vector2(terrainParams.width, terrainParams.length);
  terrainSystem.resolution = terrainParams.resolution;
  terrainSystem.maxHeight = terrainParams.maxHeight;
  
  // 确保创建材质
  terrainSystem.material = new TerrainMaterial();
  
  // 初始化
  terrainSystem.initialize();
  
  // 获取编辑器
  terrainEditor = terrainSystem.getEditor();
  
  // 设置编辑器参数
  setupEditor();
  
  // 设置基础高度
  if (baseHeight !== 0) {
    const heightfield = terrainSystem.getHeightfield();
    const size = heightfield.getSize();
    
    for (let z = -size.y/2; z <= size.y/2; z += 1) {
      for (let x = -size.x/2; x <= size.x/2; x += 1) {
        heightfield.setHeight(x, z, baseHeight);
      }
    }
    
    terrainSystem.update();
  }
  
  // 设置植被系统与地形的关联
  vegetationSystem.setTerrain(terrainSystem);
}

/**
 * 设置地形编辑器参数和工具
 */
function setupEditor() {
  if (!terrainEditor) return;
  
  // 设置默认刷子参数
  terrainEditor.setBrushSize(brushParams.size);
  terrainEditor.setBrushStrength(brushParams.strength);
  
  // 设置默认的刷子工具（升降刷）
  terrainEditor.setBrushType('raiseLower');
  
  // 设置升降刷为默认抬升地形
  const raiseLowerBrush = terrainEditor.getActiveBrush();
  if (raiseLowerBrush && raiseLowerBrush instanceof RaiseLowerBrush) {
    raiseLowerBrush.setRaisingMode(true);
  }
  
  // 设置平滑刷参数
  terrainEditor.setBrushType('smooth');
  const smoothBrush = terrainEditor.getActiveBrush();
  if (smoothBrush && smoothBrush instanceof SmoothBrush) {
    smoothBrush.setKernelSize(3);
  }
  
  // 设置噪声刷参数
  terrainEditor.setBrushType('noise');
  const noiseBrush = terrainEditor.getActiveBrush();
  if (noiseBrush && noiseBrush instanceof NoiseBrush) {
    noiseBrush.setNoiseParams(
      Math.random() * 1000, // 随机种子
      30,                   // 比例
      3                     // 八度
    );
  }
  
  // 最后设置回默认的升降刷
  terrainEditor.setBrushType('raiseLower');
  
  console.log('地形编辑器已设置完成，当前使用升降刷');
}

// 生成噪声地形
function generateTerrain() {
  initializeTerrain();
  
  const heightfield = terrainSystem.getHeightfield();
  const size = heightfield.getSize();
  
  // 设置新的随机种子
  const seed = Math.random() * 10000;
  terrainParams.seed = seed;
  
  // 生成噪声地形
  for (let z = -size.y/2; z <= size.y/2; z += 1) {
    for (let x = -size.x/2; x <= size.x/2; x += 1) {
      // 计算噪声值 (使用y作为噪声函数的种子)
      // 注意：这里应该使用TerrainUtils中的噪声函数
      // 简化实现，仅作示例
      const nx = x / terrainParams.noiseScale;
      const nz = z / terrainParams.noiseScale;
      
      let noise = 0;
      let amplitude = 1;
      let frequency = 1;
      let maxValue = 0;
      
      for (let i = 0; i < terrainParams.noiseOctaves; i++) {
        // 这里需要引入simplex-noise库或自定义噪声函数
        // 简化实现，使用基于坐标的伪随机
        const sampleX = nx * frequency + seed;
        const sampleZ = nz * frequency + seed;
        const sample = Math.sin(sampleX * 12.9898 + sampleZ * 78.233) * 43758.5453 % 1;
        
        noise += sample * amplitude;
        maxValue += amplitude;
        amplitude *= terrainParams.noisePersistence;
        frequency *= terrainParams.noiseLacunarity;
      }
      
      // 归一化并缩放到所需高度范围
      noise = (noise / maxValue) * terrainParams.maxHeight;
      
      // 设置高度
      heightfield.setHeight(x, z, noise);
    }
  }
  terrainSystem.update();
}

// 性能测量脚本
class PerformanceScript extends Script {
  private frameCount: number = 0;
  private lastTime: number = 0;
  private currentFPS: number = 0;
  private fpsHistory: number[] = [];
  private readonly maxHistoryLength = 60;
  
  onStart(): void {
    this.lastTime = performance.now();
  }
  
  update(deltaTime: number): void {
    const currentTime = performance.now();
    this.frameCount++;
    
    // 每秒计算一次FPS
    if (currentTime - this.lastTime >= 1000) {
      this.currentFPS = this.frameCount * 1000 / (currentTime - this.lastTime);
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      // 添加到历史记录
      this.fpsHistory.push(this.currentFPS);
      if (this.fpsHistory.length > this.maxHistoryLength) {
        this.fpsHistory.shift();
      }
      
      // 计算平均FPS
      const avgFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
      
      // 更新显示
      const statsElement = document.getElementById('terrain-stats');
      if (statsElement) {
        statsElement.textContent = `FPS: ${this.currentFPS.toFixed(1)} (平均: ${avgFPS.toFixed(1)})`;
      }
    }
    
    // 更新stats.js
    stats.update();
  }
}

// 添加性能监控脚本
const performanceNode = new Node3d("性能监控");
performanceNode.addScript(PerformanceScript);
terrainScene.addNode(performanceNode);

// 添加自定义FPS显示
const fpsDisplay = document.createElement('div');
fpsDisplay.id = 'terrain-stats';
fpsDisplay.style.position = 'absolute';
fpsDisplay.style.top = '80px';
fpsDisplay.style.left = '10px';
fpsDisplay.style.backgroundColor = 'rgba(0,0,0,0.7)';
fpsDisplay.style.color = 'white';
fpsDisplay.style.padding = '5px';
fpsDisplay.style.borderRadius = '3px';
fpsDisplay.style.fontSize = '14px';
document.body.appendChild(fpsDisplay);

/**
 * 添加法线显示助手
 */
function addNormalHelper() {
  // 创建一个圆锥体几何体作为法线指示器
  const geometryHelper = new THREE.ConeGeometry(2, 10, 3);
  geometryHelper.translate(0, 5, 0);
  geometryHelper.rotateX(Math.PI / 2);
  
  // 创建法线显示助手并添加到场景
  const helper = new THREE.Mesh(geometryHelper, new THREE.MeshNormalMaterial());
  helper.scale.set(0.1,0.1,0.1)
  helper.visible = false; // 初始不可见
  terrainScene.threeScene.add(helper);
  
  // 创建信息显示面板
  const infoPanel = document.createElement('div');
  infoPanel.style.position = 'absolute';
  infoPanel.style.bottom = '50px';
  infoPanel.style.left = '10px';
  infoPanel.style.backgroundColor = 'rgba(0,0,0,0.7)';
  infoPanel.style.color = 'white';
  infoPanel.style.padding = '10px';
  infoPanel.style.borderRadius = '5px';
  infoPanel.style.fontFamily = 'monospace';
  infoPanel.style.fontSize = '12px';
  infoPanel.style.pointerEvents = 'none';
  document.body.appendChild(infoPanel);
  
  return { helper, infoPanel };
}

// 输入处理
class InputHandlerScript extends Script {
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private isMouseDown: boolean = false;
  private isSpaceDown: boolean = false;
  private lastUpdatePosition: THREE.Vector3 | null = null;
  private normalHelper: THREE.Mesh;
  private infoPanel: HTMLDivElement;

  onStart(): void {
    // 创建法线助手
    const { helper, infoPanel } = addNormalHelper();
    this.normalHelper = helper;
    this.infoPanel = infoPanel;
    
    // 添加事件监听
    document.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  private onMouseDown(event: MouseEvent): void {
    // 只处理左键
    if (event.button !== 0) return;

    this.isMouseDown = true;

    // 检查是否同时按下空格键
    if (this.isSpaceDown && terrainEditor) {
      // 更新鼠标位置
      this.updateMousePosition(event);

      // 开始编辑
      const intersects = this.castRay();
      if (intersects.length > 0) {
        terrainEditor.startEditing(this.mouse, camera.getCamera());
      }
    }
  }

  private onMouseUp(event: MouseEvent): void {
    // 只处理左键
    if (event.button !== 0) return;

    this.isMouseDown = false;
    this.lastUpdatePosition = null;

    // 结束编辑
    if (terrainEditor) {
      terrainEditor.endEditing();
    }
  }

  private onMouseMove(event: MouseEvent): void {
    this.updateMousePosition(event);

    // 如果同时按下空格键和鼠标左键，继续编辑
    if (this.isMouseDown && this.isSpaceDown && terrainEditor) {
      terrainEditor.continueEditing(this.mouse, camera.getCamera());
    } else if (terrainEditor) {
      // 更新刷子预览位置
      const intersects = this.castRay();
      if (intersects.length > 0) {
        terrainEditor.updatePreview(this.mouse, camera.getCamera());
        
        // 更新法线助手位置和方向
        this.updateNormalHelper(intersects[0]);
      } else {
        // 无相交点时隐藏助手
        this.normalHelper.visible = false;
        this.infoPanel.innerHTML = '';
      }
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    // 检测空格键按下
    if (event.code === 'Space') {
      this.isSpaceDown = true;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    // 检测空格键释放
    if (event.code === 'Space') {
      this.isSpaceDown = false;
      // 如果此时鼠标左键仍然按下，结束编辑
      if (this.isMouseDown && terrainEditor) {
        terrainEditor.endEditing();
      }
    }
  }

  private updateMousePosition(event: MouseEvent): void {
    // 计算归一化的设备坐标
    const rect = engine.getRenderer().domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private castRay(): THREE.Intersection[] {
    // 设置射线
    this.raycaster.setFromCamera(this.mouse, camera.getCamera());

    // 检测射线与地形的相交
    return terrainSystem.raycast(this.raycaster);
  }
  
  private updateNormalHelper(intersection: THREE.Intersection): void {
    if (!this.normalHelper) return;
    
    // 设置助手位置
    this.normalHelper.position.copy(intersection.point);
    
    // 设置助手朝向法线方向
    if (intersection.face) {
      this.normalHelper.lookAt(
        new THREE.Vector3().addVectors(
          intersection.point,
          intersection.face.normal
        )
      );
      
      // 让助手可见
      this.normalHelper.visible = true;
      
      // 更新信息面板
      const position = intersection.point;
      const normal = intersection.face.normal;
      
      this.infoPanel.innerHTML = `
        <div>位置: X: ${position.x.toFixed(2)}, Y: ${position.y.toFixed(2)}, Z: ${position.z.toFixed(2)}</div>
        <div>法线: X: ${normal.x.toFixed(3)}, Y: ${normal.y.toFixed(3)}, Z: ${normal.z.toFixed(3)}</div>
        <div>地形高度: ${position.y.toFixed(2)}</div>
      `;
      
      // 在控制台打印信息
      // console.log('位置:', position);
      // console.log('法线:', normal);
    }
  }

  onDestroy(): void {
    // 移除事件监听
    document.removeEventListener('mousedown', this.onMouseDown.bind(this));
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
    document.removeEventListener('keyup', this.onKeyUp.bind(this));
  }
}

// 添加输入处理脚本
const inputHandler = new Node3d("输入处理");
inputHandler.addScript(InputHandlerScript);
terrainScene.addNode(inputHandler);

// 初始化地形
initializeTerrain();
// generateTerrain();

// 初始化材质
async function initializeMaterials() {
  try {
    // 批量加载贴图
    const textures = await loadTextures([
      { 
        path: 'textures/tile02/Poliigon_BrickWallReclaimed_8320_BaseColor.jpg', 
        type: TextureTypes.TextureType.BASE_COLOR,
        name: 'brick_color'
      },
      { 
        path: 'textures/tile02/Poliigon_BrickWallReclaimed_8320_Normal.png', 
        type: TextureTypes.TextureType.NORMAL,
        name: 'brick_normal'
      },
      { 
        path: 'textures/GroundWoodChips001_AO_2K.jpg', 
        type: TextureTypes.TextureType.BASE_COLOR,
        name: 'brick_color_02'
      },
      { 
        path: 'textures/GroundWoodChips001_NRM_2K.jpg', 
        type: TextureTypes.TextureType.NORMAL,
        name: 'brick_normal_02'
      },
      // 可以添加更多贴图...
    ], textureLoader3D);
    
    // 设置贴图包裹模式
    Object.values(textures).forEach(texture => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
    });
    
    // 使用加载的贴图
    terrainSystem.setMaterialLayer(0, {
      texture: textures.brick_color,
      normalMap: textures.brick_normal,
      tiling: 100,
      minHeight: 0,
      maxHeight: 20,
      minSlope: 0,
      maxSlope: 0.3
    });
    terrainSystem.setMaterialLayer(1, {
        texture: textures.brick_color_02,
        normalMap: textures.brick_normal_02,
        tiling: 100,
        minHeight: 0,
        maxHeight: 20,
        minSlope: 0,
        maxSlope: 0.3
      });
    
    // 添加更多材质层...
    
    // 添加调用植被初始化
    setTimeout(()=>{
      initializeSplitMaterialTest();
      // 初始化植被
      initializeVegetation();
    },2000)
    console.log('贴图材质已应用到地形');
  } catch (error) {
    console.warn('无法初始化材质:', error);
    // 使用默认材质
  }
}

/**
 * 批量加载贴图
 * @param textureInfos 贴图信息数组，每项包含路径和类型
 * @param textureLoader3D 贴图加载器实例
 * @returns 返回包含所有贴图的对象，键为贴图路径或自定义名称
 */
async function loadTextures(
  textureInfos: Array<{
    path: string;
    type: TextureTypes.TextureType;
    name?: string; // 可选的自定义名称
  }>,
  textureLoader3D: TextureLoader3D
): Promise<{ [key: string]: THREE.Texture }> {
  try {
    // 创建加载任务数组
    const loadingPromises = textureInfos.map(info => {
      return textureLoader3D.loadAndReturnTexture(info.path, info.type)
        .then(texture => {
          // 返回贴图及其标识符（使用name或path作为键）
          const key = info.name || info.path;
          return { key, texture };
        });
    });
    
    // 等待所有贴图加载完成
    const results = await Promise.all(loadingPromises);
    
    // 将结果整理为对象格式
    const texturesMap: { [key: string]: THREE.Texture } = {};
    results.forEach(result => {
      texturesMap[result.key] = result.texture;
    });
    
    console.log(`成功加载${results.length}个贴图`);
    return texturesMap;
  } catch (error) {
    console.error('批量加载贴图失败:', error);
    throw error; // 重新抛出错误，让调用者处理
  }
}

// 示例使用方法：
// const textures = await loadTextures([
//   { path: 'textures/tile02/Poliigon_BrickWallReclaimed_8320_BaseColor.jpg', type: TextureTypes.TextureType.BASE_COLOR, name: 'brick_color' },
//   { path: 'textures/tile02/Poliigon_BrickWallReclaimed_8320_Normal.jpg', type: TextureTypes.TextureType.NORMAL, name: 'brick_normal' }
// ], textureLoader3D);
// 
// console.log(textures.brick_color); // 访问单个贴图

// 尝试初始化材质
try {
  initializeMaterials()
} catch (error) {
  console.warn('无法初始化材质:', error);
  // 使用默认材质
}

// 激活场景
engine.activateScene("地形编辑场景");

// 启动引擎
engine.start();

// 添加窗口大小调整处理
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  camera.setAspect(width / height);
  engine.updateSize(width, height);
});

/**
 * 初始化左右两侧不同材质的测试场景
 */
function initializeSplitMaterialTest() {
//   if (!terrainSystem || !terrainSystem.terrainMaterial) {
//     console.error('地形系统或材质未初始化');
//     return;
//   }
  
  console.log('正在设置左右两侧不同材质...');
  
  window.terrainSystem = terrainSystem
  // 获取地形尺寸
  const terrainSize = terrainSystem.terrainSize || new THREE.Vector2(1000, 1000);
  const halfWidth = terrainSize.x / 2;
  
  // 网格划分数量
  const steps = 100; // 增加更多的采样点使边界更加平滑
  const stepSize = terrainSize.x / steps;
  
  // 左侧区域使用第一层材质 (brick_color)
  for (let z = -terrainSize.y/2; z <= terrainSize.y/2; z += stepSize) {
    for (let x = -terrainSize.x/2; x < 0; x += stepSize) {
      // 将左侧区域的第一层材质权重设为最大
      terrainSystem.paintMaterialLayer(
        new THREE.Vector3(x, 0, z), // 位置
        stepSize * 1.5,             // 半径（略大于步长确保覆盖）
        0,                          // 材质层索引 (第一层)
        1.0                         // 强度
      );
    }
  }
  
  // 右侧区域使用第二层材质 (brick_color_02)
  for (let z = -terrainSize.y/2; z <= terrainSize.y/2; z += stepSize) {
    for (let x = 0; x <= terrainSize.x/2; x += stepSize) {
      // 将右侧区域的第二层材质权重设为最大
      terrainSystem.paintMaterialLayer(
        new THREE.Vector3(x, 0, z), // 位置
        stepSize * 1.5,             // 半径
        1,                          // 材质层索引 (第二层)
        1.0                         // 强度
      );
    }
  }
  
  console.log('左右两侧材质设置完成');
}

// 添加植被初始化函数
function initializeVegetation() {
  // 确保植被系统与地形关联
  vegetationSystem.setTerrain(terrainSystem);
  
  // 预加载常用植被模型
  vegetationSystem.addVegetationType(
    'grass1', 
    '/public/models/g1.glb',  // 需要确保模型文件存在
    new THREE.Vector3(1, 1, 1), 
    0.5,
    0
  );
  vegetationSystem.addVegetationType(
    't1', 
    '/public/models/g4.glb',  
    new THREE.Vector3(0.01, 0.01, 0.01), 
    0,
    0
  );

  vegetationSystem.addVegetationType(
    'grass2', 
    '/public/models/g2.glb', 
    new THREE.Vector3(0.8, 1.2, 0.8), 
    0.7,
    0
  );
  
  vegetationSystem.addVegetationType(
    'flower1', 
    '/public/models/g3.glb', 
    new THREE.Vector3(1, 1, 1), 
    0.3,
    0
  );
  
//   // 设置风参数
//   vegetationSystem.updateWindParameters(
//     0.2,  // 风力强度
//     0.3,  // 风力频率
//     new THREE.Vector2(1, 0)  // 风向
//   );
  
  console.log('植被系统已初始化');
}

console.log(terrainScene,'terrainScene')