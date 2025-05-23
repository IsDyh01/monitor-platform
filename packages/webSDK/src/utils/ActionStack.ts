export interface Action {
  mertic: string;          // 行为类型（如 'click'）
  timestamp: number;     // 行为时间戳
  data: any;             // 行为数据（如点击事件的 payload）
}

export class ActionStack {
  private stack: Action[] = [];
  private maxLength: number;

  constructor(maxLength: number = 100) {
    this.maxLength = maxLength;
  }

  // 压入新行为
  push(action: Action): void {
    this.stack.push(action);
    this.trimExcess(); // 保持栈长度不超过最大值
  }

  // 获取行为栈副本
  getStack(): Action[] {
    return [...this.stack];
  }

  // 清空栈
  clear(): void {
    this.stack = [];
  }

  // 获取最近 n 个行为
  getRecentActions(count: number): Action[] {
    return this.stack.slice(-count);
  }

  // 修剪超出长度的行为（最早的优先移除）
  private trimExcess(): void {
    if (this.stack.length > this.maxLength) {
      const removeCount = this.stack.length - this.maxLength;
      this.stack.splice(0, removeCount);
    }
  }
}