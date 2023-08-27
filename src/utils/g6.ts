import G6, { Util, ModelConfig, IGroup, IG6GraphEvent, IShapeBase, Item, Graph, GraphData } from '@antv/g6';
import _ from 'lodash';
import { buildTree, ROOT_NODE_WIDTH, NODE_WIDTH, NODE_HEIGHT, NODE_LEFT_SEP, NODE_HEIGHT_SEP, NODE_STYLE, LINE_SYTLE } from './graph';
import { uuid } from './common';
import { useEditorStore } from '../store/editor';

const TYPE_MAP: { [k: string]: any } = {
  EBOM: 'type3',
  BOP: 'type6',
  ERP: 'type1',
  QMES: 'type5'
};
const G6OperateFunctions = {
  addNode: function(sourceNode: Item, graph: Graph) {
    const editorStore = useEditorStore();
    const { data } = editorStore;
    const { rootKey } = sourceNode.get('model');
    if (!data[rootKey]) return;
    const _data = data[rootKey];
    const new_data = {
      uid: uuid(),
      name: '',
      parent: sourceNode.get('id')
    };
    _data.push(new_data);
    data[rootKey] = _data;
    const graphData: GraphData = graph.save();
    if (!graphData) return;
    graph.read(buildTree(data, rootKey, {
      nodes: graphData.nodes?.filter((val: any) => val.rootKey !== rootKey || val.root),
      edges: graphData.edges?.filter((val: any) => val.rootKey !== rootKey),
      combos: graphData.combos?.filter((val: any) => val.rootKey !== rootKey),
    }));
    graph.setMode('addNode');
    (window as any).onAddNode = function() {
      const input = document.getElementsByClassName('graph-add-input')[0].children[0]
      if (!input) return;
      _data[_data.length - 1].name = input?.value;
      graph.setMode('default');
      data[rootKey] = _data;
      graph.read(buildTree(data, rootKey, {
        nodes: graphData.nodes?.filter((val: any) => val.rootKey !== rootKey || val.root),
        edges: graphData.edges?.filter((val: any) => val.rootKey !== rootKey),
        combos: graphData.combos?.filter((val: any) => val.rootKey !== rootKey),
      }));
    }
  }
}

/**
 * 注册布局的方法：当前画布布局
 * @param {string} type 布局类型，外部引用指定必须，不要与已有布局类型重名
 * @param {object} layout 布局方法
 */
G6.registerLayout('pbdLayout', {
  /**
   * 定义自定义行为的默认参数，会与用户传入的参数进行合并
   */
  getDefaultCfg() {
    return {
      nodeLeftSep: NODE_LEFT_SEP, // 节点左右间距
      nodeHeightSep: NODE_HEIGHT_SEP, // 节点上下间距
      nodeWidth: NODE_WIDTH,
      nodeHeight: NODE_HEIGHT
    };
  },
  /**
   * 初始化
   * @param {Object} data 数据
   */
  init(data: { nodes: any; edges: any; }) {
    const self = this;
    self.nodes = data.nodes;
    self.edges = data.edges;
  },
  /**
   * 执行布局
   */
  execute() {
    const self = this;
    const nodeLeft = self.nodeLeftSep,
      nodeHeightSep = self.nodeHeightSep,
      nodeWidth = self.nodeWidth,
      nodeHeight = self.nodeHeight;
    const nodeXMap = new Map();
    let currentY = 0, prevMaxX = 0;
    self.nodes.forEach((item: any, index: number) => {
      if (item.parent) {
        const itemParentX = nodeXMap.get(item.parent);
        if (!itemParentX) {
          nodeXMap.set(item.id, { ...item });
          return;
        }
        if (itemParentX.collapsed) {
          nodeXMap.set(item.id, { ...item, collapsed: true });
          return;
        }
        if (item.onlyChild) {
          item.x = itemParentX.x + nodeWidth + nodeLeft / 2;
          item.y = currentY;
        } else {
          item.x = itemParentX.x + nodeLeft;
          item.y = currentY + nodeHeightSep + nodeHeight;
        }
        currentY = item.y;
      } else {
        // 顶层主节点
        currentY = self.nodes[0].y;
        if (index > 0) {
          item.x = (prevMaxX > ROOT_NODE_WIDTH ? prevMaxX : ROOT_NODE_WIDTH) + ROOT_NODE_WIDTH / 2 + nodeLeft;
          item.y = currentY;
        }
      }
      if (item.x > prevMaxX) prevMaxX = item.x;
      nodeXMap.set(item.id, { ...item });
    });
  },
  /**
   * 根据传入的数据进行布局
   * @param {Object} data 数据
   */
  layout(data: object) {
    const self = this;
    self.init(data);
    self.execute();
  },
  /**
   * 更新布局配置，但不执行布局
   * @param {Object} cfg 需要更新的配置项
   */
  updateCfg(cfg: object) {
    const self = this;
    Util.mix(self, cfg);
  },
  /**
   * 销毁
   */
  destroy() {
    const self = this;
    self.positions = null;
    self.nodes = null;
    self.edges = null;
    self.destroyed = true;
  },
});

