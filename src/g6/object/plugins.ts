import G6 from "@antv/g6";
import { addBrotherNode, addChildNode, createRootNode } from "./behavior";
import store from "@/store";

export const contextMenu = new G6.Menu({
  getContent(evt: any) {
    if (evt.target && evt.target.isCanvas && evt.target.isCanvas()) {
      return `
        <ul class="graph-contextmenu">
          <li key='create_root'>创建根节点</li>
        </ul>
      `;
    }

    const model = evt.item.get('model');
    const rootId = store.getState().editor.rootNode['x.object.id'];
    if (model.parent === rootId) {
      return `
        <ul class="graph-contextmenu">
          <li key='create_children'>创建子节点</li>
        </ul>
      `;
    }
    return `
      <ul class="graph-contextmenu">
        <li key='create_children'>创建子节点</li>
        <li key='create_brother'>创建兄弟节点</li>
      </ul>
    `;
  },
  handleMenuClick: (target, item) => {
    const graph = (window as any).PDB_GRAPH;
    const key = target.getAttribute('key');
    switch (key) {
      case 'create_root':
        createRootNode(graph);
        break;
      case 'create_children':
        addChildNode(item, graph);
        break;
      case 'create_brother':
        addBrotherNode(item, graph);
        break;
      default:
        break;
    }
  },
  // offsetX and offsetY include the padding of the parent container
  // 需要加上父级容器的 padding-left 16 与自身偏移量 10
  offsetX: 16 + 10,
  // 需要加上父级容器的 padding-top 24 、画布兄弟元素高度、与自身偏移量 10
  offsetY: 0,
  // the types of items that allow the menu show up
  // 在哪些类型的元素上响应 ['node', 'edge', 'canvas']
  itemTypes: ['canvas', 'node'],
});