import { PostProcessingEffect } from './PostProcessingEffect';
import { BloomEffect } from './effects/BloomEffect';
import { ChromaticAberrationEffect } from './effects/ChromaticAberrationEffect';

/**
 * 后处理预设类型
 */
export enum PresetType {
    NONE = 'none',
    CINEMATIC = 'cinematic',
    RETRO = 'retro',
    HORROR = 'horror',
    DREAM = 'dream',
    CUSTOM = 'custom'
}

/**
 * 后处理预设系统 - 提供预配置的效果组合
 */
export class PostProcessingPreset {
    /**
     * 创建一个预设
     * @param type 预设类型
     * @returns 预设包含的后处理效果数组
     */
    public static createPreset(type: PresetType): PostProcessingEffect[] {
        switch (type) {
            case PresetType.NONE:
                return [];
                
            case PresetType.CINEMATIC:
                return [
                    new BloomEffect(1.2, 0.4, 0.5),
                    new ChromaticAberrationEffect(0.003)
                ];
                
            case PresetType.RETRO:
                return [
                    new ChromaticAberrationEffect(0.01),
                    new BloomEffect(0.8, 0.6, 0.4)
                ];
                
            case PresetType.HORROR:
                return [
                    new ChromaticAberrationEffect(0.008),
                    new BloomEffect(0.5, 0.7, 0.8)
                ];
                
            case PresetType.DREAM:
                return [
                    new BloomEffect(2.0, 0.6, 0.4),
                    new ChromaticAberrationEffect(0.002)
                ];
                
            case PresetType.CUSTOM:
                // 自定义预设可以在运行时配置
                return [];
                
            default:
                console.warn(`未知的预设类型: ${type}，返回空预设`);
                return [];
        }
    }
    
    /**
     * 创建自定义预设
     * @param effects 要包含的效果数组
     * @returns 自定义预设的效果数组
     */
    public static createCustomPreset(effects: PostProcessingEffect[]): PostProcessingEffect[] {
        return [...effects]; // 返回副本以避免引用问题
    }
    
    /**
     * 获取所有可用的预设类型
     * @returns 所有预设类型的数组
     */
    public static getAllPresetTypes(): PresetType[] {
        return Object.values(PresetType).filter(v => typeof v === 'string') as PresetType[];
    }
    
    /**
     * 获取预设名称
     * @param type 预设类型
     * @returns 格式化的预设名称
     */
    public static getPresetName(type: PresetType): string {
        switch (type) {
            case PresetType.NONE:
                return '无效果';
            case PresetType.CINEMATIC:
                return '电影效果';
            case PresetType.RETRO:
                return '复古效果';
            case PresetType.HORROR:
                return '恐怖效果';
            case PresetType.DREAM:
                return '梦幻效果';
            case PresetType.CUSTOM:
                return '自定义效果';
            default:
                return '未知效果';
        }
    }
    
    /**
     * 获取预设描述
     * @param type 预设类型
     * @returns 预设的简短描述
     */
    public static getPresetDescription(type: PresetType): string {
        switch (type) {
            case PresetType.NONE:
                return '无任何后处理效果';
            case PresetType.CINEMATIC:
                return '模拟电影风格，增强色彩和对比度';
            case PresetType.RETRO:
                return '创造复古游戏风格，轻微色差和发光';
            case PresetType.HORROR:
                return '营造恐怖氛围，增加阴影和色调扭曲';
            case PresetType.DREAM:
                return '创造梦幻般的视觉效果，强烈发光和柔和色彩';
            case PresetType.CUSTOM:
                return '用户自定义的效果组合';
            default:
                return '无描述';
        }
    }
}