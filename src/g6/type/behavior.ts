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
}
