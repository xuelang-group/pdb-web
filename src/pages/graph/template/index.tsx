import G6, { Edge, Item } from '@antv/g6';
import { message } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useEffect, useRef } from 'react';
import { notification } from 'antd';
import { useParams } from 'react-router-dom';
import _ from 'lodash';

import type { StoreState } from '@/store';
import store from '@/store';
import { defaultCircleR, nodeStateStyle } from '@/g6/type/node';
import { G6OperateFunctions } from '@/g6/type/behavior';
import { initG6 } from '@/g6';

import './index.less';
import { RelationConfig } from '@/reducers/relation';
import { fittingString, GLOBAL_FONT_SIZE } from '@/utils/objectGraph';
import { addDisableType, ConnectionState, ConstraintState, setGraphData, setGraphSavedMsg } from '@/reducers/template';
import { getTemplateData, updateTemplateGraph } from '@/actions/template';
import { defaultNodeColor, getBorderColor, getSavedMsg, getTextColor } from '@/utils/common'
import { edgeLabelStyle, edgeStyle } from '@/g6/type/edge';
import { useResizeDetector } from 'react-resize-detector';
import ossOperate from '@/actions/ossOperate';
let graph: any;

interface EditorProps {
  theme: string,
  getIconList: Function
}

export default function Editor(props: EditorProps) {
  const graphRef = useRef(null);
  let sourceAnchorIdx: any = null, highlightNode: any = null;

  const routerParams = useParams();
  const dispatch = useDispatch();
  const currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel),
    disableType = useSelector((state: StoreState) => state.template.disableType),
    graphData = useSelector((state: StoreState) => state.template.graphData),
    userId = useSelector((state: StoreState) => state.app.appConfig.userId);

  let edgeRelation: any = null, edgeCreating = false, startNode: any = null;

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

  let savedTimer: any;
  useEffect(() => {
    if (JSON.stringify(graphData) === '{}') return;
    savedTimer && clearTimeout(savedTimer)
    updateTemplateGraph(graphData, function (success: boolean, response: any) {
      if (!success) {
        notification.error({
          message: '更新模板数据失败：',
          description: response.message || response.msg
        });
        dispatch(setGraphSavedMsg({
          status: 'failed',
          msg: getSavedMsg('failed', new Date().getTime())
        }));
        savedTimer = setTimeout(function () {
          dispatch(setGraphSavedMsg({
            status: 'saved',
            msg: getSavedMsg('saved', new Date(_.get(graphData, 'last_change', '')).getTime())
          }));
        }, 2000);
      } else {
        const timestamp = new Date().getTime();
        dispatch(setGraphSavedMsg({
          status: 'success',
          msg: getSavedMsg('success', timestamp)
        }));
        savedTimer = setTimeout(function () {
          dispatch(setGraphSavedMsg({
            status: 'saved',
            msg: getSavedMsg('saved', timestamp)
          }));
        }, 2000);
        saveScreenShoot();
      }
    });
  }, [graphData]);

  let isUpdateScreenshot = false;
  function saveScreenShoot() {
    if (isUpdateScreenshot) {
      return;
    }
    isUpdateScreenshot = true;
    if (graphRef.current) {
      const tid = routerParams.id;
      if (!tid) return;
      let shotPath = 'studio/' + userId + '/pdb/template/' + tid + '/screen_shot.png';
      (graphRef.current as any).childNodes[0].toBlob(function (blob: any) {
        ossOperate().upload(shotPath, blob,
          () => { console.log("progress") },
          () => { console.log("error"); isUpdateScreenshot = false; },
          () => { isUpdateScreenshot = false; }
        );
      });
    }
  }
  // 初始化画布样式
  function initLayout(data: any, shouldLayout: boolean = false) {
    const container: any = graphRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight || 500;
    let isInitial = true, layout = {};
    if (shouldLayout) {
      Object.assign(layout, {
        type: 'force',
        linkDistance: function (edge: any) {
          const { textWidth } = fittingString(edge.name);
          console.log(edge, textWidth);

          return defaultCircleR * 4 + textWidth;
        },
        preventOverlap: true,
        nodeSize: defaultCircleR * 2,
        nodeSpacing: 10,
        onLayoutEnd: () => {
          if (!isInitial) return;
          isInitial = false;
          console.log('onLayoutEnd')
          const newGraphData = JSON.parse(JSON.stringify(store.getState().template.graphData));
          let hasModified = false;
          Object.keys(newGraphData.processes).forEach(function (nodeId: string) {
            const nodeItem = graph.findById(nodeId);
            const { x, y } = nodeItem.getModel();
            const currentMetadata = newGraphData.processes[nodeId]['metadata'];
            if (currentMetadata.x !== x || currentMetadata.y !== y) {
              Object.assign(newGraphData.processes[nodeId]['metadata'], { x, y });
              hasModified = true;
            }
          });
          if (hasModified) dispatch(setGraphData(newGraphData));
          // graph.destroyLayout();
        }
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
            shouldBegin: e => {
              // cancelHightlight();
              if (e.target.get('name') === 'anchor-point') return false;
              return true;
            }
          }, {
            type: 'create-edge', // 创建边
            trigger: 'drag',
            shouldBegin: (e: any) => {
              const { item } = e;
              if (!edgeRelation || !item.hasState('sourceHightLight')) return false;
              // cancelHightlight();
              if (e.target && e.target.get('name') !== 'anchor-point') return false;
              sourceAnchorIdx = e.target.get('anchorPointIdx');
              clearNodeState('sourceHightLight');
              setNodeState('targetHightLight', 'target', item.getID());
              edgeCreating = true;
              startNode = { id: item.getID(), name: item.getModel().name };
              return true;
            },
            shouldEnd: (e: any) => {
              if (!startNode) return false;
              const { item } = e;
              sourceAnchorIdx = null;
              let shouldCreate = item.hasState('targetHightLight');
              const edges = item.get('edges');
              const relationName = edgeRelation['r.type.name'];
              for (const edge of edges) {
                const { source, target, data } = edge.getModel();
                if (source === startNode.id && target === item.getID() && data['r.type.name'] === relationName) {
                  shouldCreate = false;
                  message.warning(`从${startNode.name}到${item.getModel().name}的 “${edgeRelation['r.type.label']}” 类型关系已创建。`)
                  break;
                }
              }
              clearNodeState('targetHightLight');
              setNodeState('sourceHightLight', 'source');
              startNode = null;
              return shouldCreate;
            }
          },
          // {
          //   type: 'activate-relations-custom', // 高亮相邻节点
          //   trigger: 'click',
          //   shouldUpdate: function (item) {
          //     highlightNode = item;
          //     return true;
          //   }
          // },
          'graph-select',
          'graph-keydown'
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
      linkCenter: true
    });
    (window as any).PDR_GRAPH = graph;
    graph.get('canvas').set('localRefresh', false);
    graph.data(data);
    graph.render();
    graph.zoom(1);

    const edges: any = graph.save().edges;
    G6.Util.processParallelEdges(edges, 20);
    graph.getEdges().forEach((edge: Edge, i: number) => {
      const { source, target } = edge.getModel();
      graph.updateItem(edge, {
        type: source === target ? 'connect-loop' : 'connect-line',
        curveOffset: edges[i].curveOffset,
        curvePosition: edges[i].curvePosition,
      });
    });

    (window as any).PDB_GRAPH = graph;
  }

  // 初始化画布监听事件
  function initEvent() {
    if (!graph) return;
    // 创建边
    graph.on('aftercreateedge', (event: any) => {
      const currentEdge: any = event.edge;
      if (currentEdge && currentEdge.get) {
        const label = edgeRelation['r.type.label'];
        if (currentEdge.get('currentShape') === 'loop') {
          graph.updateItem(currentEdge, {
            label,
            name: label,
            data: edgeRelation,
            type: 'connect-loop',
            style: {
              endArrow: {
                path: G6.Arrow.vee(5, 5),
              },
              startArrow: false
            },
            srcCardinality: 1,
            tgtCardinality: Infinity
          });
        } else {
          graph.updateItem(currentEdge, {
            label,
            name: label,
            data: edgeRelation,
            srcCardinality: 1,
            tgtCardinality: Infinity
          });
        }

        // 添加连线
        const model = currentEdge.get('model');
        const currentGraphData = JSON.parse(JSON.stringify(store.getState().template.graphData));
        const { source, target, data } = model;
        const relationMetadata = JSON.parse(JSON.stringify(data));
        delete relationMetadata['r.type.name'];

        const constraints = JSON.parse(JSON.stringify(data['r.type.constraints']));
        Object.assign(currentGraphData, {
          connections: [
            ...(currentGraphData.connections || []),
            {
              'r.type.name': data['r.type.name'],
              src: { process: source },
              tgt: { process: target },
              metadata: {
                ...edgeRelation,
                'r.type.constraints': {
                  ...constraints,
                  'r.constraints': [{
                    type: 'max_tgt',
                    value: Infinity
                  }]
                }
              }
            }
          ]
        });
        if (JSON.stringify(currentGraphData) !== JSON.stringify(store.getState().template.graphData))
          dispatch(setGraphData(currentGraphData));
      }
      const edges: any = graph.save().edges;
      G6.Util.processParallelEdges(edges, 20);
      graph.getEdges().forEach((edge: Edge, i: number) => {
        const { source, target } = edge.getModel();
        graph.updateItem(edge, {
          type: source === target ? 'connect-loop' : 'connect-line',
          curveOffset: edges[i].curveOffset,
          curvePosition: edges[i].curvePosition,
        });
      });
    });

    // 移入节点
    graph.on('node:mouseenter', (event: any) => {
      // hover 高亮
      graph?.setItemState(event.item, 'showAnchors', true);
    });

    // 移出节点
    graph.on('node:mouseleave', (event: any) => {
      graph.setItemState(event.item, 'showAnchors', false);
    });

    graph.on('edge:mouseenter', (event: any) => {
      const { item } = event;
      graph.setItemState(item, 'hover', true)
    });

    graph.on('edge:mouseleave', (event: any) => {
      const { item } = event;
      graph.setItemState(item, 'hover', false);
    });

    // 拖拽至画布
    graph.on('canvas:drop', function (event: any) {
      event.preventDefault();
      // // cancelHightlight();
      if (edgeCreating) {
        clearNodeState('targetHightLight');
        setNodeState('sourceHightLight', 'source');
        edgeCreating = false;
      }

      const { originalEvent } = event;
      if (originalEvent && (originalEvent as any).dataTransfer && (originalEvent as any).dataTransfer.getData('template_drop_add')) {
        // 模板管理 - 拖拽左侧节点
        const type = JSON.parse((originalEvent as any).dataTransfer.getData('template_drop_add'));
        const name = type['x.type.label'],
          uid = type['x.type.name'],
          metadata = JSON.parse(type['x.type.metadata'] || '{}'),
          fill = _.get(metadata, 'color', defaultNodeColor.fill),
          stroke = getBorderColor(_.get(metadata, 'borderColor'), fill);

        const { x, y } = event;
        const item = graph.addItem('node', {
          x,
          y,
          label: name,
          name: name,
          uid: uid,
          id: uid,
          data: { ...type },
          style: {
            ...nodeStateStyle.default,
            fill,
            stroke
          },
          labelCfg: {
            style: {
              fill: getTextColor(fill)
            }
          }
        }) as Item;
        G6OperateFunctions.selectItem(item.getModel(), graph);

        // 添加节点
        const currentGraphData = JSON.parse(JSON.stringify(store.getState().template.graphData));

        Object.assign(currentGraphData, {
          processes: {
            ...(currentGraphData.processes || {}),
            [uid]: {
              type: uid,
              metadata: {
                ...type,
                x,
                y
              }
            }
          }
        });
        setTimeout(() => {
          if (JSON.stringify(currentGraphData) !== JSON.stringify(store.getState().template.graphData))
            dispatch(setGraphData(currentGraphData));
          dispatch(addDisableType({ ...disableType, [uid]: type }));
        }, 0);
      }
    });

    // 选择边类型
    graph.on('edge:enable', function (relation: RelationConfig | null) {
      edgeRelation = relation;
      clearNodeState('sourceHightLight');
      if (relation) setNodeState('sourceHightLight', 'source');
    });

    // 画布删除节点/边
    graph.on('afterremoveitem', function (nodeInfo: any) {
      const { item, type } = nodeInfo;
      const currentGraphData = JSON.parse(JSON.stringify(store.getState().template.graphData));
      if (type === 'node') {
        if (currentGraphData.processes && currentGraphData.processes[item.uid]) {
          delete currentGraphData.processes[item.uid];
          dispatch(setGraphData(currentGraphData));
        }
      } else if (type === 'edge' && currentGraphData.connections) {
        const { source, target, data } = item;
        let changeGraphData = false;
        currentGraphData.connections = currentGraphData.connections.filter(function (connection: ConnectionState) {
          const { src, tgt } = connection;
          if (src.process === source && tgt.process === target && data['r.type.name'] === connection['r.type.name']) {
            changeGraphData = true;
            return false;
          }
          return true;
        });
        changeGraphData && dispatch(setGraphData(currentGraphData));
      }
    });

    // 拖拽节点
    graph.on('node:dragend', function (nodeInfo: any) {
      const { item } = nodeInfo;
      const { x, y, uid } = item.get('model');
      const newGraphData = JSON.parse(JSON.stringify(store.getState().template.graphData));
      if (newGraphData && newGraphData.processes && newGraphData.processes[uid]) {
        const currentMetadata = newGraphData.processes[uid]['metadata'];
        if (currentMetadata.x !== x || currentMetadata.y !== y) {
          Object.assign(newGraphData.processes[uid]['metadata'], { x, y });
          dispatch(setGraphData(newGraphData));
        }
      }
    });
  }

  const clearNodeState = function (state: string) {
    const nodes = graph.findAllByState('node', state);
    nodes.map((node: any) => node.setState(state, false));
  }

  const setNodeState = function (state: string, key: string, sourceUid?: string) {
    if (edgeRelation) {
      const bind = edgeRelation['r.type.constraints'] ? (edgeRelation['r.type.constraints']['r.binds'] || []) : [];
      bind.map((val: any) => {
        const uid = val[key];
        const item = graph.findById(uid);
        if (item && (key === 'source' || sourceUid === val['source'])) {
          item.setState(state, true);
        }
      });
    }
  }

  useEffect(() => {
    // 初始化画布信息
    let resizeObserver: any;
    if (routerParams && routerParams.id) {
      props.getIconList((iconMap: any) => {
        getTemplateData(Number(routerParams.id), (success: boolean, response: any) => {
          let data = {}, shouldLayout = false;
          if (success) {
            const nodes: any[] = [], edges: any[] = [];
            const disableType: any[] = [];
            // 初始化节点数据
            Object.keys(response.processes || {}).forEach(function (nodeId: string) {
              const { type, metadata } = response.processes[nodeId];
              const { x, y, ...other } = metadata;
              const { text } = fittingString(other['x.type.label'] || '', defaultCircleR * 2),
                _metadata = JSON.parse(other['x.type.metadata'] || '{}'),
                fill = _.get(_metadata, 'color', defaultNodeColor.fill),
                icon = _.get(_metadata, 'icon', ''),
                stroke = getBorderColor(_.get(metadata, 'borderColor'), fill);
              if (!shouldLayout && (x === undefined || y === undefined)) shouldLayout = true;
              nodes.push({
                x,
                y,
                label: text,
                name: other['x.type.label'] || '',
                uid: type,
                id: nodeId,
                icon: iconMap[icon] || icon,
                data: { ...other },
                style: {
                  ...nodeStateStyle.default,
                  fill,
                  stroke
                },
                labelCfg: {
                  style: {
                    fill: getTextColor(fill)
                  }
                }
              });
              Object.assign(disableType, { [type]: { ...other } });
            });
            // 初始化边数据
            (response.connections || []).forEach(function (connection: ConnectionState) {
              const { tgt, src, metadata } = connection;
              const label = metadata['r.type.label'];
              const constraints = metadata['r.constraints'];
              let tgtCardinality = Infinity;
              (constraints || []).forEach((constraint: ConstraintState) => {
                if (constraint.type === 'max_tgt' && tgtCardinality > constraint.value) {
                  tgtCardinality = constraint.value;
                }
              });
              const edge = {
                source: src.process,
                target: tgt.process,
                name: label,
                label,
                data: { ...metadata, 'r.type.name': connection['r.type.name'] },
                srcCardinality: 1,
                tgtCardinality
              };
              if (src.process === tgt.process) {
                Object.assign(edge, {
                  type: 'connect-loop',
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
            Object.assign(data, { nodes, edges });
            dispatch(setGraphData(response));
            dispatch(addDisableType(disableType));
          } else {
            notification.error({
              message: '获取模板数据失败：',
              description: response.message || response.msg
            });
          }
          initG6('template');
          initLayout(data, shouldLayout);
          initEvent();
        });
      });
    }

    return () => {
      graph?.destroy();
      graph = null;
      (window as any).PDB_GRAPH = null;
    }
  }, [routerParams?.id]);

  return (
    <div className="pdb-graph">
      <div ref={graphRef} className="graph" id="template-graph"></div>
    </div>
  );
}