import G6, { ComboConfig, NodeConfig } from '@antv/g6'
import { ItemData, NodeItemData } from '../store/editor'

const globalFontSize = 12;
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

function findChildren(data: ItemData[], parent: string, edges: any, nodes: NodeItemData[], combos: ComboConfig[], rootKey: string, level: string) {
  const children: any[] = [];
  let index = 0;
  for (const item of data) {
    const { uid, name, ...other } = item;
    if (item.parent === parent) {
      const _level = level + '-' + index;
      index++;
      const node = {
        ...other,
        id: uid,
        name,
        level: _level,
        label: fittingString(name, NODE_WIDTH, globalFontSize),
        parent,
        rootKey,
        comboId: `${parent}-combo`,
        data: item
      };
      nodes.push(node);
      const nestedChildren = findChildren(data, uid, edges, nodes, combos, rootKey, _level);
      if (nestedChildren.length > 0) {
        combos.push({
          id: `${uid}-combo`,
          parentId: `${parent}-combo`,
          rootKey
        });
        if (nestedChildren.length === 1 && (!nestedChildren[0].children || nestedChildren[0].children.length === 0)) {
          Object.assign(nestedChildren[0], { onlyChild: true });
        }
        Object.assign(node, { children: nestedChildren });
        edges.push({ source: node.id, target: nestedChildren[0].id, rootKey });
      }

      children.push(node);
    }
  }

  children.forEach(function (value, index) {
    if (index > 0) {
      edges.push({ source: children[index - 1].id, target: value.id });
    }
  });

  return children;
}

// 文本超长，省略号显示
const fittingString = (str: string, maxWidth: number, fontSize: number) => {
  const ellipsis = '...';
  const ellipsisLength = G6.Util.getTextSize(ellipsis, fontSize)[0];
  let currentWidth = 0;
  let res = str;
  const pattern = new RegExp('[\u4E00-\u9FA5]+'); // distinguish the Chinese charactors and letters
  str.split('').forEach((letter, i) => {
    if (currentWidth > (maxWidth - 8 - ellipsisLength)) return;
    if (pattern.test(letter)) {
      // Chinese charactors
      currentWidth += fontSize;
    } else {
      // get the width of single letter according to the fontSize
      currentWidth += G6.Util.getLetterWidth(letter, fontSize);
    }
    if (currentWidth > (maxWidth - 8 - ellipsisLength)) {
      res = `${str.substr(0, i)}${ellipsis}`;
    }
  });
  return res;
};

// 转换数据
export function buildTree(data: { [key: string]: ItemData[] }, changedRootKey?: string, originData?: any) {
  const edges: any[] = originData?.edges || [],
    combos: ComboConfig[] = originData?.combos || [];
  let nodes: NodeConfig[] = originData?.nodes || [],
    otherNodes: NodeConfig[] = [];
  if (changedRootKey) {
    const changedRootKeyIndex = changedRootKey ? nodes.findIndex(val => val.id === changedRootKey) : -1;
    otherNodes = nodes.splice(changedRootKeyIndex + 1);
  }
  Object.keys(data).forEach(function (key) {
    if (changedRootKey && key !== changedRootKey) return;
    const allData = data[key];
    const rootNodes: NodeItemData[] = [];
    let level = '0';
    const parentNode = {
      id: key,
      name: key,
      root: true,
      rootKey: key,
      label: fittingString(key, ROOT_NODE_WIDTH, globalFontSize),
      level,
    };
    combos.push({
      id: `${key}-combo`,
      rootKey: key
    });
    if (!changedRootKey) nodes.push(parentNode);
    rootNodes.push(parentNode);

    let index = 0;
    for (const item of allData) {
      const { uid, name, parent, children, ...other } = item;
      const node = {
        id: uid,
        label: fittingString(name, NODE_WIDTH, globalFontSize),
        rootKey: key,
        parent: key,
        name,
        data: item,
        ...other
      };
      if (!parent) {
        const _level = level + '-' + index;
        index++;
        Object.assign(node, { level: _level });
        nodes.push(node);
        const nestedChildren = findChildren(allData, uid, edges, nodes, combos, key, _level);
        if (nestedChildren.length > 0) {
          combos.push({
            id: `${uid}-combo`,
            parentId: `${key}-combo`,
            rootKey: key
          });
          if (nestedChildren.length === 1 && (!nestedChildren[0].children || nestedChildren[0].children.length === 0)) {
            Object.assign(nestedChildren[0], { onlyChild: true });
          }
          Object.assign(node, { children: nestedChildren });
          edges.push({ source: node.id, target: nestedChildren[0].id, rootKey: key });
        }
        rootNodes.push(node);
      }
      if (node.fans && node.fans.length > 0) {
        node.fans.forEach(function (id) {
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
        });
      }
    }

    rootNodes.forEach(function (value, index) {
      if (index > 0) {
        edges.push({ source: rootNodes[index - 1].id, target: value.id, rootKey: key });
      }
    });
  })
  if (changedRootKey && otherNodes.length > 0) {
    nodes = nodes.concat(otherNodes);
  }
  return {
    nodes,
    edges,
    combos
  };
}