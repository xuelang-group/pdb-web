import G6, { IG6GraphEvent } from '@antv/g6';
import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Checkbox, Modal, notification, Spin, Tabs } from 'antd';
import { useResizeDetector } from 'react-resize-detector';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import _ from 'lodash';

import { addChildrenToGraphData, covertToGraphData, NODE_HEIGHT } from '@/utils/objectGraph';
import type { StoreState } from '@/store';
import store from '@/store';
import { edgeLabelStyle } from '@/g6/edge';
import { G6OperateFunctions, PAGE_SIZE } from '@/g6/behavior';
import { checkOutObject, deleteObjectRelation, getChildren, getRoots, setCommonParams } from '@/actions/object';
import { CustomObjectConfig, ObjectConfig, ObjectRelationInfo, PAGINATION_TYPE, Parent, setObjects } from '@/reducers/object';
import {
  NodeItemData, setToolbarConfig, setRelationMap, setRootNode, setCurrentEditModel, setMultiEditModel, EdgeItemData,
  TypeItemData, setShowSearch, setSearchAround, setGraphLoading, setScreenShootTimestamp, setTypeMap, setGraphDataMap
} from '@/reducers/editor';
import { getImagePath, uploadFile } from '@/actions/minioOperate';
import appDefaultScreenshotPath from '@/assets/images/no_image_xly.png';
import TemplateGraph from '@/pages/graph/template/index';

import './index.less';
import GraphToolbar from './GraphToolbar';

interface EditorProps {
  theme: string
}

