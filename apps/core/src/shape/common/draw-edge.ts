import { Direction } from "../../types"; // 引入方向类型
import { expanderBoxWidth } from "../expander-shape"; // 引入扩展框宽度
import type {
  RaphaelPaper,
  RaphaelAxisAlignedBoundingBox,
  RaphaelElement,
} from "raphael"; // 引入Raphael相关类型

/**
 * 绘制从源元素到目标元素的第一条边
 * @param {object} 参数对象
 * @param {RaphaelPaper} 参数对象.paper - Raphael画布对象
 * @param {RaphaelAxisAlignedBoundingBox} 参数对象.sourceBBox - 源元素的边界框
 * @param {RaphaelAxisAlignedBoundingBox} 参数对象.targetBBox - 目标元素的边界框
 * @param {Direction} 参数对象.direction - 方向
 * @returns {RaphaelElement} - Raphael元素
 */
export const drawFirstEdge = ({
  paper,
  sourceBBox,
  targetBBox,
  direction,
}: {
  paper: RaphaelPaper;
  sourceBBox: RaphaelAxisAlignedBoundingBox;
  targetBBox: RaphaelAxisAlignedBoundingBox;
  direction: Direction;
}): RaphaelElement => {
  // 起点坐标
  const x1 = sourceBBox.cx;
  const y1 = sourceBBox.cy;
  // 终点坐标
  const x2 = direction === Direction.LEFT ? targetBBox.x2 : targetBBox.x;
  const y2 = targetBBox.cy;

  const k1 = 0.8;
  const k2 = 0.2;
  // 贝塞尔曲线控制点坐标
  const x3 = x2 - k1 * (x2 - x1);
  const y3 = y2 - k2 * (y2 - y1);

  // 使用贝塞尔曲线绘制路径
  return paper.path(`M${x1} ${y1}Q${x3} ${y3} ${x2} ${y2}`);
};

/**
 * 绘制从源元素到目标元素的子孙边
 * @param {object} 参数对象
 * @param {RaphaelPaper} 参数对象.paper - Raphael画布对象
 * @param {RaphaelAxisAlignedBoundingBox} 参数对象.sourceBBox - 源元素的边界框
 * @param {RaphaelAxisAlignedBoundingBox} 参数对象.targetBBox - 目标元素的边界框
 * @param {Direction} 参数对象.direction - 方向
 * @param {number} 参数对象.targetDepth - 目标深度
 * @param {boolean} 参数对象.hasUnder - 是否有下级元素
 * @returns {RaphaelElement} - Raphael元素
 */
export const drawGrandChildEdge = ({
  paper,
  sourceBBox,
  targetBBox,
  direction,
  targetDepth,
  hasUnder = false,
}: {
  paper: RaphaelPaper;
  sourceBBox: RaphaelAxisAlignedBoundingBox;
  targetBBox: RaphaelAxisAlignedBoundingBox;
  direction: Direction;
  targetDepth: number;
  hasUnder?: boolean;
}): RaphaelElement => {
  let shortX = 0;
  let shortY = 0;
  let connectX = 0;
  let connectY = 0;
  let targetX = 0;
  let targetY = 0;
  let targetUnderEndX = 0;
  let targetUnderEndY = 0;

  if (direction === Direction.RIGHT) {
    shortX = sourceBBox.x2;
    connectX = shortX + expanderBoxWidth;
    targetX = targetBBox.x;
    targetUnderEndX = targetBBox.x2;
  } else {
    shortX = sourceBBox.x;
    connectX = shortX - expanderBoxWidth;
    targetX = targetBBox.x2;
    targetUnderEndX = targetBBox.x;
  }

  if (targetDepth === 2) {
    shortY = sourceBBox.cy;
  } else {
    shortY = sourceBBox.y2;
  }

  connectY = shortY;
  targetY = hasUnder ? targetBBox.y2 : targetBBox.cy;
  targetUnderEndY = targetY;

  // 创建连接路径字符串
  const connectPathStr = createConnectPathStr(
    connectX,
    connectY,
    targetX,
    targetY
  );
  let pathStr = `M${shortX} ${shortY} L${connectX} ${connectY} ${connectPathStr}`;

  // 如果有下级元素，添加路径字符串
  if (hasUnder) {
    pathStr += ` M ${targetX} ${targetY} L${targetUnderEndX} ${targetUnderEndY}`;
  }

  return paper.path(pathStr);
};

/**
 * 创建贝塞尔曲线连接路径字符串
 * @param {number} x1 - 起点x坐标
 * @param {number} y1 - 起点y坐标
 * @param {number} x2 - 终点x坐标
 * @param {number} y2 - 终点y坐标
 * @returns {string} - 路径字符串
 */
const createConnectPathStr = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string => {
  const control1XFactor = 0.3;
  const control1YFactor = 0.76;
  const control1X = x1 + control1XFactor * (x2 - x1);
  const control1Y = y1 + control1YFactor * (y2 - y1);

  const control2XFactor = 0.5;
  const control2YFactor = 0;
  const control2X = x2 - control2XFactor * (x2 - x1);
  const control2Y = y2 - control2YFactor * (y2 - y1);

  return `M${x1} ${y1}C${control1X} ${control1Y} ${control2X} ${control2Y} ${x2} ${y2}`;
};