/**
 * 注册节点的方法
 * @param {string} type 节点类型，外部引用指定必须，不要与已有布局类型重名
 * @param {object} node 节点方法
 */
G6.registerNode('pbdNode', {
  draw: function draw(cfg: ModelConfig, group: IGroup) {
    let width = ROOT_NODE_WIDTH;
    let type = _.get(cfg, 'nodeType', 'default');

    if (cfg.parent) {
      width = NODE_WIDTH;
    } else if (TYPE_MAP[(cfg.id || '') as string]) {
      type = TYPE_MAP[(cfg.id || '') as string];
    }
    const { fill, stroke, color, radius } = NODE_STYLE[type as string] || NODE_STYLE['default'];

    const keyShape = group.addShape('rect', {
      attrs: {
        width,
        height: NODE_HEIGHT,
        fill,
        stroke,
        radius: radius || 2,
        cursor: 'pointer',
      },
      name: 'node-rect'
    });

    // 节点上方块区域，用于响应拖拽
    group.addShape('rect', {
      attrs: {
        width,
        height: 10,
        fill: 'transparent',
        stroke: 'transparent',
        radius: 2,
        y: -10
      },
      name: 'top-rect'
    });
    const attrs = {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    }
    if (cfg.label) {
      // text
      group.addShape('text', {
        attrs: {
          ...attrs,
          text: cfg.label,
          fill: color,
          textAlign: 'center',
          cursor: 'pointer',
          x: width / 2,
          y: 22,
        },
        name: 'text-shape',
        draggable: true
      });
    } else {
      group.addShape('dom', {
        attrs: {
          ...attrs,
          html: `
            <div class="graph-add-input" style='width: ${attrs.width}px; height: ${attrs.height}px'>
              <input autofocus/>
            </div>
          `
        },
        name: 'add-input-rect',
        draggable: true
      });
    }
    return keyShape;
  },
  afterDraw(cfg: ModelConfig | undefined, group: IGroup | undefined) {

    // dragenter时样式
    const topRect = group?.find(child => child.get('name') === 'top-rect');
    const nodeRect = group?.find(child => child.get('name') === 'node-rect');
    if (topRect) {
      topRect.on('dragenter', () => {
        topRect.attr('fill', '#c8ced5');
      });
      topRect.on('dragleave', () => {
        topRect.attr('fill', 'transparent');
      });
    }
    if (nodeRect) {
      nodeRect.on('dragenter', (event: IG6GraphEvent) => {
        group?.cfg.item.setState('active', true)
      });
      nodeRect.on('dragleave', () => {
        group?.cfg.item.clearStates(['active']);
      });
    }

    const addInputRect = group?.find(child => child.get('name') === 'add-input-rect');
    if (addInputRect) {
      console.log(addInputRect)
    }
  }
},
  'rect',
);

/**
 * 注册连线的方法
 * @param {string} type 连线类型，外部引用指定必须，不要与已有布局类型重名
 * @param {object} node 连线方法
 */
