import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Todot Engine",
  description: "Documentation for Todot 3D Engine",
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: '示例', link: '/examples/' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '入门',
          items: [
            { text: '介绍', link: '/guide/' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装', link: '/guide/installation' },
            { text: '基本概念', link: '/guide/concepts' },
          ]
        },
        {
          text: '核心功能',
          items: [
            { text: '场景管理', link: '/guide/scenes' },
            { text: '节点系统', link: '/guide/nodes' },
            { text: '组件系统', link: '/guide/components' },
            { text: '脚本系统', link: '/guide/scripts' },
          ]
        },
        {
          text: '高级功能',
          items: [
            { text: '粒子系统', link: '/guide/particles' },
            { text: '物理系统', link: '/guide/physics' },
            { text: '输入系统', link: '/guide/input' },
            { text: '地形系统', link: '/guide/terrain' },
            { text: '动画系统', link: '/guide/animation' },
          ]
        },
      ],
      '/api/': [
        {
          text: '核心',
          items: [
            { text: 'Engine', link: '/api/engine' },
            { text: 'Scene', link: '/api/scene' },
            { text: 'Node3d', link: '/api/node3d' },
          ]
        },
        {
          text: '节点类型',
          items: [
            { text: 'CameraNode3D', link: '/api/camera-node' },
            { text: 'MeshInstance3D', link: '/api/mesh-instance' },
            { text: 'ModelLoader3D', link: '/api/model-loader' },
            { text: 'AnimationNode3D', link: '/api/animation-node' },
            { text: 'InstanceManager3D', link: '/api/instance-manager' },
          ]
        },
        {
          text: '系统',
          items: [
            { text: 'ParticleSystem', link: '/api/particle-system' },
            { text: 'PhysicsSystem', link: '/api/physics-system' },
            { text: 'InputSystem', link: '/api/input-system' },
            { text: 'TerrainSystem', link: '/api/terrain-system' },
          ]
        },
      ],
      '/examples/': [
        {
          text: '示例',
          items: [
            { text: '基础示例', link: '/examples/' },
            { text: '粒子系统示例', link: '/examples/particles' },
            { text: '物理系统示例', link: '/examples/physics' },
            { text: '输入系统示例', link: '/examples/input' },
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/yourusername/todot-engine' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2023-present Todot Engine'
    }
  }
})
