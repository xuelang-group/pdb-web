import G6, { IGroup, ModelConfig } from '@antv/g6';
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useResizeDetector } from 'react-resize-detector';
import { Button, Form, Modal, Radio, Typography } from "antd";
import { LeftOutlined, PlusOutlined } from "@ant-design/icons";
import { isEmpty } from "lodash";
import { StoreState } from "@/store";
import './index.less'
import { getIcon } from '@/utils/common';

const data = {
  nodes: [
    {
      id: '1',
      label: '指标A',
      type: 'indicator',
    },
    {
      id: '2',
      label: '指标B',
      type: 'indicator',
    },
    {
      id: '3',
      label: '指标C',
      type: 'indicator',
    },
    {
      id: '4',
      label: '指标D',
      type: 'indicator',
    },
    {
      id: 'f1',
      label: '加',
      type: 'math-symbol',
    },
    {
      id: 'f3',
      label: '乘',
      type: 'math-symbol',
    },
    {
      id: '9',
      label: '结果',
      type: 'advance',
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
      target: 'f3',
    },
    {
      source: '4',
      target: 'f3',
    },
    {
      source: 'f1',
      target: '9',
    },
    {
      source: 'f3',
      target: '9',
    },
  ],
};
function registerNode() {
  G6.registerNode('advance', {
    draw: function draw(cfg: ModelConfig, group: IGroup) {
      const { id, label } = cfg;
      const keyShape = group.addShape('rect', {
        attrs: {
          width: 100,
          height: 32,
          fill: 'rgb(239, 227, 250)',
          stroke: 'rgb(188, 149, 229)',
          radius: 4,
          lineWidth: 0.6,
          cursor: 'pointer',
        },
        anchorPoints: [
          [0, 0.5],
        ],
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
          fill: 'rgba(172, 115, 233, 1)',
          textBaseline: 'middle', 
          fontFamily: 'iconfont',
          text: getIcon('PDB_2'),
          fontSize: 18
        },
        name: 'node-icon'
      });
      return keyShape;
    },
  }, 'rect')
  G6.registerNode('indicator', {
    draw: function draw(cfg: ModelConfig, group: IGroup) {
      const { id, label } = cfg;
      const keyShape = group.addShape('rect', {
        attrs: {
          width: 140,
          height: 32,
          fill: 'rgb(232, 243, 255)',
          stroke: 'rgb(148, 191, 255)',
          radius: 4,
          lineWidth: 0.6,
          cursor: 'pointer',
        },
        anchorPoints: [
          [1, 0.5],
        ],
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
          fill: 'rgba(94, 158, 255, 1)',
          textBaseline: 'middle',
          fontFamily: 'iconfont',
          // textAlign: 'center',
          text: getIcon('zhibiao'),
          fontSize: 18
        },
        name: 'node-icon'
      });
      return keyShape;
    },
  }, 'rect')
  G6.registerNode('math-symbol', {
    draw: function draw(cfg: ModelConfig, group: IGroup) {
      const { id, label } = cfg;
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
          text: '+',
        },
        name: 'node-icon'
      });
      return keyShape;
    },
  }, 'rect')
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
        // ranksep: 0,
        // nodesepFunc: () => 1,
        ranksepFunc: (d: ModelConfig) => {
          return d.type == 'advance' ? 0 : 70
        },
      },
      modes: {
        default: ['drag-canvas', 'zoom-canvas', 'drop-canvas', 'drag-node', 'create-edge']
      },
      defaultEdge: {
        type: 'cubic-horizontal',
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
    })
    graph.data(data);
    graph.render();
  }, [])

  return (
    <div className='pdb-indicator-graph-container'>
      <div ref={graphRef} className="graph" id="indicator-graph"></div>
    </div>
  )
}