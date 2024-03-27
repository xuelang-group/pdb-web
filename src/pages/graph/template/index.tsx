import G6, { Edge } from '@antv/g6';
import { useSelector } from 'react-redux';
import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useResizeDetector } from 'react-resize-detector';
import _ from 'lodash';

import type { StoreState } from '@/store';
import { defaultCircleR, nodeStateStyle } from '@/g6/type/node';
import { initG6 } from '@/g6';
import { edgeLabelStyle, edgeStyle } from '@/g6/type/edge';

import './index.less';
import { RelationConfig } from '@/reducers/relation';
import { TypeConfig } from '@/reducers/type';
import { fittingString } from '@/utils/objectGraph';
import { defaultNodeColor, getBorderColor, getTextColor } from '@/utils/common';
import { getImagePath, uploadFile } from '@/actions/minioOperate';
import appDefaultScreenshotPath from '@/assets/images/no_image_xly.png';

let graph: any;

interface EditorProps {
  theme: string,
}

export default function Editor(props: EditorProps) {
  const graphRef = useRef(null),
    routerParams = useParams(),
    navigate = useNavigate();
  const currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel),
    userId = useSelector((state: StoreState) => state.app.systemInfo.userId),
    types = useSelector((state: StoreState) => state.type.data),
    relations = useSelector((state: StoreState) => state.relation.data);

  const onResize = useCallback((width: number | undefined, height: number | undefined) => {
    graph && graph.changeSize(width, height);
  }, [graph]);

  useResizeDetector({
    targetRef: graphRef,
    onResize
  });

  useEffect(() => {
    const container: any = graphRef.current;
    if (!container || !container.clientWidth || !container.clientHeight || !graph) return;
    graph.changeSize(container.clientWidth, container.clientHeight);
    graph.paint();
  }, [currentEditModel?.id]);

  let isUpdateScreenshot = false;
  function saveScreenShoot() {
    if (isUpdateScreenshot) {
      return;
    }
    isUpdateScreenshot = true;
    if (graphRef.current) {
      const id = routerParams.id;
      if (!id) return;
      const shotPath = 'studio/' + userId + '/pdb/' + id + '/template_screen_shot.png';
      (graphRef.current as any).childNodes[0].toBlob(function (blob: any) {
        uploadFile(shotPath, blob).finally(() => {
          isUpdateScreenshot = false;
        });
      });
    }
  }
  // 初始化画布样式
  function initLayout(data: any, shouldLayout: boolean = true) {
    const container: any = graphRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight || 500;
    let isInitial = true, layout = {};
    if (shouldLayout) {
      Object.assign(layout, {
        type: 'force',
        preventOverlap: true,
        nodeSize: defaultCircleR * 2,
        nodeSpacing: defaultCircleR,
      });
    }
    graph = new G6.Graph({
      container,
      width,
      height,
      modes: {
        default: [
          {
            type: 'drag-canvas', // 画布拖拽
            allowDragOnItem: { combo: true }
          }, {
            type: 'zoom-canvas', // 画布缩放
          }, {
            type: 'drag-node', // 节点拖拽
          },
          'activate-relations-custom'
        ]
      },
      layout,
      defaultNode: {
        type: 'circle-node',
        style: nodeStateStyle.default,
        labelCfg: {
          style: {
            fill: '#1C2126'
          }
        }
      },
      defaultEdge: {
        type: 'connect-line',
        style: edgeStyle.default,
        labelCfg: {
          autoRotate: true,
          style: edgeLabelStyle(props.theme).default,
        },
        loopCfg: {
          dist: defaultCircleR * 2,
        }
      },
      linkCenter: true,
    });
    (window as any).PDR_GRAPH = graph;

    graph.get('canvas').set('localRefresh', false);
    graph.data(JSON.parse(JSON.stringify(data)));
    graph.render();
    graph.on("afterrender", function () {
      saveScreenShoot();
    });

    const edges: any = graph.save().edges;
    G6.Util.processParallelEdges(edges, 20);
    graph.getEdges().forEach((edge: Edge, i: number) => {
      const { source, target } = edge.getModel();
      graph.updateItem(edge, {
        type: source === target ? 'loop' : 'connect-line',
        curveOffset: edges[i].curveOffset,
        curvePosition: edges[i].curvePosition,
      });
    });

    (window as any).PDB_GRAPH = graph;
  }

  useEffect(() => {
    // 初始化画布信息
    let resizeObserver: any;
    if (routerParams && routerParams.id) {
      const nodes: any[] = [], edges: any[] = [];
      // 初始化节点数据
      types.forEach(function (type: TypeConfig) {
        const id = type["x.type.name"];
        const { text } = fittingString(type['x.type.label'] || '', defaultCircleR * 2),
          _metadata = JSON.parse(type['x.type.metadata'] || '{}'),
          fill = _.get(_metadata, 'color', defaultNodeColor.fill),
          icon = _.get(_metadata, 'icon', ''),
          stroke = getBorderColor(_.get(_metadata, 'borderColor'), fill);
        nodes.push({
          label: text,
          name: type['x.type.label'] || '',
          uid: type,
          id,
          data: type,
          style: {
            ...nodeStateStyle.default,
            stroke,
            fill
          },
          labelCfg: {
            style: {
              fill: getTextColor(fill)
            }
          }
        });
      });
      // // 初始化边数据
      relations.forEach(function (relation: RelationConfig) {
        const label = relation['r.type.label'],
          binds = relation['r.type.constraints']['r.binds'];
        binds.forEach(function (bind) {
          const { source, target } = bind;
          const edge = {
            source,
            target,
            name: label,
            label,
            data: { ...relation },
          };
          if (source === target) {
            Object.assign(edge, {
              type: 'loop',
              style: {
                endArrow: {
                  path: G6.Arrow.vee(5, 5),
                  d: 0
                },
                startArrow: false,
              }
            });
          }
          edges.push(edge);
        });
      });
      initG6('template');
      initLayout({ nodes, edges });
    }

    return () => {
      graph?.destroy();
      graph = null;
      (window as any).PDB_GRAPH = null;
    }
  }, []);

  return (
    <div className="pdb-graph">
      <div ref={graphRef} className="graph" id="template-graph"></div>
      <div
        className='pdb-object-switch'
        onClick={event => {
          event.stopPropagation();
          navigate(`/${routerParams.id}`);
        }}
      >
        <div className='pdb-object-switch-img'>
          <img
            src={getImagePath('studio/' + userId + '/pdb/' + routerParams?.id + '/screen_shot.png')}
            onError={(event: any) => {
              if (event.target.src !== appDefaultScreenshotPath) {
                event.target.src = appDefaultScreenshotPath;
                event.target.onerror = null;
              }
            }} />
        </div>
        <span className='pdb-object-switch-label'>类型实例</span>
      </div>
    </div>
  );
}