G6.registerEdge('step-line', {
  draw(cfg: ModelConfig, group) {
    const startPoint = cfg.startPoint,
      endPoint = cfg.endPoint;
    const { stroke } = LINE_SYTLE['default'];
    const targetModel = cfg.targetNode.get('model'),
      sourceModel = cfg.sourceNode.get('model');
    const lineWidth = cfg.isComboEdge ? 0 : 1;
    // 同层，直线
    if (targetModel.onlyChild) {
      const shape = group.addShape('path', {
        attrs: {
          stroke,
          lineWidth,
          path: [
            ['M', startPoint?.x, startPoint?.y],
            ['L', endPoint?.x, endPoint?.y],
          ],
        },
        name: 'path-shape',
      });
      return shape;
    }

    // 折线
    let startPoinX = Number(startPoint?.x) + 15;
    if (sourceModel.parent === targetModel.parent) {
      startPoinX = Number(startPoint?.x) - 10;
    }

    const shape = group.addShape('path', {
      attrs: {
        stroke,
        lineWidth,
        path: [
          ['M', startPoinX, startPoint?.y],
          ['L', startPoinX, endPoint?.y], // 三分之一处
          ['L', endPoint?.x, endPoint?.y],
        ],
      },
      name: 'path-shape',
    });
    return shape;
  }
});

G6.registerBehavior('collapse-expand', {
  getEvents: function getEvents() {
    return {
      'node:dblclick': 'onNodeClick'
    }
  },
  onNodeClick: function onNodeClick(event: IG6GraphEvent) {
    const { item } = event;
    if (!item) return;

    const id = item.get('id');
    const sourceData = (this as any).graph.findById(id);
    if (!sourceData) return;

    const model = sourceData.get('model');
    if (!model) return;

    const children = model.children;
    if (!children || children.length === 0) return;

    const collapsed = !sourceData.collapsed;
    if (!(this as any).shouldBegin(event, collapsed, this)) {
      return;
    }

    sourceData.collapsed = collapsed;
    item.getModel().collapsed = collapsed;
    (this as any).graph.emit('itemcollapsed', { item, collapsed });
    if (!(this as any).shouldUpdate(event, collapsed, this)) {
      return;
    }

    const comboId = `${id}-combo`;
    if (collapsed) {
      (this as any).graph.collapseCombo(comboId);
    } else {
      (this as any).graph.expandCombo(comboId);
    }
    (this as any).graph.layout();
  }
});

