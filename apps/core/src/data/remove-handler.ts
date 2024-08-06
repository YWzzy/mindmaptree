import * as Y from "yjs";
import { getRootData } from "./data-helper";
import type { NodeData } from "../types";

// RemoveHandler 类用于处理节点删除操作
class RemoveHandler {
  // 构造函数接受 ydoc 和 nodeDataMap 作为参数
  public constructor(
    private readonly ydoc: Y.Doc,
    private readonly nodeDataMap: Y.Map<NodeData>
  ) {}

  // 删除指定节点
  public removeNode(selecNodeIds: string[]): void {
    // 获取根节点数据
    const rootData = getRootData(this.nodeDataMap);
    // 获取需要删除的顶级节点ID
    const topNodeIds = this.getTopNodeIdsInner(["", rootData], selecNodeIds);

    if (topNodeIds.length === 0) return;

    // 使用 Yjs 的事务来进行批量操作
    this.ydoc.transact(() => {
      topNodeIds.forEach((id) => this.removeNodeDataInner(id));
    });
  }

  // 递归获取顶级节点ID
  private getTopNodeIdsInner(
    [currentId, currentData]: [string, NodeData],
    selecNodeIds: string[]
  ): string[] {
    if (!currentData) return [];

    // 如果当前节点不是根节点且在选择的节点ID列表中，则返回当前节点ID
    if (!currentData.isRoot && selecNodeIds.includes(currentId)) {
      return [currentId];
    }

    let topNodeIds: string[] = [];

    // 递归遍历子节点
    currentData.children?.forEach((childId) => {
      const childTopIds = this.getTopNodeIdsInner(
        [childId, this.nodeDataMap.get(childId)!],
        selecNodeIds
      );
      if (childTopIds.length > 0) {
        topNodeIds = topNodeIds.concat(childTopIds);
      }
    });

    return topNodeIds;
  }

  // 递归删除节点及其子节点
  private removeNodeDataInner(removeId: string): void {
    const removeData = this.nodeDataMap.get(removeId);

    if (!removeData) return;
    removeData?.children.forEach((childId) => {
      this.removeNodeDataInner(childId);
    });

    this.nodeDataMap.delete(removeId);
  }
}

export default RemoveHandler;
