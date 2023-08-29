import G6, { ComboConfig, EdgeConfig } from '@antv/g6'
import { ItemData, NodeItemData } from '../store/editor'

export const GLOBAL_FONT_SIZE = 12;
export const ROOT_NODE_WIDTH = 250, // 主节点宽度
  NODE_WIDTH = 50, // 一般节点宽度
  NODE_HEIGHT = 30, // 节点高度
  NODE_LEFT_SEP = 25, // 节点左右间距
  NODE_HEIGHT_SEP = 10; // 节点上下间距

export const NODE_STYLE: { [k: string]: any } = {
  "default": {
    fill: 'rgb(187,246,250)',
    stroke: '#02c3ff',
    color: '#333',
  },
  "type1": {
    fill: '#e9e7f5',
    stroke: '#cebee5',
    color: '#a598df',
  },
  "type2": {
    fill: '#cbf8ef',
    stroke: '#c3ebe5',
    color: '#67aaa6',
  },
  "type3": {
    fill: '#dceaff',
    stroke: '#d5dff2',
    color: '#8295cb',
  },
  "type4": {
    fill: '#defacf',
    stroke: '#d7e8cc',
    color: '#9bb585',
  },
  "type5": {
    fill: '#c5e9fc',
    stroke: '#c9daf2',
    color: '#93bbe5',
  },
  "type6": {
    fill: '#ffe3c8',
    stroke: '#e5c2a2',
    color: '#dc8e70',
  },
  "type7": {
    fill: '#fedcd9',
    stroke: '#efcfce',
    color: '#df7a7e',
    radius: NODE_HEIGHT / 2
  },
  "type8": {
    fill: '#fce2f1',
    stroke: '#ebcad7',
    color: '#e19fbb',
    radius: NODE_HEIGHT / 2
  },
  "type9": {
    fill: '#f5e3ff',
    stroke: '#dfd6ea',
    color: '#8e72b4',
    radius: NODE_HEIGHT / 2
  },
  "type10": {
    fill: '#faf1c6',
    stroke: '#f7ebd9',
    color: '#e4a272',
  },
}

export const LINE_SYTLE: { [k: string]: any } = {
  "default": {
    stroke: '#c8ced5'
  }
}

// 判断节点名称是否超过节点宽度，超过显示省略号
export const fittingString = (str: string, maxWidth: number, fontSize: number) => {
  const ellipsis = '...';
  const ellipsisLength = G6.Util.getTextSize(ellipsis, fontSize)[0];
  let currentWidth = 0;
  let res = str;
  const pattern = new RegExp('[\u4E00-\u9FA5]+'); // distinguish the Chinese charactors and letters

  for (let i = 0; i < str.length && currentWidth <= maxWidth - 8 - ellipsisLength; i++) {
    const letter = str[i];
    if (pattern.test(letter)) {
      currentWidth += fontSize;
    } else {
      currentWidth += G6.Util.getLetterWidth(letter, fontSize);
    }

    if (currentWidth > maxWidth - 8 - ellipsisLength) {
      res = `${str.substr(0, i)}${ellipsis}`;
    }
  }

  return res;
};


function findChildren(
  data: ItemData[],
  parent: string,
  edges: any[],
  nodes: NodeItemData[],
  combos: ComboConfig[],
  rootKey: string,
  level: string
): NodeItemData[] {
  const _children: NodeItemData[] = [];
  let levelIndex = 0,
    dataIndex = 0;

  for (const item of data) {
    if (item.parent === parent) {
      const { uid, name, children, ...other } = item;
      const _level = level + '-' + levelIndex;
      levelIndex++;

      const node: NodeItemData = {
        ...other,
        id: uid,
        name,
        level: _level,
        label: fittingString(name, NODE_WIDTH, GLOBAL_FONT_SIZE),
        parent,
        rootKey,
        comboId: `${parent}-combo`,
        data: item,
        dataIndex,
        onlyChild: false,
      };

      nodes.push(node);

      const nestedChildren = findChildren(data, uid, edges, nodes, combos, rootKey, _level);

      if (nestedChildren.length > 0) {
        const comboId = `${uid}-combo`;
        combos.push({
          id: comboId,
          parentId: `${parent}-combo`,
          rootKey,
        });

        if (nestedChildren.length === 1 && (!nestedChildren[0].children || nestedChildren[0].children.length === 0)) {
          nestedChildren[0].onlyChild = true;
        }

        // node.children = nestedChildren;
        edges.push({ source: node.id, target: nestedChildren[0].id, rootKey });
      }

      _children.push(node);
    }

    dataIndex++;
  }

  for (let index = 1; index < _children.length; index++) {
    edges.push({ source: _children[index - 1].id, target: _children[index].id, rootKey });
  }

  return _children;
}

