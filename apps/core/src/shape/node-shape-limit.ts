import ShapeEventEmitter from "./common/shape-event-emitter";
import NodeShapeStyle from "./common/node-shape-style";
import { Direction } from "../types";
import { isMobile } from "../helper";
import type { EventNames, EventArgs } from "./common/shape-event-emitter";
import type {
  RaphaelPaper,
  RaphaelSet,
  RaphaelElement,
  RaphaelAxisAlignedBoundingBox,
  RaphaelAttributes,
} from "raphael";
import type { StyleType } from "./common/node-shape-style";
import type { ImageData } from "../types";

const invisibleX = -999999;
const invisibleY = -999999;

const defaultPaddingWidth = 40;
const defaultRectHeight = 37;
const borderPadding = 6;

// Add default max width and height
const defaultMaxWidth = 200;
const defaultMaxHeight = 500;

export interface NodeShapeOptions {
  paper: RaphaelPaper;
  x?: number;
  y?: number;
  label: string;
  paddingWidth?: number;
  rectHeight?: number;
  labelBaseAttr?: Partial<RaphaelAttributes>;
  rectBaseAttr?: Partial<RaphaelAttributes>;
  borderBaseAttr?: Partial<RaphaelAttributes>;
  imageData?: ImageData | null;
  link?: string;
  maxWidth?: number; // Add maxWidth option
  maxHeight?: number; // Add maxHeight option
}

class NodeShape {
  private readonly paper: RaphaelPaper;
  private readonly shapeSet: RaphaelSet;
  private readonly borderShape: RaphaelElement;
  private readonly labelShape: RaphaelElement;
  private readonly rectShape: RaphaelElement;
  private readonly imageShape: RaphaelElement | null = null;
  private readonly paddingWidth: number;
  private readonly rectHeight: number;
  private readonly shapeEventEmitter: ShapeEventEmitter;
  private readonly nodeShapeStyle: NodeShapeStyle;
  private readonly imageData: ImageData | null = null;
  private readonly maxWidth: number; // Add maxWidth property
  private readonly maxHeight: number; // Add maxHeight property
  private label: string;
  private isHide: boolean = false;
  private isHoverInCalled: boolean = false;

  public constructor({
    paper,
    x,
    y,
    label,
    paddingWidth = defaultPaddingWidth,
    rectHeight = defaultRectHeight,
    labelBaseAttr,
    rectBaseAttr,
    borderBaseAttr,
    imageData,
    link,
    maxWidth = defaultMaxWidth, // Set default maxWidth
    maxHeight = defaultMaxHeight, // Set default maxHeight
  }: NodeShapeOptions) {
    this.paper = paper;
    this.label = label;
    this.paddingWidth = paddingWidth;
    this.rectHeight = rectHeight;
    this.maxWidth = maxWidth;
    this.maxHeight = maxHeight;

    const hasValidPosition = x !== undefined && y !== undefined;
    const shapeX = hasValidPosition ? x : invisibleX;
    const shapeY = hasValidPosition ? y : invisibleY;

    this.labelShape = paper.text(shapeX, shapeY, label);
    this.borderShape = paper.rect(shapeX, shapeY, 0, 0, 4);
    this.rectShape = paper.rect(shapeX, shapeY, 0, 0, 4);
    this.shapeSet = paper
      .set()
      .push(this.labelShape)
      .push(this.borderShape)
      .push(this.rectShape);

    if (imageData) {
      this.imageShape = paper.image(
        imageData.src,
        shapeX,
        shapeY,
        imageData.width,
        imageData.height
      );
      this.shapeSet.push(this.imageShape);
    }
    this.imageData = imageData || null;

    if (link) {
      const mousedownEventName = isMobile ? "touchstart" : "mousedown";
      this.labelShape[mousedownEventName](() => {
        window.location.href = link;
      });
      this.labelShape.attr({
        stroke: "#3498DB",
      });
      // @ts-ignore
      this.labelShape.node.style.cursor = "pointer";
    }

    this.nodeShapeStyle = new NodeShapeStyle({
      shapeSet: this.shapeSet,
      labelShape: this.labelShape,
      borderShape: this.borderShape,
      rectShape: this.rectShape,
      labelBaseAttr,
      rectBaseAttr,
      borderBaseAttr,
    });
    this.nodeShapeStyle.setBaseStyle();

    this.labelShape.toFront();
    // @ts-ignore
    this.labelShape.node.style["user-select"] = "none";

    this.setPosition(shapeX, shapeY);
    this.shapeEventEmitter = new ShapeEventEmitter(this.shapeSet);

    if (!hasValidPosition) {
      this.hide();
    }

    this.initHover();
  }

