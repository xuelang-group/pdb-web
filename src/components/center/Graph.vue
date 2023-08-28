<template>
  <div class="graph">
    <div id="pdb-graph"></div>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue';
import G6, { IG6GraphEvent } from '@antv/g6';
import { storeToRefs } from 'pinia';
import _ from 'lodash'

import { useEditorStore } from '../../store/editor';
import { buildTree } from '../../utils/graph';

import "../../utils/g6";

const editorStore = useEditorStore();
const { data } = storeToRefs(editorStore);

let graph: any;
onMounted(() => {
  initLayout();
  initEvent();
});

function initLayout() {
  const container = document.getElementById("pdb-graph");
  if (!container) return;
  const width = container.scrollWidth;
  const height = container.scrollHeight || 500;
  // const minimap = new G6.Minimap({
  //   size: [150, 100],
  // }); // 小地图
  graph = new G6.Graph({
    container,
    width,
    height,
    modes: {
      default: [
        {
          type: 'drag-canvas',
          allowDragOnItem: { combo: true }
        }, // 画布拖拽
        'zoom-canvas', // 画布缩放
        'collapse-expand',
        {
          type: 'drag-node',
          updateEdge: false,
          enableDelegate: true,
          shouldBegin: function(event: IG6GraphEvent) {
            if (!event.item) return false;
            const model = event.item.get('model');
            return !model.root;
          },
          shouldEnd: function(event: IG6GraphEvent) {
            return false;
          }
        },
        'drag-enter',
        'graph-keydown',
        'node-select',
        // 'collapse-expand-combo'
        // 'drag-branch',
        // 'activate-relations' // 高亮相邻节点
      ],
      addNode: [
        'drag-canvas', // 画布拖拽
        'zoom-canvas', // 画布缩放
        'graph-keydown',
      ]
    },
    defaultCombo: {
      type: 'rect',
      style: {
        lineWidth: 0
      }
    },
    defaultNode: {
      type: 'pbdNode',
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
      type: 'pbdLayout',
    },
    defaultEdge: {
      type: 'step-line',
    },
    // plugins: [minimap],
  });
  graph.data(buildTree(data.value));
  graph.render();
  graph.zoom(1);
}

function initEvent() {
  if (!graph) return
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
.graph {
  flex: 1;
  height: 100%;
  width: 0;
  padding: 25px;
  position: relative;

  #pdb-graph {
    width: 100%;
    height: 100%;
    background: #fff;
    box-shadow: 0px 4px 8px 0px rgba(9, 16, 28, 0.2);
    border-radius: 5px;
  }
}
</style>
  ../../utils/graph