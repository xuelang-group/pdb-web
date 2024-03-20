import G6, { IG6GraphEvent, IShapeBase, Item, Graph, ITEM_TYPE } from '@antv/g6';
import { addChildrenToGraphData, convertAllData } from '../../utils/objectGraph';
import { NodeItemData, setToolbarConfig, setCurrentEditModel, setMultiEditModel } from '@/reducers/editor';
import { CustomObjectConfig, ObjectConfig, Parent, setObjectDetail, setObjects } from '@/reducers/object';
import store from '@/store';
import { addObject, copyObject, deleteObject, getChildren, getObject, moveObject, setObject } from '@/actions/object';
import { message, notification } from 'antd';
import _, { isArray } from 'lodash';

export const G6OperateFunctions = {
  addNode: function (newObject: any, callback: any) {
    let newData: any = { ...newObject };

    addObject([newObject], (success: boolean, response: any) => {
      if (success) {
        Object.assign(newData, { uid: Object.values(response)[0] });
        getObject({ uid: Object.values(response)[0] }, (success: boolean, response: any) => {
          if (success && response && response[0]) {
            newData = response[0];
          }
          callback && callback(newData);
        });
      } else {
        notification.error({
          message: '创建实例失败',
          description: response.message || response.msg
        });
      }
    });
  },
  removeNode: function (nodeId: string, params: any, graph: Graph, callback?: any) {
    const objectState = store.getState().object;
    const { data } = objectState;
    const comboId = nodeId + '-combo';
    const removeIds = {
      [nodeId]: nodeId
    };
    function getRemoveIds(comboId: string) {
      const children = graph.getComboChildren(comboId);
      if (!children) return;
      const { combos, nodes } = children;
      nodes && nodes.forEach(node => {
        const id = node.get('id');
        Object.assign(removeIds, { [id]: id });
      });
      combos && combos.forEach(function (combo) {
        const id = combo.get('id');
        getRemoveIds(id);
      });
    }
    deleteObject(params, (success: boolean, response: any) => {
      if (success) {
        getRemoveIds(comboId);

        const { parent } = graph.findById(nodeId).getModel();

        const _data = JSON.parse(JSON.stringify(data)).filter((val: any) => {
          if (val.id === parent) {
            val['x.children'] = val['x.children'] ? val['x.children'] - 1 : 0;
          }
          return !removeIds.hasOwnProperty(val.id);
        });
        if (response) {
          const rootNode = store.getState().editor.rootNode;
          if (!rootNode) return;
          const rootId = rootNode.uid;
          const children = graph.getComboChildren(`${rootId}-combo`);
          let lastRootNodeIndex = children && children.nodes ? children.nodes.length : 0;
          response.map((item: ObjectConfig) => {
            const newXid = rootId + '.' + lastRootNodeIndex;
            const id = item.uid;
            const newParent = {
              "uid": rootId,
              "x.parent|x.index": lastRootNodeIndex
            };
            const newObject: CustomObjectConfig = {
              ...item,
              currentParent: {
                ...newParent,
                "x.name": rootNode['x.name'],
                id: rootId
              },
              'x.id': newXid,
              id
            }
            _data.push(newObject);
            lastRootNodeIndex++;
          });
        }
        store.dispatch(setObjects(_data));
        store.dispatch(setCurrentEditModel(null));
        const graphData = convertAllData(_data);
        graph.changeData(graphData);
        graph.layout();
      } else {
        notification.error({
          message: '删除实例失败',
          description: response.message || response.msg
        });
      }
      callback && callback()
    });
  },
  expandNode: function (node: Item, graph: Graph, callback?: any) {
    const model = node.get('model'),
      xid = model.xid,
      id = node.get('id');
    const comboId = `${id}-combo`,
      collapsed = false;
    const children = graph.getComboChildren(comboId);
    if (!children || !children.nodes || children.nodes.length === 0) {
      getChildren({ uid: model.uid }, (success: boolean, data: any) => {
        if (success) {
          const { toolbarConfig, currentGraphTab } = store.getState().editor;
          const relationLines = JSON.parse(JSON.stringify(_.get(toolbarConfig[currentGraphTab], 'relationLines', {})));
          const _data = data.map((value: any, index: number) => {
            const newValue = JSON.parse(JSON.stringify(value)),
              currentParent = newValue['x.parent'].filter((val: Parent) => val.uid === model.uid)[0],
              _xid = xid + '.' + (currentParent['x.parent|x.index'] >= 0 ? currentParent['x.parent|x.index'] : index);

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
                id
              },
              'x.id': _xid,
              id: newValue.uid
            }
          });
          store.dispatch(setToolbarConfig({
            key: 'main',
            config: { relationLines }
          }));
          graph.expandCombo(comboId);
          const curentGraphData: any = graph.save();
          const { nodes, edges, combos } = addChildrenToGraphData(model, _data, curentGraphData, _.get(toolbarConfig[currentGraphTab], 'filterMap.type', {}));
          let newData: any[] = [];
          store.getState().object.data.forEach(function (obj: any) {
            if (obj['x.id'] === xid) {
              newData.push({
                ...obj,
                collapsed
              });
              newData = newData.concat(_data);
            } else {
              newData.push(obj);
            }
          });
          store.dispatch(setObjects(newData));
          graph.changeData({
            nodes,
            edges,
            combos
          });
          node.update({
            data: {
              ...model.data,
              collapsed
            }
          });
          callback && callback();
        } else {
          notification.error({
            message: '获取子实例失败：',
            description: data.message || data.msg
          });
        }
      });
    } else {
      store.dispatch(setObjectDetail({ uid: id, options: { collapsed } }));
      graph.expandCombo(comboId);
      node.update({
        data: {
          ...model.data,
          collapsed
        }
      });
      callback && callback();
    }
  },
  moveNode: function (dragItem: Item, dropItem: Item, graph: Graph) {
    const allData = store.getState().object.data;
    const dragItemId = dragItem.get('id'),
      dragItemModel = dragItem.get('model'),
      dragItemXid = dragItemModel.xid,
      dragItemParent = dragItemModel.parent;
    const dropItemId = dropItem.get('id'),
      dropItemModel = dropItem.get('model'),
      dropItemXid = dropItemModel.xid;
    const rootNode = store.getState().editor.rootNode;
    if (!rootNode) return;
    const rootId = rootNode.uid;

    let dragItemParentUid: any, dragItemParentName = '';
    if (dragItemParent === rootId) {
      dragItemParentUid = rootId;
      dragItemParentName = 'root';
    } else {
      let dragItemParentModel = graph.findById(dragItemParent).get('model');
      dragItemParentUid = dragItemParentModel.uid;
      dragItemParentName = dragItemParentModel.name;
    }
    const lastChangeTime = new Date().getTime();

    let dragItems: CustomObjectConfig[] = [];
    let newData: CustomObjectConfig[] = [], sameParentWithDrag = 0, dropItemLastChildrenIndex = -1, modifyIdMaps: any = {};

    let shouldUpdateObject: ObjectConfig[] = [];

    allData.forEach(function (value) {
      const xid = value['x.id'],
        parent = value['currentParent'].id;
      if (!parent) return;
      if (value.id === dragItemId || xid.startsWith(dragItemXid + '.')) {
        dragItems.push({ ...value });
      } else {
        if (parent === dragItemParent) {
          const dragItemIds = dragItemXid.split('.');
          dragItemIds[dragItemIds.length - 1] = sameParentWithDrag;
          const newId = dragItemIds.join('.');
          const obj = JSON.parse(JSON.stringify(value));
          if (newId !== xid) {
            obj['x.parent'] = obj['x.parent'].map((val: Parent) => {
              const { uid } = val;
              if (uid === dragItemParentUid) {
                return {
                  uid,
                  'x.parent|x.index': sameParentWithDrag
                }
              }
              return {
                uid,
                'x.parent|x.index': val['x.parent|x.index']
              }
            });
            Object.assign(obj, {
              'x.id': newId,
              'x.last_change': lastChangeTime,
              currentParent: {
                uid: dragItemParentUid,
                'x.name': dragItemParentName,
                'x.parent|x.index': sameParentWithDrag,
                id: dragItemParent
              }
            });
            Object.assign(modifyIdMaps, {
              [value.id]: {
                new: newId,
                old: xid
              }
            });

            const { currentParent, collapsed, id, ...newObj } = JSON.parse(JSON.stringify(obj));
            delete newObj['x.id'];
            shouldUpdateObject.push(newObj);
          }
          if (value.id === dropItemId) {
            Object.assign(obj, {
              'x.children': Number(value['x.children']) + 1,
              collapsed: false
            });
          } else if (value.id === dragItemParent) {
            Object.assign(obj, {
              'x.children': Number(value['x.children']) - 1
            });
          }
          newData.push(obj);
          sameParentWithDrag++;
        } else {
          if (modifyIdMaps[parent]) {
            const newId = xid.replace(modifyIdMaps[parent].old, modifyIdMaps[parent].new);
            const data = {
              ...value,
              'x.id': newId,
              'x.last_change': lastChangeTime
            };
            if (value.id === dropItemId) {
              Object.assign(data, {
                'x.children': Number(value['x.children']) + 1,
                collapsed: false
              });
            } else if (value.id === dragItemParent) {
              Object.assign(data, {
                'x.children': Number(value['x.children']) - 1
              });
            }
            newData.push(data);
            Object.assign(modifyIdMaps, {
              [value.id]: {
                new: newId,
                old: xid
              }
            });
          } else {
            if (value.id === dropItemId) {
              newData.push({
                ...value,
                'x.children': Number(value['x.children']) + 1,
                collapsed: false
              });
            } else if (value.id === dragItemParent) {
              newData.push({
                ...value,
                'x.children': Number(value['x.children']) - 1
              });
            } else {
              newData.push(value);
            }
          }
        }
      }

      if (value.id === dropItemId || xid.startsWith(dropItemXid + '.') && (xid.split('.').length - 1) === dropItemXid.split('.').length) {
        dropItemLastChildrenIndex++;
      }
    });

    const dragItemNewXid = (modifyIdMaps[dropItemId]?.new || dropItemXid) + '.' + dropItemLastChildrenIndex;

    dragItems = dragItems.map(function (value) {
      if (value.id === dragItemId) {
        value['x.parent'] = value['x.parent'].filter(val => val.uid !== dragItemParentUid);
        const newParent = {
          uid: dropItemModel.uid,
          'x.parent|x.index': dropItemLastChildrenIndex
        }
        value['x.parent'].push(newParent);
        Object.assign(value, {
          currentParent: {
            ...newParent,
            'x.name': dropItemModel.name,
            id: dropItemId
          }
        });

        const { currentParent, collapsed, id, ...newObj } = JSON.parse(JSON.stringify(value));
        delete newObj['x.id'];
        shouldUpdateObject.push(newObj);
      }
      const newItem = {
        ...value,
        'x.id': value['x.id'].replace(dragItemXid, dragItemNewXid),
        'x.last_change': lastChangeTime
      };
      return newItem;
    });

    const handleUpdateObjects = function () {
      if (shouldUpdateObject.length > 0) {
        setObject({ 'set': shouldUpdateObject }, (success: boolean, response: any) => {
          if (!success) {
            notification.error({
              message: '更新实例失败：',
              description: response.message || response.msg
            });
            return;
          }
          const newDropItemXid = (modifyIdMaps[dropItemId]?.new || dropItemXid);
          let dropItemIndex = -1;
          for (let i = newData.length - 1; i >= 0; i--) {
            const value = newData[i];
            if (value['x.id'] === newDropItemXid || value['x.id'].startsWith(newDropItemXid + '.')) {
              dropItemIndex = i;
              break;
            }
          }
          if (dropItemIndex > -1) {
            newData.splice(dropItemIndex + 1, 0, ...dragItems);
          } else {
            newData = newData.concat(dragItems);
          }

          store.dispatch(setObjects(newData));
          const graphData = convertAllData(newData);
          graph.changeData(graphData);
          graph.layout();
        });
      }
    }

    if (dragItemParentUid === dropItemModel.uid) {
      handleUpdateObjects();
      return;
    }
    moveObject({
      uid: dragItemModel.uid,
      src: dragItemParentUid,
      dest: dropItemModel.uid
    }, (success: boolean, response: any) => {
      if (!success) {
        notification.error({
          message: '移动实例失败：',
          description: response.message || response.msg
        });
        return;
      } else {
        handleUpdateObjects();
      }
    });

  },
  selectItem: function (item: Item, type: ITEM_TYPE, state: string, graph: Graph) {
    graph.findAllByState(type, state).forEach((item: any) => {
      graph.setItemState(item, state, false);
    });
    /* 不同状态下节点和边的样式，G6 提供以下状态名的默认样式：active, inactive, selected, highlight, disable。可以通过如下方式修改或者扩展全局状态样式*/
    graph.setItemState(item, state, true);
  },
  unSelectedItem: function (type: ITEM_TYPE, state: string, graph: Graph) {
    graph.findAllByState(type, state).forEach((item: any) => {
      graph.setItemState(item, state, false);
    });
    store.dispatch(setCurrentEditModel(null));
  },
  pasteNode: function (copyItem: NodeItemData, graph: Graph, pasteItem: any) {
    const rootNode = store.getState().editor.rootNode;
    if (!rootNode) return;
    const rootId = rootNode.uid;

    const parentId = pasteItem ? pasteItem.id : rootId;
    const parentName = pasteItem ? pasteItem.name : rootNode['x.name'];
    const parentUid = pasteItem ? pasteItem.uid : rootId;
    const parentXid = pasteItem ? pasteItem.xid : rootId;

    const children = graph.getComboChildren(parentUid + '-combo');
    const childLen = children && children.nodes ? children.nodes.length : 0;
    const newXid = parentXid + '.' + childLen,
      newParent = {
        uid: parentUid,
        'x.parent|x.index': childLen
      };
    copyObject({
      uid: copyItem.uid,
      'x.parent': [newParent],
      recurse: true
    }, (success: boolean, response: any) => {
      if (success) {
        const newObj = {
          ...copyItem.data,
          uid: response.xid,
          id: response.xid,
          "x.id": newXid,
          "x.parent": [newParent],
          currentParent: {
            id: parentId,
            uid: parentUid,
            "x.name": parentName,
            "x.parent|x.index": childLen
          },
          collapsed: true
        };

        if (pasteItem) {
          addNodeChildren(newObj, pasteItem, graph);
        } else {
          addRootNode(newObj, graph);
        }
      } else {
        notification.error({
          message: '复制实例失败',
          description: response.message || response.msg
        });
      }
    });
  }
};