let graph: any;
let graphCopyItem: any;
export default function Editor(props: EditorProps) {
  const graphRef = useRef(null),
    routerParams = useParams(),
    location = useLocation(),
    dispatch = useDispatch(),
    navigate = useNavigate();
  const [modal, contextHolder] = Modal.useModal();
  const graphInfo = useSelector((state: StoreState) => state.object.graphData),
    objectData = useSelector((state: StoreState) => state.object.data),
    currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel),
    multiEditModel = useSelector((state: StoreState) => state.editor.multiEditModel),
    graphDataMap = useSelector((state: StoreState) => state.editor.graphDataMap),
    rootNode = useSelector((state: StoreState) => state.editor.rootNode),
    graphLoading = useSelector((state: StoreState) => state.editor.graphLoading),
    currentGraphTab = useSelector((state: StoreState) => state.editor.currentGraphTab),
    relationMap = useSelector((state: StoreState) => state.editor.relationMap),
    toolbarConfig = useSelector((state: StoreState) => state.editor.toolbarConfig),
    userId = useSelector((state: StoreState) => state.app.systemInfo.userId),
    queryParams = useSelector((state: StoreState) => state.query.params),
    pageLoading = useSelector((state: StoreState) => state.app.pageLoading),
    templateScreenShootTimestamp = useSelector((state: StoreState) => state.editor.templateScreenShootTimestamp);
  const [graphData, setGraphData] = useState({});

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
    if (!graphInfo.id) return;
    const graphId = Number(graphInfo.id);
    setCommonParams({ graphId });
    getRootsData();

    return () => {
      graph?.destroy();
      graph = null;
      (window as any).PDB_GRAPH = null;
    }
  }, [graphInfo?.id]);

  function getRootsData() {
    dispatch(setGraphLoading(true));
    getRoots(graphInfo?.id, (success: boolean, data: any) => {
      if (success && data) {
        dispatch(setRootNode(data));
        const rootId = data['x.object.id'];
        getChildren(graphInfo?.id, { 'x.object.id': rootId }, (success: boolean, data: any) => {
          let newData = [];
          if (success) {
            const relationLines = {};
            newData = (data || []).map((value: ObjectConfig, index: number) => {
              // 获取对象关系列表数据
              const relations: any[] = [];
              (value['x.object.version.relations'] || []).forEach((relation: ObjectRelationInfo) => {
                relations.push({
                  relation: relation['r.type.id'],
                  target: {
                    uid: relation['r.object.target.id']
                  },
                  attrValue: relation['r.object.attrvalue']
                });
              });
              Object.assign(relationLines, {
                [value['x.object.id']]: relations
              });

              return {
                ...value,
                'xid': rootId + '.' + index
              };
            });
            dispatch(setToolbarConfig({ config: { relationLines }, key: 'main' }));
            dispatch(setObjects(newData));
            initLayout(newData, rootId);
            initEvent();
          } else {
            notification.error({
              message: '获取对象实例失败',
              description: data.message || data.msg
            });
          }
          dispatch(setGraphLoading(false));
        });
      } else {
        notification.error({
          message: '获取根对象失败',
          description: data.message || data.msg
        });
        dispatch(setGraphLoading(false));
      }
    });
  }

  useEffect(() => {
    const container: any = graphRef.current;
    if (!container || !container.clientWidth || !container.clientHeight || !graph) return;
    graph.changeSize(container.clientWidth, container.clientHeight);
    graph.paint();
  }, [currentEditModel?.id]);

  function initLayout(data: Array<CustomObjectConfig>, rootId: string) {
    const container: any = graphRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight || 500;

    // 画布提示框
    const tooltip = new G6.Tooltip({
      offsetX: 10,
      offsetY: 10,
      // 允许出现 tooltip 的 item 类型
      itemTypes: ['edge', 'node'],
      // 是否允许 tooltip 出现
      shouldBegin: (e: any) => e.item.get('type') === 'edge' && e.item.get('currentShape') !== 'step-line' || e.item.get('currentShape') === 'paginationBtn',
      // 自定义 tooltip 内容
      getContent: (e: any) => {
        const { relationName, id, type, name } = e.item.getModel();
        if (type === 'paginationBtn') {
          return id.endsWith("-next") ? "下一页" : "上一页";
        }
        if (e.item.get('type') === 'edge' && e.item.get('currentShape') !== 'step-line') {
          return _.get(relationMap, `${relationName}`, { 'r.type.name': '' })['r.type.name'] || name || id;
        }
        return "";
      },
    });

    const contextMenu = new G6.Menu({
      getContent(evt: any) {
        const itemType = evt.item.get("type"),
          itemModel = evt.item.getModel();
        if (itemModel.type === "step-line" || itemModel.type === "paginationBtn") return "";

        if (itemType === "node" && (_.get(itemModel.data, 'x.object.version.childs', 0)) > 0 && _.get(itemModel, 'data.collapsed') !== false) {
          return `<ul class="pdb-graph-node-contextmenu">
            <li title="一键展开">一键展开</li>
          </ul>`;
        }

        return '';

        // if (itemType === "edge") {
        // return `<ul class="pdb-graph-node-contextmenu">
        //     <li title="删除"><span>删除</span><span>Del/Backspace</span></li>
        //   </ul>`;
        // }
        // return `<ul class="pdb-graph-node-contextmenu">
        //   <li title="探索">探索</li>
        //   <li title="删除"><span>删除</span><span>Del/Backspace</span></li>
        //   <li title="复制"><span>复制</span><span>Ctrl+c</span></li>
        //   ${!_.isEmpty(graphCopyItem) && graphCopyItem.id !== itemModel.id ?
        //     '<li title="粘贴"><span>粘贴</span><span>Ctrl+v</span></li>' : ""}
        // </ul>`;
      },
      handleMenuClick: (target: any, item) => {
        const itemModel = item.get("model");
        switch (target?.title) {
          case "探索":
            const _searchAround = JSON.parse(JSON.stringify(store.getState().editor.searchAround));
            _searchAround.show = true;
            _searchAround.options.push({ start: [itemModel.data], options: [] });
            dispatch(setSearchAround(_searchAround));
            break;
          case "复制":
            graphCopyItem = JSON.parse(JSON.stringify(itemModel));
            break;
          case "粘贴":
            onPaste(itemModel);
            break;
          case "删除":
            deleteConfirm(itemModel);
            break;
          case "一键展开":
            expandAll(item);
            break;
        }
      },
      offsetX: 10,
      offsetY: 0,
      // 在哪些类型的元素上响应
      itemTypes: ['node', 'edge'],
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
          // {
          //   type: 'drag-node',
          //   updateEdge: false,
          //   enableDelegate: true,
          //   shouldBegin: function (event: IG6GraphEvent) {
          //     if (!event.item) return false;
          //     const model = event.item.get('model');
          //     return model.parent !== rootNode['x.object.id'];
          //   },
          //   shouldEnd: function (event: IG6GraphEvent) {
          //     return false;
          //   }
          // },
          'drag-enter',
          'graph-select',
          'activate-relations-object'// 高亮相邻关系及节点
          // 'collapse-expand-combo'
          // 'drag-branch',
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
              return model.parent !== rootNode['x.object.id'];
            },
            shouldEnd: function (event: IG6GraphEvent) {
              return false;
            }
          },
          'drag-enter',
          'graph-select',
          'activate-relations-object'// 高亮相邻关系及节点
        ]
      },
      defaultCombo: {
        type: 'rect',
        style: {
          lineWidth: 0,
          fill: 'transparent'
        }
      },
      defaultNode: {
        type: 'pdbNode',
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
        loopCfg: {
          position: 'right',
          dist: NODE_HEIGHT,
          clockwise: false
        },
      },
      plugins: [tooltip, contextMenu]
    });
    let graphData: any = {};
    if (data) {
      graphData = covertToGraphData(data, rootId, _.get(toolbarConfig[currentGraphTab], 'filterMap.type'));
    }
    graph.data(JSON.parse(JSON.stringify(graphData)));
    setGraphData(graphData);
    graph.render();
    graph.zoom(1);
    dispatch(setShowSearch(true));

    (window as any).PDB_GRAPH = graph;
    dispatch(setGraphDataMap({
      ...graphDataMap,
      'main': graphData
    }));

    if (queryParams.graphId) {
      const searchIcon = document.getElementById("pdb-explore-search-icon");
      if (searchIcon) {
        searchIcon.click();
      }
    }
  }

  async function fetchChildren(item: NodeItemData, curentGraphData: any, _objectData: any, shouldExpandCombo: any, relationLines: any) {
    await (() => {
      return new Promise(async (resolve: any, reject: any) => {
        const children = graph.getComboChildren(`${item.id}-combo`);
        if (!children || !children.nodes || children.nodes.length === 0) {
          const limit = Number(PAGE_SIZE());
          const itemChildLen = _.get(item.data, 'x.object.version.childs', 0);
          let params = { 'x.object.id': item.id };

          if (limit > 0 && itemChildLen > limit) {
            Object.assign(params, { first: limit, offset: 0 });
          }
          getChildren(graphInfo?.id, params, async (success: boolean, data: any) => {
            if (success) {
              const { toolbarConfig, currentGraphTab } = store.getState().editor;

              const _data: CustomObjectConfig[] = data.map((value: ObjectConfig, index: number) => {
                const _xid = item.data.xid + '.' + index;

                // 获取对象关系列表数据
                const relations: any[] = [];
                (value['x.object.version.relations'] || []).forEach((relation: ObjectRelationInfo) => {
                  relations.push({
                    relation: relation['r.type.id'],
                    target: {
                      uid: relation['r.object.target.id']
                    },
                    attrValue: relation['r.object.attrvalue']
                  });
                });
                Object.assign(relationLines, {
                  [value['x.object.id']]: relations
                });

                return ({
                  ...value,
                  'xid': _xid,
                  collapsed: false
                });
              });

              if (params.hasOwnProperty("offset")) {
                const totalPage = itemChildLen ? Math.ceil(itemChildLen / limit) : 1;
                _data.push({
                  'x.type.id': PAGINATION_TYPE,
                  'x.object.name': '下一页',
                  'x.object.id': 'pagination-' + item.id + `-${Number(PAGE_SIZE())}-next`,
                  'x.object.version.parents': { 'x.object.id': item.id },
                  totalPage,
                });
              }
              const { nodes, edges, combos } = addChildrenToGraphData(item, _data, curentGraphData, _.get(toolbarConfig[currentGraphTab], 'filterMap.type', {}));
              Object.assign(curentGraphData, { nodes, edges, combos });
              let newData: any[] = [];
              _objectData.forEach(function (obj: any) {
                if (obj['xid'] === item.xid) {
                  newData.push({
                    ...obj,
                    collapsed: false
                  });
                  newData = newData.concat(_data);
                } else {
                  newData.push(obj);
                }
              });
              _objectData = JSON.parse(JSON.stringify(newData));
              for (const val of _data) {
                const childrenLen = _.get(val, 'x.object.version.childs', 0);
                if (childrenLen > 0) {
                  await fetchChildren({ id: val['x.object.id'], data: val }, curentGraphData, _objectData, shouldExpandCombo, relationLines);
                }
              }
            } else {
              notification.error({
                message: '获取子实例失败：',
                description: data.message || data.msg
              });
            }
            resolve();
          });
        } else {
          for (const node of curentGraphData.nodes) {
            if (node.id === item.id) {
              Object.assign(node, { data: { ...node.data, collapsed: false } });
              break;
            }
          }
          for (const combo of curentGraphData.combos) {
            if (combo.id === `${item.id}-combo`) {
              Object.assign(combo, { collapsed: false });
              break;
            }
          }

          for (const node of children.nodes) {
            const model = node.get('model');

            if (_.get(model.data, 'x.object.version.childs', 0) > 0) {
              await fetchChildren(model, curentGraphData, _objectData, shouldExpandCombo, relationLines);
            }
          }

          shouldExpandCombo.push(`${item.id}-combo`);


          for (const obj of _objectData) {
            if (obj['xid'].startsWith(item.xid)) {
              Object.assign(obj, { collapsed: false });
              break;
            }
          }
          resolve();
        }
      })
    })();
  }

  async function expandAll(item: any) {
    const graphData = JSON.parse(JSON.stringify(graph.save())),
      _objectData = JSON.parse(JSON.stringify(objectData));
    store.dispatch(setGraphLoading(true));
    const model = item.get("model");
    const shouldExpandCombo: any = [];
    const relationLines = JSON.parse(JSON.stringify(_.get(toolbarConfig[currentGraphTab], 'relationLines', {})));
    await fetchChildren(model, graphData, _objectData, shouldExpandCombo, relationLines);
    store.dispatch(setToolbarConfig({
      key: currentGraphTab,
      config: { relationLines }
    }));
    shouldExpandCombo.forEach(function (comboId: string) {
      graph.expandCombo(comboId);
    });
    graph.changeData(graphData);
    graph.layout();

    item.update({
      data: {
        ...model.data,
        collapsed: false
      }
    });
    graph.expandCombo(`${model.id}-combo`);
    store.dispatch(setObjects(_objectData));
    store.dispatch(setGraphLoading(false));
  }

  let deleteConfirmModal: any = null;
  function deleteConfirm(currentEditModel: any) {
    if (!currentEditModel) return;
    deleteConfirmModal = modal.confirm({
      className: 'pdb-confirm-modal',
      title: '删除实例',
      icon: <i className="pdb-confirm-icon spicon icon-jinggao1 text-warning"></i>,
      getContainer: () => (document.getElementsByClassName('pdb')[0] || document.body) as any,
      content: renderRemoveModalContent(currentEditModel),
      okButtonProps: {
        danger: true
      },
      okText: "确定删除",
      cancelText: "取消",
      onOk: () => handleModalOk(currentEditModel, true),
      onCancel: handleModalCancel
    });
  }


  function onPaste(currentEditModel: any) {
    if (currentEditModel && (currentEditModel.data.collapsed === undefined || currentEditModel.data.collapsed)) {
      const item = graph.findById(currentEditModel.id);
      G6OperateFunctions.expandNode(item, graph, () => {
        G6OperateFunctions.pasteNode(graphCopyItem, graph, currentEditModel);
      });
    } else {
      G6OperateFunctions.pasteNode(graphCopyItem, graph, currentEditModel);
    }
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
        case 46:
          // DEL键
          deleteConfirm(currentEditModel);
          break;
        // case 9:
        //   // Tab键响应，选中节点时，会向后增加子节点
        //   addChildNode(selectedNode, graph);
        //   break;
        // case 13:
        //   // 回车键，创建兄弟节点
        //   addBrotherNode(selectedNode, graph);
        //   break;
        // case 67:
        //   // ctrl + c
        //   if (!currentEditModel) return;
        //   if (ctrlKey) {
        //     graphCopyItem = JSON.parse(JSON.stringify(currentEditModel));
        //   }
        //   break;
        // case 86:
        //   // ctrl + v
        //   if (ctrlKey && currentEditModel && graphCopyItem && graphCopyItem.id !== currentEditModel.id) {
        //     onPaste(currentEditModel);
        //   }
        //   break;
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

  let isUpdateScreenshot = false;
  function saveScreenShoot() {
    if (isUpdateScreenshot) {
      return;
    }
    isUpdateScreenshot = true;
    if (graphRef.current) {
      const id = routerParams.id;
      if (!id) return;
      const { userId } = store.getState().app.systemInfo;
      let shotPath = 'studio/' + userId + '/pdb/' + id + '/screen_shot.png';
      (graphRef.current as any).childNodes[0].toBlob(function (blob: any) {
        if (!blob) return;
        uploadFile(shotPath, blob).finally(() => {
          isUpdateScreenshot = false;
          dispatch(setScreenShootTimestamp(new Date().getTime()));
        }).catch(err => { });
      });
    }
  }

  const handleChangeRemoveAll = function (event: any, currentEditModel: any) {
    deleteConfirmModal && deleteConfirmModal.update({
      onOk: () => handleModalOk(currentEditModel, event.target.checked)
    });
  }

  const renderRemoveModalContent = function (currentEditModel: NodeItemData | EdgeItemData | TypeItemData) {
    const name = (currentEditModel?.name || '') as string;
    return (
      <>
        <div className='pdb-confirm-info'>是否删除实例：{name}?</div>
        {_.get(currentEditModel.data, 'x.object.version.childs', 0) > 0 &&
          <div className='pdb-confirm-info-checkbox'>
            <Checkbox defaultChecked onChange={event => handleChangeRemoveAll(event, currentEditModel)} />
            <span>同时删除该实例的所有下级实例</span>
          </div>
        }
      </>
    )
  }

  const handleModalOk = async function (currentEditModel: any, removeAll: boolean) {
    if (currentEditModel.type === "pdbNode") {
      /**
       * 版本相关，暂不支持
       */
      // const parentId = currentEditModel.data['x.object.version.parents']['x.object.id'];
      // if (parentId && parentId !== rootNode['x.object.id']) {
      //   const parentNode = graph.findById(parentId);
      //   if (parentNode) {
      //     const parentData: ObjectConfig = parentNode.getModel().data;
      //     let isCheckout = false;
      //     if (parentData && parentData['x_version'] && !parentData['x_checkout']) {
      //       await (() => {
      //         return new Promise((resolve) => {
      //           checkOutObject(parentId, (success: boolean, response: any) => {
      //             resolve(null);
      //             if (success) {
      //               isCheckout = true;
      //               graph.updateItem(parentNode, {
      //                 data: {
      //                   ...parentData,
      //                   'x_checkout': true
      //                 }
      //               });
      //             } else {
      //               notification.error({
      //                 message: '删除实例失败',
      //                 description: response.message || response.msg
      //               });
      //             }
      //           });
      //         })
      //       })();
      //       if (!isCheckout) return;
      //     }
      //   }
      // }
      G6OperateFunctions.removeNode(currentEditModel?.id, {
        'x.object.id': currentEditModel?.data['x.object.id'],
        'recurse': removeAll
      }, graph, () => {
        handleModalCancel();
      });
    } else if (_.get(currentEditModel, "source")) {
      const { id, relationName, source, target } = currentEditModel;
      deleteObjectRelation([{
        vid: source,
        [relationName]: [{ vid: target }]
      }], (success: boolean, response: any) => {
        if (success) {
          graph.removeItem(id);
        } else {
          notification.error({
            message: '删除连线失败',
            description: response.message || response.msg
          });
        }
        handleModalCancel();
      });
    }
  }

  const handleModalCancel = function () {
    deleteConfirmModal && deleteConfirmModal.destroy();
    deleteConfirmModal = null;
  }

  return (
    <div className='pdb-object-graph-container'>
      <div className="pdb-graph pdb-object-graph">
        <Spin spinning={graphLoading && !pageLoading}>
          <div className="pdb-object-graph-content">
            <GraphToolbar theme={props.theme} />
            <div ref={graphRef} className="graph" id="object-graph"></div>
            {userId && routerParams?.id &&
              <div
                className='pdb-object-switch'
                onClick={event => {
                  event.stopPropagation();
                  dispatch(setCurrentEditModel(null));
                  navigate(`/${routerParams.id}/template`);
                  if (currentEditModel && graph) {
                    const item = graph.findById(currentEditModel.id);
                    if (item) item.setState("selected", false);
                  }
                }}
              >
                {!location.pathname.endsWith("/template") &&
                  <div className='pdb-object-switch-img'>
                    <img
                      src={getImagePath('studio/' + userId + '/pdb/' + routerParams?.id + '/template_screen_shot.png') + `&t=${templateScreenShootTimestamp}`}
                      onError={(event: any) => {
                        if (event.target.src !== appDefaultScreenshotPath) {
                          event.target.src = appDefaultScreenshotPath;
                          event.target.onerror = null;
                        }
                      }} />
                  </div>
                }
                <span className='pdb-object-switch-label'>类型模板</span>
              </div>
            }
          </div>
        </Spin>
      </div>
      <TemplateGraph theme={props.theme} />
      {contextHolder}
    </div>
  );
}