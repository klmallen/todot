/**
 * 示例索引文件
 * 导出所有示例以便在示例浏览器中使用
 */

import { runParticleExample } from './particle-example';
import { runPhysicsExample } from './physics-example';
import { InputExample } from '../input/examples/InputExample';
import { runCustomMeshParticleExample } from './custom-mesh-particle-example';
import { runPhysicsModelExample } from './physics-model-example';
import { runBoxParticleExample } from './box-particle-example';
import { runPermanentSwordTrailExample } from './permanent-sword-trail-example';

// 示例类型定义
export interface Example {
  id: string;         // 唯一标识符
  name: string;
  description: string;
  category: string;
  thumbnailUrl?: string;
  run: (canvas: HTMLCanvasElement) => Promise<any>;
}

// 示例列表
export const examples: Example[] = [
  {
    id: 'particle',
    name: '粒子系统示例',
    description: '展示各种粒子效果，包括基础粒子、火焰、烟雾、魔法效果、雪花和自定义网格粒子',
    category: '特效',
    thumbnailUrl: '/examples/thumbnails/particle.svg',
    run: runParticleExample
  },
  {
    id: 'physics',
    name: '物理系统示例',
    description: '展示物理系统功能，包括碰撞、重力、冲量和爆炸效果',
    category: '物理',
    thumbnailUrl: '/examples/thumbnails/physics.svg',
    run: runPhysicsExample
  },
  {
    id: 'input',
    name: '输入系统示例',
    description: '展示如何使用输入节点、鼠标节点和射线节点进行交互',
    category: '输入',
    thumbnailUrl: '/examples/thumbnails/input.svg',
    run: async (canvas: HTMLCanvasElement) => {
      const example = new InputExample();
      await example.initialize(canvas);
      return example;
    }
  },
  {
    id: 'custom-mesh-particle',
    name: '自定义网格粒子示例',
    description: '演示如何使用自定义网格和模型作为粒子',
    category: '特效',
    thumbnailUrl: '/examples/thumbnails/particle.svg',
    run: runCustomMeshParticleExample
  },
  {
    id: 'box-particle',
    name: '盒子粒子示例',
    description: '演示如何使用立方体、球体和圆环作为粒子',
    category: '特效',
    thumbnailUrl: '/examples/thumbnails/particle.svg',
    run: runBoxParticleExample
  },
  {
    id: 'permanent-sword-trail',
    name: '永久刀光效果',
    description: '演示如何创建永久存在的刀光效果，使用自定义网格和FBX模型',
    category: '特效',
    thumbnailUrl: '/examples/thumbnails/particle.svg',
    run: runPermanentSwordTrailExample
  },
  {
    id: 'physics-model',
    name: '物理模型示例',
    description: '演示如何为模型添加物理能力并正确显示碰撞体',
    category: '物理',
    thumbnailUrl: '/examples/thumbnails/physics.svg',
    run: runPhysicsModelExample
  }
];

// 按类别分组的示例
export const examplesByCategory: Record<string, Example[]> = examples.reduce((acc, example) => {
  if (!acc[example.category]) {
    acc[example.category] = [];
  }
  acc[example.category].push(example);
  return acc;
}, {} as Record<string, Example[]>);

// 获取所有类别
export const categories = Object.keys(examplesByCategory);

// 根据名称获取示例
export function getExampleByName(name: string): Example | undefined {
  return examples.find(example => example.name === name);
}

// 根据ID获取示例
export function getExampleById(id: string): Example | undefined {
  return examples.find(example => example.id === id);
}

// 导出各个示例文件
export * from './permanent-sword-trail-example';
export * from './tsl-dissolve-sword-trail-example';
