import Raphael from "raphael";
import MultiSelectShape from "../shape/multi-select-shape";
import Viewport from "../viewport";
import Node from "../node/node";
import Selection from "./selection";
import PaperWrapper from "../paper-wrapper";
import ToolOperation from "../tool-operation";
import { isMobile } from "../helper";

// 有效的位移差，用于初始化移动操作
const validDiff = 2;

class MultiSelect {
  // 定义类的私有属性
  private readonly multiSelectShape: MultiSelectShape;
  private readonly viewport: Viewport;
  private readonly selection: Selection;
  private readonly svgDom: SVGSVGElement | null;
  private readonly toolOperation: ToolOperation;
  private allNodes: Node[] = [];
  private preSelectNodes: Node[] = [];
  private able: boolean = true; // 多选功能是否可用
  private isStart: boolean = false; // 是否开始多选
  private isMoveInited: boolean = false; // 是否初始化了移动操作
  private lastClientX: number = 0; // 上一次鼠标的X坐标
  private lastClientY: number = 0; // 上一次鼠标的Y坐标

  // 构造函数，初始化多选功能
  public constructor({
    paperWrapper,
    viewport,
    toolOperation,
    selection,
  }: {
    paperWrapper: PaperWrapper;
    viewport: Viewport;
    toolOperation: ToolOperation;
    selection: Selection;
  }) {
    const paper = paperWrapper.getPaper();
    this.svgDom = paperWrapper.getSvgDom();
    this.multiSelectShape = new MultiSelectShape(paper);
    this.viewport = viewport;
    this.selection = selection;
    this.toolOperation = toolOperation;

    // 根据设备类型添加不同的事件监听器
    if (isMobile) {
      this.svgDom?.addEventListener("touchstart", this.handleTouchstart, false);
    } else {
      this.svgDom?.addEventListener("mousedown", this.handleMousedown);
      this.svgDom?.addEventListener("mousemove", this.handleMousemove);
      this.svgDom?.addEventListener("mouseup", this.handleMouseup);
    }
  }

  // 禁用多选功能
  public disable(): void {
    this.able = false;
  }

  // 启用多选功能
  public enable(): void {
    this.able = true;
  }

  // 清除事件监听器
  public clear(): void {
    if (isMobile) {
      this.svgDom?.removeEventListener(
        "touchstart",
        this.handleTouchstart,
        false
      );
    } else {
      this.svgDom?.removeEventListener("mousedown", this.handleMousedown);
      this.svgDom?.removeEventListener("mousemove", this.handleMousemove);
      this.svgDom?.removeEventListener("mouseup", this.handleMouseup);
    }
  }

  // 处理触摸开始事件
  private handleTouchstart = (): void => {
    this.selection.empty();
  };

  // 处理鼠标按下事件
  private handleMousedown = (event: MouseEvent): void => {
    if (!this.able) {
      return;
    }

    this.isStart = true;
    this.lastClientX = event.clientX;
    this.lastClientY = event.clientY;

    this.selection.empty();
  };

  // 处理鼠标移动事件
  private handleMousemove = (event: MouseEvent): void => {
    if (!this.isStart) return;

    const { clientX, clientY } = event;
    const dx = this.lastClientX - clientX;
    const dy = this.lastClientY - clientY;

    // 初始化移动操作
    if (
      !this.isMoveInited &&
      (Math.abs(dx) > validDiff || Math.abs(dy) > validDiff)
    ) {
      const viewportPosition = this.viewport.getViewportPosition(
        event.clientX,
        event.clientY
      );
      this.multiSelectShape.init(viewportPosition.x, viewportPosition.y);

      const nodeMap = this.toolOperation.getNodeMap();
      this.allNodes = Object.keys(nodeMap).map((nodeId) => {
        return nodeMap[nodeId];
      });

      this.isMoveInited = true;
    }

    // 更新多选框的大小和选中的节点
    if (this.isMoveInited) {
      const viewportPosition = this.viewport.getViewportPosition(
        event.clientX,
        event.clientY
      );
      this.multiSelectShape.resize(viewportPosition.x, viewportPosition.y);

      const intersectNodes =
        this.allNodes.filter((item) => {
          return Raphael.isBBoxIntersect(
            this.multiSelectShape.getBBox(),
            item.getBBox()
          );
        }) || [];

      const selectedNodes = [];

      // 按顺序多选节点
      for (let i = 0; i < this.preSelectNodes.length; i++) {
        if (intersectNodes.includes(this.preSelectNodes[i])) {
          selectedNodes.push(this.preSelectNodes[i]);
        }
      }

      for (let i = 0; i < intersectNodes.length; i++) {
        if (!selectedNodes.includes(intersectNodes[i])) {
          selectedNodes.push(intersectNodes[i]);
        }
      }

      this.selection.select(selectedNodes);
      this.preSelectNodes = selectedNodes;
    }

    this.lastClientX = clientX;
    this.lastClientY = clientY;
  };

  // 处理鼠标松开事件
  private handleMouseup = (): void => {
    if (!this.isStart) return;

    this.multiSelectShape.hide();
    this.allNodes = [];
    this.preSelectNodes = [];
    this.isStart = false;
    this.isMoveInited = false;
    this.lastClientX = 0;
    this.lastClientY = 0;
  };
}

// 导出 MultiSelect 类
export default MultiSelect;