  // 获取矩形边界框
  public getBBox(): RaphaelAxisAlignedBoundingBox {
    return this.rectShape.getBBox();
  }

  // 获取标签边界框
  public getLabelBBox(): RaphaelAxisAlignedBoundingBox {
    return this.labelShape.getBBox();
  }

  // 设置标签
  public setLabel(label: string, direction?: Direction): void {
    const beforeLabelBBox = this.labelShape.getBBox();
    this.labelShape.attr({
      text: label,
    });
    const afterLabelBBox = this.labelShape.getBBox();

    const bbox = this.getBBox();
    const diff = afterLabelBBox.width - beforeLabelBBox.width;

    this.setPosition(bbox.x, bbox.y);

    if (direction !== Direction.RIGHT && direction !== Direction.LEFT) {
      this.shapeSet.translate(-diff / 2, 0);
    }

    this.label = label;
  }

  // 平移到指定位置
  public translateTo(x: number, y: number): void {
    const { x: oldX, y: oldY } = this.getBBox();
    const dx = x - oldX;
    const dy = y - oldY;

    this.show();

    if (dx === 0 && dy === 0) return;

    this.shapeSet.translate(dx, dy);
  }

  // 按指定偏移量平移
  public translate(dx: number, dy: number): void {
    this.shapeSet.translate(dx, dy);
  }

  // 设置样式
  public setStyle(styleType: StyleType): void {
    this.nodeShapeStyle.setStyle(styleType);
  }

  // 获取当前样式
  public getStyle(): StyleType {
    return this.nodeShapeStyle.getStyle();
  }

  // 克隆当前形状
  public clone(): NodeShape {
    const { x, y } = this.getBBox();
    return new NodeShape({
      paper: this.paper,
      x,
      y,
      label: this.label,
      paddingWidth: this.paddingWidth,
      rectHeight: this.rectHeight,
      ...this.nodeShapeStyle.getBaseAttr(),
    });
  }

  // 移除形状
  public remove(): void {
    this.shapeSet.remove();
    this.shapeEventEmitter.removeAllListeners();
  }

  // 添加事件监听器
  public on<T extends EventNames>(
    eventName: EventNames,
    ...args: EventArgs<T>
  ): void {
    this.shapeEventEmitter.on(eventName, ...args);
  }

  // 显示形状
  public show(): void {
    this.shapeSet.show();
    this.isHide = false;
  }

  // 隐藏形状
  public hide(): void {
    this.shapeSet.hide();
    this.isHide = true;
  }

  // 获取是否隐藏状态
  public getIsHide(): boolean {
    return this.isHide;
  }

  // 将形状移到前面
  public toFront(): void {
    this.borderShape.toFront();
    this.rectShape.toFront();
    this.labelShape.toFront();
  }

  // 检查形状是否在不可见位置
  public isInvisible(): boolean {
    const bbox = this.getBBox();
    return bbox.x === invisibleX && bbox.y === invisibleY;
  }

  // 内部方法：平移形状到指定位置
  private shapeTranslateTo(
    shape: RaphaelElement | RaphaelSet,
    x: number,
    y: number
  ): void {
    const { x: oldX, y: oldY } = shape.getBBox();
    const dx = x - oldX;
    const dy = y - oldY;

    if (dx === 0 && dy === 0) return;

    shape.translate(dx, dy);
  }