/**
 * 新增兄弟节点
 * @param sourceNode 被操作节点
 * @param graph 
 * @param defaultTypeName 默认类型数据
 * @param prev 是否在节点上方添加，否就在节点下方添加
 */
export function addBrotherNode(sourceNode: Item, graph: Graph, typeData: any = {}, prev = false) {

  const defaultTypeName = _.get(typeData, 'id', ''),
    typeAttrs = _.get(typeData, 'attrs', {}),
    typeMetadata = _.get(typeData, 'metadata', '{}'),
    sourceNodeId = sourceNode.get('id');
  if (!sourceNodeId) return;

  const sourceNodeModel = sourceNode.get('model');
  const sourceNodeXid = sourceNodeModel.xid;
  const sourceNodeIds = sourceNodeXid.split('.');
  const sourceNodeIndex = sourceNodeIds.pop();
  const parentNodeXid = sourceNodeIds.join('.');

  const parentNodeId = sourceNodeModel.parent;
  const parentNode = graph.findById(parentNodeId);
  if (!parentNode) return;
  const parentNodeModel = parentNode.get('model');
  let xIndex = Number(sourceNodeIndex) + 1;
  if (prev) {
    xIndex = Number(sourceNodeIndex);
  }
  const newXid = parentNodeXid + '.' + xIndex;

  const newParent = {
    "uid": parentNodeModel.uid,
    "x.parent|x.index": xIndex,
  };

  G6OperateFunctions.addNode({
    "x.name": parentNodeModel.name + '-' + xIndex,
    "x.parent": [newParent],
    "x.type.name": defaultTypeName,
    "x.metadata": typeMetadata,
    ...typeAttrs
  }, (newData: any) => {
    const newObj = {
      ...newData,
      "x.id": newXid,
      currentParent: {
        ...newParent,
        "x.name": parentNodeModel.name,
        id: parentNodeId
      }
    };

    const objectState = store.getState().object;
    const { data } = objectState;
    const _data: CustomObjectConfig[] = [];

    let hasAdd = false, currentIndex = 0, modifyIdMaps: any = {}, shouldUpdateObject = [];
    let prevIsSource = false;
    for (let i = 0; i < data.length; i++) {
      const obj = data[i],
        xid = obj['x.id'],
        parentId = obj['currentParent'].id;
      if (!parentId) return;
      if (!hasAdd) {
        if (prev) {
          if (xid === sourceNodeXid) {
            _data.push(newObj);
            hasAdd = true;
            currentIndex++;
          }
        } else if (prevIsSource && !xid.startsWith(sourceNodeXid)) {
          _data.push(newObj);
          hasAdd = true;
          currentIndex++;
        }
      }
      prevIsSource = xid.startsWith(sourceNodeXid);

      if (parentId === parentNodeId) {
        const newId = parentNodeXid + '.' + currentIndex;
        if (newId !== xid) {
          const newParent = {
            uid: parentNodeModel.uid,
            'x.parent|x.index': currentIndex
          }
          const newObj = {
            ...obj,
            'x.id': newId,
            currentParent: {
              ...newParent,
              'x.name': parentNodeModel.name,
              id: parentNodeId
            }
          };
          newObj['x.parent'] = newObj['x.parent'].filter(val => val.uid !== parentNodeModel.uid);
          newObj['x.parent'].push(newParent);

          _data.push(newObj);
          Object.assign(modifyIdMaps, {
            [obj.id]: {
              new: newId,
              old: xid
            }
          });

          const { id, collapsed, currentParent, ...newObject } = JSON.parse(JSON.stringify(newObj));
          delete newObject['x.id'];
          shouldUpdateObject.push(newObject);
        } else {
          _data.push(obj);
        }
        currentIndex++;
        continue;
      }

      if (modifyIdMaps[parentId]) {
        const modifyId = modifyIdMaps[parentId];
        const newId = xid.replace(modifyId.old, modifyId.new);
        const newObj = { ...obj, 'x.id': newId };
        _data.push(newObj);
        continue;
      }

      _data.push(obj);
    }
    if (!hasAdd) {
      _data.push(newObj);
    }
    const updateGraph = () => {
      store.dispatch(setObjects(_data));

      const graphData = convertAllData(_data);
      graph.changeData(graphData);
      graph.layout();

      const item = graph.findById(newObj.id);
      if (!item) return;
      graph.emit('node:click', {
        item: item,
        shape: item.get('keyShape')
      });
    }
    if (shouldUpdateObject.length > 0) {
      setObject({ 'set': shouldUpdateObject }, (success: boolean, response: any) => {
        if (success) {
          updateGraph();
        }
      });
    } else {
      updateGraph();
    }
  });
}

