<template>
  <div id="pdb-graph">
  </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue';
import G6, { Util } from '@antv/g6';
import { storeToRefs } from 'pinia';
import _ from 'lodash'

import { useEditorStore } from '../../store/editor';
import { buildTree, ROOT_NODE_WIDTH, NODE_WIDTH, NODE_HEIGHT, NODE_LEFT_SEP, NODE_HEIGHT_SEP, NODE_STYLE, LINE_SYTLE } from '../../utils/graph';

const editorStore = useEditorStore();
const { data } = storeToRefs(editorStore);

const TYPE_MAP = {
  EBOM: 'type3',
  BOP: 'type6',
  ERP: 'type1',
  QMES: 'type5'
};
let graph: any;
onMounted(() => {
  initG6();
  initLayout();
  initEvent();
});

function initG6() {
  /**
   * 注册布局的方法
   * @param {string} type 布局类型，外部引用指定必须，不要与已有布局类型重名
   * @param {object} layout 布局方法
   */
  G6.registerLayout('plmLayoutCustom', {
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
    init(data: object) {
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
            return
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

  G6.registerNode('plmNodeCustom', {
    draw: function draw(cfg, group) {
      let width = ROOT_NODE_WIDTH;
      let type = _.get(cfg, 'nodeType', 'default');

      if (cfg.parent) {
        width = NODE_WIDTH;
      } else if (TYPE_MAP[cfg.id]) {
        type = TYPE_MAP[cfg.id];
      }
      const { fill, stroke, color, radius } = NODE_STYLE[type] || NODE_STYLE['default'];

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
  G6.registerEdge('step-line', {
    draw(cfg, group) {
      const startPoint = cfg.startPoint,
            endPoint = cfg.endPoint;
      const { stroke } = LINE_SYTLE['default'];

      // 同层，直线
      if (_.get(cfg.targetNode, '_cfg.model.onlyChild')) {
        const shape = group.addShape('path', {
          attrs: {
            stroke,
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
      if (_.get(cfg.sourceNode, '_cfg.model.parent') === _.get(cfg.targetNode, '_cfg.model.parent')) {
        startPoinX = Number(startPoint?.x) - 10;
      }

      const shape = group.addShape('path', {
        attrs: {
          stroke,
          path: [
            ['M', startPoinX, startPoint?.y],
            ['L', startPoinX, endPoint?.y], // 三分之一处
            ['L', endPoint?.x, endPoint?.y],
          ],
        },
        name: 'path-shape',
      });
      return shape;
    },
  })
}

function initLayout() {
  const container = document.getElementById("pdb-graph");
  if (!container) return;
  const width = container.scrollWidth;
  const height = container.scrollHeight || 500;
  const minimap = new G6.Minimap({
    size: [150, 100],
  }); // 小地图
  graph = new G6.Graph({
    container,
    width,
    height,
    modes: {
      default: [
        'drag-canvas', // 画布拖拽
        'zoom-canvas', // 画布缩放
        // 'activate-relations' // 高亮相邻节点
      ],
    },
    defaultNode: {
      size: [40, 20],
      type: 'plmNodeCustom',
      style: {
        lineWidth: 2,
        stroke: '#5B8FF9',
        fill: '#C6E5FF',
      },
    },
    nodeStateStyles: {
      // 自定义选中节点样式
      selectedNode: {
        stroke: '#0C69D9',
        fill: '#FFFFFF',
      }
    },
    layout: {
      type: 'plmLayoutCustom',
    },
    defaultEdge: {
      type: 'step-line',
    },
    plugins: [minimap],
  });
  graph.data(buildTree(data.value));
  graph.fitCenter(true, { duration: 200, easing: 'easeCubic' });
  graph.render();
}

function initEvent() {
  if (!graph) return
  graph.on('node:click', (event: { item: any; target: any; }) => {
    const node = event.item; // 被点击的节点元素
    const shape = event.target; // 被点击的图形，可根据该信息作出不同响应，以达到局部响应效果

    editorStore.setCurrentEditModel(node._cfg.model);
    graph.findAllByState('node', 'selectedNode').forEach((node: any) => {
      graph.setItemState(node, 'selectedNode', false);
    });
    /* 不同状态下节点和边的样式，G6 提供以下状态名的默认样式：active, inactive, selected, highlight, disable。可以通过如下方式修改或者扩展全局状态样式*/
    graph.setItemState(node, 'selectedNode', true);
  });

  graph.on('canvas:click', () => {
    // 取消选中高亮
    graph.findAllByState('node', 'selectedNode').forEach((node: any) => {
      graph.setItemState(node, 'selectedNode', false);
    });
  });

  graph.on('node:mouseenter', (event: { item: any; }) => {
    // hover 高亮
    graph.setItemState(event.item, 'active', true);
  });

  graph.on('node:mouseleave', (event: { item: any; }) => {
    graph.setItemState(event.item, 'active', false);
  });
}

</script>
<style lang="less" scoped>
#pdb-graph {
  flex: 1;
  height: 100%;
  width: 0;
}
</style>
  ../../utils/graph