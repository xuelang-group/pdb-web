import G6, { IG6GraphEvent, IShapeBase, Item, Graph, ITEM_TYPE, ModelConfig, G6Event, INode } from '@antv/g6';
import { addChildrenToGraphData, convertAllData, replaceChildrenToGraphData } from '../../utils/objectGraph';
import { NodeItemData, setToolbarConfig, setCurrentEditModel, setMultiEditModel, setGraphLoading } from '@/reducers/editor';
import { CustomObjectConfig, ObjectConfig, ObjectParentInfo, ObjectRelationInfo, Parent, setObjectDetail, setObjects } from '@/reducers/object';
import store from '@/store';
import { addObject, checkOutObject, copyObject, deleteObject, getChildren, moveObject, rearrangeChildren, setObject } from '@/actions/object';
import { message, notification } from 'antd';
import _, { isArray } from 'lodash';
import { nodeStateStyle } from '../type/node';
import { defaultNodeColor, getTextColor } from '@/utils/common';
import { TypeConfig } from '@/reducers/type';

export const PAGE_SIZE = () => store.getState().editor.toolbarConfig["main"]["pageSize"] || 0;

export const G6OperateFunctions = {
  addNode: function (newObject: any, callback: any) {
    const graphId = store.getState().object.graphData.id;
    addObject(graphId, [newObject], (success: boolean, response: any) => {
      if (success) {
        callback(response[0]);
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
    const graphData = store.getState().object.graphData;
    deleteObject(graphData?.id, params, (success: boolean, response: any) => {
      if (success) {
        getRemoveIds(comboId);

        const deleteModel: any = graph.findById(nodeId).getModel(),
          parentNodeId = deleteModel.parent;

        let newIndex = 0;
        const _data = JSON.parse(JSON.stringify(data)).filter((val: CustomObjectConfig) => {
          if (val['x.object.id'] === parentNodeId) {
            val['x.object.version.childs'] = val['x.object.version.childs'] ? val['x.object.version.childs'] - 1 : 0;
          }
          const shouldRemove = !removeIds.hasOwnProperty(val['x.object.id']);
          if ((val['x.object.version.parents'] || {})['x.object.id'] === parentNodeId && shouldRemove && val['xid']) {
            const xid = val['xid'].split(".");
            xid.pop();
            xid.push(newIndex.toString());
            val['xid'] = xid.join(".");
            newIndex++;
          }
          return shouldRemove;
        });
        /**
         * 暂不确定，联调时修改
         */
        // if (!_.isEmpty(response)) {
        //   const rootNode = store.getState().editor.rootNode;
        //   const rootId = rootNode['x.object.id'];
        //   const children = graph.getComboChildren(`${rootId}-combo`);
        //   let lastRootNodeIndex = children && children.nodes ? children.nodes.length : 0;
        //   const shouldUpdateObject: any[] = [];
        //   if (deleteModel.parent === rootId) {
        //     if (lastRootNodeIndex > 0) {
        //       lastRootNodeIndex -= 1;
        //     }
        //   }
        //   response.map((item: ObjectConfig) => {
        //     const newXid = rootId + '.' + lastRootNodeIndex;
        //     const id = item.uid;
        //     const newParent = {
        //       "uid": rootId,
        //       "x_index": (lastRootNodeIndex + 1) * 1024
        //     };
        //     const newObject: CustomObjectConfig = {
        //       ...item,
        //       'xid': newXid,
        //     }
        //     _data.push(newObject);
        //     shouldUpdateObject.push({
        //       "vid": id,
        //       "e_x_parent": [{
        //         "vid": newParent['uid'],
        //         "x_index": newParent['x_index']
        //       }]
        //     });
        //     lastRootNodeIndex++;
        //   });
        //   if (shouldUpdateObject.length > 0) {
        //     setObject({ 'set': shouldUpdateObject }, (success: boolean, response: any) => { });
        //   }
        // }

        let shouldUpdate = true;
        const graphData = convertAllData(_data);
        const parentCombo: any = graph.findById(parentNodeId + "-combo");
        if (parentCombo) {
          const comboLastNodes = parentCombo.getChildren().nodes || [],
            comboLastNode = comboLastNodes.length > 0 ? comboLastNodes[comboLastNodes.length - 1] : null;
          if (comboLastNode && comboLastNode.get("id").startsWith("pagination-" + parentNodeId) && comboLastNode.get("id").endsWith("-next")) {
            const { name, parent, nextDisabled } = comboLastNode.get('model');
            const config = name.split('-'), limit = Number(PAGE_SIZE());
            let offset = Number(config[2]) - limit, _nextDisabled = nextDisabled;
            if (comboLastNodes.length <= 3 && comboLastNodes[0].get("id").endsWith("-prev")) {
              offset -= limit;
              _nextDisabled = false;
            }
            G6OperateFunctions.changePagination(graph, { parent, nextDisabled: _nextDisabled }, offset, graphData, _data);
            shouldUpdate = false;
          }
        }
        store.dispatch(setCurrentEditModel(null));
        store.dispatch(setGraphLoading(false));
        if (shouldUpdate) {
          store.dispatch(setObjects(_data));
          graph.changeData(graphData);
          graph.layout();
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
    const model: NodeItemData = node.get('model'),
      modelChildLen = model.data['x.object.version.childs'],
      xid = model.xid;
    const comboId = `${model.id}-combo`,
      collapsed = false;
    const children = graph.getComboChildren(comboId);
    if (!children || !children.nodes || children.nodes.length === 0) {
      store.dispatch(setGraphLoading(true));
      const limit = Number(PAGE_SIZE());
      let params = { vid: model.uid };

      if (limit > 0 && Number(modelChildLen) > limit) {
        Object.assign(params, { first: limit, offset: 0 });
      }
      getChildren(params, (success: boolean, data: any) => {
        if (success) {
          const { toolbarConfig, currentGraphTab } = store.getState().editor;
          const relationLines = JSON.parse(JSON.stringify(_.get(toolbarConfig[currentGraphTab], 'relationLines', {})));
          const _data = data.map((value: ObjectConfig, index: number) => {
            const _xid = xid + '.' + index;

            // 获取对象关系列表数据
            const relations: any[] = [];
            (value['x.object.version.relations'] || []).forEach((info: ObjectRelationInfo) => {
              const typeId = info['r.type.id'],
                { target } = info['r.object.binds'];
              if (typeId.startsWith("Relation_")) {
                relations.push({
                  relation: typeId,
                  target: {
                    uid: target
                  },
                  attrValue: info['r.object.attrvalue']
                });
              }
            });
            Object.assign(relationLines, {
              [value['x.object.id']]: relations
            });

            return {
              ...value,
              'x_id': _xid
            }
          });
          store.dispatch(setToolbarConfig({
            key: currentGraphTab,
            config: { relationLines }
          }));
          graph.expandCombo(comboId);
          const curentGraphData: any = graph.save();
          if (params.hasOwnProperty("offset")) {
            const totalPage = modelChildLen ? Math.ceil(modelChildLen / limit) : 1;
            _data.push({
              uid: 'pagination-' + model.id + `-${Number(PAGE_SIZE())}-next`,
              id: 'pagination-' + model.id + `-${Number(PAGE_SIZE())}-next`,
              totalPage,
              currentParent: { id: model.id }
            });
          }
          const { nodes, edges, combos } = addChildrenToGraphData(model, _data, curentGraphData, _.get(toolbarConfig[currentGraphTab], 'filterMap.type', {}));
          let newData: any[] = [];
          store.getState().object.data.forEach(function (obj: CustomObjectConfig) {
            if (obj['xid'] === xid) {
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
      store.dispatch(setObjectDetail({ uid: model.id, options: { collapsed } }));
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
      dragItemParent = dragItemModel.data['x.object.version.parents']['x.object.id'];
    const dropItemId = dropItem.get('id'),
      dropItemModel = dropItem.get('model'),
      dropItemXid = dropItemModel.xid;
    const rootId = store.getState().editor.rootNode['x.object.id'];

    let dragItemParentId: any;
    if (dragItemParent === rootId) {
      dragItemParentId = rootId;
    } else {
      dragItemParentId = graph.findById(dragItemParent).get('id');
    }

    const lastChangeTime = new Date().getTime();

    let dragItems: CustomObjectConfig[] = [];
    let newData: CustomObjectConfig[] = [],
      sameParentWithDrag = 0,
      dropItemLastChildrenIndex = -1,
      modifyIdMaps: any = {},
      dropItemLastChildrenXIndex: any = 0;

    let shouldUpdateObject: ObjectConfig[] = [],
      dragItemIdMap = { [dragItemId]: dragItem };

    allData.forEach(function (value) {
      const xid = value['xid'],
        objId = value['x.object.id'],
        parent: any = (value['x.object.version.parents'] || {})['x.object.id'];
      if (!parent) return;
      if (objId === dragItemId || xid && xid.startsWith(dragItemXid + '.') || parent && dragItemIdMap[parent]) {
        dragItems.push({ ...value });
        Object.assign(dragItemIdMap, { [objId]: value });
      } else {
        if (parent === dragItemParent) {
          const dragItemIds = dragItemXid.split('.');
          dragItemIds[dragItemIds.length - 1] = sameParentWithDrag;
          const newId = dragItemIds.join('.');
          const obj = JSON.parse(JSON.stringify(value));
          if (newId !== xid) {
            Object.assign(obj, {
              'xid': newId
            });
            Object.assign(modifyIdMaps, {
              [objId]: {
                new: newId,
                old: xid
              }
            });
          }
          const childLen = Number(value['x.object.version.childs'] || 0);
          if (objId === dropItemId) {
            Object.assign(obj, {
              'x.object.version.childs': childLen + 1,
              collapsed: false
            });
          } else if (objId === dragItemParent) {
            Object.assign(obj, {
              'x.object.version.childs': childLen - 1
            });
          }
          newData.push(obj);
          sameParentWithDrag++;
        } else {
          if (modifyIdMaps[parent] && xid) {
            const newId = xid.replace(modifyIdMaps[parent].old, modifyIdMaps[parent].new);
            const data: CustomObjectConfig = {
              ...value,
              'xid': newId,
              'x.object.updated': lastChangeTime
            };
            if (objId === dropItemId) {
              Object.assign(data, {
                'x.object.version.childs': Number(value['x.object.version.childs'] || 0) + 1,
                collapsed: false
              });
            } else if (objId === dragItemParent) {
              Object.assign(data, {
                'x.object.version.childs': Number(value['x.object.version.childs'] || 0) - 1
              });
            }
            newData.push(data);
            Object.assign(modifyIdMaps, {
              [objId]: {
                new: newId,
                old: xid
              }
            });
          } else {
            if (objId === dropItemId) {
              newData.push({
                ...value,
                'x.object.version.childs': Number(value['x.object.version.childs'] || 0) + 1,
                collapsed: false
              });
            } else if (objId === dragItemParent) {
              newData.push({
                ...value,
                'x.object.version.childs': Number(value['x.object.version.childs'] || 0) - 1
              });
            } else {
              newData.push(value);
            }
          }
        }
      }

      if (objId === dropItemId || xid && xid.startsWith(dropItemXid + '.') && (xid.split('.').length - 1) === dropItemXid.split('.').length) {
        dropItemLastChildrenIndex++;
        dropItemLastChildrenXIndex = (value['x.object.version.parents'] || {})['x.object.index'];
      }
    });

    const dragItemNewXid = (modifyIdMaps[dropItemId]?.new || dropItemXid) + '.' + dropItemLastChildrenIndex;

    const newIndex = (Math.floor((dropItemLastChildrenXIndex || 0) / 1024) + 1) * 1024;
    dragItems = dragItems.map(function (value) {
      const objId = value['x.object.id'];
      if (objId === dragItemId) {
        const newParent: ObjectParentInfo = {
          'x.object.id': dropItemId,
          'x.object.index': newIndex
        }
        Object.assign(value, {
          'x.object.version.parents': newParent
        });

        const { collapsed, xid, totalPage, nextDisabled, ...newObj } = JSON.parse(JSON.stringify(value));
        shouldUpdateObject.push(newObj);
      }
      if (value['xid']) {
        return {
          ...value,
          'xid': value['xid'].replace(dragItemXid, dragItemNewXid),
        };
      }
      return value;
    });

    const handleUpdateObjects = function () {
      const newDropItemXid = (modifyIdMaps[dropItemId]?.new || dropItemXid);
      let dropItemIndex = -1;
      for (let i = newData.length - 1; i >= 0; i--) {
        const value = newData[i];
        if (value['xid'] && (value['xid'] === newDropItemXid || value['xid'].startsWith(newDropItemXid + '.'))) {
          dropItemIndex = i;
          break;
        }
      }
      if (dropItemIndex > -1) {
        newData.splice(dropItemIndex + 1, 0, ...dragItems);
      } else {
        newData = newData.concat(dragItems);
      }

      const graphData = convertAllData(newData);

      let shouldUpdate = true;
      const limit = Number(PAGE_SIZE());
      const prevParentCombo: any = graph.findById(dragItemParentId + "-combo");
      if (prevParentCombo) {
        const comboLastNodes = prevParentCombo.getChildren().nodes || [],
          comboLastNode = comboLastNodes.length > 0 ? comboLastNodes[comboLastNodes.length - 1] : null;
        if (comboLastNode && comboLastNode.get("id").startsWith("pagination-" + dragItemParentId) && comboLastNode.get("id").endsWith("-next")) {
          const { name, parent } = comboLastNode.get('model');
          const config = name.split('-');
          let offset = Number(config[2]) - limit;
          if (comboLastNodes.length <= 3 && comboLastNodes[0].get("id").endsWith("-prev")) {
            offset -= limit;
          }
          G6OperateFunctions.changePagination(graph, { parent, nextDisabled: false }, offset, graphData, newData);
          shouldUpdate = false;
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
          G6OperateFunctions.changePagination(graph, { parent, nextDisabled: false }, offset, graphData, newData);
          shouldUpdate = false;
        }
      }
      store.dispatch(setGraphLoading(false));
      if (shouldUpdate) {
        store.dispatch(setObjects(newData));
        graph.changeData(graphData);
        graph.layout();
      }

      const currentEditModel = store.getState().editor.currentEditModel;
      if (currentEditModel && currentEditModel.id) {
        const graphNodeItem = graph.findById(currentEditModel.id as string);
        graphNodeItem && store.dispatch(setCurrentEditModel(graphNodeItem.get("model")));
      }
      store.dispatch(setGraphLoading(false));
    }
    store.dispatch(setGraphLoading(true));
    if (dragItemParentId === dropItemId) {
      if (shouldUpdateObject.length > 0) {
        const graphId = store.getState().object.graphData?.id;
        setObject(graphId, shouldUpdateObject, (success: boolean, response: any) => {
          if (!success) {
            notification.error({
              message: '更新实例失败：',
              description: response.message || response.msg
            });
            store.dispatch(setGraphLoading(false));
            return;
          }
          handleUpdateObjects();
        });
      } else {
        store.dispatch(setGraphLoading(false));
      }
      return;
    }
    moveObject({
      vid: dragItemId,
      src: dragItemParentId,
      dest: dropItemId,
      newIndex
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
    const rootId = rootNode['x.object.id'];

    const parentId = pasteItem ? pasteItem.id : rootId;
    const parentName = pasteItem ? pasteItem.name : rootNode['x.object.name'];
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
        'x_index': (childLen + 1) * 1024,
        'x_children': childLen + 1
      };
    store.dispatch(setGraphLoading(true));
    copyObject({
      'vid': copyItem.uid,
      'e_x_parent': [{
        'vid': newParent['uid'],
        'x_index': newParent['x_index']
      }],
      recurse: true
    }, (success: boolean, response: any) => {
      if (success) {
        const customData = {
          "xid": newXid,
          collapsed: true
        }
        if (pasteItem) {
          addNodeChildren({ ...response, ...customData }, pasteItem, graph);
        } else {
          addRootNode(response, customData, graph);
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
  changePagination: function (graph: Graph, { parent, nextDisabled }: { parent: string, nextDisabled: boolean }, offset: number, curentGraphData?: any, objectData?: any) {
    return new Promise((resolve, reject) => {
      if (nextDisabled) {
        resolve(null);
        return;
      }
      const params: any = { vid: parent };

      const limit = Number(PAGE_SIZE()),
        _offset = Number(offset);
      if (_offset >= 0 && limit > 0) {
        Object.assign(params, { first: limit, offset: _offset });
      }
      store.dispatch(setGraphLoading(true));
      getChildren(params, (success: boolean, data: any) => {
        if (success) {
          const parentNode = graph.findById(parent),
            parentModel = parentNode.get('model'),
            collapsed = false;
          let id = parentModel.id,
            xid = parentModel.xid,
            childLen = parentModel.childLen;
          const comboId = `${id}-combo`;
          if (objectData) {
            const index = objectData.findIndex((val: any) => val.id === parent);
            if (index > -1) {
              xid = objectData[index]['x_id'];
              childLen = objectData[index]['x_children'] || 0;
            }
          }
          const { toolbarConfig, currentGraphTab } = store.getState().editor;
          const relationLines = JSON.parse(JSON.stringify(_.get(toolbarConfig[currentGraphTab], 'relationLines', {})));
          let _data: any[] = [];
          if (params.hasOwnProperty("offset") && params['offset'] > 0) {
            _data.push({
              uid: 'pagination-' + parent + `-${_offset - limit}-prev`,
              id: 'pagination-' + parent + `-${_offset - limit}-prev`,
              currentParent: { id }
            });
          }
          _data = _data.concat(data.map((value: any, index: number) => {
            const infoIndex = _.get(value, 'tags.0.name') === 'v_node' ? 0 : 1,
              attrIndex = infoIndex === 0 ? 1 : 0;
            const newValue = JSON.parse(JSON.stringify(value)),
              parents = newValue['e_x_parent'],
              currentParent = parents.filter((val: Parent) => val.dst?.toString() === parent)[0],
              _xid = xid + '.' + index,
              defaultInfo = _.get(newValue.tags[infoIndex], 'props', {}),
              attrValue = _.get(newValue.tags[attrIndex], 'props', {}),
              uid = newValue['vid'].toString();

            // 获取对象关系列表数据
            const relations: any[] = [];
            Object.keys(newValue).forEach((key: string) => {
              if (key.startsWith("Relation_")) {
                const relationKey = key.replace('_', '.');
                if (isArray(newValue[key])) {
                  newValue[key].forEach((target: any) => {
                    relations.push({
                      relation: relationKey,
                      target: {
                        uid: _.get(target, 'dst', '').toString()
                      },
                      attrValue: _.get(target, 'props', {})
                    });
                  });
                } else {
                  relations.push({
                    relation: relationKey,
                    target: {
                      uid: _.get(newValue[key], 'dst', '').toString()
                    },
                    attrValue: _.get(newValue[key], 'props', {})
                  });
                }
              }
            });
            Object.assign(relationLines, {
              [uid]: relations
            });

            return {
              ...defaultInfo,
              'x_attr_value': { ...attrValue },
              'e_x_parent': parents,
              'x_children': _.get(newValue, 'x_children', 0),
              currentParent: {
                ...(_.get(currentParent, 'props', {})),
                uid: currentParent.dst.toString(),
                id
              },
              'x_id': _xid,
              id: uid,
              uid: uid
            }
          }));
          store.dispatch(setToolbarConfig({
            key: 'main',
            config: { relationLines }
          }));
          graph.expandCombo(comboId);

          let newData: any[] = [];
          const xidLen = xid.split(".").length + 1;
          let concatIndex = -1, removeMap: any = {}, removeChildren: any[] = [], removeChildrenMap: any = {}, parentChildLen = childLen;
          const allData = objectData || store.getState().object.data;
          allData.forEach(function (obj: any, index: number) {
            const parentId = _.get(obj, "currentParent.id", "");
            if (obj.id === parent) {
              parentChildLen = obj['x_children'] || 0;
            }
            if (obj['x_id'] === xid) {
              newData.push({
                ...obj,
                collapsed
              });
              // newData = newData.concat(_data);
              concatIndex = newData.length;
            }
            if (obj['x_id'] && obj['x_id'].startsWith(xid) && obj['x_id'].split(".").length === xidLen) {
              Object.assign(removeChildrenMap, { [obj.id]: obj });
            }
            if ((!obj['x_id'] && !obj.uid.startsWith(`pagination-${id}`) || obj['x_id'] && !obj['x_id'].startsWith(xid)) && !removeChildrenMap[parentId]) {
              newData.push(obj);
            } else {
              if (obj['x_id'] && obj['x_id'].startsWith(xid) && obj['x_id'].split(".").length > xidLen || removeChildrenMap[parentId]) {
                removeChildren.push(obj);
                Object.assign(removeChildrenMap, { [obj.id]: obj });
              }
              obj['x_id'] && Object.assign(removeMap, { [obj.id]: obj.collapsed });
            }
          });

          let concatData = [];
          _data = _data.map(item => ({ ...item, collapsed: _.get(removeMap, item.id, true) }));

          if (_offset >= 0 && limit > 0 && parentChildLen > limit) {
            const totalPage = parentChildLen ? Math.ceil(parentChildLen / limit) : 1;
            _data.push({
              uid: 'pagination-' + parent + `-${_offset + limit}-next`,
              id: 'pagination-' + parent + `-${_offset + limit}-next`,
              totalPage,
              nextDisabled: (_offset + data.length) >= parentChildLen,
              currentParent: { id }
            });
          }

          if (removeChildren.length > 0) {
            let newRemoveChildren: any[] = [];
            _data.forEach(function (val) {
              const nodeXid = val['x_id'];
              concatData.push(val);
              if (nodeXid) {
                for (let i = 0; i < removeChildren.length; i++) {
                  const item = removeChildren[i];
                  const itemXid = item['x_id'];
                  if (itemXid && itemXid.startsWith(nodeXid)) {
                    if (itemXid.split(".").length === nodeXid.split(".").length + 1 && _.get(item, 'currentParent.id') !== val.id) {
                      break;
                    }
                    concatData.push(item);
                  } else if (item.id.startsWith("pagination-" + val.id)) {
                    concatData.push(item);
                  } else {
                    newRemoveChildren.push(item);
                  }
                }
                removeChildren = JSON.parse(JSON.stringify(newRemoveChildren));
                newRemoveChildren = [];
              }
            });
          } else {
            concatData = _data;
          }

          const { nodes, edges, combos } = replaceChildrenToGraphData({ id, xid }, _data, curentGraphData || graph.save(), _.get(toolbarConfig[currentGraphTab], 'filterMap.type', {}));

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
        resolve(null);
      });
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
export async function addBrotherNode(sourceNode: Item, graph: Graph, typeInfo: { id: string; name: string; attrDefaultValue: {}; metadata: string; }, prev = false) {

  const defaultTypeName = _.get(typeInfo, 'id', ''),
    typeAttrValue = _.get(typeInfo, 'attrDefaultValue', {}),
    typeMetadata = _.get(typeInfo, 'metadata', '{}'),
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
  const sourceNodeXIndex = sourceNodeModel.data['x.object.version.parents']['x.object.index'];
  const sourcePrevNodeXIndex = sourcePrevNodeItem ? (sourcePrevNodeItem.getModel().data as any)['x.object.version.parents']['x.object.index'] : sourceNodeXIndex - 1;
  const newParentIndex = sourcePrevNodeXIndex + ((sourceNodeXIndex - sourcePrevNodeXIndex) / 2);
  const newParent = {
    "x.object.id": parentNodeModel.uid,
    "x.object.index": newParentIndex,
  };

  /**
   * 版本相关，暂不支持
   */
  // let isCheckout = false;
  // if (parentNodeModel.data && parentNodeModel.data['x.object.version'] && !parentNodeModel.data['x_checkout']) {
  //   await (() => {
  //     return new Promise((resolve) => {
  //       checkOutObject(parentNodeModel.uid, (success: boolean, response: any) => {
  //         resolve(null);
  //         if (success) {
  //           isCheckout = true;
  //           graph.updateItem(parentNode, {
  //             data: {
  //               ...parentNodeModel.data,
  //               'x_checkout': true
  //             }
  //           });
  //         } else {
  //           notification.error({
  //             message: '创建实例失败',
  //             description: response.message || response.msg
  //           });
  //         }
  //       });
  //     })
  //   })();
  //   if (!isCheckout) return;
  // }
  store.dispatch(setGraphLoading(true));

  G6OperateFunctions.addNode({
    "x.type.id": defaultTypeName,
    "x.object.name": typeInfo.name,
    "x.object.metadata": typeMetadata,
    "x.object.version.parents": newParent,
    "x.object.version.attrvalue": typeAttrValue
  }, (newData: ObjectConfig) => {
    const childLen = parentNodeModel.data['x.object.version.childs'] || 0;
    parentNode.update({
      data: {
        ...(parentNodeModel?.data),
        'x.object.version.childs': childLen + 1,
      },
      collapsed: false
    });
    store.dispatch(setObjectDetail({
      uid: parentNodeId,
      options: {
        'x.object.version.childs': childLen + 1,
        collapsed: false
      }
    }));

    const updateGraphData = function () {
      const newObj: CustomObjectConfig = {
        ...newData,
        "xid": newXid
      };

      const objectState = store.getState().object;
      const { data } = objectState;
      const _data: CustomObjectConfig[] = [];

      let hasAdd = false, currentIndex = 0, modifyIdMaps: any = {};
      let prevIsSource: any = false;
      for (let i = 0; i < data.length; i++) {
        const obj = data[i],
          xid = obj['xid'],
          parentId = (obj['x.object.version.parents'] || {})['x.object.id'];
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
              'xid': newId,
            };

            _data.push(newObj);
            Object.assign(modifyIdMaps, {
              [obj['x.object.id']]: {
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

        if (modifyIdMaps[parentId] && xid) {
          const modifyId = modifyIdMaps[parentId];
          const newId = xid.replace(modifyId.old, modifyId.new);
          const newObj = { ...obj, 'xid': newId };
          _data.push(newObj);
          continue;
        }

        _data.push(obj);
      }
      if (!hasAdd) {
        _data.push(newObj);
      }

      let shouldUpdate = true;
      const graphData = convertAllData(_data);
      const parentCombo: any = graph.findById(parentNodeId + "-combo");
      if (parentCombo) {
        const comboLastNodes = parentCombo.getChildren().nodes || [],
          comboLastNode = comboLastNodes.length > 0 ? comboLastNodes[comboLastNodes.length - 1] : null;
        if (comboLastNode && comboLastNode.get("id").startsWith("pagination-" + parentNodeId) && comboLastNode.get("id").endsWith("-next")) {
          const { name, parent } = comboLastNode.get('model');
          const config = name.split('-');
          G6OperateFunctions.changePagination(graph, { parent, nextDisabled: false }, config[2], graphData, _data);
          shouldUpdate = false;
        }
      }

      store.dispatch(setGraphLoading(false));
      if (shouldUpdate) {
        store.dispatch(setObjects(_data));
        graph.changeData(graphData);
        graph.layout();

        const item = graph.findById(newObj['x.object.id']);
        if (item) {
          graph.emit('node:click', {
            item: item,
            shape: item.get('keyShape')
          });
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
  const childLen = sourceNode.data['x.object.version.childs'];
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
    const obj = JSON.parse(JSON.stringify(data[i])) as CustomObjectConfig;
    const parent = (obj['x.object.version.parents'] || {})['x.object.id'],
      xid = obj['xid'];

    if (obj['x.object.id'] === sourceNodeId) {
      Object.assign(obj, { 'x.object.version.childs': childLen });
    }

    if (!hasAdd && xid && ((prevBrotherXid && xid.startsWith(prevBrotherXid + '.')) || parent === sourceNodeId || obj['xid'] === sourceNodeXid)) {
      _data.unshift(newObj);
      hasAdd = true;
    }
    _data.unshift(obj);
  }

  const { toolbarConfig, currentGraphTab } = store.getState().editor;
  const graphData = addChildrenToGraphData(sourceNode, [newObj], graph.save(), _.get(toolbarConfig[currentGraphTab], 'filterMap.type', {}));

  let shouldUpdate = true;
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
      G6OperateFunctions.changePagination(graph, { parent, nextDisabled: false }, offset, graphData, _data);
      shouldUpdate = false;
    }
  }
  store.dispatch(setGraphLoading(false));
  if (shouldUpdate) {
    graph.changeData(graphData);
    graph.layout();
    store.dispatch(setObjects(_data));
  }
}

// 增加根节点
function addRootNode(objectData: ObjectConfig, customData: any, graph: Graph) {
  const objectState = store.getState().object;
  const rootId = store.getState().editor.rootNode['x.object.id'];

  const _data = JSON.parse(JSON.stringify(objectState.data || []));
  _data.push(objectData);
  store.dispatch(setObjects(_data));

  const curentGraphData: any = graph.save();
  const { nodes, edges, combos } = curentGraphData;

  const objId = objectData['x.object.id'],
    name = objectData['x.object.name'],
    metadata = JSON.parse(objectData['x.object.metadata'] || '{}'),
    fill = _.get(metadata, 'color', defaultNodeColor.fill),
    iconKey = _.get(metadata, 'icon', '');
  const node: NodeItemData = {
    id: objId,
    xid: customData['xid'],
    parent: rootId,
    name: name,
    data: objectData,
    comboId: rootId + '-combo',
    childLen: Number(objectData['x.object.version.childs'] || 0),
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
    id: `${objId}-combo`,
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
async function createChildNode(sourceNode: NodeItemData, graph: Graph, typeData: { id: string; name: string; attrDefaultValue: {}; metadata: string; }) {
  const sourceNodeId = sourceNode.id;
  if (!sourceNodeId) return;

  const typeId = _.get(typeData, 'id', ''),
    defaultTypeName = _.get(typeData, 'name', ''),
    typeAttrDefaultValue = _.get(typeData, 'attrs', {}),
    typeMetadata = _.get(typeData, 'metadata', '{}')

  const sourceNodeXid = sourceNode.xid;

  const childLen = sourceNode.data['x.object.version.childs'] || 0;

  const newXid = sourceNodeXid + '.' + childLen;

  const newParent: ObjectParentInfo = {
    "x.object.id": sourceNodeId,
    "x.object.index": (childLen + 1) * 1024,
  };

  /**
   * 版本相关，暂不支持
   */
  // let isCheckout = false;
  // if (sourceNode.data && sourceNode.data['x_version'] && !sourceNode.data['x_checkout']) {
  //   await (() => {
  //     return new Promise((resolve) => {
  //       checkOutObject(sourceNode.uid, (success: boolean, response: any) => {
  //         resolve(null);
  //         if (success) {
  //           isCheckout = true;
  //           graph.updateItem(sourceNode.uid, {
  //             data: {
  //               ...sourceNode.data,
  //               'x_checkout': true
  //             }
  //           });
  //         } else {
  //           notification.error({
  //             message: '创建实例失败',
  //             description: response.message || response.msg
  //           });
  //         }
  //       });
  //     })
  //   })();
  //   if (!isCheckout) return;
  // }

  store.dispatch(setGraphLoading(true));
  G6OperateFunctions.addNode({
    "x.type.id": typeId,
    "x.object.name": defaultTypeName,
    "x.object.version.parents": newParent,
    "x.object.metadata": typeMetadata,
    "x.object.version.attrvalue": typeAttrDefaultValue
  }, (newData: ObjectConfig) => {
    const newObj: CustomObjectConfig = {
      ...newData,
      "xid": newXid,
    };

    const sourceItem = graph.findById(sourceNodeId);
    const newSourceNodeData = {
      ...sourceNode.data,
      "x.object.version.childs": childLen + 1
    };
    sourceItem.update({
      data: newSourceNodeData,
      collapsed: false
    });

    addNodeChildren(newObj, { ...sourceNode, data: newSourceNodeData }, graph);
    store.dispatch(setGraphLoading(false));

    const item = graph.findById(newObj['x.object.id']);
    if (!item) return;
    graph.emit('node:click', {
      item: item,
      shape: item.get('keyShape')
    });
  });
}

export function addChildNode(sourceNode: Item, graph: Graph, typeData: { id: string; name: string; attrDefaultValue: {}; metadata: string; }) {
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
  const rootId = rootNode['x.object.id'];
  if (!rootId) return;
  const children = graph.getComboChildren(`${rootId}-combo`);
  let childLen = children && children.nodes ? children.nodes.length : 0;
  if (childLen > 0 && children.nodes[0].getID().startsWith("pagination-")) {
    childLen -= 1;
  }
  if (childLen > 0 && children.nodes[childLen - 1].getID().startsWith("pagination-")) {
    childLen -= 1;
  }

  const newXid = rootId + '.' + childLen;

  const newParent: ObjectParentInfo = {
    "x.object.id": rootId,
    "x.object.index": (childLen + 1) * 1024
  };
  store.dispatch(setGraphLoading(true));
  G6OperateFunctions.addNode({
    "x.type.id": typeId,
    "x.object.name": defaultName,
    "x.object.version.parents": newParent,
    "x.object.metadata": typeMetadata,
    "x.object.version.attrvalue": typeAttrs
  }, (newData: ObjectConfig) => {
    addRootNode(newData, { 'xid': newXid }, graph);
    store.dispatch(setGraphLoading(false));
    const item = graph.findById(newData['x.object.id']);
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

export function insertRootNode(graph: Graph, typeData: { id: string; name: string; attrDefaultValue: {}; metadata: string; }, dropItem: any) {
  const defaultName = _.get(typeData, 'name', ''),
    typeId = _.get(typeData, 'id', ''),
    typeAttrDefaultValue = _.get(typeData, 'attrs', {}),
    typeMetadata = _.get(typeData, 'metadata', '{}');
  const rootNode = store.getState().editor.rootNode;
  const rootId = rootNode['x.object.id'];
  const objectState = store.getState().object;
  const { data } = objectState;
  const dropItemModel = dropItem.getModel(),
    dropItemXid = dropItemModel.xid,
    dropItemIndex = Number(dropItemXid.replace(rootId + ".", "")),
    newXid = dropItemXid,
    newParent: ObjectParentInfo = {
      "x.object.id": rootId,
      "x.object.index": 0
    };

  const dropPrevItemXid = dropItemIndex > 1 ? (rootId + "." + (dropItemIndex - 1)) : "";
  let currentIndex = dropItemIndex, dropItemDataIndex = -1;
  const newObjData = JSON.parse(JSON.stringify(data));
  let newParentIndex: number;
  const dropItemParentIndex = Number((dropItemModel.data['x.object.version.parents'] || {})['x.object.index']);
  newObjData.forEach((item: CustomObjectConfig, index: number) => {
    if (item['xid'] === dropPrevItemXid) {
      const dropPrevItemXindex: number = Number((item['x.object.version.parents'] || {})['x.object.index']);
      newParentIndex = dropPrevItemXindex + (dropItemParentIndex - dropPrevItemXindex) / 2;
      Object.assign(newParent, {
        "x.object.index": newParentIndex
      });
    } else if (dropItemIndex === 0 && index === 0) {
      newParentIndex = dropItemParentIndex / 2;
      Object.assign(newParent, {
        "x.object.index": newParentIndex
      });
    }

    if (dropItemDataIndex === -1 && item['xid'] === dropItemXid) dropItemDataIndex = index;

    if (item['xid'] && item['xid'].startsWith(rootId + '.' + (currentIndex + 1))) {
      currentIndex += 1;
    }

    if (item['xid'] && item['xid'].startsWith(rootId + '.' + currentIndex)) {
      const newIndex = currentIndex + 1;
      item['xid'] = item['xid'].replace(rootId + '.' + currentIndex, rootId + '.' + newIndex);
    }
  });

  store.dispatch(setGraphLoading(true));
  G6OperateFunctions.addNode({
    "x.object.name": defaultName,
    "x.object.version.parents": newParent,
    "x.type.id": typeId,
    "x.object.metadata": typeMetadata,
    "x.object.version.attrvalue": typeAttrDefaultValue
  }, (newData: ObjectConfig) => {
    const newObject: CustomObjectConfig = {
      ...newData,
      'xid': newXid
    };

    const updateGraphData = function () {
      newObjData.splice(dropItemDataIndex, 0, newObject);
      store.dispatch(setObjects(newObjData));
      const graphData = convertAllData(newObjData);
      graph.changeData(graphData);
      graph.layout();
      store.dispatch(setGraphLoading(false));

      const item = graph.findById(newObject['x.object.id']);
      if (!item) return;
      graph.emit('node:click', {
        item: item,
        shape: item.get('keyShape')
      });
      setTimeout(() => {
        graph.focusItem(item, true);
      }, 0);
    }
    // if (Number.isInteger(newParentIndex)) {
    updateGraphData();
    /**
     * rearrangeChildren接口没有，暂不支持
     */
    // } else {
    //   const parentUid = newParent['x.object.id'];

    //   rearrangeChildren({ uid: parentUid }, (success: boolean, response: any) => {
    //     if (success) {
    //       getChildren({ vid: parentUid }, (success: boolean, data: any) => {
    //         if (success) {

    //           const { toolbarConfig, currentGraphTab } = store.getState().editor;
    //           const relationLines = JSON.parse(JSON.stringify(_.get(toolbarConfig[currentGraphTab], 'relationLines', {})));
    //           let _data: any[] = [];

    //           _data = _data.concat(data.map((value: any, index: number) => {
    //             const infoIndex = _.get(value, 'tags.0.name') === 'v_node' ? 0 : 1,
    //               attrIndex = infoIndex === 0 ? 1 : 0;
    //             const newValue = JSON.parse(JSON.stringify(value)),
    //               parents = newValue['e_x_parent'],
    //               currentParent = parents.filter((val: Parent) => val.dst?.toString() === rootId)[0],
    //               defaultInfo = _.get(newValue.tags[infoIndex], 'props', {}),
    //               attrValue = _.get(newValue.tags[attrIndex], 'props', {}),
    //               uid = newValue['vid'].toString();

    //             // 获取对象关系列表数据
    //             const relations: any[] = [];
    //             Object.keys(newValue).forEach((key: string) => {
    //               if (key.startsWith("Relation_")) {
    //                 const relationKey = key.replace('_', '.');
    //                 if (_.isArray(newValue[key])) {
    //                   newValue[key].forEach((target: any) => {
    //                     relations.push({
    //                       relation: relationKey,
    //                       target: {
    //                         uid: _.get(target, 'dst', '').toString()
    //                       },
    //                       attrValue: _.get(target, 'props', {})
    //                     });
    //                   });
    //                 } else {
    //                   relations.push({
    //                     relation: relationKey,
    //                     target: {
    //                       uid: _.get(newValue[key], 'dst', '').toString()
    //                     },
    //                     attrValue: _.get(newValue[key], 'props', {})
    //                   });
    //                 }
    //               }
    //             });
    //             Object.assign(relationLines, {
    //               [uid]: relations
    //             });

    //             return {
    //               ...defaultInfo,
    //               'x_attr_value': { ...attrValue },
    //               'e_x_parent': parents,
    //               'x_children': _.get(newValue, 'x_children', 0),
    //               currentParent: {
    //                 ...(_.get(currentParent, 'props', {})),
    //                 uid: currentParent.dst.toString(),
    //                 id: rootId,
    //               },
    //               'x_id': rootId + '.' + index,
    //               id: uid,
    //               uid: uid
    //             };
    //           }));

    //           store.dispatch(setToolbarConfig({
    //             key: 'main',
    //             config: { relationLines }
    //           }));
    //           const curentGraphData: any = graph.save();

    //           const { nodes, edges, combos } = replaceChildrenToGraphData({ id: parentUid, xid: parentUid }, _data, curentGraphData, _.get(toolbarConfig[currentGraphTab], 'filterMap.type', {}));
    //           let newData: any[] = _data;

    //           store.getState().object.data.forEach(function (obj: any) {
    //             if (!obj['x_id'] || obj['x_id'].split(".").length > 2) {
    //               newData.push(obj);
    //             }
    //           });
    //           store.dispatch(setObjects(newData));
    //           graph.changeData({
    //             nodes,
    //             edges,
    //             combos
    //           }, false);
    //         } else {
    //           notification.error({
    //             message: '获取子实例失败：',
    //             description: data.message || data.msg
    //           });
    //         }
    //         store.dispatch(setGraphLoading(false));
    //       });
    //     } else {
    //       updateGraphData();
    //     }
    //   });
    // }
  });
}

// 从类型拖拽创建实例
export function dropCanvasAddNode(typeInfo: { id: string; name: string; attrDefaultValue: {}; metadata: string; }, dropItem: any, position: string, graph: Graph) {
  if (position === 'top-rect') {
    addBrotherNode(dropItem, graph, typeInfo, true);
  } else if (position === 'node-rect') {
    addChildNode(dropItem, graph, typeInfo);
  } else if (position === 'left-rect') {
    insertRootNode(graph, typeInfo, dropItem);
  } else {
    createRootNode(graph, typeInfo);
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
        'combo:drop': 'drop'
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
        dragItemModel = dragItem.get('model') as NodeItemData,
        dragItemXid = dragItemModel.xid,
        dropItemId = dropItem.get('id'),
        dropItemModel = dropItem.get('model') as NodeItemData,
        dropItemXid = dropItemModel.xid;

      if (dragItemId === dropItemId) return;

      // 同树时，不允许父级投入其子级中
      if (dragItemXid.length < dropItemXid.length &&
        dropItemXid.startsWith(dragItemXid + '.')
      ) return;

      let newData: any[] = [];
      const dropItemParentId = (dropItemModel.data['x.object.version.parents'] || {})['x.object.id'];
      const dragItemData = JSON.parse(JSON.stringify(dragItemModel.data)) as ObjectConfig;
      const shouldUpdateObject: ObjectConfig[] = [];

      const lastChangeTime = new Date().getTime();
      if (type === 'top-rect' || type === 'left-rect') {
        const rootInfo = store.getState().editor.rootNode;
        const rootId = rootInfo['x.object.id'];
        let dragItemParentUid = rootId,
          dropItemParentUid = rootId, dropItemParentModel: any = rootInfo;

        const dragitemParentId = (dragItemData['x.object.version.parents'] || {})['x.object.id'] || '';
        if (dragitemParentId !== rootId) {
          dragItemParentUid = graph.findById(dragitemParentId).get('id');
        }
        if (dropItemParentId && dropItemParentId !== rootId) {
          dropItemParentUid = graph.findById(dropItemParentId).get('id');
        }
        if (dropItemParentId !== rootId && dropItemParentId !== dragitemParentId && dragitemParentId === dropItemParentUid) {
          message.warning(`当前${dropItemParentModel.data['x.object.name']}对象中存在${dragItemModel.data['x.object.name']}对象`);
          return;
        }

        const objectState = store.getState().object;
        const { data } = objectState;
        // 插入某个节点前面
        let currentDropParentChildrenIndex = 0,
          originDragItems: CustomObjectConfig[] = [],
          dragItems = [],
          dragItemsIdMap: any = { [dragItemId]: dragItemData },
          currentDragParentChildrenIndex = 0;

        data.forEach(function (value) {
          if (value['xid'] && value['xid'] !== dragItemXid && value['xid'] !== dropItemXid && value['xid'].startsWith(dragItemXid + '.') || dragItemsIdMap[(value['x.object.version.parents'] || {})['x.object.id'] || '']) {
            Object.assign(dragItemsIdMap, { [value['x.object.id']]: value })
            originDragItems.push(value);
          }
        });

        let modifyIdMaps: any = {};
        data.forEach(function (value: CustomObjectConfig) {
          const new_value = JSON.parse(JSON.stringify(value)) as CustomObjectConfig;
          Object.assign(new_value, {
            'x.object.updated': lastChangeTime
          });
          const childLen = Number(new_value['x.object.version.childs']);
          if (value['x.object.id'] === dragItemParentUid) {
            Object.assign(new_value, {
              "x.object.version.childs": childLen - 1
            });
          } else if (value['x.object.id'] === dropItemParentUid) {
            Object.assign(new_value, {
              "x.object.version.childs": childLen + 1
            });
          }
          const _xid = value['xid'],
            parentId = (value['x.object.version.parents'] || {})['x.object.id'] || '';
          if (parentId !== rootId && !graph.findById(parentId)) {
            newData.push(new_value);
            return;
          }
          let parentUid: any = rootId;
          if (parentId !== rootId) {
            parentUid = graph.findById(parentId).get('id');
          }

          if (_xid && (_xid.startsWith(dragItemXid + '.') || _xid === dragItemXid) || dragItemsIdMap[parentId]) {
            return;
          }

          if (!_xid) {
            newData.push(new_value);
            return;
          }

          if (_xid === dropItemXid) {
            // 节点xid等于dropItemXid时，先将dragItem数据推入data
            const dropItemIds = dropItemXid.split('.');
            dropItemIds[dropItemIds.length - 1] = currentDropParentChildrenIndex.toString();
            let newId = dropItemIds.join('.');
            if (modifyIdMaps[parentUid] && _xid) {
              const modifyId = modifyIdMaps[parentUid];
              newId = _xid.replace(modifyId.old, modifyId.new);
            }
            const ids = JSON.parse(JSON.stringify(dropItemIds)),
              lastIndex = Number(ids.pop());
            ids.push(lastIndex - 1);
            const dropPrevXid = ids.join(".");
            const dropPrevNodeItem = graph.find("node", function (item, index) {
              return item.getModel().xid === dropPrevXid;
            });
            const droNodeXIndex = (dropItemModel.data['x.object.version.parents'] || {})['x.object.index'] || 1024;
            const dropPrevNodeXIndex = dropPrevNodeItem ? (((dropPrevNodeItem.getModel().data as ObjectConfig)['x.object.version.parents'] || {})['x.object.index'] || 1024) : droNodeXIndex - 1;
            const newParent: ObjectParentInfo = {
              'x.object.id': parentUid,
              'x.object.index': dropPrevNodeXIndex + ((droNodeXIndex - dropPrevNodeXIndex) / 2)
            };

            const obj: CustomObjectConfig = {
              ...dragItemData,
              'xid': newId,
              'x.object.version.parents': newParent,
              'x.object.updated': lastChangeTime
            };
            newData.push(obj);
            const { xid, collapsed, totalPage, nextDisabled, ...newObj } = JSON.parse(JSON.stringify(obj));
            shouldUpdateObject.push(newObj);

            dragItems = originDragItems.map(item => {
              if (item['xid']) {
                const newItem = {
                  ...item,
                  'xid': item['xid'].replace(dragItemXid, newId),
                }
                newData.push(newItem);
              } else {
                newData.push(item);
              }
            });
            currentDropParentChildrenIndex++;
          }
          if (parentId === dropItemParentId) {
            // drop对象的父级下所有children index 设置
            const dropItemIds = dropItemXid.split('.');
            dropItemIds[dropItemIds.length - 1] = currentDropParentChildrenIndex.toString();
            const newId = dropItemIds.join('.');
            if (_xid !== newId) {
              new_value['xid'] = newId;

              Object.assign(modifyIdMaps, {
                [new_value['x.object.id']]: {
                  new: newId,
                  old: _xid
                }
              });
            }
            currentDropParentChildrenIndex++;
          } else if (parentId === (dragItemModel.data['x.object.version.parents'] || {})['x.object.id']) {
            // drag对象的父级下所有children index 设置
            const dragItemIds = dragItemXid.split('.');
            dragItemIds[dragItemIds.length - 1] = currentDragParentChildrenIndex.toString();
            const newId = dragItemIds.join('.');
            if (_xid !== newId) {
              new_value['xid'] = newId;
              Object.assign(modifyIdMaps, {
                [new_value['x.object.id']]: {
                  new: newId,
                  old: _xid
                }
              });
            }
            currentDragParentChildrenIndex++;
          }

          if (modifyIdMaps[parentUid] && new_value['xid']) {
            const modifyId = modifyIdMaps[parentUid];
            new_value['xid'] = new_value['xid'].replace(modifyId.old, modifyId.new);
            Object.assign(modifyIdMaps, {
              [new_value['x.object.id']]: {
                new: new_value['xid'],
                old: _xid
              }
            });
            if (modifyIdMaps[new_value['x.object.id']]) {
              Object.assign(modifyIdMaps[new_value['x.object.id']], { new: new_value['xid'] });
            }
          }

          newData.push(new_value);
        });

        const handleUpdateObjects = async function () {
          let graphData: any = convertAllData(newData);
          let shouldUpdate = true;

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
                if (comboLastNodes.length <= 3 && comboLastNodes[0].get("id").endsWith("-prev")) {
                  offset -= limit;
                }
                await G6OperateFunctions.changePagination(graph, { parent, nextDisabled: false }, offset, graphData, newData);
                graphData = graph.save();
                newData = store.getState().object.data;
                shouldUpdate = false;
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
                G6OperateFunctions.changePagination(graph, { parent, nextDisabled: false }, offset, graphData, newData);
                shouldUpdate = false;
              }
            }
          }

          store.dispatch(setGraphLoading(false));
          if (shouldUpdate) {
            store.dispatch(setObjects(newData));
            graph.changeData(JSON.parse(JSON.stringify(graphData)));
            graph.layout();
          }

          const currentEditModel = store.getState().editor.currentEditModel;
          if (currentEditModel && currentEditModel.id) {
            const graphNodeItem = graph.findById(currentEditModel.id as string);
            graphNodeItem && store.dispatch(setCurrentEditModel(graphNodeItem.get("model")));
          }
        }

        store.dispatch(setGraphLoading(true));
        if (dragItemParentUid === dropItemParentUid) {
          if (shouldUpdateObject.length > 0) {
            const graphId = store.getState().object.graphData?.id;
            setObject(graphId, shouldUpdateObject, (success: boolean, response: any) => {
              if (success) {
                handleUpdateObjects();
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
        } else {
          moveObject({
            vid: dragItemId,
            src: dragItemParentUid,
            dest: dropItemParentUid,
            newIndex: _.get(shouldUpdateObject[0], 'x.object.version.parents', { 'x.object.index': 1024 })['x.object.index']
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
        if ((dragItemData['x.object.version.parents'] || {})['x.object.id'] === dropItemId) {
          message.warning(`当前${dropItemModel.data['x.object.name']}对象中存在${dragItemModel.data['x.object.name']}对象`);
          return;
        }

        if (Number(dropItemModel.data['x.object.version.childs']) > 0 && (dropItemModel.collapsed === undefined || dropItemModel.collapsed)) {
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
      const dropAddType: TypeConfig = JSON.parse((originalEvent as any).dataTransfer ? (originalEvent as any).dataTransfer.getData('object_drop_add') : '{}');
      const dropAddTypeId = dropAddType['x.type.id'];
      if (!dropAddTypeId) {
        this.dropItem = item;
        this.dropTarget = target;
        return;
      }
      const dropAddTypeName = dropAddType['x.type.name'],
        dropAddTypeMetadata = dropAddType['x.type.metadata'];
      const dropAddTypeAttrs = {};
      (dropAddType['x.type.version.attrs'] || []).forEach((attr: any) => {
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
        attrDefaultValue: dropAddTypeAttrs,
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
        'combo:click': 'nodeUnselected',
        'clear:active': 'nodeUnselected' // 新增
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
      const { sourceNode, targetNode, ...otherModel } = model;
      store.dispatch(setCurrentEditModel(otherModel));

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


  // 高亮相邻关系及节点
  G6.registerBehavior('activate-relations-object', {
    getDefaultCfg(): object {
      return {
        // 可选 mouseenter || click
        // 选择 click 会监听 touch，mouseenter 不会监听
        trigger: 'click',
        activeState: 'highlight',
        inactiveState: 'inactive',
        resetSelected: false,
        shouldUpdate() {
          return true;
        },
      };
    },
    getEvents(): { [key in G6Event]?: string } {
      if ((this as any).get('trigger') === 'mouseenter') {
        return {
          'node:mouseenter': 'setAllItemStates',
          'node:mouseleave': 'clearActiveState',
        };
      }
      return {
        'node:click': 'setAllItemStates',
        'combo:click': 'clearActiveState',
        'canvas:click': 'clearActiveState',
        'node:touchstart': 'setOnTouchStart',
        'canvas:touchstart': 'clearOnTouchStart',
        'clear:active': 'clearActiveState' // 新增
      };
    },
    setOnTouchStart(e: IG6GraphEvent) {
      const self = this as any;
      try {
        const touches = (e.originalEvent as TouchEvent).touches;
        const event1 = touches[0];
        const event2 = touches[1];

        if (event1 && event2) {
          return;
        }

        e.preventDefault();
      } catch (e) {
        console.warn('Touch original event not exist!');
      }
      self.setAllItemStates(e);
    },
    clearOnTouchStart(e: IG6GraphEvent) {
      const self = this as any;
      try {
        const touches = (e.originalEvent as TouchEvent).touches;
        const event1 = touches[0];
        const event2 = touches[1];

        if (event1 && event2) {
          return;
        }

        e.preventDefault();
      } catch (e) {
        console.warn('Touch original event not exist!');
      }
      self.clearActiveState(e);
    },
    setAllItemStates(e: IG6GraphEvent) {
      const self = this as any;

      clearTimeout(self.timer);
      self.throttleSetAllItemStates(e, self);
      console.log(self)
    },
    clearActiveState(e: any) {
      const self = this as any;

      // avoid clear state frequently, it costs a lot since all the items' states on the graph need to be cleared
      self.timer = setTimeout(() => {
        self.throttleClearActiveState(e, self);
      }, 50)
    },
    throttleSetAllItemStates: _.throttle(
      (e: any, self: any) => {
        const item: INode = e.item as INode;
        const itemType = item.getType();
        if (itemType === "combo") return;
        const graph = self.graph;
        if (!graph || graph.destroyed) return;
        self.item = item;
        if (!self.shouldUpdate(e.item, { event: e, action: 'activate' }, self)) {
          return;
        }
        const activeState = self.activeState;
        // const inactiveState = self.inactiveState;
        const nodes = graph.getNodes();
        const edges = graph.getEdges();
        const vEdges = graph.get('vedges');
        const nodeLength = nodes.length;
        const edgeLength = edges.length;
        const vEdgeLength = vEdges.length;
        // const inactiveItems = self.inactiveItems || {};
        const activeItems = self.activeItems || {};

        for (let i = 0; i < nodeLength; i++) {
          const node = nodes[i];
          const nodeId = node.getID();
          const hasSelected = node.hasState('selected');
          if (self.resetSelected) {
            if (hasSelected) {
              graph.setItemState(node, 'selected', false);
            }
          }
          if (activeItems[nodeId]) {
            graph.setItemState(node, activeState, false);
            delete activeItems[nodeId];
          }
          // if (inactiveState && !inactiveItems[nodeId]) {
          //   graph.setItemState(node, inactiveState, true);
          //   inactiveItems[nodeId] = node;
          // }
        }
        for (let i = 0; i < edgeLength; i++) {
          const edge = edges[i];
          const edgeId = edge.getID();
          const edgeType = edge.getModel().type;
          if ((edgeType === "tree-relation-line" || edgeType === "same-tree-relation-line") && activeItems[edgeId]) {
            graph.setItemState(edge, activeState, false);
            delete activeItems[edgeId];
          }
          // if (inactiveState && !inactiveItems[edgeId]) {
          //   graph.setItemState(edge, inactiveState, true);
          //   inactiveItems[edgeId] = edge;
          // }
        }

        for (let i = 0; i < vEdgeLength; i++) {
          const vEdge = vEdges[i];
          const vEdgeId = vEdge.getID();
          if (activeItems[vEdgeId]) {
            graph.setItemState(vEdge, activeState, false);
            delete activeItems[vEdgeId];
          }
          // if (inactiveState && !inactiveItems[vEdgeId]) {
          //   graph.setItemState(vEdge, inactiveState, true);
          //   inactiveItems[vEdgeId] = vEdge;
          // }
        }

        if (item && !item.destroyed) {
          // if (inactiveState) {
          //   graph.setItemState(item, inactiveState, false);
          //   delete inactiveItems[item.getID()];
          // }
          if (!activeItems[item.getID()]) {
            graph.setItemState(item, activeState, true);
            activeItems[item.getID()] = item;
          }

          const rEdges = item.getEdges();
          const rEdgeLegnth = rEdges.length;
          for (let i = 0; i < rEdgeLegnth; i++) {
            const edge = rEdges[i];
            const edgeType = edge.getModel().type;
            if (edgeType === "tree-relation-line" || edgeType === "same-tree-relation-line") {
              const edgeId = edge.getID();
              let otherEnd: INode;
              if (edge.getSource() === item) {
                otherEnd = edge.getTarget();
              } else {
                otherEnd = edge.getSource();
              }
              const otherEndId = otherEnd.getID();
              // if (inactiveState && inactiveItems[otherEndId]) {
              //   graph.setItemState(otherEnd, inactiveState, false);
              //   delete inactiveItems[otherEndId];
              // }
              if (!activeItems[otherEndId]) {
                graph.setItemState(otherEnd, activeState, true);
                activeItems[otherEndId] = otherEnd;
              }
              // if (inactiveItems[edgeId]) {
              //   graph.setItemState(edge, inactiveState, false);
              //   delete inactiveItems[edgeId];
              // }
              if (!activeItems[edgeId]) {
                graph.setItemState(edge, activeState, true);
                activeItems[edgeId] = edge;
              }
              edge.toFront();
            }
          }
        }
        self.activeItems = activeItems;
        // self.inactiveItems = inactiveItems;
        graph.emit('afteractivaterelations', { item: e.item, action: 'activate' });
      },
      50,
      {
        trailing: true,
        leading: true
      }
    ),
    throttleClearActiveState: _.throttle(
      (e: any, self: any) => {
        const graph = self.get('graph');
        if (!graph || graph.destroyed) return;
        if (!self.shouldUpdate(e.item, { event: e, action: 'deactivate' }, self)) return;

        const activeState = self.activeState;
        // const inactiveState = self.inactiveState;

        const activeItems = self.activeItems || {};
        // const inactiveItems = self.inactiveItems || {};

        Object.values(activeItems).filter((item: any) => !item.destroyed).forEach(item => {
          graph.clearItemStates(item, activeState);
        });
        // Object.values(inactiveItems).filter((item: any) => !item.destroyed).forEach(item => {
        //   graph.clearItemStates(item, inactiveState);
        // });
        self.activeItems = {};
        // self.inactiveItems = {};
        graph.emit('afteractivaterelations', {
          item: e.item || self.get('item'),
          action: 'deactivate',
        });
      },
      50,
      {
        trailing: true,
        leading: true
      }
    )
  });
}