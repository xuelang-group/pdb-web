import { nodeStateStyle } from '@/g6/node';
import store from '@/store';
import G6, { ComboConfig, EdgeConfig, GraphData } from '@antv/g6';
import _, { isArray } from 'lodash';
import { NodeItemData, RelationsConfig } from '../reducers/editor';
import { CustomObjectConfig } from '../reducers/object';
import { defaultNodeColor, getTextColor } from './common';

export const GLOBAL_FONT_SIZE = 12;
export const ROOT_NODE_WIDTH = 320, // 主节点宽度
  NODE_WIDTH = 130, // 一般节点宽度
  NODE_HEIGHT = 48, // 节点高度
  NODE_LEFT_SEP = 25, // 节点左右间距
  NODE_HEIGHT_SEP = 20, // 节点上下间距
  COLLAPSE_SHAPE_R = 8; // 折叠icon的半径

export const LINE_SYTLE: { [k: string]: any } = {
  "default": {
    stroke: '#c8ced5'
  }
}

const paginationIconMap: any = {
  next: String.fromCodePoint(59272),
  prev: String.fromCodePoint(60181)
}
export const paginationOption = (icon: string = "") => ({
  type: "paginationBtn",
  icon: {
    show: true,
    fontFamily: 'iconfont',
    text: paginationIconMap[icon],
    fill: "#4C5A67",
    textAlign: 'center',
    fontSize: 22,
    cursor: 'pointer',
    // x: 0.5,
    rotate: 90,
    y: icon === "next" ? 2 : 10,
  },
  labelCfg: {
    style: {
      fontSize: 12,
      fill: "#4C5A67",
      cursor: 'pointer'
    }
  },
  style: {
    stroke: "#4C5A67",
    fill: "#f9fbfc",
    radius: 3,
    cursor: 'pointer',
    lineWidth: 0
  },
  size: [25, 10]
});

// 判断节点名称是否超过节点宽度，超过显示省略号
export const fittingString = (str: string, maxWidth: number = 0, fontSize: number = GLOBAL_FONT_SIZE) => {
  const ellipsis = '...';
  const ellipsisLength = G6.Util.getTextSize(ellipsis, fontSize)[0];
  let currentWidth = 0;
  let text = str;
  const pattern = new RegExp('[\u4E00-\u9FA5]+'); // distinguish the Chinese charactors and letters
  if (maxWidth > 0) {
    const _maxWidth = maxWidth - 8 - ellipsisLength;
    for (let i = 0; i < str.length && currentWidth <= _maxWidth; i++) {
      const letter = str[i];
      if (pattern.test(letter)) {
        currentWidth += fontSize;
      } else {
        currentWidth += G6.Util.getLetterWidth(letter, fontSize);
      }
      if (currentWidth > _maxWidth) {
        text = `${str.substr(0, i)}${ellipsis}`;
      }
    }

    return {
      hasEllipsis: currentWidth > _maxWidth,
      textWidth: currentWidth > _maxWidth ? _maxWidth : currentWidth,
      text
    };
  }
  for (let i = 0; i < str.length; i++) {
    const letter = str[i];
    if (pattern.test(letter)) {
      currentWidth += fontSize;
    } else {
      currentWidth += G6.Util.getLetterWidth(letter, fontSize);
    }
  }
  return {
    hasEllipsis: false,
    textWidth: currentWidth,
    text
  };
};

function findLastIndex(nodes: any[], xid: string) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const nodeXid = _.get(nodes[i], 'data.xid', '') as string;
    if (nodeXid && (nodeXid === xid || nodeXid.startsWith(xid + '.'))) {
      return i;
    }
  }
  return -1; // 没有匹配项
}