G6.registerBehavior('drag-enter', {
  getEvents: function getEvents() {
    return {
      // 'node:dragstart': 'dragstart',
      // 'node:drag': 'drag',
      'node:dragend': 'dragend',
      'node:drop': 'drop'
      // 'node:dragenter': 'dragenter',
      // 'node:dragleave': 'dragleave',
    };
  },
  dragend: function dragend(event: IG6GraphEvent) {
    const dragItem = event.item;
    if (dragItem && this.dropItem && this.dropTarget) {
      const { cfg } = (this.dropTarget as IShapeBase);
      if (!cfg) return;
      (this as any).changeData(dragItem, this.dropItem, cfg.name);
    }
  },
  changeData(dragItem: IShapeBase, dropItem: IShapeBase, type: string) {
    if (type !== 'top-rect' && type !== 'node-rect') return;
    const graphData = (this as any).graph.save();
    const dragItemId = dragItem.get('id'),
      dragItemModel = dragItem.get('model'),
      dragItemRootKey = dragItemModel.rootKey,
      dropItemId = dropItem.get('id'),
      dropItemModel = dropItem.get('model'),
      dropItemRootKey = dropItemModel.rootKey;
    // 不允许跨树移动
    if (dragItemId === dropItemId || dragItemRootKey !== dropItemRootKey) return;

    const dragItemLevel = dragItemModel.level,
          dropItemLevel = dropItemModel.level;

    // 不允许父级投入其子级中
    if (dragItemLevel.length < dropItemLevel.length && dropItemLevel.startsWith(dragItemLevel)) return;
    
    const editorStore = useEditorStore();
    const { data, setData } = editorStore;
    if (data[dragItemRootKey]) {
      const _data = data[dragItemRootKey],
        new_data = new Array();
      const dropItemParent = dropItemModel.parent,
        dragItemParent = dragItemModel.parent;
      const dragItemData = dragItemModel.data;
      if (type === 'top-rect') {
        // 插入某个节点前面
        dragItemData.parent = dropItemParent;
        _data.forEach(function (value) {
          if (value.uid === dragItemId) return;
          if (value.uid === dropItemId) {
            // 节点uid等于dropItemId时，先将dragItem数据推入data
            new_data.push(dragItemData);
          } else if (value.uid === dragItemParent) {
            // 节点uid等于dragItem父级时，将其父级children数据里面移除dragItemId
            value.children = value.children?.filter(val => val !== dragItemId);
          } else if (value.uid === dropItemParent) {
            // 节点uid等于dropItemId父级时，将其父级children数据里面插入dragItemId
            value.children?.push(dragItemId);
          }
          new_data.push(value);
        });
      } else if (type === 'node-rect') {
        let hasInsertDropData = false;
        dragItemData.parent = dropItemId;
        // 插入某个节点内，即变成节点子级
        for (let i = _data.length - 1; i >= 0; i--) {
          const value = _data[i];
          if (value.uid === dragItemId) continue;
          if (!hasInsertDropData && value.parent === dropItemId) {
            new_data.unshift(dragItemData);
            hasInsertDropData = true;
          } else if (value.uid === dropItemId) {
            value.children?.push(dragItemId);
          } else if (value.uid === dragItemParent) {
            value.children = value.children?.filter(val => val !== dragItemId);
          }
          new_data.unshift(value);
        }
        if (!hasInsertDropData) {
          new_data.push(dragItemData);
        }
      }

      data[dragItemRootKey] = new_data;
      setData(data);
      (this as any).graph.read(buildTree(data, dragItemRootKey, {
        nodes: graphData.nodes.filter((val: any) => val.rootKey !== dragItemRootKey || val.root),
        edges: graphData.edges.filter((val: any) => val.rootKey !== dragItemRootKey),
        combos: graphData.combos.filter((val: any) => val.rootKey !== dragItemRootKey),
      }));
    }
  },
  drop: function drop(event: IG6GraphEvent) {
    const { item, target } = event;
    this.dropItem = item;
    this.dropTarget = target;
  }
});

G6.registerBehavior('node-select', {
  getEvents: function getEvents() {
    return {
      'node:click': 'nodeSelected',
      'canvas:click': 'nodeUnselected'
    };
  },
  nodeSelected: function(event: IG6GraphEvent) {
    const node = event.item; // 被点击的节点元素
    const shape = event.target; // 被点击的图形，可根据该信息作出不同响应，以达到局部响应效果

    if (!node) return;
    const graph = this.graph as Graph;
    if (!graph) return;
    const editorStore = useEditorStore();
    editorStore.setCurrentEditModel(node.get('model'));
    graph.findAllByState('node', 'selectedNode').forEach((node: any) => {
      graph.setItemState(node, 'selectedNode', false);
    });
    /* 不同状态下节点和边的样式，G6 提供以下状态名的默认样式：active, inactive, selected, highlight, disable。可以通过如下方式修改或者扩展全局状态样式*/
    graph.setItemState(node, 'selectedNode', true);
  },
  nodeUnselected: function(event: IG6GraphEvent) {
    const graph = this.graph as Graph;
    if (!graph) return;
    // 取消选中高亮
    graph.findAllByState('node', 'selectedNode').forEach((node: any) => {
      graph.setItemState(node, 'selectedNode', false);
    });
  }
})

G6.registerBehavior('graph-keydown', {
  getEvents: function getEvents() {
    return {
      'keydown': 'keydown'
    };
  },
  keydown: function keydown(event: IG6GraphEvent) {
    console.log('KEYDOWN: ', event);
    const { keyCode } = event;
    const graph = (this as any).graph;
    switch (keyCode) {
      case 9:
        let selectedNode = null;
        graph.findAllByState('node', 'selectedNode').forEach((node: Item) => {
          selectedNode = node;
        });
        if (!selectedNode) return;
        G6OperateFunctions.addNode(selectedNode, graph);
        break;
      case 13:
        if (graph.getCurrentMode() === 'addNode') {
          window.onAddNode();
        }
        break;
      default:
        break;
    }
  }
});