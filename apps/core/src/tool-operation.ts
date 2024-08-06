import Node from "./node/node";
import Tree from "./tree/tree";
import Selection from "./selection/selection";
import DataHandler from "./data/data-handler";

// 工具操作类，处理工具栏、子工具栏和键盘的公共操作
class ToolOperation {
  private readonly root: Node; // 根节点
  private readonly tree: Tree; // 树结构
  private readonly selection: Selection; // 节点选择处理
  private readonly dataHandler: DataHandler; // 数据处理

  public constructor({
    root,
    tree,
    selection,
    dataHandler,
  }: {
    root: Node;
    tree: Tree;
    selection: Selection;
    dataHandler: DataHandler;
  }) {
    this.root = root;
    this.tree = tree;
    this.selection = selection;
    this.dataHandler = dataHandler;
  }

  // 撤销操作
  public undo(): void {
    this.dataHandler.undo();
  }

  // 重做操作
  public redo(): void {
    this.dataHandler.redo();
  }

  // 添加子节点
  public addChildNode(): void {
    const selectNode = this.selection.getSingleSelectNode();
    if (!selectNode) return;
    this.dataHandler.addChildNode(selectNode.id, selectNode.depth + 1);
  }

  // 添加兄弟节点
  public addBrotherNode(): void {
    const selectNode = this.selection.getSingleSelectNode();
    if (!selectNode) return;
    this.dataHandler.addBrotherNode(selectNode.id, selectNode.depth);
  }

  // 修改添加兄弟节点方法，支持指定标签
  public addBrotherNodeLabel(label?: string): void {
    const selectNode = this.selection.getSingleSelectNode();
    if (!selectNode) return;
    this.dataHandler.addBrotherNode(selectNode.id, selectNode.depth, label);
  }

  // 新方法：批量添加子节点
  public addMultipleChildNodes(parentNodeId: string, labels: string[]): void {
    const parentNode = this.getNodeMap()[parentNodeId];
    if (!parentNode) return;

    this.dataHandler.addMultipleChildNodes(
      parentNodeId,
      parentNode.depth + 1,
      labels
    );
  }

  // 移除节点
  public removeNode(): void {
    const selectNodes = this.selection.getSelectNodes();
    if (!selectNodes || selectNodes.length === 0) return;

    const selecNodeIds = selectNodes.map((selectNode) => selectNode.id);
    this.dataHandler.removeNode(selecNodeIds);
  }

  // 获取节点映射
  public getNodeMap(): Record<string, Node> {
    const nodeMap = {};
    this.setNodeMapInner(this.root, nodeMap);
    return nodeMap;
  }

  // 设置节点映射的内部方法
  private setNodeMapInner(node: Node, nodeMap: Record<string, Node>): void {
    nodeMap[node.id] = node;
    node.children.forEach((child) => this.setNodeMapInner(child, nodeMap));
  }
}

export default ToolOperation;
