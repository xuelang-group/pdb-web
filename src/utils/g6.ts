import G6, { Util, ModelConfig, IGroup, IG6GraphEvent } from '@antv/g6';
import { buildTree, ROOT_NODE_WIDTH, NODE_WIDTH, NODE_HEIGHT, NODE_LEFT_SEP, NODE_HEIGHT_SEP, NODE_STYLE, LINE_SYTLE } from './graph';
import _ from 'lodash';

const TYPE_MAP: {[k:string]: any} = {
  EBOM: 'type3',
  BOP: 'type6',
  ERP: 'type1',
  QMES: 'type5'
};

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
      }
    });
    // text
    group.addShape('text', {
      attrs: {
        text: cfg.label,
        fill: color,
        textAlign: 'center',
        height: NODE_HEIGHT,
        x: width / 2,
        y: 22,
        cursor: 'pointer',
      },
      name: 'text-shape',
    });
    return keyShape;
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
    // // (this as any).onChange(item, collapsed, this);
    (this as any).graph.layout();
  }
});

// G6.registerBehavior('drag-branch', {
//   getEvents: function getEvents() {
//     return {
//       'node:dragstart': 'dragstart',
//       'node:drag': 'drag',
//       'node:dragend': 'dragend',
//       'node:dragenter': 'dragenter',
//       'node:dragleave': 'dragleave',
//     };
//   },
//   dragstart: function dragstart(e) {
//     (this as any).set('foundNode', undefined)
//     this.origin = {
//       x: e.x,
//       y: e.y,
//     };
//     this.target = e.item;
//     // 未配置 shouldBegin 时 默认为 true
//     if (this.shouldBegin && !this.shouldBegin(_.get(this.target, '_cfg.id'))) {
//       this.began = false;
//       return;
//     }
//     this.began = true;
//   },
//   dragenter: function dragenter(e) {
//     if (!this.began) {
//       return;
//     }
//   },
//   dragleave: function dragleave(e) {
//     if (!this.began) {
//       return;
//     }
//   },
//   drag: function drag(e) {
//     if (!this.began) {
//       return;
//     }
//     (this as any).updateDelegate(e);
//   },
//   dragend: function dragend(e) {
//     const graph = (this as any).get('graph');
//     const foundNode = (this as any).get('foundNode');
//     if (!this.began) {
//       return;
//     }
//     this.began = false;
//     const { item } = e;
//     const id = item.getID();
//     const data = graph.findDataById(id);

//     // remove delegate
//     if (this.delegateRect) {
//       (this.delegateRect as any).remove();
//       this.delegateRect = null;
//     }

//     if (!foundNode) {
//       graph.emit('afterdragbranch', { success: false, message: 'Failed. No node close to the dragged node.', branch: data })
//       return;
//     }

//     const foundNodeId = foundNode.getID();

//     let oriParentData: any;
//     Util.traverseTree(graph.get('data'), (d: any) => {
//       if (oriParentData) return false;
//       if (d.children?.filter((child: any) => child.id === id)?.length) {
//         oriParentData = d;
//       }
//       return true;
//     });

//     // 未配置 shouldEnd，则默认为 true
//     if (this.shouldEnd && !(this as any).shouldEnd(data, graph.findDataById(foundNodeId), oriParentData)) {
//       return;
//     }

//     // if the foundNode is a descent of the dragged node, return
//     let isDescent = false;

//     Util.traverseTree(data, (d) => {
//       if (d.id === foundNodeId) isDescent = true;
//     });
//     if (isDescent) {
//       const newParentData = graph.findDataById(foundNodeId);
//       graph.emit('afterdragbranch', { success: false, message: 'Failed. The target node is a descendant of the dragged node.', newParentData, branch: data })
//       return;
//     }

//     const newParentData = graph.findDataById(foundNodeId);
//     // 触发外部对数据的改变
//     graph.emit('afterdragbranch', { success: true, message: 'Success.', newParentData, oriParentData, branch: data })
//     graph.removeChild(data.id);
//     setTimeout(() => {
//       let newChildren = newParentData.children;
//       if (newChildren) newChildren.push(data);
//       else newChildren = [data];
//       // 更新正在被操作的子树颜色
//       Util.traverseTree(data, d => {
//         d.branchColor = newParentData.branchColor
//       })
//       graph.updateChildren(newChildren, newParentData.id);
//     }, 600);
//   },
//   updateDelegate(e) {
//     const { graph } = this;
//     if (!this.delegateRect) {
//       // 拖动多个
//       const parent = graph.get('group');
//       const attrs = {
//         fill: '#F3F9FF',
//         fillOpacity: 0.5,
//         stroke: '#1890FF',
//         strokeOpacity: 0.9,
//         lineDash: [5, 5],
//       };

//       const { x: cx, y: cy, width, height, minX, minY } = this.calculationGroupPosition(e);
//       this.originPoint = { x: cx, y: cy, width, height, minX, minY };
//       // model上的x, y是相对于图形中心的，delegateShape是g实例，x,y是绝对坐标
//       this.delegateRect = parent.addShape('rect', {
//         attrs: {
//           width,
//           height,
//           x: cx,
//           y: cy,
//           ...attrs,
//         },
//         // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
//         name: 'rect-delegate-shape',
//       });
//       this.delegateRect.set('capture', false);
//     } else {
//       const clientX = e.x - this.origin.x + this.originPoint.minX;
//       const clientY = e.y - this.origin.y + this.originPoint.minY;
//       this.delegateRect.attr({
//         x: clientX,
//         y: clientY,
//       });
//     }
//   },
//   calculationGroupPosition(evt) {
//     let node = this.target;
//     if (!node) {
//       node = evt.item;
//     }

//     const bbox = node.getBBox();
//     const { minX, minY, maxX, maxY } = bbox;

//     return {
//       x: Math.floor(minX),
//       y: Math.floor(minY),
//       width: Math.ceil(maxX) - Math.floor(minX),
//       height: Math.ceil(maxY) - Math.floor(minY),
//       minX,
//       minY,
//     };
//   },
// });