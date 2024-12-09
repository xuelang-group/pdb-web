import G6, { Util } from '@antv/g6';
import _ from 'lodash';
import { ROOT_NODE_WIDTH, NODE_WIDTH, NODE_HEIGHT, NODE_HEIGHT_SEP, paginationOption } from '../utils/objectGraph';
import store from '@/store';

export function registerLayout() {

  /**
   * 注册布局的方法：当前画布布局
   * @param {string} type 布局类型，外部引用指定必须，不要与已有布局类型重名
   * @param {object} layout 布局方法
   */
  G6.registerLayout('pbdLayout', {
    nodeXMap: new Map(),
    /**
     * 定义自定义行为的默认参数，会与用户传入的参数进行合并
     */
    getDefaultCfg() {
      return {
        rootNodeLeftSep: 40, // 主节点左右间距
        nodeLeftSep: 30, // 节点左右间距
        nodeHeightSep: NODE_HEIGHT_SEP, // 节点上下间距
        nodeWidth: NODE_WIDTH,
        nodeHeight: NODE_HEIGHT,
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
      const rootNodeLeft = self.rootNodeLeftSep,
        nodeLeft = self.nodeLeftSep,
        nodeHeightSep = self.nodeHeightSep,
        nodeWidth = self.nodeWidth,
        nodeXMap = self.nodeXMap;
      let currentY = 0, prevMaxX = 0, rootIndex: any = -1, firstRoot: any = null,
        currenNodeWidth = ROOT_NODE_WIDTH, prevRootMaxX = 0, prevMaxNodeWidth = 0, prevNodeHeight = self.nodeHeight;
      const rootId = store.getState().editor.rootNode['x.object.id'];
      self.nodes.forEach((item: any, index: number) => {
        const parent = _.get(item.data['x.object.version.parent'], 'x.object.id', '');
        if (parent !== rootId) {
          const itemParentX = nodeXMap.get(parent);
          if (!itemParentX) {
            nodeXMap.set(item.id, { ...item });
            return;
          }
          if (itemParentX.data.collapsed) {
            nodeXMap.set(item.id, { ...item, data: { ...item.data, collapsed: true } });
            return;
          }
          item.x = itemParentX.x + nodeLeft;
          item.y = currentY + nodeHeightSep + prevNodeHeight;
          currenNodeWidth = item.width;
          const prevNode = index > 0 ? self.nodes[index - 1] : null;
          if (item.type === "paginationBtn") {
            item.x += paginationOption().size[0] / 2;
            prevNodeHeight = 10;

            if (prevNode && Number(_.get(prevNode.data, 'x.object.version.childs', 0)) > 0) {
              item.y += 5;
            }
          } else {
            prevNodeHeight = self.nodeHeight;

            if (prevNode && prevNode.type === "paginationBtn" && prevNode.id.endsWith("-prev")) {
              item.y -= 20;
            }
          }
          currentY = item.y;
        } else {
          // 顶层主节点
          if (rootIndex > -1) {
            currentY = firstRoot.y;
            const currentWidth = prevMaxX + (ROOT_NODE_WIDTH + rootNodeLeft);
            const width = prevMaxX > prevRootMaxX ? ROOT_NODE_WIDTH : currenNodeWidth;
            item.x = ((prevMaxX + prevMaxNodeWidth) > (prevRootMaxX + ROOT_NODE_WIDTH) ? (prevMaxX + prevMaxNodeWidth) : (prevRootMaxX + ROOT_NODE_WIDTH)) + rootNodeLeft;
            item.y = currentY;
            prevRootMaxX = item.x;
            rootIndex++;
          } else {
            currentY = item.y;
            firstRoot = item;
            rootIndex = 0;
            prevMaxX = item.x;
            prevRootMaxX = item.x;
          }
          currenNodeWidth = ROOT_NODE_WIDTH;
          prevNodeHeight = self.nodeHeight;
        }
        if (item.x > prevMaxX) {
          prevMaxX = item.x;
          prevMaxNodeWidth = currenNodeWidth;
        }
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
}