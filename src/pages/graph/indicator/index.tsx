// @ts-ignore
import G6, { EdgeConfig, Graph, IG6GraphEvent, IGroup, INode, ModelConfig, NodeConfig } from '@antv/g6';
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useResizeDetector } from 'react-resize-detector';
import { Button, Form, message, Modal, Radio, Typography } from "antd";
import { LeftOutlined, PlusOutlined } from "@ant-design/icons";
import { get, isEmpty } from "lodash";
import { StoreState } from "@/store";
import { getIcon } from '@/utils/common';
import './index.less'

const data = {
  nodes: [
    {
      id: '1',
      label: '指标A',
    },
    {
      id: '2',
      label: '指标B',
    },
    {
      id: '3',
      label: '指标C',
    },
    {
      id: '4',
      label: '指标D',
    },
    {
      id: '5',
      label: '指标E',
    },
    {
      id: 'f1',
      label: '＋',
      type: 'math-symbol',
    },
    {
      id: 'f2',
      label: '×',
      type: 'math-symbol',
    },
    {
      id: 'f3',
      label: '－',
      type: 'math-symbol',
    },
    {
      id: 'end',
      label: '结果',
      result: true
    },
  ],
  edges: [
    {
      source: '1',
      target: 'f1',
    },
    {
      source: '2',
      target: 'f1',
    },
    {
      source: '3',
      target: 'f2',
    },
    {
      source: '4',
      target: 'f2',
    },
    {
      source: '5',
      target: 'f3',
    },
    {
      source: 'f1',
      target: 'f3',
    },
    {
      source: 'f2',
      target: 'f3',
    },
    {
      source: 'f3',
      target: 'end',
    },
  ],
};
function registerNode() {
  G6.registerNode('indicator', {
    options: {
      stateStyles: {
        selected: {
          'node-rect': {
            lineWidth: 2,
          }
        }
      }
    },
    draw: function draw(cfg: ModelConfig, group: IGroup) {
      const { id, label } = cfg;
      const result = id === 'end'
      const bg = result ? 'rgb(239, 227, 250)' : 'rgb(232, 243, 255)'
      const border = result ? 'rgb(188, 149, 229)' : 'rgb(148, 191, 255)'
      const iconColor = result ? 'rgba(172, 115, 233, 1)' : 'rgba(94, 158, 255, 1)'
      const icon = result ? 'jieguo' : 'zhibiao'
      const keyShape = group.addShape('rect', {
        attrs: {
          width: 140,
          height: 32,
          fill: bg,
          stroke: border,
          radius: 4,
          lineWidth: 0.6,
          cursor: 'pointer',
        },
        name: 'node-rect'
      });
      group.addShape('text', {
        attrs: {
          text: label,
          fill: '#1C2126',
          textBaseline: 'middle',
          fontSize: 14,
          cursor: 'pointer',
          x: 40,
          y: 16,
        },
        name: 'node-text',
        draggable: true
      });
      group.addShape('text', {
        attrs: {
          x: 12,
          y: 16,
          fill: iconColor,
          textBaseline: 'middle',
          fontFamily: 'iconfont',
          // textAlign: 'center',
          text:  getIcon(icon),
          fontSize: 18
        },
        name: 'node-icon',
        draggable: true
      });
      return keyShape;
    },
    getAnchorPoints(cfg?: ModelConfig) {
      return cfg?.id == 'end' ? [[0, 0.5]] : [[1, 0.5]];
    },
  }, 'rect')
  G6.registerNode('math-symbol', {
    options: {
      stateStyles: {
        selected: {
          'node-rect': {
            stroke: 'rgba(121, 168, 2, 1)',
            lineWidth: 2,
          }
        }
      }
    },
    draw: function draw(cfg: ModelConfig, group: IGroup) {
      const { id, label, data } = cfg;
      const mathSym = get(cfg, 'data.symbol')
      const keyShape = group.addShape('rect', {
        attrs: {
          width: 40,
          height: 32,
          fill: 'rgb(166, 203, 71)',
          stroke: 'rgb(166, 203, 71)',
          radius: 4,
          cursor: 'pointer',
        },
        anchorPoints: [
          [0, 0.5],
          [1, 0.5],
        ],
        linkPoints: {
          right: true,
          left: true,
        },
        name: 'node-rect'
      });
      group.addShape('text', {
        attrs: {
          x: 20,
          y: 16,
          fill: '#fff',
          textBaseline: 'middle',
          textAlign: 'center',
          fontWeight: 500,
          fontSize: 18,
          text: label,
        },
        name: 'node-icon',
        draggable: true
      });
      return keyShape;
    },
    getAnchorPoints(cfg?: ModelConfig) {
      return [[0, 0.5], [1, 0.5]];
    },
  }, 'rect')

  G6.registerBehavior('drop-canvas', {
    getEvents() {
      return {
        'canvas:drop': 'onDrop'
      };
    },
    onDrop: function (event: IG6GraphEvent) {
      const { clientX, clientY, dataTransfer } = event.originalEvent as any;
      if (!dataTransfer) return
      const dropAdd = dataTransfer.getData('drop_add');
      const graph = this.graph as Graph;
      const model = JSON.parse(dropAdd)
      if (model.id == 'end') {
        const end = graph.findById('end')
        if (end) {
          message.warning('一个高级指标中只能有一个结果')
          return
        }
      }
      const point = graph.getPointByClient(clientX, clientY)
      graph.addItem('node', {...model, ...point })
      // graph.refresh()
    }
  })
}

