import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { examples, categories, examplesByCategory, Example } from './engine/examples';
import './exampleBrowser.css';

/**
 * 示例浏览器组件
 */
function ExampleBrowser() {
  // 状态
  const [selectedExample, setSelectedExample] = useState<Example | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [engineInstance, setEngineInstance] = useState<any>(null);

  // 引用
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 运行示例
  const runExample = async (example: Example) => {
    if (!canvasRef.current) return;

    // 清理DOM中可能存在的UI元素
    const existingUIs = document.querySelectorAll('.engine-ui');
    existingUIs.forEach(ui => ui.remove());

    // 如果有正在运行的示例，先停止它
    if (engineInstance) {
      try {
        // 尝试清理场景
        if (typeof engineInstance.reset === 'function') {
          engineInstance.reset();
        }

        // 尝试停止引擎
        if (typeof engineInstance.stop === 'function') {
          engineInstance.stop();
        }

        // 尝试释放资源
        if (typeof engineInstance.dispose === 'function') {
          engineInstance.dispose();
        }
      } catch (error) {
        console.error('停止上一个示例时出错:', error);
      }
    }

    // 重置引擎实例
    setEngineInstance(null);

    // 尝试强制进行垃圾回收
    try {
      // 使用任何可能的方式来提示浏览器进行垃圾回收
      if (typeof window !== 'undefined') {
        // @ts-ignore - 非标准属性，但在某些浏览器中可能存在
        if (typeof window.gc === 'function') {
          // @ts-ignore
          window.gc();
        }
      }
    } catch (e) {
      // 忽略错误
    }

    setIsRunning(true);

    try {
      // 创建新的canvas元素替换旧的
      if (canvasRef.current && canvasRef.current.parentNode) {
        const oldCanvas = canvasRef.current;
        const newCanvas = document.createElement('canvas');
        newCanvas.className = oldCanvas.className;
        newCanvas.style.cssText = oldCanvas.style.cssText;
        oldCanvas.parentNode.replaceChild(newCanvas, oldCanvas);
        canvasRef.current = newCanvas;
      }

      // 运行示例
      console.log(`开始运行示例: ${example.name}`);
      const instance = await example.run(canvasRef.current);
      console.log(`示例运行成功: ${example.name}`);
      setEngineInstance(instance);
    } catch (error) {
      console.error('运行示例时出错:', error);
      // alert(`运行示例失败: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // 选择示例
  const handleSelectExample = (example: Example) => {
    setSelectedExample(example);
    runExample(example);
  };

  // 初始化时运行第一个示例
  useEffect(() => {
    if (examples.length > 0 && !selectedExample) {
      handleSelectExample(examples[0]);
    }
  }, []);

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="example-browser">
      <header className="example-header">
        <h1>引擎示例浏览器</h1>
        <div className="example-header-actions">
          {selectedExample && (
            <button
              className="restart-button"
              onClick={() => selectedExample && runExample(selectedExample)}
              disabled={isRunning}
            >
              重新启动示例
            </button>
          )}
        </div>
      </header>

      <div className="example-content">
        <aside className="example-sidebar">
          <div className="category-list">
            {categories.map(category => (
              <div
                key={category}
                className={`category-item ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </div>
            ))}
          </div>

          <div className="example-list">
            {examplesByCategory[activeCategory]?.map(example => (
              <div
                key={example.name}
                className={`example-item ${selectedExample?.name === example.name ? 'active' : ''}`}
                onClick={() => handleSelectExample(example)}
              >
                <div className="example-item-content">
                  {example.thumbnailUrl && (
                    <div className="example-thumbnail">
                      <img src={example.thumbnailUrl} alt={example.name} />
                    </div>
                  )}
                  <div className="example-info">
                    <h3>{example.name}</h3>
                    <p>{example.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="example-viewport" ref={containerRef}>
          {isRunning && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <div className="loading-text">加载示例中...</div>
            </div>
          )}

          <canvas ref={canvasRef} className="example-canvas"></canvas>

          {selectedExample && (
            <div className="example-info-overlay">
              <h2>{selectedExample.name}</h2>
              <p>{selectedExample.description}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// 渲染示例浏览器
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ExampleBrowser />
  </React.StrictMode>
);
