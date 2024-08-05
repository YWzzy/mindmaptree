import * as Y from "yjs";
import type { NodeData } from "../types";

const parentMap: Map<string, string[]> = new Map(); // 节点ID到其子节点ID的映射

// 更新 nodeDataMap 中指定节点的数据
export const updateNodeDataMap = (
  nodeDataMap: Y.Map<NodeData>,
  id: string,
  data: Partial<NodeData>
): void => {
  const originData = nodeDataMap.get(id);
  if (!originData) return;

  const newData = {
    ...originData,
    ...data,
  };
  nodeDataMap.set(id, newData);

  // 更新 parentMap
  if (originData.children) {
    originData.children.forEach((childId) => {
      let parentChildren = parentMap.get(childId) || [];
      parentChildren = parentChildren.filter((pid) => pid !== id);
      parentMap.set(childId, parentChildren);
    });
  }
  if (newData.children) {
    newData.children.forEach((childId) => {
      let parentChildren = parentMap.get(childId) || [];
      parentChildren.push(id);
      parentMap.set(childId, parentChildren);
    });
  }
};

// todo 获取root，能不能不通过遍历？
export const getRootData = (nodeDataMap: Y.Map<NodeData>): NodeData => {
  let rootData: NodeData | undefined;
  const values = nodeDataMap.values() as Iterable<NodeData>;
  for (let value of values) {
    if (value.isRoot) {
      rootData = value;
    }
  }
  return rootData!;
};

// todo 获取father，能不能不通过遍历？
export const getFatherDatas = (
  nodeDataMap: Y.Map<NodeData>,
  id: string
): [string, NodeData] => {
  const entries = nodeDataMap.entries() as Iterable<[string, NodeData]>;
  let fatherDatas: [string, NodeData] | undefined;
  for (let entry of entries) {
    if (entry[1].children.includes(id)) {
      fatherDatas = entry;
    }
  }
  return fatherDatas!;
};

// // 获取根节点数据
// export const getRootData = (
//   nodeDataMap: Y.Map<NodeData>
// ): NodeData | undefined => {
//   if (rootId) {
//     return nodeDataMap.get(rootId);
//   }
//   return undefined;
// };

// // 获取父节点数据
// export const getFatherDatas = (
//   nodeDataMap: Y.Map<NodeData>,
//   id: string
// ): any => {
//   const parentIds = parentMap.get(id);
//   if (parentIds && parentIds.length > 0) {
//     const parentId = parentIds[0];
//     const parentData = nodeDataMap.get(parentId);
//     if (parentData) {
//       return [parentId, parentData];
//     }
//   }
//   return undefined;
// };
