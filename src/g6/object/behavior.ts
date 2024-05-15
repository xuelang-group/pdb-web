import G6, { IG6GraphEvent, IShapeBase, Item, Graph, ITEM_TYPE, ModelConfig } from '@antv/g6';
import { addChildrenToGraphData, convertAllData, replaceChildrenToGraphData } from '../../utils/objectGraph';
import { NodeItemData, setToolbarConfig, setCurrentEditModel, setMultiEditModel, setGraphLoading } from '@/reducers/editor';
import { CustomObjectConfig, ObjectConfig, Parent, setObjectDetail, setObjects } from '@/reducers/object';
import store from '@/store';
import { addObject, copyObject, deleteObject, getChildren, getObject, moveObject, rearrangeChildren, setObject } from '@/actions/object';
import { message, notification } from 'antd';
import _, { isArray } from 'lodash';
import { nodeStateStyle } from '../type/node';
import { defaultNodeColor, getTextColor } from '@/utils/common';

export const PAGE_SIZE = () => store.getState().editor.toolbarConfig["main"]["pageSize"] || 0;

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
        store.dispatch(setGraphLoading(false));
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

    store.dispatch(setGraphLoading(true));
    deleteObject(params, (success: boolean, response: any) => {
      if (success) {
        getRemoveIds(comboId);

        const deleteModel: any = graph.findById(nodeId).getModel(),
          parentNodeId = deleteModel.parent;

        let newIndex = 0;
        const _data = JSON.parse(JSON.stringify(data)).filter((val: any) => {
          if (val.id === parentNodeId || val.uid === parentNodeId) {
            val['x.children'] = val['x.children'] ? val['x.children'] - 1 : 0;
          }
          const shouldRemove = !removeIds.hasOwnProperty(val.id || val.uid);
          if (val.currentParent.id === parentNodeId && shouldRemove && val['x.id']) {
            const xid = val['x.id'].split(".");
            xid.pop();
            xid.push(newIndex);
            val['x.id'] = xid.join(".");
            newIndex++;
          }
          return shouldRemove;
        });
        if (!_.isEmpty(response)) {
          const rootNode = store.getState().editor.rootNode;
          if (!rootNode) return;
          const rootId = rootNode.uid;
          const children = graph.getComboChildren(`${rootId}-combo`);
          let lastRootNodeIndex = children && children.nodes ? children.nodes.length : 0;
          const shouldUpdateObject: any[] = [];
          if (deleteModel.parent === rootId) {
            if (lastRootNodeIndex > 0) {
              lastRootNodeIndex -= 1;
            }
            // _data.forEach((val: any) => {
            //   if (!val.id.startsWith("pagination-") && val.currentParent.uid === deleteModel.parent &&
            //     val.currentParent['x.parent|x.index'] > deleteModel?.data.currentParent['x.parent|x.index']
            //   ) {
            //     val.currentParent['x.parent|x.index'] -= 1;
            //     val['x.parent'][0]['x.parent|x.index'] -= 1;
            //     shouldUpdateObject.push({
            //       uid: val.uid,
            //       'x.parent': val['x.parent']
            //     });
            //   }
            // });
          }
          response.map((item: ObjectConfig) => {
            const newXid = rootId + '.' + lastRootNodeIndex;
            const id = item.uid;
            const newParent = {
              "uid": rootId,
              "x.parent|x.index": (lastRootNodeIndex + 1) * 1024
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
            shouldUpdateObject.push({
              uid: id,
              "x.parent": [newParent]
            });
            lastRootNodeIndex++;
          });
          if (shouldUpdateObject.length > 0) {
            setObject({ 'set': shouldUpdateObject }, (success: boolean, response: any) => { });
          }
        }
        store.dispatch(setObjects(_data));
        store.dispatch(setCurrentEditModel(null));
        const graphData = convertAllData(_data);
        graph.changeData(graphData);
        graph.layout();

        const parentCombo: any = graph.findById(parentNodeId + "-combo");
        if (parentCombo) {
          const comboLastNodes = parentCombo.getChildren().nodes || [],
            comboLastNode = comboLastNodes.length > 0 ? comboLastNodes[comboLastNodes.length - 1] : null;
          if (comboLastNode && comboLastNode.get("id").startsWith("pagination-" + parentNodeId) && comboLastNode.get("id").endsWith("-next")) {
            const { name, parent, nextDisabled } = comboLastNode.get('model');
            const config = name.split('-'), limit = Number(PAGE_SIZE());
            let offset = Number(config[2]) - limit, _nextDisabled = nextDisabled;
            if (comboLastNodes.length === 2 && comboLastNodes[0].get("id").endsWith("-prev")) {
              offset -= limit;
              _nextDisabled = false;
            }
            G6OperateFunctions.changePagination(graph, { parent, nextDisabled: _nextDisabled }, offset);
          }
        }
      } else {
        notification.error({
          message: '删除实例失败',
          description: response.message || response.msg
        });
      }
      store.dispatch(setGraphLoading(false));
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
      store.dispatch(setGraphLoading(true));
      const limit = Number(PAGE_SIZE());
      let params = { uid: model.uid };

      if (limit > 0 && Number(model.childLen) > limit) {
        Object.assign(params, { first: limit, offset: 0 });
      }
      getChildren(params, (success: boolean, data: any) => {
        if (success) {
          const { toolbarConfig, currentGraphTab } = store.getState().editor;
          const relationLines = JSON.parse(JSON.stringify(_.get(toolbarConfig[currentGraphTab], 'relationLines', {})));
          const _data = data.map((value: any, index: number) => {
            const newValue = JSON.parse(JSON.stringify(value)),
              currentParent = newValue['x.parent'].filter((val: Parent) => val.uid === model.uid)[0],
              _xid = xid + '.' + index;

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
            key: currentGraphTab,
            config: { relationLines }
          }));
          graph.expandCombo(comboId);
          const curentGraphData: any = graph.save();
          if (params.hasOwnProperty("offset")) {
            const totalPage = model.childLen ? Math.ceil(model.childLen / limit) : 1;
            _data.push({
              uid: 'pagination-' + model.uid + `-${Number(PAGE_SIZE())}-next`,
              id: 'pagination-' + model.uid + `-${Number(PAGE_SIZE())}-next`,
              totalPage,
              currentParent: { id }
            });
          }
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
        store.dispatch(setGraphLoading(false));
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

    let dragItemParentUid: any;
    if (dragItemParent === rootId) {
      dragItemParentUid = rootId;
    } else {
      let dragItemParentModel = graph.findById(dragItemParent).get('model');
      dragItemParentUid = dragItemParentModel.uid;
    }

    const lastChangeTime = new Date();

    let dragItems: CustomObjectConfig[] = [];
    let newData: CustomObjectConfig[] = [], sameParentWithDrag = 0, dropItemLastChildrenIndex = -1, modifyIdMaps: any = {}, dropItemLastChildrenXIndex: any = 0;

    let shouldUpdateObject: ObjectConfig[] = [];

    allData.forEach(function (value) {
      const xid = value['x.id'],
        parent = value['currentParent'].id;
      if (!parent) return;
      if (value.id === dragItemId || xid && xid.startsWith(dragItemXid + '.')) {
        dragItems.push({ ...value });
      } else {
        if (parent === dragItemParent) {
          const dragItemIds = dragItemXid.split('.');
          dragItemIds[dragItemIds.length - 1] = sameParentWithDrag;
          const newId = dragItemIds.join('.');
          const obj = JSON.parse(JSON.stringify(value));
          if (newId !== xid) {
            Object.assign(obj, {
              'x.id': newId
            });
            Object.assign(modifyIdMaps, {
              [value.id]: {
                new: newId,
                old: xid
              }
            });
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

      if (value.id === dropItemId || xid && xid.startsWith(dropItemXid + '.') && (xid.split('.').length - 1) === dropItemXid.split('.').length) {
        dropItemLastChildrenIndex++;
        dropItemLastChildrenXIndex = value?.currentParent['x.parent|x.index'];
      }
    });

    const dragItemNewXid = (modifyIdMaps[dropItemId]?.new || dropItemXid) + '.' + dropItemLastChildrenIndex;

    dragItems = dragItems.map(function (value) {
      if (value.id === dragItemId) {
        value['x.parent'] = value['x.parent'].filter(val => val.uid !== dragItemParentUid);
        const newParent = {
          uid: dropItemModel.uid,
          'x.parent|x.index': (Math.floor((dropItemLastChildrenXIndex || 0) / 1024) + 1) * 1024
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
            store.dispatch(setGraphLoading(false));
            return;
          }

          const newDropItemXid = (modifyIdMaps[dropItemId]?.new || dropItemXid);
          let dropItemIndex = -1;
          for (let i = newData.length - 1; i >= 0; i--) {
            const value = newData[i];
            if (value['x.id'] && (value['x.id'] === newDropItemXid || value['x.id'].startsWith(newDropItemXid + '.'))) {
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
          store.dispatch(setGraphLoading(false));

          const limit = Number(PAGE_SIZE());
          const prevParentCombo: any = graph.findById(dragItemParentUid + "-combo");
          if (prevParentCombo) {
            const comboLastNodes = prevParentCombo.getChildren().nodes || [],
              comboLastNode = comboLastNodes.length > 0 ? comboLastNodes[comboLastNodes.length - 1] : null;
            if (comboLastNode && comboLastNode.get("id").startsWith("pagination-" + dragItemParentUid) && comboLastNode.get("id").endsWith("-next")) {
              const { name, parent } = comboLastNode.get('model');
              const config = name.split('-');
              let offset = Number(config[2]) - limit;
              if (comboLastNodes.length === 2 && comboLastNodes[0].get("id").endsWith("-prev")) {
                offset -= limit;
              }
              G6OperateFunctions.changePagination(graph, { parent, nextDisabled: false }, offset);
            }
          }

          const currentParentCombo: any = graph.findById(dropItemId + "-combo");
          if (currentParentCombo) {
            const comboLastNodes = currentParentCombo.getChildren().nodes || [],
              comboLastNode = comboLastNodes.length > 0 ? comboLastNodes[comboLastNodes.length - 1] : null;
            if (comboLastNode) {
              const { name, parent } = comboLastNode.get('model');
              let offset = 0;
              if (comboLastNode.get("id").startsWith("pagination-" + dropItemId) && comboLastNode.get("id").endsWith("-next")) {
                const config = name.split('-');
                offset = Number(config[2]) - limit;
              }
              G6OperateFunctions.changePagination(graph, { parent, nextDisabled: false }, offset);
            }
          }

          const currentEditModel = store.getState().editor.currentEditModel;
          if (currentEditModel && (currentEditModel.uid || currentEditModel.id)) {
            const graphNodeItem = graph.findById((currentEditModel.uid || currentEditModel.id) as string);
            graphNodeItem && store.dispatch(setCurrentEditModel(graphNodeItem.get("model")));
          }
        });
      } else {
        store.dispatch(setGraphLoading(false));
      }
    }
    store.dispatch(setGraphLoading(true));
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
        store.dispatch(setGraphLoading(false));
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
    let childLen = children && children.nodes ? children.nodes.length : 0;
    if (childLen > 0 && children.nodes[0].getID().startsWith("pagination-")) {
      childLen -= 1;
    }
    if (childLen > 0 && children.nodes[childLen - 1].getID().startsWith("pagination-")) {
      childLen -= 1;
    }
    const newXid = parentXid + '.' + childLen,
      newParent = {
        uid: parentUid,
        'x.parent|x.index': (childLen + 1) * 1024,
        'x.children': childLen + 1
      };
    store.dispatch(setGraphLoading(true));
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
            ...newParent,
            id: parentId,
            "x.name": parentName
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
      store.dispatch(setGraphLoading(false));
    });
  },
  changePagination: function (graph: Graph, { parent, nextDisabled }: { parent: string, nextDisabled: boolean }, offset: number) {
    if (nextDisabled) return;
    const params = { uid: parent };

    const limit = Number(PAGE_SIZE()),
      _offset = Number(offset);
    if (_offset >= 0) {
      Object.assign(params, { first: limit, offset: _offset });
    }
    store.dispatch(setGraphLoading(true));
    getChildren(params, (success: boolean, data: any) => {
      if (success) {
        const parentNode = graph.findById(parent),
          parentModel = parentNode.get('model'),
          { id, xid, childLen } = parentModel,
          comboId = `${id}-combo`,
          collapsed = false;
        const { toolbarConfig, currentGraphTab } = store.getState().editor;
        const relationLines = JSON.parse(JSON.stringify(_.get(toolbarConfig[currentGraphTab], 'relationLines', {})));
        let _data: any[] = [];
        if (_offset > 0) {
          _data.push({
            uid: 'pagination-' + parent + `-${_offset - limit}-prev`,
            id: 'pagination-' + parent + `-${_offset - limit}-prev`,
            currentParent: { id }
          });
        }
        _data = _data.concat(data.map((value: any, index: number) => {
          const newValue = JSON.parse(JSON.stringify(value)),
            currentParent = newValue['x.parent'].filter((val: Parent) => val.uid === parent)[0],
            _xid = xid + '.' + index;

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
        }));
        store.dispatch(setToolbarConfig({
          key: 'main',
          config: { relationLines }
        }));
        graph.expandCombo(comboId);
        const curentGraphData: any = graph.save();

        if (_offset >= 0 && childLen > limit) {
          const totalPage = childLen ? Math.ceil(childLen / limit) : 1;
          _data.push({
            uid: 'pagination-' + parent + `-${_offset + limit}-next`,
            id: 'pagination-' + parent + `-${_offset + limit}-next`,
            totalPage,
            nextDisabled: (_offset + data.length) >= childLen,
            currentParent: { id }
          });
        }

        let newData: any[] = [];
        const xidLen = xid.split(".").length + 1;
        let concatIndex = -1, removeMap:any = {}, removeChildren: any[] = [];
        const allData = store.getState().object.data;
        allData.forEach(function (obj: any, index: number) {
          if (obj['x.id'] === xid) {
            newData.push({
              ...obj,
              collapsed
            });
            // newData = newData.concat(_data);
            concatIndex = newData.length;
          }
          if (!obj['x.id'] && !obj.uid.startsWith(`pagination-${id}`) || obj['x.id'] && !obj['x.id'].startsWith(xid)) {
            newData.push(obj);
          } else {
            if (obj['x.id'] && obj['x.id'].startsWith(xid) && obj['x.id'].split(".").length > xidLen) {
              removeChildren.push(obj);
            }
            Object.assign(removeMap, { [obj['x.id']]: obj.collapsed });
          }
        });
        let concatData = [];
        _data = _data.map(item => ({...item, collapsed: removeMap[item['x.id']]}));

        if (removeChildren.length > 0) {
          let newRemoveChildren: any[] = [];
          _data.forEach(function(val) {
            const nodeXid = val['x.id'];
            concatData.push(val);
            if (nodeXid) {
              for (let i = 0; i < removeChildren.length; i++) {
                const item = removeChildren[i];
                const itemXid = item['x.id'];
                if (itemXid && itemXid.startsWith(nodeXid)) {
                  concatData.push(item);
                } else {
                  newRemoveChildren.push(item);
                }
              }
              removeChildren = JSON.parse(JSON.stringify(newRemoveChildren));
              newRemoveChildren = [];
            }
          });
        } else  {
          concatData = _data;
        }

        const { nodes, edges, combos } = replaceChildrenToGraphData(parentModel, _data, curentGraphData, _.get(toolbarConfig[currentGraphTab], 'filterMap.type', {}));
        
        if (concatIndex > -1) {
          newData.splice(concatIndex, 0, ...concatData);
        }
        store.dispatch(setObjects(newData));
        graph.changeData({
          nodes,
          edges,
          combos
        }, false);
        // node.update({
        //   data: {
        //     ...parentModel.data,
        //     collapsed
        //   }
        // });
      } else {
        notification.error({
          message: '获取子实例失败：',
          description: data.message || data.msg
        });
      }
      store.dispatch(setGraphLoading(false));
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

  const sourcePrevNodeItem = graph.find("node", function (item, index) {
    return item.getModel().xid === (parentNodeXid + '.' + (xIndex - 1));
  });
  const sourceNodeXIndex = sourceNodeModel.data.currentParent['x.parent|x.index'];
  const sourcePrevNodeXIndex = sourcePrevNodeItem ? (sourcePrevNodeItem.getModel().data as any).currentParent['x.parent|x.index'] : sourceNodeXIndex - 1;
  const newParentIndex = sourcePrevNodeXIndex + ((sourceNodeXIndex - sourcePrevNodeXIndex) / 2);
  const newParent = {
    "uid": parentNodeModel.uid,
    "x.parent|x.index": newParentIndex,
  };

  store.dispatch(setGraphLoading(true));

  G6OperateFunctions.addNode({
    "x.name": typeData.name,
    "x.parent": [newParent],
    "x.type.name": defaultTypeName,
    "x.metadata": typeMetadata,
    ...typeAttrs
  }, (newData: any) => {
    const childLen = parentNodeModel.data['x.children'];
    parentNode.update({
      childLen: childLen + 1,
      data: {
        ...(parentNodeModel?.data),
        'x.children': childLen + 1,
        collapsed: false
      }
    });
    store.dispatch(setObjectDetail({
      uid: parentNodeId,
      options: {
        'x.children': childLen + 1,
        collapsed: false
      }
    }));

    const updateGraphData = function () {
      const updateGraph = () => {
        store.dispatch(setObjects(_data));

        const graphData = convertAllData(_data);
        graph.changeData(graphData);
        graph.layout();
        store.dispatch(setGraphLoading(false));

        const item = graph.findById(newObj.id);
        if (!item) return;
        graph.emit('node:click', {
          item: item,
          shape: item.get('keyShape')
        });
      }
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

      let hasAdd = false, currentIndex = 0, modifyIdMaps: any = {};
      let prevIsSource: any = false;
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
          } else if (prevIsSource && xid && !xid.startsWith(sourceNodeXid)) {
            _data.push(newObj);
            hasAdd = true;
            currentIndex++;
          }
        }
        prevIsSource = xid && xid.startsWith(sourceNodeXid);

        if (parentId === parentNodeId) {
          const newId = parentNodeXid + '.' + currentIndex;
          if (newId !== xid) {
            const newObj = {
              ...obj,
              'x.id': newId,
            };

            _data.push(newObj);
            Object.assign(modifyIdMaps, {
              [obj.id]: {
                new: newId,
                old: xid
              }
            });
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

      updateGraph();

      const parentCombo: any = graph.findById(parentNodeId + "-combo");
      if (parentCombo) {
        const comboLastNodes = parentCombo.getChildren().nodes || [],
          comboLastNode = comboLastNodes.length > 0 ? comboLastNodes[comboLastNodes.length - 1] : null;
        if (comboLastNode && comboLastNode.get("id").startsWith("pagination-" + parentNodeId) && comboLastNode.get("id").endsWith("-next")) {
          const { name, parent, nextDisabled } = comboLastNode.get('model');
          const config = name.split('-');
          G6OperateFunctions.changePagination(graph, { parent, nextDisabled: false }, config[2]);
        }
      }
    }
    if (Number.isInteger(newParentIndex)) {
      updateGraphData();
    } else {
      rearrangeChildren({ uid: parentNodeModel.uid }, (success: boolean, response: any) => {
        if (success) {
          const parentCombo: any = graph.findById(parentNodeId + "-combo");
          if (parentCombo) {
            const comboLastNodes = parentCombo.getChildren().nodes || [],
              comboLastNode = comboLastNodes.length > 0 ? comboLastNodes[comboLastNodes.length - 1] : null;
            if (comboLastNode && comboLastNode.get("id").startsWith("pagination-" + parentNodeId) && comboLastNode.get("id").endsWith("-next")) {
              const { name, parent } = comboLastNode.get('model');
              const config = name.split('-');
              G6OperateFunctions.changePagination(graph, { parent, nextDisabled: false }, Number(config[2]) - Number(PAGE_SIZE()));
            } else {
              G6OperateFunctions.changePagination(graph, { parent: parentNodeModel.uid, nextDisabled: false }, 0);
            }
          } else {
            G6OperateFunctions.changePagination(graph, { parent: parentNodeModel.uid, nextDisabled: false }, 0);
          }
        } else {
          updateGraphData();
        }
      });
    }
  });
}

// 在节点尾部增加子节点
function addNodeChildren(newObj: CustomObjectConfig, sourceNode: NodeItemData, graph: Graph) {
  const childLen = newObj.currentParent['x.children'];
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

    if (!hasAdd && xid && ((prevBrotherXid && xid.startsWith(prevBrotherXid + '.')) || parent === sourceNodeId || obj['x.id'] === sourceNodeXid)) {
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
      const childLen = Number(node.childLen) + 1;
      Object.assign(node, {
        ...node,
        childLen: childLen,
        data: {
          ...node.data,
          'x.children': childLen,
          collapsed: false
        }
      });
      store.dispatch(setObjectDetail({
        uid: sourceNodeId,
        options: {
          'x.children': childLen,
          collapsed: false
        }
      }));
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

  const sourceNodeCombo: any = graph.findById(sourceNodeId + "-combo"), limit = Number(PAGE_SIZE());
  if (sourceNodeCombo) {
    const comboLastNodes = sourceNodeCombo.getChildren().nodes || [],
      comboLastNode = comboLastNodes.length > 0 ? comboLastNodes[comboLastNodes.length - 1] : null;
    if (comboLastNode) {
      let offset = 0;
      const { name, parent } = comboLastNode.get('model');
      if (comboLastNode.get("id").startsWith("pagination-" + sourceNodeId) && comboLastNode.get("id").endsWith("-next")) {
        const config = name.split('-');
        offset = Number(config[2]) - limit;
      }
      G6OperateFunctions.changePagination(graph, { parent, nextDisabled: false }, offset);
    }
  }
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

  const { uid, id, } = newObj;
  const name = newObj['x.name'],
    metadata = JSON.parse(newObj['x.metadata'] || '{}'),
    fill = _.get(metadata, 'color', defaultNodeColor.fill),
    iconKey = _.get(metadata, 'icon', '');
  const node = {
    uid,
    id,
    xid: newObj['x.id'],
    parent: rootId,
    name: name,
    data: newObj,
    comboId: rootId + '-combo',
    childLen: Number(newObj['x.children']),
    icon: iconKey,
    style: {
      ...nodeStateStyle.default,
      fill
    },
    labelCfg: {
      style: {
        fill: getTextColor(fill)
      }
    }
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

  const childLen = sourceNode.data['x.children'];

  const newXid = sourceNodeXid + '.' + childLen;

  const newParent = {
    "uid": sourceNode.uid,
    "x.parent|x.index": (childLen + 1) * 1024,
    "x.children": childLen + 1
  };
  store.dispatch(setGraphLoading(true));
  G6OperateFunctions.addNode({
    "x.name": defaultTypeName,
    "x.parent": [newParent],
    "x.type.name": typeId,
    "x.metadata": typeMetadata,
    ...typeAttrs
  }, (newData: any) => {
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
    store.dispatch(setGraphLoading(false));

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
  let childLen = children && children.nodes ? children.nodes.length : 0;
  if (childLen > 0 && children.nodes[0].getID().startsWith("pagination-")) {
    childLen -= 1;
  }
  if (childLen > 0 && children.nodes[childLen - 1].getID().startsWith("pagination-")) {
    childLen -= 1;
  }

  const newXid = rootId + '.' + childLen;

  const newParent = {
    "uid": rootId,
    "x.parent|x.index": (childLen + 1) * 1024
  };
  store.dispatch(setGraphLoading(true));
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
    };
    addRootNode(newObject, graph);
    store.dispatch(setGraphLoading(false));

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
  const dropItemModel = dropItem.getModel(),
    dropItemXid = dropItemModel.xid,
    dropItemIndex = Number(dropItemXid.replace(rootId + ".", "")),
    newXid = dropItemXid,
    newParent = {
      "uid": rootId,
      // "x.parent|x.index": dropItemIndex
    };

  const dropPrevItemXid = dropItemIndex > 1 ? (rootId + "." + (dropItemIndex - 1)) : "";
  let currentIndex = dropItemIndex, dropItemDataIndex = -1;
  const newObjData = JSON.parse(JSON.stringify(data));
  let newParentIndex: any;
  newObjData.forEach((item: CustomObjectConfig, index: number) => {

    if (item['x.id'] === dropPrevItemXid) {
      const dropPrevItemXindex: number = Number(item.currentParent['x.parent|x.index']);
      newParentIndex = dropPrevItemXindex + (Number(dropItemModel.data.currentParent['x.parent|x.index']) - dropPrevItemXindex) / 2;
      Object.assign(newParent, {
        "x.parent|x.index": newParentIndex
      });
    } else if (dropItemIndex === 0 && index === 0) {
      newParentIndex = Number(dropItemModel.data.currentParent['x.parent|x.index']) / 2;
      Object.assign(newParent, {
        "x.parent|x.index": newParentIndex
      });
    }

    if (dropItemDataIndex === -1 && item['x.id'] === dropItemXid) dropItemDataIndex = index;

    if (item['x.id'] && item['x.id'].startsWith(rootId + '.' + (currentIndex + 1))) {
      currentIndex += 1;
    }

    if (item['x.id'] && item['x.id'].startsWith(rootId + '.' + currentIndex)) {
      const newIndex = currentIndex + 1;
      item['x.id'] = item['x.id'].replace(rootId + '.' + currentIndex, rootId + '.' + newIndex);
    }
  });

  store.dispatch(setGraphLoading(true));
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
      store.dispatch(setGraphLoading(false));

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
    if (Number.isInteger(newParentIndex)) {
      updateGraphData();
    } else {
      const parentUid = newParent.uid;

      rearrangeChildren({ uid: parentUid }, (success: boolean, response: any) => {
        if (success) {
          getChildren({ uid: parentUid }, (success: boolean, data: any) => {
            if (success) {

              const { toolbarConfig, currentGraphTab } = store.getState().editor;
              const relationLines = JSON.parse(JSON.stringify(_.get(toolbarConfig[currentGraphTab], 'relationLines', {})));
              let _data: any[] = [];

              _data = _data.concat(data.map((value: any, index: number) => {
                const newValue = JSON.parse(JSON.stringify(value)),
                  parents = newValue['x.parent'],
                  currentParent = parents.filter((val: Parent) => val.uid === rootId)[0];

                delete newValue['~x.parent'];
                delete newValue['~x.parent|x.index'];

                // 获取对象关系列表数据
                if (newValue['x.relation.name']) {
                  const relations: any[] = [];
                  newValue['x.relation.name'].forEach((relation: string) => {
                    if (_.isArray(newValue[relation])) {
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
                  'x.id': rootId + '.' + index,
                  id: newValue.uid
                };
              }));

              store.dispatch(setToolbarConfig({
                key: 'main',
                config: { relationLines }
              }));
              const curentGraphData: any = graph.save();

              const { nodes, edges, combos } = replaceChildrenToGraphData({ id: parentUid, xid: parentUid }, _data, curentGraphData, _.get(toolbarConfig[currentGraphTab], 'filterMap.type', {}));
              let newData: any[] = _data;

              store.getState().object.data.forEach(function (obj: any) {
                if (!obj['x.id'] || obj['x.id'].split(".").length > 2) {
                  newData.push(obj);
                }
              });
              store.dispatch(setObjects(newData));
              graph.changeData({
                nodes,
                edges,
                combos
              }, false);
            } else {
              notification.error({
                message: '获取子实例失败：',
                description: data.message || data.msg
              });
            }
            store.dispatch(setGraphLoading(false));
          });
        } else {
          updateGraphData();
        }
      });
    }
  });
}

export function dropCanvasAddNode({ id, name, attrs, metadata }: any, dropItem: any, position: string, graph: Graph) {
  if (position === 'top-rect') {
    addBrotherNode(dropItem, graph, { id, attrs, metadata, name }, true);
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

      const lastChangeTime = new Date();
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
          if (value['x.id'] && value['x.id'] !== dragItemXid && value['x.id'] !== dropItemXid && value['x.id'].startsWith(dragItemXid + '.')) {
            originDragItems.push(value);
          }
        });

        let modifyIdMaps: any = {};
        data.forEach(function (value: any) {
          const new_value = JSON.parse(JSON.stringify(value));
          Object.assign(new_value, {
            'x.last_change': lastChangeTime
          });
          if (value.uid === dragItemParentUid) {
            Object.assign(new_value, {
              "x.children": new_value["x.children"] - 1
            });
          } else if (value.uid === dropItemParentUid) {
            Object.assign(new_value, {
              "x.children": new_value["x.children"] + 1
            });
          }
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

          if (!xid) {
            newData.push(new_value);
            return;
          }
          if (xid.startsWith(dragItemXid + '.') || xid === dragItemXid) return;
          if (xid === dropItemXid) {
            // 节点xid等于dropItemXid时，先将dragItem数据推入data
            const dropItemIds = dropItemXid.split('.');
            dropItemIds[dropItemIds.length - 1] = currentDropParentChildrenIndex;
            const newId = dropItemIds.join('.');

            const ids = JSON.parse(JSON.stringify(dropItemIds)),
              lastIndex = Number(ids.pop());
            ids.push(lastIndex - 1);
            const dropPrevXid = ids.join(".");
            const dropPrevNodeItem = graph.find("node", function (item, index) {
              return item.getModel().xid === dropPrevXid;
            });
            const droNodeXIndex = dropItemModel.data.currentParent['x.parent|x.index'];
            const dropPrevNodeXIndex = dropPrevNodeItem ? (dropPrevNodeItem.getModel().data as any).currentParent['x.parent|x.index'] : droNodeXIndex - 1;
            const newParent = {
              uid: parentUid,
              'x.parent|x.index': dropPrevNodeXIndex + ((droNodeXIndex - dropPrevNodeXIndex) / 2),
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

                const currentEditModel = store.getState().editor.currentEditModel;
                if (currentEditModel && (currentEditModel.uid || currentEditModel.id)) {
                  const graphNodeItem = graph.findById((currentEditModel.uid || currentEditModel.id) as string);
                  graphNodeItem && store.dispatch(setCurrentEditModel(graphNodeItem.get("model")));
                }

                const limit = Number(PAGE_SIZE());
                if (dragItemParentUid !== dropItemParentUid) {
                  const prevParentCombo: any = graph.findById(dragItemParentUid + "-combo");
                  if (prevParentCombo) {
                    const comboLastNodes = prevParentCombo.getChildren().nodes || [],
                      comboLastNode = comboLastNodes.length > 0 ? comboLastNodes[comboLastNodes.length - 1] : null;
                    if (comboLastNode && comboLastNode.get("id").startsWith("pagination-" + dragItemParentUid) && comboLastNode.get("id").endsWith("-next")) {
                      const { name, parent } = comboLastNode.get('model');
                      const config = name.split('-');
                      let offset = Number(config[2]) - limit;
                      if (comboLastNodes.length === 2 && comboLastNodes[0].get("id").endsWith("-prev")) {
                        offset -= limit;
                      }
                      G6OperateFunctions.changePagination(graph, { parent, nextDisabled: false }, offset);
                    }
                  }

                  const currentParentCombo: any = graph.findById(dropItemParentUid + "-combo");
                  if (currentParentCombo && dropItemParentUid !== rootId) {
                    const comboLastNodes = currentParentCombo.getChildren().nodes || [],
                      comboLastNode = comboLastNodes.length > 0 ? comboLastNodes[comboLastNodes.length - 1] : null;
                    if (comboLastNode) {
                      const { name, parent } = comboLastNode.get('model');
                      let offset = 0;
                      if (comboLastNode.get("id").startsWith("pagination-" + dropItemParentUid) && comboLastNode.get("id").endsWith("-next")) {
                        const config = name.split('-');
                        offset = Number(config[2]) - limit;
                      }
                      G6OperateFunctions.changePagination(graph, { parent, nextDisabled: false }, offset);
                    }
                  }
                }
              } else {
                notification.error({
                  message: '更新实例失败',
                  description: response.message || response.msg
                });
              }
              store.dispatch(setGraphLoading(false));
            });
          } else {
            store.dispatch(setGraphLoading(false));
          }
        }

        store.dispatch(setGraphLoading(true));
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
              store.dispatch(setGraphLoading(false));
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
        'edge:click': 'edgeSelected',
        'canvas:click': 'nodeUnselected',
      };
    },
    nodeSelected: function (event: IG6GraphEvent) {
      const graph = this.graph as Graph;
      if (!graph) return;

      const node = event.item; // 被点击的节点元素
      // const shape = event.target; // 被点击的图形，可根据该信息作出不同响应，以达到局部响应效果
      if (!node) return;
      const model = node.get('model'),
        nodeType = model.type;
      if (nodeType === "paginationBtn") {
        const { name, parent, nextDisabled } = node.get('model');
        if (nextDisabled) return;
        const config = name.split('-'),
          params = { uid: parent };

        const limit = Number(PAGE_SIZE());
        Object.assign(params, { first: limit, offset: config[2] });
        G6OperateFunctions.changePagination(graph, { parent, nextDisabled }, config[2]);
        return;
      }
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

      graph.findAllByState('edge', 'selected').forEach((item: any) => {
        graph.setItemState(item, 'selected', false);
      });
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
      store.dispatch(setMultiEditModel(null));
      store.dispatch(setCurrentEditModel(model));

      graph.findAllByState('node', 'selected').forEach((item: any) => {
        graph.setItemState(item, 'selected', false);
      });
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