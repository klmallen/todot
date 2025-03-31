export class Clock {
  private startTime: number = 0;
  private lastTime: number = 0;
  private running: boolean = false;

  constructor() {
    this.startTime = 0;
    this.lastTime = 0;
    this.running = false;
  }

  start(): void {
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    this.running = true;
  }

  stop(): void {
    this.running = false;
  }

  getDelta(): number {
    if (!this.running) return 0;

    const currentTime = performance.now();
    const delta = (currentTime - this.lastTime) / 1000; // 转换为秒
    this.lastTime = currentTime;
    return delta;
  }

  getElapsedTime(): number {
    if (!this.running) return 0;
    return (performance.now() - this.startTime) / 1000;
  }
} 