// 在节点尾部增加子节点
function addNodeChildren(newObj: CustomObjectConfig, sourceNode: NodeItemData, graph: Graph) {
  const childLen = newObj.currentParent['x.parent|x.index'];
  if (childLen === undefined) return;
  const sourceNodeId = sourceNode.id;
  if (!sourceNodeId) return;

  const sourceNodeXid = sourceNode.xid;

  let prevBrotherXid: any = null;
  if (childLen > 0) {
    prevBrotherXid = sourceNodeXid + '.' + (childLen - 1);
  }
  const objectState = store.getState().object;
  const { data } = objectState;
  const _data = [];

  let hasAdd = false;
  for (let i = data.length - 1; i >= 0; i--) {
    const obj = data[i];
    const parent = obj['currentParent'].id,
      xid = obj['x.id'];

    if (!hasAdd && ((prevBrotherXid && xid.startsWith(prevBrotherXid + '.')) || parent === sourceNodeId || obj['x.id'] === sourceNodeXid)) {
      _data.unshift(newObj);
      hasAdd = true;
    }
    _data.unshift(obj);
  }
  store.dispatch(setObjects(_data));

  const curentGraphData: any = graph.save();
  for (let i = 0; i < curentGraphData.nodes.length; i++) {
    const node = curentGraphData.nodes[i];
    if (node.id === sourceNodeId) {
      Object.assign(node, {
        ...node,
        childLen: Number(node.childLen) + 1,
        data: {
          ...node.data,
          'x.children': Number(node.childLen) + 1,
          collapsed: false
        }
      });
      break;
    }
  }
  const { toolbarConfig, currentGraphTab } = store.getState().editor;
  const { nodes, edges, combos } = addChildrenToGraphData(sourceNode, [newObj], curentGraphData, _.get(toolbarConfig[currentGraphTab], 'filterMap.type', {}));
  graph.changeData({
    nodes,
    edges,
    combos
  });

  graph.layout();
}