// 转换为画布数据
export function covertToGraphData(data: CustomObjectConfig[], parentId: string, filterMap: any) {
  const edges: EdgeConfig[] = [];
  const combos: ComboConfig[] = [];
  const nodes: NodeItemData[] = [];
  const rootId = store.getState().editor.rootNode['x.object.id'];

  if (parentId === rootId) {
    combos.push({ id: `${rootId}-combo` });
  }
  let index = 0;
  for (const item of data) {
    const id = item['x.object.id'],
      xid = item['xid'] || id,
      collapsed = item.collapsed === undefined ? true : item.collapsed,
      metadata = JSON.parse(item['x.object.metadata'] || '{}'),
      fill = _.get(metadata, 'color', defaultNodeColor.fill),
      iconKey = _.get(metadata, 'icon', '');
    const comboId = `${id}-combo`;
    const node = {
      id,
      data: { ...item, xid },
      icon: iconKey,
      isDisabled: !_.isEmpty(filterMap) && !_.get(filterMap, item['x.type.id'] || ''),
      style: {
        ...nodeStateStyle.default,
        fill
      },
      labelCfg: {
        style: {
          fill: getTextColor(fill)
        }
      }
    };

    if (parentId) {
      combos.push({
        id: comboId,
        parentId: parentId + '-combo',
        collapsed
      });
      Object.assign(node, { comboId: parentId + '-combo' });
    } else {
      combos.push({
        id: comboId,
        collapsed
      });
    }

    const isPagination = id.startsWith("pagination-");
    if (isPagination) {
      Object.assign(node, paginationOption(id.split("-")[3] === "prev" ? "prev" : "next"));
      if (item.totalPage) {
        Object.assign(node, { totalPage: item.totalPage, nextDisabled: Boolean(item.nextDisabled) });
      }
    }

    nodes.push(node as NodeItemData);

    if (item['x.object.version.parent'] && item['x.object.version.parent']['x.object.id'] !== rootId) {
      if (!isPagination) {
        const prevIsPagination = index > 0 && nodes[index - 1].id.startsWith("pagination-");
        edges.push({ source: index === 0 ? parentId : (prevIsPagination ? (index > 1 ? nodes[index - 2].id : parentId) : nodes[index - 1].id), target: id });
      }
    }

    index++;
  }

  return {
    nodes,
    edges,
    combos,
  };
}

// 添加子节点
export function addChildrenToGraphData(parent: NodeItemData, data: CustomObjectConfig[], currentData: GraphData, filterMap: any) {
  const id = parent.id;

  const sortData = data.sort((a, b) => {
    if (!a['xid'] || !b['xid']) return 1;
    const aIds: any = a['xid'].split('.'),
      bIds: any = b['xid'].split('.');
    for (let i = 1; i < aIds.length; i++) {
      if (Number(aIds[i]) === Number(bIds[i])) continue;
      return Number(aIds[i]) > Number(bIds[i]) ? 1 : -1;
    }

    return 1;
  });
  const { nodes, combos, edges } = covertToGraphData(sortData, id, filterMap);

  const lastIndex = parent.data.xid ? findLastIndex(currentData.nodes || [], parent.data.xid) : -1;
  const newNodes = JSON.parse(JSON.stringify(currentData.nodes));

  for (let node of newNodes) {
    if (node.id === id) {
      Object.assign(node, {
        ...node,
        data: {
          ...node.data,
          collapsed: false
        }
      });
      break;
    }
  }

  if (lastIndex > -1) {
    newNodes.splice((lastIndex > -1 ? lastIndex + 1 : -1), 0, ...nodes);
  } else {
    nodes.forEach((value) => {
      newNodes.push(value);
    });
  }

  const newEdges = edges.concat(currentData.edges || []);
  const newCombos = combos.concat(currentData.combos?.map(({ id, parentId, collapsed }) => {
    if (id === `${parent.id}-combo`) {
      return { id, parentId, collapsed: false }
    }
    return { id, parentId, collapsed }
  }) || []);

  return {
    nodes: JSON.parse(JSON.stringify(newNodes)),
    edges: JSON.parse(JSON.stringify(newEdges)),
    combos: JSON.parse(JSON.stringify(newCombos)),
  };
}


