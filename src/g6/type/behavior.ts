import G6, { IG6GraphEvent, INode, IEdge, Item, Graph, G6Event, NodeConfig, EdgeConfig } from '@antv/g6';
import { throttle } from '@antv/util';
import store from '../../store';
import { setCurrentEditModel } from '../../reducers/editor';
import { Modal } from 'antd';

const { confirm } = Modal;
export const G6OperateFunctions = {
  selectItem: function (model: NodeConfig | EdgeConfig, graph: Graph) {
    const { currentEditModel } = store.getState().editor;
    if (!model.id || currentEditModel?.id === model.id) return;

    if (currentEditModel?.id) {
      const curentSelected = graph.findById(currentEditModel.id);
      if (curentSelected) {
        graph.setItemState(curentSelected, 'selected', false);
        graph.setItemState(curentSelected, 'showAnchors', false);
      }
    }

    store.dispatch(setCurrentEditModel(model));

    graph.setItemState(model.id, 'selected', true);
  },
  removeNode: function (node: Item, graph: Graph) {
    const nodeModel = node.getModel();
    if (!nodeModel || !nodeModel.uid) return;
    store.dispatch(setCurrentEditModel(null));
    graph.emit('clear:active', { item: null });
    graph.removeItem(node);
  },
  removeEdge: function (edge: Item, graph: Graph) {
    const edgeModel = edge.getModel();
    confirm({
      wrapClassName: 'suanpan-modal',
      title: '删除关系',
      content: `是否删除 "${edgeModel.label || edgeModel.id}" 关系?`,
      okText: '确定',
      cancelText: '取消',
      onOk() {
        graph.emit('clear:active', { item: null });
        graph.removeItem(edge);
        store.dispatch(setCurrentEditModel(null));
      }
    });
  }
}

