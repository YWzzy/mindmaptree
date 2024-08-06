import EventEmitter from "eventemitter3";
import Node from "../node/node";
import Viewport from "../viewport";
import { generateId } from "../helper";
import type { RaphaelPaper } from "raphael";
import type { NodeOptions, NodeEventMap, NodeEventNames } from "../node/node";
import type { ImageData } from "../types";

// 创建节点的参数接口
export interface CreateNodeParams {
  id?: NodeOptions["id"];
  depth: NodeOptions["depth"];
  label: NodeOptions["label"];
  direction: NodeOptions["direction"];
  x?: NodeOptions["x"];
  y?: NodeOptions["y"];
  father?: NodeOptions["father"];
  isExpand?: NodeOptions["isExpand"];
  imageData?: ImageData;
  link?: string;
}

// 创建节点函数类型
export type CreateNodeFunc = (params: CreateNodeParams) => Node;

type NodeCallbackArgs<EventNames extends NodeEventNames> = Parameters<
  NodeEventMap[EventNames][0]
>;
type NodeCreatorCallback<EventNames extends NodeEventNames> = (
  node: Node,
  ...args: Parameters<NodeEventMap[EventNames][0]>
) => void;

interface NodeCreatorEventMap {
  mousedown: NodeCreatorCallback<"mousedown">;
  click: NodeCreatorCallback<"click">;
  dblclick: NodeCreatorCallback<"dblclick">;
  touchstart: NodeCreatorCallback<"touchstart">;
  mousedownExpander: NodeCreatorCallback<"mousedownExpander">;
  dragEnd: NodeCreatorCallback<"dragEnd">;
}

type NodeCreatorEventNames = keyof NodeCreatorEventMap;

// 只支持带有一个回调的事件
const nodeCreatorEventNames: NodeCreatorEventNames[] = [
  "mousedown",
  "click",
  "dblclick",
  "touchstart",
  "mousedownExpander",
  "dragEnd",
];

class NodeCreator {
  private readonly paper: RaphaelPaper;
  private readonly viewport: Viewport;
  private readonly eventEmitter: EventEmitter<NodeCreatorEventMap>;

  // 构造函数
  public constructor({
    paper,
    viewport,
  }: {
    paper: RaphaelPaper;
    viewport: Viewport;
  }) {
    this.paper = paper;
    this.viewport = viewport;
    this.eventEmitter = new EventEmitter<NodeCreatorEventMap>();
  }

  // 创建节点
  public createNode = ({
    id,
    depth,
    label,
    direction,
    x,
    y,
    father,
    isExpand,
    imageData,
    link,
  }: CreateNodeParams): Node => {
    const newNode = new Node({
      paper: this.paper,
      id: id || generateId(),
      depth,
      label,
      direction,
      x,
      y,
      father,
      isExpand,
      viewport: this.viewport,
      imageData,
      link,
    });

    nodeCreatorEventNames.forEach((eventName) => {
      newNode.on(eventName, (...args: NodeCallbackArgs<NodeEventNames>) => {
        // @ts-ignore
        this.eventEmitter.emit(eventName, newNode, ...args);
      });
    });

    return newNode;
  };

  // 监听事件
  public on<EventName extends NodeCreatorEventNames>(
    eventName: EventName,
    callback: NodeCreatorEventMap[EventName]
  ): void {
    // @ts-ignore
    this.eventEmitter.on(eventName, callback);
  }

  // 清除所有监听器
  public clear(): void {
    this.eventEmitter.removeAllListeners();
  }
}

export default NodeCreator;