// 添加子节点
export function replaceChildrenToGraphData(parent: { id: string, xid: string }, data: CustomObjectConfig[], currentData: GraphData, filterMap: any) {
  const id = parent.id;
  const rootId = store.getState().editor.rootNode['x.object.id'];

  const newDataIdMap: any = {};
  const sortData = data.sort((a, b) => {
    if (!a['xid'] || !b['xid']) return 1;

    Object.assign(newDataIdMap, {
      [a['x.object.id']]: a,
      [b['x.object.id']]: b
    });
    const aIds: any = a['xid'].split('.'),
      bIds: any = b['xid'].split('.');
    for (let i = 1; i < aIds.length; i++) {
      if (Number(aIds[i]) === Number(bIds[i])) continue;
      return Number(aIds[i]) > Number(bIds[i]) ? 1 : -1;
    }

    return 1;
  });
  const { nodes, combos, edges } = covertToGraphData(sortData, id, filterMap);

  const currentNodes: any = currentData.nodes,
    removeIds: any = {};
  let newNodes: NodeItemData[] = [];
  if (id === rootId) {
    newNodes = newNodes.concat(nodes);
  }
  const parentXid = parent.xid, parentId = parent.id;
  const shoudldRemoveXidLen = parentXid.split(".").length + 1;
  let removeIdChildren: any[] = [], removeIdChildrenMap: any = {}, concatIndex = -1;
  for (let i = 0; i < currentNodes.length; i++) {
    const node = currentNodes[i],
      nodeId = node.id,
      nodeData = node.data || {},
      nodeXid = nodeData.xid || '',
      nodeParent = _.get(nodeData['x.object.version.parent'], 'x.object.id', '');
    if (nodeXid && nodeXid.startsWith(parentXid) && nodeXid.split(".").length === shoudldRemoveXidLen) {
      Object.assign(removeIdChildrenMap, { [nodeId]: node });
    }
    if ((!nodeXid.startsWith(parentXid) || nodeXid == parentXid) && !nodeId.startsWith("pagination-" + parentId) && !removeIdChildrenMap[nodeParent] && !removeIds[nodeParent]) {
      newNodes.push(node);
    } else if (newDataIdMap[nodeParent] && (nodeXid.startsWith(parentXid) && nodeXid.split(".").length > shoudldRemoveXidLen || nodeParent && removeIdChildrenMap[nodeParent])) {
      removeIdChildren.push(node);
      Object.assign(removeIdChildrenMap, { [nodeId]: node });
    } else {
      Object.assign(removeIds, { [nodeId]: node });
    }
    if (nodeId === id) {
      concatIndex = newNodes.length;
    }
  }

  let concatNodes: NodeItemData[] = [];
  if (removeIdChildren.length > 0) {
    let newRemoveIdChildren: any[] = [];
    nodes.forEach(function (node) {
      const nodeId = node.id,
        nodeXid = node.data.xid;
      concatNodes.push(node);
      if (nodeXid) {
        for (let i = 0; i < removeIdChildren.length; i++) {
          const item = removeIdChildren[i],
            itemId = item.id,
            itemXid = item.xid;
          if (itemXid && itemXid.startsWith(nodeXid)) {
            if (itemXid.split(".").length === nodeXid.split(".").length + 1 && _.get(item.data['x.object.version.parent'], 'x.object.id') !== nodeId) {
              break;
            }
            concatNodes.push(item);
            if (nodeXid.split(".").length + 1 === itemXid.split(".").length) {
              edges.push({ source: nodeId, target: itemId });
            }
          } else if (itemId.startsWith("pagination-" + nodeId)) {
            concatNodes.push(item);
          } else {
            newRemoveIdChildren.push(item);
          }
        }
        removeIdChildren = JSON.parse(JSON.stringify(newRemoveIdChildren));
        newRemoveIdChildren = [];
      }
    });
  } else {
    concatNodes = nodes;
  }

  if (concatIndex > -1) {
    newNodes.splice(concatIndex, 0, ...concatNodes);
  }

  const newEdges = edges.concat((currentData.edges || []).filter(({ source, target }: any) => !removeIds[source] && !removeIds[target]));
  const prevCombos: any[] = [];
  (currentData.combos || []).map(({ id, parentId, collapsed }: any) => {
    const _id = id.replace("-combo", "");
    if (!removeIds[_id]) {
      prevCombos.push({ id, parentId, collapsed });
    }
  });

  const newCombos = combos.map(function (data) {
    const _id = data.id.replace("-combo", "");
    if (removeIds[_id]) {
      return {
        ...data,
        collapsed: _.get(removeIds[_id], "data.collapsed", true)
      }
    }
    return data;
  }).concat(prevCombos);

  return {
    nodes: JSON.parse(JSON.stringify(newNodes)),
    edges: JSON.parse(JSON.stringify(newEdges)),
    combos: JSON.parse(JSON.stringify(newCombos)),
  };
}