export function registerBehavior() {

  // 节点选中
  G6.registerBehavior('graph-select', {
    getEvents: function getEvents() {
      return {
        'node:click': 'nodeSelected',
        'edge:click': 'edgeSelected',
        'canvas:click': 'unselectedAll',
      };
    },
    nodeSelected: function (event: IG6GraphEvent) {
      const node: any = event.item; // 被点击的节点元素
      // const shape = event.target; // 被点击的图形，可根据该信息作出不同响应，以达到局部响应效果

      if (!node) return;
      const graph = this.graph as Graph;
      if (!graph) return;

      graph.setItemState(node.getID(), 'selected', true);
      G6OperateFunctions.selectItem(node.getModel(), graph);
    },
    edgeSelected: function (event: IG6GraphEvent) {
      const edge = event.item; // 被点击的节点元素
      if (!edge) return;
      const graph = this.graph as Graph;
      if (!graph) return;
      graph.setItemState(edge.getID(), 'selected', true);
      G6OperateFunctions.selectItem(edge.getModel(), graph);
    },
    unselectedAll: function (event: IG6GraphEvent) {
      const graph = this.graph as Graph;
      if (!graph) return;

      const { currentEditModel } = store.getState().editor;
      if (currentEditModel?.id) {
        const curentSelected = graph.findById(currentEditModel.id);
        if (curentSelected) {
          graph.setItemState(curentSelected, 'selected', false);
          graph.setItemState(curentSelected, 'showAnchors', false);
        }
      }
      currentEditModel && store.dispatch(setCurrentEditModel(null));
    },
  });
  // 画布监听keydown
  G6.registerBehavior('graph-keydown', {
    getEvents: function getEvents() {
      return {
        'keydown': 'graphKeydown'
      };
    },
    graphKeydown: function (event: IG6GraphEvent) {
      if ((event.target as any).tagName !== 'BODY') return;
      const { keyCode, ctrlKey, target } = event;
      const graph = (this as any).graph;
      const { currentEditModel } = store.getState().editor;
      if (!currentEditModel?.id) return;
      const curentSelected = graph.findById(currentEditModel.id);
      if (!curentSelected) return;
      switch (keyCode) {
        case 8:
        case 46:
          // DEL键 (46) / backspace (8)
          const type = curentSelected.get('type');
          if (type === 'node') {
            G6OperateFunctions.removeNode(curentSelected, graph);
          } else if (type === 'edge') {
            G6OperateFunctions.removeEdge(curentSelected, graph);
          }
          break;
        case 67:
          // ctrl + c
          if (ctrlKey) {
            this.copyItem = curentSelected;
          }
          break;
        case 86:
          // ctrl + v
          if (ctrlKey && this.copyItem) {

          }
          break;
        default:
          break;
      }
    }
  });


  // 高亮相邻边 -- 原代码
  G6.registerBehavior('activate-relations-custom', {
    getDefaultCfg(): object {
      return {
        // 可选 mouseenter || click
        // 选择 click 会监听 touch，mouseenter 不会监听
        trigger: 'mouseenter',
        activeState: 'active',
        inactiveState: 'inactive',
        resetSelected: false,
        shouldUpdate() {
          return true;
        },
      };
    },
    getEvents(): { [key in G6Event]?: string } {
      if ((this as any).get('trigger') === 'mouseenter') {
        return {
          'node:mouseenter': 'setAllItemStates',
          'combo:mouseenter': 'setAllItemStates',
          'node:mouseleave': 'clearActiveState',
          'combo:mouseleave': 'clearActiveState',
        };
      }
      return {
        'node:click': 'setAllItemStates',
        'combo:click': 'setAllItemStates',
        'canvas:click': 'clearActiveState',
        'node:touchstart': 'setOnTouchStart',
        'combo:touchstart': 'setOnTouchStart',
        'canvas:touchstart': 'clearOnTouchStart',
        'clear:active': 'clearActiveState' // 新增
      };
    },
    setOnTouchStart(e: IG6GraphEvent) {
      const self = this as any;
      try {
        const touches = (e.originalEvent as TouchEvent).touches;
        const event1 = touches[0];
        const event2 = touches[1];

        if (event1 && event2) {
          return;
        }

        e.preventDefault();
      } catch (e) {
        console.warn('Touch original event not exist!');
      }
      self.setAllItemStates(e);
    },
    clearOnTouchStart(e: IG6GraphEvent) {
      const self = this as any;
      try {
        const touches = (e.originalEvent as TouchEvent).touches;
        const event1 = touches[0];
        const event2 = touches[1];

        if (event1 && event2) {
          return;
        }

        e.preventDefault();
      } catch (e) {
        console.warn('Touch original event not exist!');
      }
      self.clearActiveState(e);
    },
    setAllItemStates(e: IG6GraphEvent) {
      const self = this as any;

      clearTimeout(self.timer);
      self.throttleSetAllItemStates(e, self);
    },
    clearActiveState(e: any) {
      const self = this as any;

      // avoid clear state frequently, it costs a lot since all the items' states on the graph need to be cleared
      self.timer = setTimeout(() => {
        self.throttleClearActiveState(e, self);
      }, 50)
    },
    throttleSetAllItemStates: throttle(
      (e: any, self: any) => {
        const item: INode = e.item as INode;
        const graph = self.graph;
        if (!graph || graph.destroyed) return;
        self.item = item;
        if (!self.shouldUpdate(e.item, { event: e, action: 'activate' }, self)) {
          return;
        }
        const activeState = self.activeState;
        const inactiveState = self.inactiveState;
        const nodes = graph.getNodes();
        const combos = graph.getCombos();
        const edges = graph.getEdges();
        const vEdges = graph.get('vedges');
        const nodeLength = nodes.length;
        const comboLength = combos.length;
        const edgeLength = edges.length;
        const vEdgeLength = vEdges.length;
        const inactiveItems = self.inactiveItems || {};
        const activeItems = self.activeItems || {};

        for (let i = 0; i < nodeLength; i++) {
          const node = nodes[i];
          const nodeId = node.getID();
          const hasSelected = node.hasState('selected');
          if (self.resetSelected) {
            if (hasSelected) {
              graph.setItemState(node, 'selected', false);
            }
          }
          if (activeItems[nodeId]) {
            graph.setItemState(node, activeState, false);
            delete activeItems[nodeId];
          }
          if (inactiveState && !inactiveItems[nodeId]) {
            graph.setItemState(node, inactiveState, true);
            inactiveItems[nodeId] = node;
          }
        }
        for (let i = 0; i < comboLength; i++) {
          const combo = combos[i];
          const comboId = combo.getID();
          const hasSelected = combo.hasState('selected');
          if (self.resetSelected) {
            if (hasSelected) {
              graph.setItemState(combo, 'selected', false);
            }
          }
          if (activeItems[comboId]) {
            graph.setItemState(combo, activeState, false);
            delete activeItems[comboId];
          }
          if (inactiveState && !inactiveItems[comboId]) {
            graph.setItemState(combo, inactiveState, true);
            inactiveItems[comboId] = combo;
          }
        }

        for (let i = 0; i < edgeLength; i++) {
          const edge = edges[i];
          const edgeId = edge.getID();
          if (activeItems[edgeId]) {
            graph.setItemState(edge, activeState, false);
            delete activeItems[edgeId];
          }
          if (inactiveState && !inactiveItems[edgeId]) {
            graph.setItemState(edge, inactiveState, true);
            inactiveItems[edgeId] = edge;
          }
        }

        for (let i = 0; i < vEdgeLength; i++) {
          const vEdge = vEdges[i];
          const vEdgeId = vEdge.getID();
          if (activeItems[vEdgeId]) {
            graph.setItemState(vEdge, activeState, false);
            delete activeItems[vEdgeId];
          }
          if (inactiveState && !inactiveItems[vEdgeId]) {
            graph.setItemState(vEdge, inactiveState, true);
            inactiveItems[vEdgeId] = vEdge;
          }
        }

        if (item && !item.destroyed) {
          if (inactiveState) {
            graph.setItemState(item, inactiveState, false);
            delete inactiveItems[item.getID()];
          }
          if (!activeItems[item.getID()]) {
            graph.setItemState(item, activeState, true);
            activeItems[item.getID()] = item;
          }

          const rEdges = item.getEdges();
          const rEdgeLegnth = rEdges.length;
          for (let i = 0; i < rEdgeLegnth; i++) {
            const edge = rEdges[i];
            const edgeId = edge.getID();
            let otherEnd: INode;
            if (edge.getSource() === item) {
              otherEnd = edge.getTarget();
            } else {
              otherEnd = edge.getSource();
            }
            const otherEndId = otherEnd.getID();
            if (inactiveState && inactiveItems[otherEndId]) {
              graph.setItemState(otherEnd, inactiveState, false);
              delete inactiveItems[otherEndId];
            }
            if (!activeItems[otherEndId]) {
              graph.setItemState(otherEnd, activeState, true);
              activeItems[otherEndId] = otherEnd;
            }
            if (inactiveItems[edgeId]) {
              graph.setItemState(edge, inactiveState, false);
              delete inactiveItems[edgeId];
            }
            if (!activeItems[edgeId]) {
              graph.setItemState(edge, activeState, true);
              activeItems[edgeId] = edge;
            }
            edge.toFront();
          }
        }
        self.activeItems = activeItems;
        self.inactiveItems = inactiveItems;
        graph.emit('afteractivaterelations', { item: e.item, action: 'activate' });
      },
      50,
      {
        trailing: true,
        leading: true
      }
    ),
    throttleClearActiveState: throttle(
      (e: any, self: any) => {
        const graph = self.get('graph');
        if (!graph || graph.destroyed) return;
        if (!self.shouldUpdate(e.item, { event: e, action: 'deactivate' }, self)) return;

        const activeState = self.activeState;
        const inactiveState = self.inactiveState;

        const activeItems = self.activeItems || {};
        const inactiveItems = self.inactiveItems || {};

        Object.values(activeItems).filter((item: any) => !item.destroyed).forEach(item => {
          graph.clearItemStates(item, activeState);
        });
        Object.values(inactiveItems).filter((item: any) => !item.destroyed).forEach(item => {
          graph.clearItemStates(item, inactiveState);
        });
        self.activeItems = {};
        self.inactiveItems = {};
        graph.emit('afteractivaterelations', {
          item: e.item || self.get('item'),
          action: 'deactivate',
        });
      },
      50,
      {
        trailing: true,
        leading: true
      }
    )
  });
}
