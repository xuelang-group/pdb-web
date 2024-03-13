import G6, { ComboConfig, EdgeConfig, IG6GraphEvent } from '@antv/g6';
import { LoadingOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Checkbox, Modal, notification, Tabs } from 'antd';
import { useResizeDetector } from 'react-resize-detector';

import { convertResultData, covertToGraphData } from '@/utils/objectGraph';
import type { StoreState } from '@/store';
import { getChildren, getRoots, setCommonParams } from '@/actions/object';
import { CustomObjectConfig, Parent, setObjects } from '@/reducers/object';
import { initG6 } from '@/g6';
import { NodeItemData, setCurrentGraphTab, setToolbarConfig, setRelationMap, setRootNode, setCurrentEditModel, setMultiEditModel, EdgeItemData, TypeItemData, setShowSearch } from '@/reducers/editor';
import { G6OperateFunctions } from '@/g6/object/behavior';
import store from '@/store';
import { RelationConfig } from '@/reducers/relation';
import './index.less';
import GraphToolbar from './GraphToolbar';
import { useParams } from 'react-router-dom';
import { isArray } from 'lodash';
import { QueryResultState, setResult } from '@/reducers/query';
import _ from 'lodash';
import { edgeLabelStyle } from '@/g6/type/edge';
import ossOperate from '@/actions/ossOperate';

interface EditorProps {
  theme: string
  getIconList: Function
}

