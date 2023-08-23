<template>
  <div id="pdb-graph">
  </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue';
import G6, { Util } from '@antv/g6';
import { storeToRefs } from 'pinia';

import { useEditorStore } from '../../store/editor';
import { buildTree } from '../../utils/common';

const editorStore = useEditorStore();
const { data } = storeToRefs(editorStore);
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
        nodeLeftSep: 25, // 同一部分的节点间距
        nodeHeightSep: 40, // 节点大小
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
      const nodeLeft = self.nodeLeftSep;
      const nodeHeight = self.nodeHeightSep;
      const nodeXMap = new Map();
      let currentY = 0;
      self.nodes.forEach((item: any, index: number) => {
        if (item.parent) {
          const itemParentX = nodeXMap.get(item.parent);
          if (!itemParentX) {
            nodeXMap.set(item.id, { ...item });
            return
          }
          item.x = itemParentX.x + nodeLeft;
          item.y = currentY + nodeHeight;
          currentY = item.y;
        } else {
          currentY = self.nodes[0].y;
          if (index > 0) {
            item.y = currentY;
          }
          item.size = [200, 20];
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

  G6.registerNode('plmNodeCustom', {
    draw: function draw(cfg, group) {
      let width = 120;
      if (cfg.parent) width = 50;
      const keyShape = group.addShape('rect', {
        attrs: {
          width,
          height: 30,
          fill: 'rgb(187,246,250)',
          stroke: '#02c3ff',
          radius: 2
        }
      });
      // text
      group.addShape('text', {
        attrs: {
          text: cfg.label,
          fill: '#333',
          textAlign: 'center',
          height: 30,
          x: width / 2,
          y: 22,
          fontFamily:
            typeof window !== 'undefined'
              ? window.getComputedStyle(document.body, null).getPropertyValue('font-family') ||
              'Arial, sans-serif'
              : 'Arial, sans-serif',
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
      let startPoinX = Number(startPoint?.x) + 15;
      if (cfg.sourceNode._cfg.model.parent === cfg.targetNode._cfg.model.parent) {
        startPoinX = Number(startPoint?.x) - 10;
      }
      
      const shape = group.addShape('path', {
        attrs: {
          stroke: '#333',
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

  graph = new G6.Graph({
    container,
    width,
    height,
    modes: {
      default: ['drag-canvas', 'zoom-canvas'],
    },
    defaultNode: {
      size: [40, 20] ,
      type: 'plmNodeCustom',
      style: {
        lineWidth: 2,
        stroke: '#5B8FF9',
        fill: '#C6E5FF',
      },
    },
    layout: {
      type: 'plmLayoutCustom',
      indent: 0
    },
    defaultEdge: {
      type: 'step-line',
    }
  });
  graph.data(buildTree(data.value));
  graph.render();
}

function initEvent() {
  if (!graph) return
  graph.on('node:click', (event: { item: any; target: any; }) => {
    const node = event.item; // 被点击的节点元素
    const shape = event.target; // 被点击的图形，可根据该信息作出不同响应，以达到局部响应效果
    console.log(node, shape)
    editorStore.setCurrentEditModel(node._cfg.model)
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
  