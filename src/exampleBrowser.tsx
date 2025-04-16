import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { examples, categories, examplesByCategory, Example, getExampleById } from './engine/examples';
import './exampleBrowser.css';

/**
 * 示例详情页组件
 */
function ExampleDetail() {
  // 获取URL参数中的示例ID
  const { exampleId } = useParams<{ exampleId: string }>();
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = React.useState<boolean>(false);
  const [engineInstance, setEngineInstance] = React.useState<any>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // 根据ID获取示例
  const example = exampleId ? getExampleById(exampleId) : null;

  // 运行示例
  const runExample = React.useCallback(async (example: Example) => {
    if (!canvasRef.current) return;

    // 清理DOM中可能存在的UI元素
    const existingUIs = document.querySelectorAll('.engine-ui');
    existingUIs.forEach(ui => ui.remove());

    // 尝试清理全局对象
    try {
      // 安全地检查全局引擎实例是否存在并有效
      const globalEngine = (window as any).currentEngine;
      if (globalEngine && typeof globalEngine === 'object') {
        // 安全地调用方法
        if (typeof globalEngine.stop === 'function') {
          globalEngine.stop();
        }
        if (typeof globalEngine.dispose === 'function') {
          globalEngine.dispose();
        }
        // 清除引用
        (window as any).currentEngine = null;
        console.log('全局引擎实例已清理');
      }
    } catch (e) {
      console.error('清理全局引擎实例失败:', e);
    }

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
      console.log(`开始运行示例: ${example.name} (ID: ${example.id})`);
      const instance = await example.run(canvasRef.current);
      console.log(`示例运行成功: ${example.name}`);

      // 存储引擎实例
      setEngineInstance(instance);

      // 安全地存储到全局对象中，便于清理
      if (instance && typeof instance === 'object') {
        (window as any).currentEngine = instance;
        console.log('引擎实例已存储到全局对象');
      }
    } catch (error) {
      console.error('运行示例时出错:', error);
    } finally {
      setIsRunning(false);
    }
  }, []);  // 移除 engineInstance 依赖，避免循环依赖

  // 处理窗口大小变化
  React.useEffect(() => {
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

  // 当示例ID变化时运行示例
  React.useEffect(() => {
    if (example) {
      runExample(example);
    }

    // 组件卸载时清理引擎实例
    return () => {
      if (engineInstance) {
        try {
          if (typeof engineInstance.stop === 'function') {
            engineInstance.stop();
          }
          if (typeof engineInstance.dispose === 'function') {
            engineInstance.dispose();
          }
        } catch (error) {
          console.error('组件卸载时清理引擎实例失败:', error);
        }
      }

      // 清理全局对象
      try {
        // 安全地检查全局引擎实例是否存在并有效
        const globalEngine = (window as any).currentEngine;
        if (globalEngine && typeof globalEngine === 'object') {
          // 安全地调用方法
          if (typeof globalEngine.stop === 'function') {
            globalEngine.stop();
          }
          if (typeof globalEngine.dispose === 'function') {
            globalEngine.dispose();
          }
          // 清除引用
          (window as any).currentEngine = null;
          console.log('组件卸载时全局引擎实例已清理');
        }
      } catch (e) {
        console.error('清理全局引擎实例失败:', e);
      }
    };
  }, [example, runExample, engineInstance]);

  // 如果示例不存在，重定向到首页
  if (!example) {
    return <Navigate to="/" />;
  }

  return (
    <div className="example-detail">
      <header className="example-header">
        <Link to="/" className="back-button">返回示例列表</Link>
        <h1>{example.name}</h1>
        <div className="example-header-actions">
          <button
            className="restart-button"
            onClick={() => runExample(example)}
            disabled={isRunning}
          >
            重新启动示例
          </button>
        </div>
      </header>

      <div className="example-content">
        <main className="example-viewport" ref={containerRef}>
          {isRunning && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <div className="loading-text">加载示例中...</div>
            </div>
          )}

          <canvas ref={canvasRef} className="example-canvas"></canvas>

          <div className="example-info-overlay">
            <h2>{example.name}</h2>
            <p>{example.description}</p>
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * 示例列表组件
 */
function ExampleList() {
  const [activeCategory, setActiveCategory] = React.useState<string>(categories[0]);
  const navigate = useNavigate();

  // 选择示例
  const handleSelectExample = (example: Example) => {
    console.log(`选择示例: ${example.name} (ID: ${example.id})`);
    navigate(`/example/${example.id}`);
  };

  return (
    <div className="example-browser">
      <header className="example-header">
        <h1>引擎示例浏览器</h1>
      </header>

      <div className="example-content">
        <aside className="example-sidebar full-width">
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
                key={example.id}
                className="example-item"
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
      </div>
    </div>
  );
}

/**
 * 主应用组件
 */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ExampleList />} />
        <Route path="/example/:exampleId" element={<ExampleDetail />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

// 渲染应用
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
