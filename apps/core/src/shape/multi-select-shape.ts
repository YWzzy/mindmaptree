import type {
  RaphaelPaper,
  RaphaelElement,
  RaphaelAxisAlignedBoundingBox,
} from "raphael";

class MultiSelectShape {
  // 初始化开始坐标
  private startX: number = 0;
  private startY: number = 0;
  // 判断是否已初始化
  private isInit: boolean = false;
  // 存储矩形元素
  private rectShape: RaphaelElement | null = null;

  // 构造函数，接收Raphael画布对象
  public constructor(private readonly paper: RaphaelPaper) {}

  /**
   * 初始化选择框的起点
   * @param {number} startX - 起点的x坐标
   * @param {number} startY - 起点的y坐标
   */
  public init(startX: number, startY: number) {
    this.startX = startX;
    this.startY = startY;
    this.isInit = true;
  }

  /**
   * 根据终点坐标调整选择框的大小
   * @param {number} endX - 终点的x坐标
   * @param {number} endY - 终点的y坐标
   */
  public resize(endX: number, endY: number) {
    if (!this.isInit) return;

    const { startX, startY } = this;

    // 计算矩形的起点、宽度和高度
    const x = startX < endX ? startX : endX;
    const y = startY < endY ? startY : endY;
    const width = Math.abs(startX - endX);
    const height = Math.abs(startY - endY);

    // 如果矩形不存在，则创建一个新的矩形
    if (this.rectShape === null) {
      this.rectShape = this.paper.rect(x, y, width, height);
      // 设置矩形的样式
      this.rectShape.attr({
        stroke: "#73a1bf",
        fill: "rgba(153,124,255,0.1)",
        opacity: 0.8,
      });
    } else {
      // 如果矩形已存在，则更新其属性
      this.rectShape.attr({ x, y, width, height });
    }
  }

  /**
   * 隐藏选择框
   */
  public hide() {
    this.isInit = false;
    // 移除矩形元素
    this.rectShape?.remove();
    this.rectShape = null;
  }

  /**
   * 获取选择框的边界框
   * @returns {RaphaelAxisAlignedBoundingBox} - 边界框对象
   */
  public getBBox(): RaphaelAxisAlignedBoundingBox {
    return this.rectShape?.getBBox()!;
  }
}

export default MultiSelectShape;
