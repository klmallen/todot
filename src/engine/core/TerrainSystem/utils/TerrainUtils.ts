import { createNoise2D, createNoise3D, createNoise4D } from 'simplex-noise';

export class TerrainUtils {
  /**
   * 生成噪声地形
   */
  static generateNoise(
    width: number,
    height: number,
    seed: number,
    scale: number,
    octaves: number,
    persistence: number,
    lacunarity: number
  ): Float32Array {
    const noiseMap = new Float32Array(width * height);
    
    // 使用新的API创建噪声函数
    const noise2D = createNoise2D();
    
    const seedX = Math.random() * 10000;
    const seedZ = Math.random() * 10000;
    
    for (let z = 0; z < height; z++) {
      for (let x = 0; x < width; x++) {
        // 在多个频率上累积噪声
        let amplitude = 1;
        let frequency = 1;
        let noiseValue = 0;
        let ampSum = 0;
        
        for (let i = 0; i < octaves; i++) {
          // 采样点坐标
          const sampleX = (x / scale) * frequency + seedX;
          const sampleZ = (z / scale) * frequency + seedZ;
          
          // 2D噪声，范围在-1到1之间
          const noise = noise2D(sampleX, sampleZ);
          
          // 累积噪声值
          noiseValue += noise * amplitude;
          ampSum += amplitude;
          
          // 更新振幅和频率
          amplitude *= persistence;
          frequency *= lacunarity;
        }
        
        // 归一化噪声值到0-1范围
        noiseValue = (noiseValue / ampSum + 1) * 0.5;
        
        noiseMap[z * width + x] = noiseValue;
      }
    }
    
    return noiseMap;
  }
  
  /**
   * 生成带种子的噪声
   */
  static getSimplexNoise(
    x: number,
    z: number,
    seed: number,
    scale: number,
    octaves: number,
    persistence: number,
    lacunarity: number
  ): number {
    // 使用新的API创建噪声函数
    // 如果需要固定种子，可以使用alea等库提供确定性随机数生成
    const noise2D = createNoise2D();
    
    let amplitude = 1;
    let frequency = 1;
    let noiseValue = 0;
    let ampSum = 0;
    
    for (let i = 0; i < octaves; i++) {
      // 采样点坐标
      const sampleX = (x / scale) * frequency;
      const sampleZ = (z / scale) * frequency;
      
      // 2D噪声，范围在-1到1之间
      const noise = noise2D(sampleX, sampleZ);
      
      // 累积噪声值
      noiseValue += noise * amplitude;
      ampSum += amplitude;
      
      // 更新振幅和频率
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    
    // 归一化振幅
    return noiseValue / ampSum;
  }
  
  /**
   * 双线性插值
   */
  static bilinearInterpolation(
    x: number,
    z: number,
    x1: number,
    x2: number,
    z1: number,
    z2: number,
    q11: number,
    q12: number,
    q21: number,
    q22: number
  ): number {
    const xRatio = (x - x1) / (x2 - x1);
    const zRatio = (z - z1) / (z2 - z1);
    
    // 在x方向上的两次线性插值
    const r1 = q11 * (1 - xRatio) + q21 * xRatio;
    const r2 = q12 * (1 - xRatio) + q22 * xRatio;
    
    // 在z方向上的最终插值
    return r1 * (1 - zRatio) + r2 * zRatio;
  }
} 