const modalTile: any = {
  'remove': '删除实例'
}
let graph: any;
let graphCopyItem: any;
export default function Editor(props: EditorProps) {
  const graphRef = useRef(null);
  const routerParams = useParams();
  const dispatch = useDispatch();
  const currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel),
    multiEditModel = useSelector((state: StoreState) => state.editor.multiEditModel),
    rootNode = useSelector((state: StoreState) => state.editor.rootNode),
    relations = useSelector((state: StoreState) => state.relation.data),
    queryStatus = useSelector((state: StoreState) => state.query.status),
    queryResult = useSelector((state: StoreState) => state.query.result),
    currentGraphTab = useSelector((state: StoreState) => state.editor.currentGraphTab),
    iconMap = useSelector((state: StoreState) => state.editor.iconMap),
    relationMap = useSelector((state: StoreState) => state.editor.relationMap),
    toolbarConfig = useSelector((state: StoreState) => state.editor.toolbarConfig),
    userId = useSelector((state: StoreState) => state.app.appConfig.userId);
  const [graphData, setGraphData] = useState({}),
    [graphDataMap, setGraphDataMap] = useState<any>({});

  const onResize = useCallback((width: number | undefined, height: number | undefined) => {
    graph && graph.changeSize(width, height);
  }, [graph]);

  useResizeDetector({
    targetRef: graphRef,
    onResize
  });

  useEffect(() => {
    if (!routerParams.id) return;
    const graphId = Number(routerParams.id);
    setCommonParams({ graphId });
    initG6('object');
    getRootsData();

    return () => {
      graph?.destroy();
      graph = null;
      (window as any).PDB_GRAPH = null;
    }
  }, [routerParams?.id]);

  useEffect(() => {
    const relationMap = {};
    relations.forEach((item: RelationConfig) => {
      Object.assign(relationMap, {
        [item['r.type.name']]: { ...item }
      });
    });
    dispatch(setRelationMap(relationMap));
  }, [relations]);

  function getRootsData() {
    getRoots((success: boolean, data: any) => {
      if (success) {
        if (!data || data.length === 0) return;
        const rootData = data[0];
        const rootId = rootData.uid;
        dispatch(setRootNode(rootData));
        props.getIconList((iconMap: any) => {
          getChildren({ uid: rootId }, (success: boolean, data: any) => {
            let newData = [];
            if (success) {
              const relationLines = {};
              newData = data.map((value: any, index: number) => {
                const newValue = JSON.parse(JSON.stringify(value)),
                  parents = newValue['x.parent'],
                  currentParent = parents.filter((val: Parent) => val.uid === rootId)[0];

                delete newValue['~x.parent'];
                delete newValue['~x.parent|x.index'];

                // 获取对象关系列表数据
                if (newValue['x.relation.name']) {
                  const relations: any[] = [];
                  newValue['x.relation.name'].forEach((relation: string) => {
                    if (isArray(newValue[relation])) {
                      newValue[relation].forEach((target: any) => {
                        relations.push({
                          relation,
                          target
                        });
                      });
                    } else {
                      relations.push({
                        relation,
                        target: newValue[relation]
                      });
                    }
                  });
                  Object.assign(relationLines, {
                    [newValue.uid]: relations
                  });
                }

                return {
                  ...newValue,
                  currentParent: {
                    ...currentParent,
                    id: rootId,
                  },
                  'x.id': rootId + '.' + (currentParent['x.parent|x.index'] >= 0 ? currentParent['x.parent|x.index'] : index),
                  id: newValue.uid
                };
              });
              dispatch(setToolbarConfig({ config: { relationLines }, key: 'main' }));
              dispatch(setObjects(newData));
            }

            initLayout(newData, rootId, iconMap);
            initEvent();
          });
        });
      } else {
        notification.error({
          message: '获取根对象失败',
          description: data.message || data.msg
        });
      }
    });
  }

  useEffect(() => {
    const container: any = graphRef.current;
    if (!container || !container.clientWidth || !container.clientHeight || !graph) return;
    graph.changeSize(container.clientWidth, container.clientHeight);
    graph.paint();
  }, [currentEditModel?.id]);

  function initLayout(data: Array<CustomObjectConfig>, rootId: string, iconMap: any) {
    const container: any = graphRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight || 500;
    // const minimap = new G6.Minimap({
    //   size: [150, 100],
    //   type: 'keyShape'
    // }); // 小地图

    // 画布提示框
    const tooltip = new G6.Tooltip({
      offsetX: 10,
      offsetY: 10,
      // 允许出现 tooltip 的 item 类型
      itemTypes: ['edge'],
      // 是否允许 tooltip 出现
      shouldBegin: (e: any) => e.item.get('currentShape') !== 'step-line',
      // 自定义 tooltip 内容
      getContent: (e: any) => {
        const { relationName, id } = e.item.getModel();
        return _.get(relationMap, `${relationName}`, { 'r.type.label': '' })['r.type.label'] || id;
      },
    });
    graph = new G6.Graph({
      container,
      width,
      height,
      modes: {
        default: [
          {
            type: 'brush-select',
            trigger: 'ctrl',
            includeCombos: false,
            includeEdges: false,
            selectOnCombo: true
          } as any,
          {
            type: 'drag-canvas',
            /**
             * enableOptimize设置为 true 时，
             * 在拖拽/缩放过程中，非关键图形（即 G6.registerNode、G6.registerEdge、G6.registerCombo 的 draw 返回的图形）将会被隐藏。
             * 拖拽/缩放结束后，那些临时被隐藏的图形将恢复显示。
             * 这样能够大大提升拖拽/缩放过程中的帧率。
             */
            allowDragOnItem: { combo: true }
          }, // 画布拖拽
          {
            type: 'zoom-canvas',
          }, // 画布缩放
          'collapse-expand',
          {
            type: 'drag-node',
            updateEdge: false,
            enableDelegate: true,
            shouldBegin: function (event: IG6GraphEvent) {
              if (!event.item) return false;
              const model = event.item.get('model');
              return model.parent !== rootNode?.uid;
            },
            shouldEnd: function (event: IG6GraphEvent) {
              return false;
            }
          },
          'drag-enter',
          'graph-select',
          // 'collapse-expand-combo'
          // 'drag-branch',
          // 'activate-relations' // 高亮相邻节点
        ],
        maxData: [
          {
            type: 'drag-canvas',
            enableOptimize: true,
            allowDragOnItem: { combo: true }
          }, // 画布拖拽
          {
            type: 'zoom-canvas',
            enableOptimize: true,
          }, // 画布缩放
          'collapse-expand',
          {
            type: 'drag-node',
            updateEdge: false,
            enableDelegate: true,
            shouldBegin: function (event: IG6GraphEvent) {
              if (!event.item) return false;
              const model = event.item.get('model');
              return model.parent !== rootNode?.uid;
            },
            shouldEnd: function (event: IG6GraphEvent) {
              return false;
            }
          },
          'drag-enter',
          'graph-select'
        ]
        // addNode: [
        //   'drag-canvas', // 画布拖拽
        //   'zoom-canvas', // 画布缩放
        //   'graph-keydown',
        // ]
      },
      defaultCombo: {
        type: 'rect',
        style: {
          lineWidth: 0,
          fill: 'transparent'
        }
      },
      defaultNode: {
        type: 'pbdNode',
        style: {
          lineWidth: 2,
          stroke: '#94BFFF',
          fill: '#E8F3FF'
        },
      },
      nodeStateStyles: {
        // 自定义选中节点样式
        selected: {
          stroke: '#0084FF',
          lineWidth: 2,
        }
      },
      layout: {
        type: 'pbdLayout',
      },
      defaultEdge: {
        type: 'step-line',
        labelCfg: {
          style: edgeLabelStyle(props.theme).default,
        },
      },
      plugins: [tooltip]
      // plugins: [minimap],
      // plugins: [contextMenu]
    });
    (window as any).PDR_GRAPH = graph;
    let graphData: any = {};
    if (data) {
      graphData = covertToGraphData(data, rootId, iconMap, _.get(toolbarConfig[currentGraphTab], 'filterMap.type'));
    }
    graph.data(graphData);
    setGraphData(graphData);
    graph.render();
    graph.zoom(1);
    dispatch(setShowSearch(true));

    (window as any).PDB_GRAPH = graph;
  }

  function initEvent() {
    if (!graph) return
    graph.on('node:mouseenter', (event: { item: any; }) => {
      // hover 高亮
      graph?.setItemState(event.item, 'active', true);
    });

    graph.on('node:mouseleave', (event: { item: any; }) => {
      graph?.setItemState(event.item, 'active', false);
    });

    graph.on('edge:mouseenter', (event: { item: any; }) => {
      // hover 高亮
      graph?.setItemState(event.item, 'active', true);
      event.item.toFront();
    });

    graph.on('edge:mouseleave', (event: { item: any; }) => {
      graph?.setItemState(event.item, 'active', false);
    });

    // 画布监听keydown
    graph.on('keydown', function (event: IG6GraphEvent) {
      if ((event.target as any).tagName !== 'BODY') return;
      const { keyCode, ctrlKey } = event;
      const { currentEditModel } = store.getState().editor;

      switch (keyCode) {
        case 8:
          // DEL键
          if (!currentEditModel) return;
          Modal.confirm({
            className: 'pdb-confirm-modal',
            title: '删除实例',
            icon: <i className="pdb-confirm-icon spicon icon-jinggao1 text-warning"></i>,
            getContainer: () => (document.getElementsByClassName('pdb')[0] || document.body) as any,
            content: rendeRemoveModalContent(currentEditModel),
            okButtonProps: {
              danger: true
            },
            okText: "确定删除",
            cancelText: "取消",
            onOk: handleModalOk,
            onCancel: handleModalCancel
          });
          break;
        // case 9:
        //   // Tab键响应，选中节点时，会向后增加子节点
        //   addChildNode(selectedNode, graph);
        //   break;
        // case 13:
        //   // 回车键，创建兄弟节点
        //   addBrotherNode(selectedNode, graph);
        //   break;
        case 67:
          // ctrl + c
          if (!currentEditModel) return;
          if (ctrlKey) {
            graphCopyItem = JSON.parse(JSON.stringify(currentEditModel));
          }
          break;
        case 86:
          // ctrl + v
          if (ctrlKey && graphCopyItem) {
            if (currentEditModel && (currentEditModel.data.collapsed === undefined || currentEditModel.data.collapsed)) {
              const item = graph.findById(currentEditModel.id);
              G6OperateFunctions.expandNode(item, graph, () => {
                G6OperateFunctions.pasteNode(graphCopyItem, graph, currentEditModel);
              });
            } else {
              G6OperateFunctions.pasteNode(graphCopyItem, graph, currentEditModel);
            }
          }
          break;
        default:
          break;
      }
    });

    graph.on('afterchangedata', function (event: any, data: any) {
      const currentGraphData = graph.save();
      if (JSON.stringify(currentGraphData) !== JSON.stringify(graphData)) {
        setGraphData(currentGraphData);
        setTimeout(() => {
          saveScreenShoot();
        }, 1000);
      }
    });

    graph.on('combo:click', function () {
      const nodes = graph.findAllByState('node', 'selected');
      nodes.forEach((node: any) => graph.setItemState(node, 'selected', false));
      if (currentEditModel) dispatch(setCurrentEditModel(null));
      if (multiEditModel) dispatch(setMultiEditModel(null));
      graph.emit('nodeselectchange', {
        selectedItems: {
          nodes: [],
          edges: [],
          combos: [],
        },
        select: false,
      });
    });

    // 框选节点响应
    graph.on('nodeselectchange', (e: any) => {
      // 当前操作时选中(true)还是取消选中(false)
      if (e.select) {
        // 当前操作后，所有被选中的 items 集合
        const { nodes } = e.selectedItems;
        if (nodes.length !== 1) {
          dispatch(setCurrentEditModel(null));
          dispatch(setMultiEditModel(nodes.map((node: any) => node.getModel())));
        } else {
          const node = nodes[0];
          dispatch(setCurrentEditModel(node.getModel()));
          G6OperateFunctions.selectItem(node, 'node', 'selected', graph);
          dispatch(setMultiEditModel(null));
        }
      } else {
        dispatch(setMultiEditModel(null));
      }
    });
  }

  const [isModalOpen, setModalOpen] = useState(false),
    [modalOperate, setModalOperate] = useState(''),
    [modalLoading, setModalLoading] = useState(false);

  // 弹窗-删除-是否删除子对象
  const [removeAll, setRemoveAll] = useState(true);

  let isUpdateScreenshot = false;
  function saveScreenShoot() {
    if (isUpdateScreenshot) {
      return;
    }
    isUpdateScreenshot = true;
    if (graphRef.current) {
      const id = routerParams.id;
      if (!id) return;
      let shotPath = 'studio/' + userId + '/pdb/graph/' + id + '/screen_shot.png';
      (graphRef.current as any).childNodes[0].toBlob(function (blob: any) {
        ossOperate().upload(shotPath, blob,
          () => { console.log("progress") },
          () => { console.log("error"); isUpdateScreenshot = false; },
          () => { isUpdateScreenshot = false; }
        );
      });
    }
  }

  useEffect(() => {
    if (currentGraphTab !== 'main') {
      updateGraphData(currentGraphTab);
    }
  }, [queryResult[Number(currentGraphTab)]]);

  const updateGraphData = function (activeKey: string) {
    const index = Number(activeKey);
    const data = _.get(queryResult[index], 'data');
    if (!data) return;
    const nodes: NodeItemData[] = [], edges: EdgeConfig[] = [], combos: ComboConfig[] = [], edgeIdMap = {}, relationLines = {};
    convertResultData(data, null, nodes, edges, combos, edgeIdMap, iconMap, relationLines);
    dispatch(setToolbarConfig({
      key: activeKey,
      config: { relationLines }
    }));
    graph.data({ nodes, edges, combos });
    graph.render();
    graph.zoom(1);
  }

  const selectTab = function (activeKey: string) {
    if (currentGraphTab === activeKey) return;
    setGraphDataMap({ ...graphDataMap, [currentGraphTab]: graph.save() });
    if (graphDataMap[activeKey]) {
      graph.data(graphDataMap[activeKey]);
      graph.render();
      graph.zoom(1);
    } else {
      updateGraphData(activeKey);
    }
    dispatch(setCurrentGraphTab(activeKey));
  }

  const handleEditTab = function (targetKey: any) {
    const newQueryResult = JSON.parse(JSON.stringify(queryResult));
    newQueryResult.splice(targetKey, 1);
    dispatch(setResult(newQueryResult));
    dispatch(setCurrentGraphTab('main'));

    graph.data(graphDataMap['main']);
    graph.render();
    graph.zoom(1);
  }

  const handleChangeRemoveAll = function (event: any) {
    setRemoveAll(event.target.checked);
  }

  const rendeRemoveModalContent = function (currentEditModel: NodeItemData | EdgeItemData | TypeItemData) {
    const name = (currentEditModel?.name || '') as string;
    return (
      <>
        <div className='pdb-confirm-info'>是否删除实例：{name}?</div>
        {Boolean(currentEditModel.childLen) &&
          <div className='pdb-confirm-info-checkbox'>
            <Checkbox checked={removeAll} onChange={handleChangeRemoveAll} />
            <span>同时删除该实例的所有下级实例</span>
          </div>
        }
      </>
    )
  }

  const handleModalOk = function () {
    if (!currentEditModel?.id) return;
    if (modalOperate === 'remove') {
      setModalLoading(true);
      G6OperateFunctions.removeNode(currentEditModel?.id, {
        uid: currentEditModel?.uid,
        recurse: removeAll
      }, graph, () => {
        handleModalCancel();
      });
    }
  }

  const handleModalCancel = function () {
    setModalOpen(false);
    setModalOperate('');
    setRemoveAll(true);
    setModalLoading(false);
  }

  return (
    <div className="pdb-graph pdb-object-graph">
      {queryResult.length > 0 &&
        <Tabs
          type="editable-card"
          hideAdd
          activeKey={currentGraphTab}
          items={[
            { key: 'main', label: '主画布', closable: false },
            ...(queryResult.map(({ index, name }: QueryResultState, i: number) => {
              let item = { key: i.toString(), label: `${name} 查询结果` };
              if (_.get(queryStatus[index], 'loading')) {
                Object.assign(item, {
                  icon: <LoadingOutlined spin />
                });
              }
              return item;
            }))
          ]}
          onChange={selectTab}
          onEdit={handleEditTab}
        />
      }
      <div className={"pdb-object-graph-content" + (queryResult.length > 0 ? ' has-tabs' : '')}>
        <GraphToolbar theme={props.theme} />
        <div ref={graphRef} className="graph" id="object-graph"></div>
        <div
          className='pdb-object-template'
          onClick={event => {

          }}
        ></div>
      </div>
      {/* <Modal
        title={modalTile[modalOperate]}
        open={isModalOpen}
        className='pdb-object-modal'
        confirmLoading={modalLoading}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      >
        {renderModalContent(modalOperate)}
      </Modal> */}
    </div>
  );
}