export default function IndicatorAdvance() {
  const navigate = useNavigate();
  const routerParams = useParams();
  const graphRef = useRef<HTMLDivElement | null>(null)
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const query = useSelector((state: StoreState) => state.query.params);

  let graph: any
  let prevWidth: number | undefined = 0, prevHeight: number | undefined = 0;
  const onResize = useCallback((width: number | undefined, height: number | undefined) => {
    if (graph) {
      graph.changeSize(width, height);
      if (prevWidth === 0 && prevHeight === 0) {
        const graphData = graph.save();
        graph.data(graphData);
        graph.render();
        graph.zoom(1);
        graph.layout();
      }
    }
    prevWidth = width;
    prevHeight = height;
  }, [graph]);

  useResizeDetector({
    targetRef: graphRef,
    onResize
  });

  useEffect(() => {
    registerNode()
    const container: any = graphRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight || 500;

    graph = new G6.Graph({
      container: container,
      width,
      height,
      fitView: true,
      layout: {
        type: 'dagre',
        rankdir: 'LR',
        controlPoints: true,
        align: undefined,
        nodesep: 6,
        ranksepFunc: (d: ModelConfig) => d.result ? 0 : 70,
      },
      modes: {
        default: ['drag-canvas', 'zoom-canvas', 'drop-canvas', 'drag-node', {
          type: 'create-edge',
          shouldBegin: (e: IG6GraphEvent) => {
            const event = e.originalEvent as MouseEvent
            if (!event.ctrlKey) return false
            const model = e.item?.getModel()
            return model?.id !== 'end'
          },
          // @ts-ignore
          shouldEnd: function (e: IG6GraphEvent, {source}) {
            console.log('--- e.item: ', e.item)
            const targetNode = e.item as INode
            const model = targetNode?.getModel()
            const sourceNode = graph.findById(source)            
            if (
              model?.id === source ||                                             // 禁止自身相连
              model?.type !== "math-symbol" && model?.id !== 'end' ||             // 目标节点只能是运算符或结果
              sourceNode.getModel().type !== "math-symbol" && model?.id === 'end' // 指标不能直接与结果相连
            ) return false
            const inEdges = targetNode.getInEdges()
            // 目标节点最多连两条线
            if (inEdges.length == 2) return false 
            const outEdges = targetNode.getOutEdges()
            const index = inEdges.findIndex(edg => source === edg.getModel().source)
            const outdex = outEdges.findIndex(edg => source === edg.getModel().target)
            console.log('--- index: ', index)
            // 两个节点之间只能连一条线
            return index == -1 && outdex == -1
          },
        }]
      },
      defaultNode: {
        type: 'indicator',
      },
      defaultEdge: {
        type: 'cubic-horizontal',
        sourceAnchor: 1,
        targetAnchor: 0,
        style: {
          stroke: '#c8ced5',
          lineWidth: 1,
          endArrow: {
            path: G6.Arrow.triangle(5, 10, 0),
            fill: '#c8ced5',
            stroke: '#c8ced5',
          }
        }
      },
      edgeStateStyles: {
        active: {
          stroke: '#c8ced5',
          lineWidth: 2,
        },
        selected: {
          stroke: '#ff0',
          lineWidth: 3,
        },
      },
    })
    graph.data(data);
    graph.render();


    graph.on('node:click', (evt: IG6GraphEvent) => {
      const { item } = evt;
      graph.getNodes().forEach((node: any) => {
        graph.clearItemStates(node);
      });
      graph.setItemState(item, 'selected', true);
    });
    graph.on('edge:mouseenter', (evt: IG6GraphEvent) => {
      const { item } = evt;
      graph.setItemState(item, 'active', true);
    });

    graph.on('edge:mouseleave', (evt: IG6GraphEvent) => {
      const { item } = evt;
      graph.setItemState(item, 'active', false);
    });
    graph.on('edge:dblclick', (e: IG6GraphEvent) => {
      graph.removeItem(e.item)
    });
    graph.on('canvas:click', () => {
      graph.getNodes().forEach((node: any) => {
        graph.clearItemStates(node);
      });
    });

    graph.on('keyup', (e: IG6GraphEvent) => {
      console.log('--- keyup: ', e.keyCode)
      switch(e.keyCode) {
        case 46:
          // Delete
          const nodes = graph.findAllByState('node', 'selected');          
          if (nodes.length) {
            for (let item of nodes) {
              graph.removeItem(item)
            }
          }
          break;
        default:
      }
    })
  }, [])

  return (
    <div className='pdb-indicator-graph-container' onKeyDown={e => e.stopPropagation()}>
      <div ref={graphRef} className="graph" id="indicator-graph"></div>
    </div>
  )
}