  private setPosition(x: number, y: number): void {
    const {
      labelShape,
      borderShape,
      rectShape,
      imageShape,
      paddingWidth,
      rectHeight,
      imageData,
      maxWidth,
      maxHeight,
    } = this;

    const labelBBox = labelShape.getBBox();
    const paddingHeight = rectHeight - labelBBox.height;

    const leftShape = imageData?.toward === "right" ? labelShape : imageShape;
    const rightShape = imageData?.toward === "right" ? imageShape : labelShape;
    const defaultBBox = { x: 0, y: 0, width: 0, height: 0 };
    const leftBBox = leftShape?.getBBox() || defaultBBox;
    const rightBBox = rightShape?.getBBox() || defaultBBox;

    let imageGap = 0;
    if (imageShape) {
      imageGap =
        imageData?.gap !== undefined && imageData?.gap >= 0
          ? imageData?.gap
          : 8;
    }

    let contentWidth =
      leftBBox.width + rightBBox.width + paddingWidth + imageGap;
    let contentHeight =
      paddingHeight + Math.max(leftBBox.height, rightBBox.height);

    // Limit content size to maxWidth and maxHeight
    contentWidth = Math.min(contentWidth, maxWidth);
    contentHeight = Math.min(contentHeight, maxHeight);

    rectShape.attr({
      width: contentWidth,
      height: contentHeight,
    });

    borderShape.attr({
      width: contentWidth + borderPadding,
      height: contentHeight + borderPadding,
    });

    const leftShapeX = x + paddingWidth / 2;
    const leftShapeY = y + (contentHeight - leftBBox.height) / 2;
    const rightShapeX = leftShapeX + leftBBox.width + imageGap;
    const rightShapeY = y + (contentHeight - rightBBox.height) / 2;

    this.shapeTranslateTo(
      borderShape,
      x - borderPadding / 2,
      y - borderPadding / 2
    );
    leftShape && this.shapeTranslateTo(leftShape, leftShapeX, leftShapeY);
    rightShape && this.shapeTranslateTo(rightShape, rightShapeX, rightShapeY);

    // Clip content that exceeds max dimensions
    this.clipContent(contentWidth, contentHeight);
  }

  private clipContent(width: number, height: number): void {
    console.log("====================================");
    console.log("width, height", width, height);
    console.log("====================================");
    const clipPath = this.paper
      .path(`M0,0 L${width},0 L${width},${height} L0,${height}Z`)
      .attr({ stroke: "none" });

    // Create a unique id for the clipPath
    const clipPathId = `clipPath_${Math.random().toString(36).substr(2, 9)}`;

    // Set the id of the clipPath
    (clipPath.node as SVGElement).id = clipPathId;

    // Move the clipPath to a defs element
    const defs =
      this.paper.canvas.querySelector("defs") ||
      this.paper.canvas.insertBefore(
        document.createElementNS("http://www.w3.org/2000/svg", "defs"),
        this.paper.canvas.firstChild
      );
    defs.appendChild(clipPath.node);

    // Apply the clip-path to each element in the set
    this.shapeSet.forEach((element) => {
      (element.node as SVGElement).style.clipPath = `url(#${clipPathId})`;
    });
  }

  private initHover(): void {
    if (isMobile) return;

    this.shapeEventEmitter.on(
      "hover",
      () => {
        const curStyleType = this.nodeShapeStyle.getStyle();
        if (curStyleType !== "select" && curStyleType !== "disable") {
          this.nodeShapeStyle.setStyle("hover");
          this.isHoverInCalled = true;
        }
      },
      () => {
        const curStyleType = this.nodeShapeStyle.getStyle();
        if (
          this.isHoverInCalled &&
          curStyleType !== "select" &&
          curStyleType !== "disable"
        ) {
          this.nodeShapeStyle.setStyle("base");
          this.isHoverInCalled = false;
        }
      }
    );
  }
}

export default NodeShape;