// 增加根节点
function addRootNode(newObj: CustomObjectConfig, graph: Graph) {
  const objectState = store.getState().object;
  const rootNode = store.getState().editor.rootNode;
  if (!rootNode) return;
  const rootId = rootNode.uid;

  const _data = JSON.parse(JSON.stringify(objectState.data || []));
  _data.push(newObj);
  store.dispatch(setObjects(_data));

  const curentGraphData: any = graph.save();
  const { nodes, edges, combos } = curentGraphData;

  const { uid, id } = newObj;
  const name = newObj['x.name'];
  const node = {
    uid,
    id,
    xid: newObj['x.id'],
    parent: rootId,
    name: name,
    data: newObj,
    comboId: rootId + '-combo',
    childLen: Number(newObj['x.children'])
  };
  const combo = {
    id: `${id}-combo`,
    parentId: rootId + '-combo',
    collapsed: true
  };
  graph.changeData({
    nodes: [...nodes, node],
    edges,
    combos: [...combos, combo]
  });

  graph.layout();
}

// 新增子节点
function createChildNode(sourceNode: NodeItemData, graph: Graph, typeData: any) {
  const sourceNodeId = sourceNode.id;
  if (!sourceNodeId) return;

  const typeId = _.get(typeData, 'id', ''),
    defaultTypeName = _.get(typeData, 'name', ''),
    typeAttrs = _.get(typeData, 'attrs', {}),
    typeMetadata = _.get(typeData, 'metadata', '{}')

  const sourceNodeXid = sourceNode.xid;

  const children = graph.getComboChildren(sourceNodeId + '-combo');
  const childLen = children && children.nodes ? children.nodes.length : 0;

  const newXid = sourceNodeXid + '.' + childLen;

  const newParent = {
    "uid": sourceNode.uid,
    "x.parent|x.index": childLen,
  };
  G6OperateFunctions.addNode({
    "x.name": defaultTypeName,
    "x.parent": [newParent],
    "x.type.name": typeId,
    "x.metadata": typeMetadata,
    ...typeAttrs
  }, (newData: any) => {
    const parentNode = graph.findById(sourceNodeId),
      parentNodeModel: any = parentNode.getModel();
    parentNode.update({
      childLen: childLen + 1,
      data: {
        ...(parentNodeModel?.data),
        'x.children': childLen + 1,
        collapsed: false
      }
    });
    store.dispatch(setObjectDetail({
      uid: sourceNodeId,
      options: {
        'x.children': childLen + 1,
        collapsed: false
      }
    }));

    const id = newData.uid;
    const newObj = {
      ...newData,
      id,
      "x.id": newXid,
      currentParent: {
        ...newParent,
        "x.name": sourceNode.name,
        id: sourceNodeId
      }
    };

    addNodeChildren(newObj, sourceNode, graph);

    const item = graph.findById(newObj.id);
    if (!item) return;
    graph.emit('node:click', {
      item: item,
      shape: item.get('keyShape')
    });
  });
}

