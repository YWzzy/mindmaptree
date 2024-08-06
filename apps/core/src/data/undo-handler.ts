import * as Y from "yjs";
import { NodeData } from "../types";

// UndoHandler 类用于处理撤销和重做操作
class UndoHandler {
  private readonly undoManager: Y.UndoManager;

  // 构造函数接受 nodeDataMap 作为参数，并初始化 undoManager
  public constructor(nodeDataMap: Y.Map<NodeData>) {
    this.undoManager = new Y.UndoManager(nodeDataMap);
  }

  // 撤销上一步操作
  public undo(): void {
    this.undoManager.undo();
  }

  // 重做上一步操作
  public redo(): void {
    this.undoManager.redo();
  }

  // 判断是否有可以撤销的操作
  public canUndo(): boolean {
    return this.undoManager.undoStack.length > 0;
  }

  // 判断是否有可以重做的操作
  public canRedo(): boolean {
    return this.undoManager.redoStack.length > 0;
  }
}

export default UndoHandler;
