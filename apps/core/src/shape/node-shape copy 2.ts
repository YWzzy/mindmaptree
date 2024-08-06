Updated NodeShape Class with Text Wrapping and Truncation

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
const defaultPaddingHeight = 20;
const borderPadding = 6;

const defaultMaxWidth = 200;
const defaultMaxHeight = 500;

export interface NodeShapeOptions {
  paper: RaphaelPaper;
  x?: number;
  y?: number;
  label: string;
  paddingWidth?: number;
  paddingHeight?: number;
  labelBaseAttr?: Partial<RaphaelAttributes>;
  rectBaseAttr?: Partial<RaphaelAttributes>;
  borderBaseAttr?: Partial<RaphaelAttributes>;
  imageData?: ImageData | null;
  link?: string;
  maxWidth?: number;
  maxHeight?: number;
}

class NodeShape {
  private readonly paper: RaphaelPaper;
  private readonly shapeSet: RaphaelSet;
  private readonly borderShape: RaphaelElement;
  private readonly labelShape: RaphaelElement;
  private readonly rectShape: RaphaelElement;
  private readonly imageShape: RaphaelElement | null = null;
  private readonly paddingWidth: number;
  private readonly paddingHeight: number;
  private readonly shapeEventEmitter: ShapeEventEmitter;
  private readonly nodeShapeStyle: NodeShapeStyle;
  private readonly imageData: ImageData | null = null;
  private readonly maxWidth: number;
  private readonly maxHeight: number;
  private label: string;
  private isHide: boolean = false;
  private isHoverInCalled: boolean = false;

  public constructor({
    paper,
    x,
    y,
    label,
    paddingWidth = defaultPaddingWidth,
    paddingHeight = defaultPaddingHeight,
    labelBaseAttr,
    rectBaseAttr,
    borderBaseAttr,
    imageData,
    link,
    maxWidth = defaultMaxWidth,
    maxHeight = defaultMaxHeight,
  }: NodeShapeOptions) {
    this.paper = paper;
    this.label = label;
    this.paddingWidth = paddingWidth;
    this.paddingHeight = paddingHeight;
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
    }
    // @ts-ignore
    this.labelShape.node.style.cursor = "pointer";

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

    this.setLabel(label);
    this.shapeEventEmitter = new ShapeEventEmitter(this.shapeSet);

    if (!hasValidPosition) {
      this.hide();
    }

    this.initHover();
  }

  public setLabel(label: string, direction?: Direction): void {
    this.label = label;
    const maxContentWidth = this.maxWidth - this.paddingWidth;
    const maxContentHeight = this.maxHeight - this.paddingHeight;

    const wrappedText = this.wrapText(label, maxContentWidth, maxContentHeight);
    this.labelShape.attr({ text: wrappedText });

    const updatedLabelBBox = this.getLabelBBox();
    const contentWidth = Math.min(updatedLabelBBox.width + this.paddingWidth, this.maxWidth);
    const contentHeight = Math.min(updatedLabelBBox.height + this.paddingHeight, this.maxHeight);

    this.rectShape.attr({
      width: contentWidth,
      height: contentHeight,
    });

    this.borderShape.attr({
      width: contentWidth + borderPadding,
      height: contentHeight + borderPadding,
    });

    const bbox = this.getBBox();
    this.setPosition(bbox.x, bbox.y);

    if (direction !== Direction.RIGHT && direction !== Direction.LEFT) {
      const diff = contentWidth - (bbox.width - this.paddingWidth);
      this.shapeSet.translate(-diff / 2, 0);
    }

    this.clipContent(contentWidth, contentHeight);
  }

  private wrapText(text: string, maxWidth: number, maxHeight: number): string {
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = this.getTextWidth(currentLine + ' ' + word);
      
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);

    // Truncate if exceeds maxHeight
    let totalHeight = 0;
    let truncatedLines = [];
    for (let line of lines) {
      totalHeight += this.getTextHeight(line);
      if (totalHeight > maxHeight) {
        if (truncatedLines.length > 0) {
          truncatedLines[truncatedLines.length - 1] += '...';
        } else {
          truncatedLines.push(line + '...');
        }
        break;
      }
      truncatedLines.push(line);
    }

    return truncatedLines.join('\n');
  }

  private getTextWidth(text: string): number {
    const font = this.labelShape.attr('font') as string;
    const fontSize = this.labelShape.attr('font-size') as number;
    const tempText = this.paper.text(0, 0, text).attr({
      font: font,
      'font-size': fontSize
    });
    const width = tempText.getBBox().width;
    tempText.remove();
    return width;
  }

  private getTextHeight(text: string): number {
    const font = this.labelShape.attr('font') as string;
    const fontSize = this.labelShape.attr('font-size') as number;
    const tempText = this.paper.text(0, 0, text).attr({
      font: font,
      'font-size': fontSize
    });
    const height = tempText.getBBox().height;
    tempText.remove();
    return height;
  }

  private setPosition(x: number, y: number): void {
    const {
      labelShape,
      borderShape,
      rectShape,
      imageShape,
      paddingWidth,
      paddingHeight,
      imageData,
    } = this;

    const labelBBox = labelShape.getBBox();

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

    const contentWidth = leftBBox.width + rightBBox.width + paddingWidth + imageGap;
    const contentHeight = Math.max(leftBBox.height, rightBBox.height) + paddingHeight;

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
  }

  private clipContent(width: number, height: number): void {
    const clipPath = this.paper
      .rect(0, 0, width, height)
      .attr({ fill: "white", stroke: "none" });

    const clipPathId = `clipPath_${Math.random().toString(36).substr(2, 9)}`;
    (clipPath.node as SVGElement).id = clipPathId;

    const defs =
      this.paper.canvas.querySelector("defs") ||
      this.paper.canvas.insertBefore(
        document.createElementNS("http://www.w3.org/2000/svg", "defs"),
        this.paper.canvas.firstChild
      );
    defs.appendChild(clipPath.node);

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