// 原始数据转换成graph图数据，返回{ nodes, edges, combos }
// 当changedRootKey有值时，只重新计算对应rootKey的数据
export function buildTree(data: { [key: string]: ItemData[] }, changedRootKey?: string, originData?: any) {
  const edges: EdgeConfig[] = originData?.edges || [];
  const combos: ComboConfig[] = originData?.combos || [];
  const nodes: NodeItemData[] = originData?.nodes || [];
  let otherNodes: NodeItemData[] = [];

  if (changedRootKey) {
    const changedRootKeyIndex = changedRootKey ? nodes.findIndex((val) => val.id === changedRootKey) : -1;
    otherNodes = nodes.splice(changedRootKeyIndex + 1);
  }

  for (const key in data) {
    if (changedRootKey && key !== changedRootKey) continue;

    const allData = data[key];
    const rootNodes: NodeItemData[] = [];
    const level = '0';
    const parentNode: NodeItemData = {
      id: key,
      name: key,
      root: true,
      rootKey: key,
      label: fittingString(key, ROOT_NODE_WIDTH, GLOBAL_FONT_SIZE),
      level,
    };

    combos.push({
      id: `${key}-combo`,
      rootKey: key,
    });

    if (!changedRootKey) nodes.push(parentNode);
    rootNodes.push(parentNode);

    let levelIndex = 0,
      dataIndex = 0;

    for (const item of allData) {
      const { uid, name, parent, children, ...other } = item;
      const node = {
        id: uid,
        label: fittingString(name, NODE_WIDTH, GLOBAL_FONT_SIZE),
        rootKey: key,
        parent: key,
        name,
        data: item,
        dataIndex,
        onlyChild: false,
        ...other,
      };

      if (!parent) {
        const _level = level + '-' + levelIndex;
        levelIndex++;

        Object.assign(node, { level: _level });
        nodes.push(node as NodeItemData);

        const nestedChildren = findChildren(allData, uid, edges, nodes, combos, key, _level);

        if (nestedChildren.length > 0) {
          const comboId = `${uid}-combo`;
          combos.push({
            id: comboId,
            parentId: `${key}-combo`,
            rootKey: key,
          });

          if (nestedChildren.length === 1 && (!nestedChildren[0].children || nestedChildren[0].children.length === 0)) {
            nestedChildren[0].onlyChild = true;
          }

          // Object.assign(node, { children: nestedChildren });
          edges.push({ source: node.id, target: nestedChildren[0].id, rootKey: key });
        }

        rootNodes.push(node as NodeItemData);
      }

      if (node.fans && node.fans.length > 0) {
        for (const id of node.fans) {
          edges.push({
            source: node.id,
            target: id,
            type: 'cubic',
            style: {
              stroke: '#F6BD16',
              lineWidth: 2,
              endArrow: {
                path: G6.Arrow.triangle(),
                fill: '#F6BD16',
                stroke: '#F6BD16',
              },
            },
          });
        }
      }

      dataIndex++;
    }

    for (let index = 1; index < rootNodes.length; index++) {
      edges.push({ source: rootNodes[index - 1].id, target: rootNodes[index].id, rootKey: key });
    }
  }

  if (changedRootKey && otherNodes.length > 0) {
    nodes.push(...otherNodes);
  }

  return {
    nodes,
    edges,
    combos,
  };
}