export function addChildNode(sourceNode: Item, graph: Graph, typeData: any = {}) {
  const model = sourceNode.get('model');
  if (!model) return;
  if (Number(model.childLen) > 0 && (model.data.collapsed === undefined || model.data.collapsed)) {
    G6OperateFunctions.expandNode(sourceNode, graph, () => {
      createChildNode(model, graph, typeData);
      graph.layout();
    });
  } else {
    createChildNode(model, graph, typeData);
  }
}

// 新增根节点
export function createRootNode(graph: Graph, typeData: any = {}) {
  const defaultName = _.get(typeData, 'name', ''),
    typeId = _.get(typeData, 'id', ''),
    typeAttrs = _.get(typeData, 'attrs', {}),
    typeMetadata = _.get(typeData, 'metadata', '{}');
  const rootNode = store.getState().editor.rootNode;
  if (!rootNode) return;
  const rootId = rootNode.uid;
  const children = graph.getComboChildren(`${rootId}-combo`);
  const childLen = children && children.nodes ? children.nodes.length : 0;

  const newXid = rootId + '.' + childLen;

  const newParent = {
    "uid": rootId,
    "x.parent|x.index": childLen
  };
  G6OperateFunctions.addNode({
    "x.name": defaultName,
    "x.parent": [newParent],
    "x.type.name": typeId,
    "x.metadata": typeMetadata,
    ...typeAttrs
  }, (newData: any) => {
    const id = newData.uid;
    const newObject = {
      ...newData,
      currentParent: {
        ...newParent,
        "x.name": rootNode['x.name'],
        id: rootId
      },
      'x.id': newXid,
      id
    }
    addRootNode(newObject, graph);

    const item = graph.findById(newObject.id);
    if (!item) return;
    graph.emit('node:click', {
      item: item,
      shape: item.get('keyShape')
    });
    setTimeout(() => {
      graph.focusItem(item, true);
    }, 0);
  })
}

export function insertRootNode(graph: Graph, typeData: any, dropItem: any) {
  const defaultName = _.get(typeData, 'name', ''),
    typeId = _.get(typeData, 'id', ''),
    typeAttrs = _.get(typeData, 'attrs', {}),
    typeMetadata = _.get(typeData, 'metadata', '{}');
  const rootNode = store.getState().editor.rootNode;
  if (!rootNode) return;
  const rootId = rootNode.uid;
  const objectState = store.getState().object;
  const { data } = objectState;
  const dropItemXid = dropItem.getModel().xid,
    dropItemIndex = Number(dropItemXid.replace(rootId + ".", "")),
    newXid = dropItemXid,
    newParent = {
      "uid": rootId,
      "x.parent|x.index": dropItemIndex
    },
    shouldUpdateObject: ObjectConfig[] = [];

  let currentIndex = dropItemIndex, dropItemDataIndex = -1;
  const newObjData = JSON.parse(JSON.stringify(data));
  newObjData.forEach((item: CustomObjectConfig, index: number) => {
    if (dropItemDataIndex === -1 && item['x.id'] === dropItemXid) dropItemDataIndex = index;

    if (item['x.id'].startsWith(rootId + '.' + (currentIndex + 1))) {
      currentIndex += 1;
    }

    if (item['x.id'].startsWith(rootId + '.' + currentIndex)) {
      const newIndex = currentIndex + 1;
      item['x.id'] = item['x.id'].replace(rootId + '.' + currentIndex, rootId + '.' + newIndex);
      if (item.currentParent.uid === rootId) {
        Object.assign(item.currentParent, { 'x.parent|x.index': newIndex });
        Object.assign(item['x.parent'][0], { 'x.parent|x.index': newIndex });
        shouldUpdateObject.push(item);
      }
    }
  });

  G6OperateFunctions.addNode({
    "x.name": defaultName,
    "x.parent": [newParent],
    "x.type.name": typeId,
    "x.metadata": typeMetadata,
    ...typeAttrs
  }, (newData: any) => {
    const id = newData.uid;
    const newObject = {
      ...newData,
      currentParent: {
        ...newParent,
        "x.name": rootNode['x.name'],
        id: rootId
      },
      'x.id': newXid,
      id
    }

    const updateGraphData = function () {
      newObjData.splice(dropItemDataIndex, 0, newObject);
      store.dispatch(setObjects(newObjData));
      const graphData = convertAllData(newObjData);
      graph.changeData(graphData);
      graph.layout();

      const item = graph.findById(newObject.id);
      if (!item) return;
      graph.emit('node:click', {
        item: item,
        shape: item.get('keyShape')
      });
      setTimeout(() => {
        graph.focusItem(item, true);
      }, 0);
    }
    if (shouldUpdateObject && shouldUpdateObject.length > 0) {
      setObject({ 'set': shouldUpdateObject }, (success: boolean, response: any) => {
        if (success) {
          updateGraphData();
        } else {
          notification.error({
            message: '更新实例失败',
            description: response.message || response.msg
          });
        }
      });
    } else {
      updateGraphData();
    }
  });
}

