import Node from "../node/node";
import EventEmitter from "eventemitter3";
import SelectionArrowNext from "./selection-arrow-next";
import SelectionRemoveNext from "./selection-remove-next";
import type { ArrowType } from "./selection-arrow-next";

interface SelectionEventMap {
  select: (nodes: Node[]) => void; // 选择事件的回调函数类型
}

class Selection {
  public selectNodes: Node[] = []; // 当前选择的节点列表
  private readonly selectionArrowNext: SelectionArrowNext; // 处理箭头导航的实例
  private readonly selectionRemoveNext: SelectionRemoveNext; // 处理删除下一个节点的实例
  private readonly eventEmitter: EventEmitter<SelectionEventMap>; // 事件发射器实例
  private isMultiClickMode: boolean = false; // 多选模式标志

  public constructor(private root: Node) {
    this.selectionArrowNext = new SelectionArrowNext();
    this.selectionRemoveNext = new SelectionRemoveNext();
    this.eventEmitter = new EventEmitter<SelectionEventMap>();
  }

  // 设置多选模式
  public setIsMultiClickMode(isMultiClickMode: boolean) {
    this.isMultiClickMode = isMultiClickMode;
  }

  // 选择指定节点列表
  public select(nodes: Node[]): void {
    const clonedNodes = [...nodes]; // 克隆节点数组
    this.selectNodes.forEach((selection) => selection.setStyle("base")); // 恢复之前选择的节点样式
    clonedNodes.forEach((node) => node.setStyle("select")); // 设置新选择节点的样式
    this.selectNodes = clonedNodes; // 更新当前选择的节点列表

    this.eventEmitter.emit("select", this.selectNodes); // 触发选择事件
  }

  // 单节点选择
  public selectSingle(node: Node): void {
    if (!this.isMultiClickMode) {
      this.select([node]); // 非多选模式下直接选择单个节点
      return;
    }

    const targetNodeIndex = this.selectNodes.findIndex(
      (selectNode) => selectNode.id === node.id
    );
    if (targetNodeIndex >= 0) {
      node.setStyle("base"); // 取消选择节点的样式
      this.selectNodes.splice(targetNodeIndex, 1); // 从选择列表中移除节点
    } else {
      node.setStyle("select"); // 设置节点为选择状态
      this.selectNodes.push(node); // 将节点添加到选择列表
    }
    this.eventEmitter.emit("select", this.selectNodes); // 触发选择事件
  }

  // 根据箭头类型选择下一个节点
  public selectArrowNext(arrowType: ArrowType): void {
    const lastSelectNode = this.selectNodes[this.selectNodes.length - 1];
    if (!lastSelectNode) return; // 如果没有选中的节点则返回

    const nextNode = this.selectionArrowNext.getArrowNextNode(
      lastSelectNode,
      arrowType
    );
    if (nextNode) {
      this.select([nextNode]); // 选择下一个节点
    }
  }

  // 清空选择列表
  public empty(): void {
    this.select([]);
  }

  // 注册选择事件的回调函数
  public on<T extends EventEmitter.EventNames<SelectionEventMap>>(
    eventName: T,
    callback: EventEmitter.EventListener<SelectionEventMap, T>
  ) {
    this.eventEmitter.on(eventName, callback);
  }

  // 获取当前选择的节点列表
  public getSelectNodes(): Node[] {
    return this.selectNodes;
  }

  // 获取单个选择的节点（如果选择了多个节点则返回 null）
  public getSingleSelectNode(): Node | null {
    if (this.selectNodes.length !== 1) {
      return null;
    }
    return this.selectNodes[0];
  }

  // 获取要删除的下一个节点
  public getRemoveNextNode(): Node | null {
    return this.selectionRemoveNext.getRemoveNextNode(this.selectNodes);
  }

  // 根据节点ID列表选择节点
  public selectByIds(selectIds: string[]) {
    const nodeMap = this.getNodeMap(); // 获取节点ID到节点的映射
    const selectNodes =
      selectIds.map((nodeId) => nodeMap[nodeId]).filter((node) => !!node) || []; // 根据ID查找节点并过滤掉不存在的节点

    this.select(selectNodes); // 选择找到的节点
  }

  // 获取节点ID到节点的映射
  private getNodeMap = (): Record<string, Node> => {
    const nodeMap: Record<string, Node> = {};
    this.getNodeMapInner(this.root, nodeMap); // 递归构建节点映射
    return nodeMap;
  };

  // 递归遍历节点及其子节点，构建节点映射
  private getNodeMapInner = (
    node: Node,
    nodeMap: Record<string, Node>
  ): void => {
    if (!node) return;
    nodeMap[node.id] = node; // 将节点添加到映射中

    node.children?.forEach((child) => {
      this.getNodeMapInner(child, nodeMap); // 递归处理子节点
    });
  };
}

export default Selection;
