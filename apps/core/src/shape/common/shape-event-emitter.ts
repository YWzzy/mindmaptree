import { RaphaelSet, RaphaelElement, RaphaelBaseElement } from "raphael";

// 定义事件名称类型
export type EventNames =
  | "mousedown"
  | "click"
  | "dblclick"
  | "drag"
  | "hover"
  | "touchstart";

// 根据事件名称类型，定义事件参数类型
export type EventArgs<EventName extends EventNames> = Parameters<
  RaphaelBaseElement[EventName]
>;

// 定义事件参数映射类型
type EventArgsMap = Partial<{
  [EventName in EventNames]: EventArgs<EventName>[];
}>;

// 定义形状事件发射器类
class ShapeEventEmitter {
  // 存储事件参数的映射对象
  private readonly eventArgs: EventArgsMap = {};

  // 构造函数，初始化形状对象
  public constructor(private readonly shape: RaphaelElement | RaphaelSet) {}

  // 为指定事件添加监听器
  public on<T extends EventNames>(eventName: T, ...args: EventArgs<T>): void {
    // 如果事件名称无效，直接返回
    if (!eventName) return;

    // 如果事件名称对应的参数数组不存在，初始化为空数组
    if (this.eventArgs[eventName] === undefined) {
      this.eventArgs[eventName] = [];
    }

    // 将事件参数添加到对应的参数数组中
    this.eventArgs[eventName]!.push(args);

    // 为形状对象绑定事件监听器
    // @ts-ignore
    this.shape[eventName](...args);
  }

  // 移除所有事件监听器
  public removeAllListeners(): void {
    // 获取所有事件名称
    const eventNames: EventNames[] = Object.keys(
      this.eventArgs
    ) as EventNames[];

    // 遍历每个事件名称
    eventNames.forEach((eventName: EventNames) => {
      // 获取对应的事件参数数组
      const events = this.eventArgs[eventName];

      // 遍历每个事件参数，移除对应的事件监听器
      events?.forEach((args) => {
        // @ts-ignore
        this.shape[`un${eventName}`](...args);
      });
    });
  }
}

export default ShapeEventEmitter;