export function dropCanvasAddNode({ id, name, attrs, metadata }: any, dropItem: any, position: string, graph: Graph) {
  if (position === 'top-rect') {
    addBrotherNode(dropItem, graph, { id, attrs, metadata }, true);
  } else if (position === 'node-rect') {
    addChildNode(dropItem, graph, { id, name, attrs, metadata });
  } else if (position === 'left-rect') {
    insertRootNode(graph, { id, name, attrs, metadata }, dropItem);
  } else {
    createRootNode(graph, { id, name, attrs, metadata });
  }
}

export function registerBehavior() {

  // 折叠/展开节点
  G6.registerBehavior('collapse-expand', {
    getEvents: function getEvents() {
      return {
        // 'node:dblclick': 'onCollapsed'
        'collapse-text:click': 'onCollapsed',
        'collapse-shape:click': 'onCollapsed'
      }
    },
    onCollapsed: function onCollapsed(event: IG6GraphEvent) {
      const { item } = event;
      if (!item) return;

      const graph = (this as any).graph;
      const id = item.get('id');
      const model = item.get('model');
      if (!model) return;

      const collapsed = !(model.data.collapsed === undefined ? true : model.data.collapsed);
      if (!(this as any).shouldBegin(event, collapsed, this)) {
        return;
      }
      graph.emit('itemcollapsed', { item, collapsed });
      if (!(this as any).shouldUpdate(event, collapsed, this)) {
        return;
      }



      const comboId = `${id}-combo`;
      item.update({
        data: {
          ...model.data,
          collapsed
        }
      });

      // if (model.isQueryNode) {
      //   collapsed ? graph.collapseCombo(comboId) : graph.expandCombo(comboId);
      //   return;
      // }

      store.dispatch(setObjectDetail({ uid: id, options: { collapsed } }));
      if (collapsed) {
        setTimeout(() => {
          graph.collapseCombo(comboId);
          graph.layout();
        }, 0);
      } else {
        G6OperateFunctions.expandNode(item, graph, () => {
          graph.layout();
        });
      }
    }
  });

  // 拖拽节点
  G6.registerBehavior('drag-enter', {
    getEvents: function getEvents() {
      return {
        'node:dragstart': 'dragstart',
        // 'node:drag': 'drag',
        'node:dragend': 'dragend',
        'node:drop': 'drop',
        'canvas:drop': 'drop',
        // 'node:dragenter': 'dragenter',
        // 'node:dragleave': 'dragleave',
      };
    },
    dragstart: function dragstart(event: IG6GraphEvent) {
      this.dragItem = event.item;
    },
    dragend: function dragend(event: IG6GraphEvent) {
      const dragItem = event.item;
      if (dragItem && this.dropItem && this.dropTarget) {
        const { cfg } = (this.dropTarget as IShapeBase);
        if (!cfg) return;
        (this as any).changeData(dragItem, this.dropItem, cfg.name);
      }
    },
    changeData(dragItem: Item, dropItem: Item, type: string) {
      if (type !== 'top-rect' && type !== 'node-rect' && type !== 'left-rect') return;
      const graph = this.graph as Graph;
      const dragItemId = dragItem.get('id'),
        dragItemModel = dragItem.get('model'),
        dragItemXid = dragItemModel.xid,
        dropItemId = dropItem.get('id'),
        dropItemModel = dropItem.get('model'),
        dropItemXid = dropItemModel.xid;

      if (dragItemId === dropItemId) return;

      // 同树时，不允许父级投入其子级中
      if (dragItemXid.length < dropItemXid.length &&
        dropItemXid.startsWith(dragItemXid + '.')
      ) return;

      const newData: any[] = [];
      const dropItemParentId = dropItemModel.parent;
      const dragItemData = JSON.parse(JSON.stringify(dragItemModel.data));
      const shouldUpdateObject: ObjectConfig[] = [];

      const lastChangeTime = new Date().getTime();
      if (type === 'top-rect' || type === 'left-rect') {
        const rootInfo = store.getState().editor.rootNode,
          rootId = rootInfo?.uid;
        let dragItemParentUid = rootId, dragItemParentModel: any = rootInfo,
          dropItemParentUid = rootId, dropItemParentModel: any = rootInfo;

        if (dragItemModel.parent !== rootId) {
          dragItemParentModel = graph.findById(dragItemModel.parent).get('model');
          dragItemParentUid = dragItemParentModel.uid;
        }
        if (dropItemParentId !== rootId) {
          const dropItemParentModel = graph.findById(dropItemParentId).get('model');
          dropItemParentUid = dropItemParentModel.uid;
        }
        if (dropItemParentId !== rootId && dropItemParentId !== dragItemModel.parent) {
          if (dragItemData['x.parent'].findIndex((val: Parent) => val.uid === dropItemParentUid) > -1) {
            message.warning(`当前${dropItemParentModel.name}对象中存在${dragItemModel.name}对象`);
            return;
          }
        }

        const objectState = store.getState().object;
        const { data } = objectState;
        // 插入某个节点前面
        let currentDropParentChildrenIndex = 0,
          originDragItems: CustomObjectConfig[] = [],
          dragItems = [],
          currentDragParentChildrenIndex = 0;

        data.forEach(function (value) {
          if (value['x.id'] !== dragItemXid && value['x.id'] !== dropItemXid && value['x.id'].startsWith(dragItemXid + '.')) {
            originDragItems.push(value);
          }
        });

        let modifyIdMaps: any = {};
        data.forEach(function (value: any) {
          const new_value = JSON.parse(JSON.stringify(value));
          Object.assign(new_value, {
            'x.last_change': lastChangeTime
          });
          const xid = value['x.id'],
            parentId = value['currentParent'].id;
          if (parentId !== rootId && !graph.findById(parentId)) {
            newData.push(new_value);
            return;
          }
          let parentUid: any = rootId, parentModel: any = rootInfo;
          if (parentId !== rootId) {
            parentModel = graph.findById(parentId).get('model');
            parentUid = parentModel.uid;
          }

          if (xid.startsWith(dragItemXid + '.') || xid === dragItemXid) return;
          if (xid === dropItemXid) {
            // 节点xid等于dropItemXid时，先将dragItem数据推入data
            const dropItemIds = dropItemXid.split('.');
            dropItemIds[dropItemIds.length - 1] = currentDropParentChildrenIndex;
            const newId = dropItemIds.join('.');

            const newParent = {
              uid: parentUid,
              'x.parent|x.index': currentDropParentChildrenIndex,
            };
            dragItemData['x.parent'] = dragItemData['x.parent'].filter((val: Parent) => val.uid !== dragItemData.currentParent.uid);
            dragItemData['x.parent'].push(newParent);
            const obj = {
              ...dragItemData,
              'x.id': newId,
              'currentParent': {
                ...newParent,
                'x.name': parentModel.name,
                id: parentId
              },
              'x.last_change': lastChangeTime
            };
            newData.push(obj);
            const { currentParent, collapsed, id, ...newObj } = JSON.parse(JSON.stringify(obj));
            delete newObj['x.id'];
            shouldUpdateObject.push(newObj);

            dragItems = originDragItems.map(item => {
              const newItem = {
                ...item,
                'x.id': item['x.id'].replace(dragItemXid, newId),
              }
              newData.push(newItem);
            });
            currentDropParentChildrenIndex++;
          }
          if (parentId === dropItemParentId) {
            // drop对象的父级下所有children index 设置
            const dropItemIds = dropItemXid.split('.');
            dropItemIds[dropItemIds.length - 1] = currentDropParentChildrenIndex;
            const newId = dropItemIds.join('.');
            if (xid !== newId) {
              new_value['x.id'] = newId;

              const { currentParent, collapsed, id, ...newObject } = JSON.parse(JSON.stringify(new_value));
              newObject['x.parent'] = newObject['x.parent'].map((val: Parent) => {
                const { uid } = val;
                if (uid === parentUid) {
                  return {
                    uid,
                    'x.parent|x.index': currentDropParentChildrenIndex
                  }
                }
                return {
                  uid,
                  'x.parent|x.index': val['x.parent|x.index']
                };
              });
              delete newObject['x.id'];
              shouldUpdateObject.push(newObject);

              Object.assign(modifyIdMaps, {
                [new_value.uid]: {
                  new: newId,
                  old: xid
                }
              });
            }
            currentDropParentChildrenIndex++;
          } else if (parentId === dragItemModel.parent) {
            // drag对象的父级下所有children index 设置
            const dragItemIds = dragItemXid.split('.');
            dragItemIds[dragItemIds.length - 1] = currentDragParentChildrenIndex;
            const newId = dragItemIds.join('.');
            if (xid !== newId) {
              new_value['x.id'] = newId;
              const { id, collapsed, currentParent, ...newObject } = JSON.parse(JSON.stringify(new_value));
              newObject['x.parent'] = newObject['x.parent'].map((val: Parent) => {
                const { uid } = val;
                if (uid === parentUid) {
                  return {
                    uid,
                    'x.parent|x.index': currentDragParentChildrenIndex
                  }
                }
                return {
                  uid,
                  'x.parent|x.index': val['x.parent|x.index']
                };
              });
              delete newObject['x.id'];
              shouldUpdateObject.push(newObject);

              Object.assign(modifyIdMaps, {
                [new_value.uid]: {
                  new: newId,
                  old: xid
                }
              });
            }
            currentDragParentChildrenIndex++;
          }

          if (modifyIdMaps[parentUid]) {
            const modifyId = modifyIdMaps[parentUid];
            new_value['x.id'] = xid.replace(modifyId.old, modifyId.new);
            Object.assign(modifyIdMaps, {
              [new_value.uid]: {
                new: new_value['x.id'],
                old: xid
              }
            });
          }

          newData.push(new_value);
        });

        const handleUpdateObjects = function () {
          if (shouldUpdateObject.length > 0) {
            setObject({ 'set': shouldUpdateObject }, (success: boolean, response: any) => {
              if (success) {
                store.dispatch(setObjects(newData));
                const graphData = convertAllData(newData);
                graph.changeData(JSON.parse(JSON.stringify(graphData)));
                graph.layout();
              } else {
                notification.error({
                  message: '更新实例失败',
                  description: response.message || response.msg
                });
              }
            });
          }
        }

        if (dragItemParentUid === dropItemParentUid) {
          handleUpdateObjects();
        } else {
          moveObject({
            uid: dragItemModel.uid,
            src: dragItemParentUid,
            dest: dropItemParentUid
          }, (success: boolean, response: any) => {
            if (!success) {
              notification.error({
                message: '移动实例失败',
                description: response.message || response.msg
              });
              return;
            }
            handleUpdateObjects();
          });
        }
      } else if (type === 'node-rect') {
        if (dragItemData['x.parent'].findIndex((val: Parent) => val.uid === dropItemModel.uid) > -1) {
          message.warning(`当前${dropItemModel.name}对象中存在${dragItemModel.name}对象`);
          return;
        }

        if (Number(dropItemModel.childLen) > 0 && (dropItemModel.data.collapsed === undefined || dropItemModel.data.collapsed)) {
          G6OperateFunctions.expandNode(dropItem, (this as any).graph, () => {
            G6OperateFunctions.moveNode(dragItem, dropItem, graph);
          });
        } else {
          G6OperateFunctions.moveNode(dragItem, dropItem, graph);
          graph.expandCombo(dropItemId + '-combo');
        }
      }
    },
    drop: function drop(event: IG6GraphEvent) {
      const { item, target, originalEvent } = event;
      const dropAddType = JSON.parse((originalEvent as any).dataTransfer ? (originalEvent as any).dataTransfer.getData('object_drop_add') : '{}');
      const dropAddTypeId = dropAddType['x.type.name'],
        dropAddTypeMetadata = dropAddType['x.type.metadata'] || '{}';
      if (!dropAddTypeId) {
        this.dropItem = item;
        this.dropTarget = target;
        return;
      }
      const dropAddTypeName = dropAddType['x.type.label'];
      const dropAddTypeAttrs = {};
      (dropAddType['x.type.attrs'] || []).forEach((attr: any) => {
        if (attr.default !== undefined && attr.default !== '') {
          Object.assign(dropAddTypeAttrs, {
            [attr.name]: attr.default
          });
        }
      })
      const graph = this.graph as Graph;
      const { cfg } = (target as IShapeBase);
      dropCanvasAddNode({
        id: dropAddTypeId,
        name: dropAddTypeName,
        attrs: dropAddTypeAttrs,
        metadata: dropAddTypeMetadata
      }, item, cfg.name, graph);
    },
  });

  G6.registerBehavior('graph-select', {
    getEvents: function getEvents() {
      return {
        'node:click': 'nodeSelected',   // 节点选中
        // 'edge:click': 'edgeSelected',
        'canvas:click': 'nodeUnselected',
      };
    },
    nodeSelected: function (event: IG6GraphEvent) {
      const graph = this.graph as Graph;
      if (!graph) return;

      const node = event.item; // 被点击的节点元素
      // const shape = event.target; // 被点击的图形，可根据该信息作出不同响应，以达到局部响应效果
      if (!node) return;
      const model = node.get('model');
      (window as any).PDB_GRAPH = graph;

      if (event.originalEvent) {
        const { ctrlKey, metaKey } = event.originalEvent as any;
        const { currentEditModel, multiEditModel } = store.getState().editor;
        if (ctrlKey || metaKey) {
          // ctrl + 点击节点 多选
          let newMultiEditModel = JSON.parse(JSON.stringify(multiEditModel || []));
          if (currentEditModel) {
            newMultiEditModel.push(currentEditModel);
            store.dispatch(setCurrentEditModel(null));
          }
          if (node.hasState('selected')) {
            // 取消选中
            if (currentEditModel?.id === model.id) store.dispatch(setCurrentEditModel(null));
            newMultiEditModel = newMultiEditModel.filter((item: NodeItemData) => item.id !== model.id);
            graph.setItemState(model.id, 'selected', false);
          } else {
            newMultiEditModel.push(model);
            graph.setItemState(model.id, 'selected', true);
          }
          if (newMultiEditModel.length !== 1) {
            store.dispatch(setMultiEditModel(newMultiEditModel));
          } else {
            store.dispatch(setMultiEditModel(null));
            store.dispatch(setCurrentEditModel(newMultiEditModel[0]));
            graph.setItemState(newMultiEditModel[0].id, 'selected', true);
          }
          return;
        }

        if (currentEditModel?.id === model.id) return;
      }

      store.dispatch(setMultiEditModel(null));
      store.dispatch(setCurrentEditModel(model));
      G6OperateFunctions.selectItem(node, 'node', 'selected', graph);
    },
    edgeSelected: function (event: IG6GraphEvent) {
      const edge = event.item; // 被点击的节点元素
      if (!edge) return;
      const graph = this.graph as Graph;
      if (!graph) return;
      const model = edge.get('model');
      const { currentEditModel } = store.getState().editor;
      if (currentEditModel?.id === model.id) return;
      store.dispatch(setCurrentEditModel(model));

      G6OperateFunctions.selectItem(edge, 'edge', 'selected', graph);
    },
    nodeUnselected: function (event: IG6GraphEvent) {
      const graph = this.graph as Graph;
      if (!graph) return;

      const { currentEditModel, multiEditModel } = store.getState().editor;
      if (currentEditModel) store.dispatch(setCurrentEditModel(null));
      if (multiEditModel) store.dispatch(setMultiEditModel(null));

      // 取消选中高亮
      G6OperateFunctions.unSelectedItem('node', 'selected', graph);
      G6OperateFunctions.unSelectedItem('edge', 'selected', graph);
    }
  });
}