export function convertResultData(
  data: any,
  currentParent: any,
  nodes: NodeItemData[],
  edges: EdgeConfig[],
  combos: ComboConfig[],
  edgeIdMap: any,
  relationLines: RelationsConfig,
  xid?: string
) {
  const rootId = store.getState().editor.rootNode['x.object.id'];

  if (!currentParent) {
    combos.push({ id: `${rootId}-combo` });
  }

  data.forEach((item: CustomObjectConfig, index: number) => {
    const id = item['x.object.id'],
      childLen = item['x.object.version.childs'] || 0,
      _xid = xid ? (xid + '.' + index) : (item['xid'] || id),
      children = _.get(item, 'e_x_children', []),
      metadata = JSON.parse(item['x.object.metadata'] || '{}'),
      fill = _.get(metadata, 'color', defaultNodeColor.fill),
      iconKey = _.get(metadata, 'icon', '');
    if (id === rootId) {
      childLen > 0 && convertResultData(children, item, nodes, edges, combos, edgeIdMap, relationLines, _xid);
    } else {
      const comboId = `${id}-combo`;
      const currentParentId = _.get(currentParent, 'uid'),
        parentId = currentParentId || rootId;
      const collapsed = false;
      const node: any = {
        id,
        xid: _xid,
        isQueryNode: true,
        data: {
          ...item,
          collapsed: false,
        },
        childLen,
        collapsed,
        icon: iconKey,
        target: _.get(item, 'target'), // true代表uid传入的目标节点，false代表父节点
        style: {
          ...nodeStateStyle.default,
          fill
        },
        labelCfg: {
          style: {
            fill: getTextColor(fill)
          }
        }
      };

      if (parentId) {
        combos.push({
          id: comboId,
          parentId: parentId + '-combo',
          collapsed
        });
        Object.assign(node, { comboId: parentId + '-combo' });
      } else {
        combos.push({
          id: comboId,
          collapsed
        });
      }

      const isPagination = id.startsWith("pagination-");
      if (isPagination) {
        Object.assign(node, paginationOption(id.split("-")[3] === "prev" ? "prev" : "next"));
        if (item.totalPage) {
          Object.assign(node, { totalPage: item.totalPage, nextDisabled: Boolean(item.nextDisabled) });
        }
      }

      nodes.push(node);

      if (currentParentId !== rootId) {
        if (currentParentId && edgeIdMap[currentParentId] && !isPagination) {
          edges.push({ source: edgeIdMap[currentParentId], target: id });
        }
      }
      Object.assign(edgeIdMap, {
        [id]: id
      });

      if (!isPagination) {
        // 获取对象关系列表数据
        Object.assign(relationLines, {
          [id]: item['x.object.version.relations'] || []
        });
      }

      childLen > 0 && convertResultData(children, item, nodes, edges, combos, edgeIdMap, relationLines, _xid);
    }
  });
}

export function convertAllData(data: CustomObjectConfig[]) {
  const edges: EdgeConfig[] = [];
  const combos: ComboConfig[] = [];
  const nodes: NodeItemData[] = [];
  let edgeIdMap: any = {};
  const rootId = store.getState().editor.rootNode['x.object.id'];
  combos.push({ id: `${rootId}-combo` });
  for (const item of data) {
    const id = item['x.object.id'],
      xid = item['xid'] || id,
      metadata = JSON.parse(item['x.object.metadata'] || '{}'),
      fill = _.get(metadata, 'color', defaultNodeColor.fill),
      iconKey = _.get(metadata, 'icon', '');
    const comboId = `${id}-combo`;
    const parentId = (item['x.object.version.parent'] || {})['x.object.id'];
    const collapsed = Boolean(item.collapsed === undefined ? true : item.collapsed);
    const node: NodeItemData = {
      id,
      data: { ...item, xid },
      icon: iconKey,
      style: {
        ...nodeStateStyle.default,
        fill
      },
      labelCfg: {
        style: {
          fill: getTextColor(fill)
        }
      }
    };

    if (parentId) {
      combos.push({
        id: comboId,
        parentId: parentId + '-combo',
        collapsed
      });
      Object.assign(node, { comboId: parentId + '-combo' });
    } else {
      combos.push({
        id: comboId,
        collapsed
      });
    }

    const isPagination = id.startsWith("pagination-");
    if (isPagination) {
      Object.assign(node, paginationOption(id.split("-")[3] === "prev" ? "prev" : "next"));
      if (item.totalPage) {
        Object.assign(node, { totalPage: item.totalPage, nextDisabled: Boolean(item.nextDisabled) });
      }
    }

    nodes.push(node as NodeItemData);

    if (parentId) {
      if (parentId !== rootId) {
        if (edgeIdMap[parentId] && !isPagination) {
          edges.push({ source: edgeIdMap[parentId], target: id });
        }
      }
      Object.assign(edgeIdMap, {
        [id]: id
      });
    }
  }

  return {
    nodes,
    edges,
    combos,
  };
}

export function resizeGraph() {
  const graph = (window as any).PDB_GRAPH;
  if (!graph) return;
  const containers: any = document.getElementsByClassName('graph');
  if (!containers || containers.length === 0) return;
  const container = containers[0];
  if (!container || !container.clientWidth || !container.clientHeight || !graph) return;
  graph.changeSize(container.clientWidth, container.clientHeight);
  graph.paint();
}