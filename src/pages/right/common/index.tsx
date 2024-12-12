import { Input, Button, Form, InputRef, Tabs, Spin, notification, InputNumber, Select, DatePicker, Modal, Empty, Divider, Switch, Tooltip } from 'antd';
import { DownCircleOutlined, UpCircleOutlined } from '@ant-design/icons';
import TextArea from 'antd/lib/input/TextArea';
import { useEffect, useState, useRef, ReactNode, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import debounce from 'lodash/debounce';
import moment from 'moment';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper'
import { useLocation, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import _, { isArray } from 'lodash';
import { Controlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import { js as beautify } from 'js-beautify';

import type { StoreState } from '@/store';
import ParamEditor from './ParamEditor';
import { defaultNodeColor, typeMap } from '@/utils/common';
import { fittingString, resizeGraph } from '@/utils/objectGraph';
import { getTypeInfo, setType } from '@/actions/type';
import { setRelation } from '@/actions/relation';
import { checkInObject, checkOutObject, createObjectRelation, discardObject, getCheckoutVersion, getObject, setObject } from '@/actions/object';
import { getGraphInfo, updateGraphInfo } from '@/actions/graph'
import { AttrConfig, setTypeDetail, TypeConfig } from '@/reducers/type';
import { RelationConfig, setRelationDetail } from '@/reducers/relation';
import { CustomObjectConfig, ObjectConfig, ObjectGraphDataState, setGraphData, setObjectDetail } from '@/reducers/object';
import { NodeItemData, setIsEditing, setToolbarConfig } from '@/reducers/editor';
import PdbPanel from '@/components/Panel';
import NodeIconPicker from '@/components/NodeIconPicker';
import NodeColorPicker from '@/components/NodeColorPicker';
import MultiModelParamEditor from './MultiModelParamEditor';
import { ParamItem } from './ParamItem';
import RelationBind from '../relation/RelationBind';
import RelationList from '../object/RelationList';

import './index.less';
import SearchAround from '@/components/SearchAround';
import store from '@/store';
// import VersionList from '../object/VersionList';

const { Option } = Select;
const CodeEditor = ({ value = '', onChange, handleChange }: any, other2: any) => (
  <CodeMirror
    value={value}
    options={{
      lineNumbers: false,
      theme: 'material',
    }}
    onBeforeChange={(editor, data, value) => {
      onChange(value);
    }}
    onChange={() => {
      handleChange();
    }}
  />
);
interface RightProps {
  route: string // 路由
}
export default function Right(props: RightProps) {
  const dispatch = useDispatch(),
    idRef = useRef<any>(),
    location = useLocation();
  const [modal, contextHolder] = Modal.useModal();
  const graphData = useSelector((state: any) => state.object.graphData),
    currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel),
    multiEditModel = useSelector((state: StoreState) => state.editor.multiEditModel),
    searchAround = useSelector((state: StoreState) => state.editor.searchAround),
    types = useSelector((state: StoreState) => state.type.data),
    relations = useSelector((state: StoreState) => state.relation.data),
    isEditing = useSelector((state: StoreState) => state.editor.isEditing);

  const [currentEditDefaultData, setCurrentEditDefaultData] = useState(null as any), // 当前对象原始数据
    [currentEditType, setCurrentEditType] = useState(''), // 当前编辑的是对象，类型还是关系
    [attrs, setAttrs] = useState([] as any[]), // 属性列表
    [typeLoading, setTypeLoading] = useState(false),
    [currentEditParam, setCurrentEditParam] = useState(null as any), // 当前编辑类型属性
    [showMore, setShowMore] = useState(Boolean(!currentEditModel)), // 查看更多
    [metadataKey, setMetadataKey] = useState(''),
    [attrLoading, setAttrLoading] = useState(false),
    [panelTitle, setPanelTitle] = useState('');
  // [hasVersion, setHasVersion] = useState(false),
  // [checkoutVersion, setCheckoutVersion] = useState({});

  const [infoForm] = Form.useForm(),
    [attrForm] = Form.useForm();
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    setMetadataKey(props.route === 'object' && !location.pathname.endsWith("/template") ? 'x.object.metadata' : 'x.type.metadata');
  }, [props.route]);

  useEffect(() => {
    if (currentEditModel || !graphData || JSON.stringify(graphData) === '{}') return;
    if (props.route === 'object') {
      // 项目相关信息
      const { name, id, updated, created, description } = graphData as ObjectGraphDataState;
      infoForm.setFieldsValue({
        name,
        uid: id,
        lastChange: moment(updated).format("YYYY-MM-DD HH:mm:ss"),
        created: moment(created).format("YYYY-MM-DD HH:mm:ss"),
        description
      });
    }
  }, [graphData]);

  useEffect(() => {
    resizeGraph();
  }, [currentEditParam]);

  async function initData(currentEditType: string, currentEditDefaultData: any, currentEditModel: any) {
    let prevLabel = '';
    let uid = '';
    let _currentEditDefaultData = JSON.parse(JSON.stringify(currentEditDefaultData));
    let _attrs: any = [];

    // 获取属性列表
    if (currentEditType === 'object') {
      prevLabel = 'x.object.';
      if (_currentEditDefaultData['x.type.id']) {
        _attrs = await getObjectTypeInfo(_currentEditDefaultData['x.type.id']);
      }
      uid = _currentEditDefaultData[prevLabel + 'id'];
      getObjectInfo(uid, _attrs);
    } else {
      let attrKey = "";
      if (currentEditType === 'type') {
        prevLabel = 'x.type.';
        attrKey = 'x.type.version.attrs';
      } else {
        prevLabel = 'r.type.';
        attrKey = 'r.type.attrs';
      }
      _attrs = _currentEditDefaultData[attrKey] || [];
      _attrs.forEach((attr: any) => {
        const { datetimeFormat, type, name } = attr;
        if (type === 'datetime') {
          _currentEditDefaultData[name] && Object.assign(_currentEditDefaultData, {
            [name]: dayjs(moment(_currentEditDefaultData[name]).format(datetimeFormat), datetimeFormat)
          });
        } else if (currentEditType === 'relation') {
          let value = attr.default;
          if (currentEditModel && currentEditModel.data && currentEditModel.data.hasOwnProperty(name)) {
            value = currentEditModel.data[name];
          }
          Object.assign(_currentEditDefaultData, {
            [name]: value
          });
        }
      });
      setAttrs(_attrs);
      uid = _currentEditDefaultData[prevLabel + 'id'];
    }

    setCurrentEditDefaultData(_currentEditDefaultData);
    const attFormValue = {};
    _attrs.forEach((attr: AttrConfig) => {
      const { type, name, datetimeFormat } = attr;
      let value = attr.default;
      if (currentEditModel && currentEditModel.data && currentEditModel.data.hasOwnProperty(name)) {
        value = currentEditModel.data[name];
      }
      if (type === 'datetime') {
        value && Object.assign(attFormValue, { [name]: dayjs(moment(value).format(datetimeFormat), datetimeFormat) });
      } else {
        Object.assign(attFormValue, { [name]: value });
      }
    });
    attrForm.setFieldsValue(attFormValue);

    let _created = _.get(_currentEditDefaultData, prevLabel + 'created', ''),
      _lastChange = _.get(_currentEditDefaultData, prevLabel + 'updated', '');

    if (Number(_created).toString() === _created) {
      _created = Number(_created);
    }
    if (Number(_lastChange).toString() === _lastChange) {
      _lastChange = Number(_lastChange);
    }
    const formValues = {
      name: _currentEditDefaultData[prevLabel + 'name'],
      uid,
      lastChange: _lastChange ? moment(_lastChange).format("YYYY-MM-DD HH:mm:ss") : '',
      created: _created ? moment(_created).format("YYYY-MM-DD HH:mm:ss") : ''
    };

    if (currentEditType === 'object') {
      Object.assign(formValues, {
        typeName: _currentEditDefaultData['x.type.id'] || ''
      });
    } else if (currentEditType === 'relation') {
      Object.assign(formValues, {
        source: currentEditModel.source,
        target: currentEditModel.target
      });
    }
    infoForm.setFieldsValue(formValues);
  }

  useEffect(() => {
    attrForm.resetFields();
    setShowMore(Boolean(!currentEditModel));
    let panelTitle = `${props.route === 'object' ? '项目' : '模板'}属性`;
    if (currentEditModel && currentEditModel.data) {
      if (currentEditModel.data.hasOwnProperty('x.type.id')) {
        panelTitle = '对象属性';
      } else if (currentEditModel.data.hasOwnProperty('r.type.id')) {
        panelTitle = '关系属性';
      }
    }
    setPanelTitle(panelTitle);
    if (!currentEditModel) {
      if (!graphData) return;
      if (props.route === 'object' && graphData.id) {
        getGraphInfo(graphData.id, (success: boolean, data: any) => {
          let _graphData: ObjectGraphDataState = JSON.parse(JSON.stringify(graphData));
          if (success) {
            _graphData = JSON.parse(JSON.stringify(data));
            dispatch(setGraphData(data));
          }
          const { name, id, updated, created } = _graphData;
          infoForm.setFieldsValue({
            name,
            uid: id,
            lastChange: moment(updated).format("YYYY-MM-DD HH:mm:ss"),
            created: moment(created).format("YYYY-MM-DD HH:mm:ss")
          });
        });
      }
      return;
    }
    const currentEditDefaultData = JSON.parse(JSON.stringify(currentEditModel.data || {}));

    // 判断当前编辑的类型
    let currentEditType = 'object';
    if (currentEditDefaultData['x.type.name']) {
      currentEditType = 'type';
    } else if (currentEditDefaultData['r.type.name']) {
      currentEditType = 'relation';
    }
    setCurrentEditType(currentEditType);
    initData(currentEditType, currentEditDefaultData, currentEditModel);

    // const hasVersion = Boolean(currentEditDefaultData['x_version']);
    // setHasVersion(hasVersion);
    // hasVersion && dispatch(setIsEditing(currentEditDefaultData['x_checkout']));

    return () => {
      setCurrentEditParam(null);
      setCurrentEditDefaultData(null);
      setCurrentEditType('');
      dispatch(setIsEditing(true));
      // setHasVersion(false);
    }
  }, [currentEditModel]);

  const [paramDragging, setParamDragging] = useState(false);
  let timer: any = null;
  function initialForm() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      return;
    }
    timer = setTimeout(() => {
      const typeItems = document.getElementsByClassName("type-items");
      if (typeItems.length > 0 && typeItems[0].firstElementChild && typeItems[0].firstElementChild.children
        && typeItems[0].firstElementChild.children.length === attrs.length) {
        attrForm.validateFields();
      } else {
        clearTimeout(timer);
        timer = null;
      }
      initialForm();
    }, 500);
  }
  useEffect(() => {
    if (currentEditType === 'object') {

      initialForm();
      return;
    }
    if (!currentEditModel || paramDragging) return;
    updateAttrs(attrs);
  }, [attrs]);

  // 更新属性列表
  const updateAttrs = function (attrs: any, callback?: Function) {
    if (!currentEditDefaultData) return;
    const attrKey = currentEditType === 'type' ? 'x.type.version.attrs' : 'r.type.attrs';
    if (JSON.stringify(currentEditDefaultData[attrKey]) !== JSON.stringify(attrs)) {
      updateItemData({
        ...currentEditDefaultData,
        [attrKey]: attrs
      }, callback, attrKey);
    }
  }

  // 关系类型 - 连接对象更新
  const updateBinds = function (newBind: any) {
    if (currentEditType === 'relation' && currentEditModel) {
      if (JSON.stringify(newBind) !== JSON.stringify(currentEditDefaultData['r.type.binds'] || [])) {
        updateItemData({
          ...currentEditDefaultData,
          'r.type.binds': newBind
        }, undefined, 'r.type.binds');
      }
    }
  }

  const getObjectInfo = function (uid: string, attrs: any) {
    setAttrLoading(true);
    getObject(graphData?.id, [{ 'x.object.id': uid }], async (success: boolean, response: any) => {
      if (success && response) {
        const objectData = response[0] as ObjectConfig;
        /**
         * 版本相关，暂不支持
         */
        // if (objectData['x_version'] && objectData['x_checkout']) {
        //   await (() => {
        //     return new Promise((resolve) => {
        //       getCheckoutVersion(uid, (success: boolean, response: any) => {
        //         if (success) {
        //           const _attrs = _.get(response, 'e_v_attrs.tags.0.props', {});
        //           Object.assign(objectData['x_attr_value'], _attrs);
        //           setCheckoutVersion(response);
        //         }
        //         resolve(null);
        //       });
        //     });
        //   })();
        // }
        const { toolbarConfig, currentGraphTab } = store.getState().editor;

        if (currentGraphTab === "main") {
          const relationLines = JSON.parse(JSON.stringify(_.get(toolbarConfig[currentGraphTab], 'relationLines', {})));
          // 获取对象关系列表数据
          Object.assign(relationLines, {
            [objectData['x.object.id']]: objectData['x.object.version.relations'] || []
          });
          dispatch(setToolbarConfig({
            key: currentGraphTab,
            config: { relationLines }
          }));
        }
        const filedValue = objectData['x.object.version.attrvalue'];
        const attFormValue = {};
        attrs && attrs.forEach((attr: AttrConfig) => {
          const { datetimeFormat, type, name } = attr;
          const value = filedValue[name] !== undefined ? filedValue[name] : attr.default;
          if (type === 'datetime') {
            if (value) {
              Object.assign(objectData['x.object.version.attrvalue'], { [name]: dayjs(moment(value).format(datetimeFormat), datetimeFormat) });
              Object.assign(attFormValue, { [name]: dayjs(moment(value).format(datetimeFormat), datetimeFormat) });
            }
          } else {
            Object.assign(attFormValue, { [name]: value });
          }
        });
        setCurrentEditDefaultData(objectData);
        attrForm.setFieldsValue(attFormValue);
      } else if (!success) {
        notification.error({
          message: '获取对象属性值失败',
          description: response.message || response.msg
        });
      }
      setAttrLoading(false);
    });
  }

  // 获取对象类型信息
  const getObjectTypeInfo = function (typeName: string) {
    return new Promise((resolve) => {
      if (!typeName) return;
      setTypeLoading(true);
      getTypeInfo(graphData?.id, [typeName], (success: boolean, response: any) => {
        setTypeLoading(false);
        if (success) {
          const attrs = _.get(response[0], 'x.type.version.attrs', []);
          resolve(attrs);
          setAttrs(attrs);
        } else {
          notification.error({
            message: '获取对象类型属性失败',
            description: response.message || response.msg
          });
        }
      });
    });
  }

  // 更新当前编辑item
  const updateItemData = function (data: any, callback?: Function, key?: string) {
    if (currentEditType === 'type') {
      updateType(data, callback);
    } else if (currentEditType === 'relation') {
      updateRelation(data, callback);
    } else {
      updateObject(data, key, callback);
    }
  }

  // 更新对象类型
  const updateType = (type: TypeConfig, callback?: Function) => {
    if (!(window as any).PDB_GRAPH || !currentEditModel?.id) return;
    const timestamp = new Date();

    setType(graphData?.id, [type], (success: boolean, response: any) => {
      if (success) {
        const typeName = type['x.type.name'],
          typeId = type['x.type.id'];
        if (currentEditModel && (typeName !== _.get(currentEditModel.data, 'x.type.name') || type['x.type.metadata'] !== _.get(currentEditModel.data, 'x.type.metadata'))) {
          const icon = _.get(JSON.parse(type['x.type.metadata'] || '{}'), 'icon', '');
          (window as any).PDB_GRAPH?.updateItem(currentEditModel?.id, {
            icon: icon,
            data: type
          });
        }

        setCurrentEditDefaultData(type);
        dispatch(setTypeDetail({ id: typeId, options: type }));
        infoForm.setFieldValue('lastChange', moment(timestamp).format("YYYY-MM-DD HH:mm:ss"));
      } else {
        notification.error({
          message: '更新对象类型失败',
          description: response.message || response.msg
        });
      }
      callback && callback(success, response);
    });
  }

  // 更新关系类型
  const updateRelation = (relation: RelationConfig, callback?: Function) => {
    if (!(window as any).PDB_GRAPH || !currentEditModel?.id) return;
    const graph = (window as any).PDB_GRAPH;
    if (props.route === "object") {
      const { source, target, relationName } = currentEditModel;
      const modelAtts = {};

      Object.keys(relation).forEach(function (key) {
        if (!key.startsWith("r.type.")) {
          Object.assign(modelAtts, { [key]: _.get(relation, key) });
        }
      });

      createObjectRelation([{
        'vid': source,
        [relationName as string]: [{
          'vid': target,
          ...modelAtts
        }]
      }], (success: boolean, response: any) => {
        if (success) {
          graph.updateItem(currentEditModel.id, { data: relation });
        } else {
          notification.error({
            message: '更新关系属性失败',
            description: response.message || response.msg
          });
        }
        callback && callback(success, response);
      });
    } else {
      const item = (window as any).PDB_GRAPH.findById(currentEditModel?.id);
      const timestamp = new Date();

      if (JSON.stringify(currentEditDefaultData) === JSON.stringify(relation)) return;
      setRelation(graphData?.id, [relation], (success: boolean, response: any) => {
        if (success) {
          const id = relation['r.type.id'],
            name = relation['r.type.name'];

          if (name !== _.get(currentEditModel.data, 'r.type.name')) {
            (window as any).PDB_GRAPH?.updateItem(item, {
              data: relation
            });
          }

          setCurrentEditDefaultData(relation);
          dispatch(setRelationDetail({ id, options: relation }));
          infoForm.setFieldValue('lastChange', moment(timestamp).format("YYYY-MM-DD HH:mm:ss"));
        } else {
          notification.error({
            message: '更新关系类型失败',
            description: response.message || response.msg
          });
        }
        callback && callback(success, response);
      });
    }
  }

  // 更新对象
  const updateObject = (object: CustomObjectConfig, key?: string, callback?: Function) => {
    if (!(window as any).PDB_GRAPH || !currentEditModel?.id) return;
    const item = (window as any).PDB_GRAPH.findById(currentEditModel?.id);
    const timestamp = new Date();

    const { xid, collapsed, totalPage, nextDisabled, ...newObject } = JSON.parse(JSON.stringify(object));
    setObject(graphData?.id, [newObject], (success: boolean, response: any) => {
      if (success) {
        const name = object['x.object.name'];
        const icon = _.get(JSON.parse(object['x.object.metadata'] || '{}'), 'icon', '');
        const graph = (window as any).PDB_GRAPH;
        graph?.updateItem(item, {
          icon: icon,
          data: object,
          name: name
        })
        const nodeId = currentEditDefaultData.uid, nodeItem = graph.findById(nodeId);
        if (key === 'name' && nodeItem) {
          const nodeWidth = nodeItem.getModel().width;
          const edges = graph?.findAll('edge', (edge: any) => edge.getModel().source === nodeId || edge.getModel().target === nodeId);
          edges.forEach((edge: any) => {
            let options = {};
            if (edge.getModel().source === nodeId) {
              Object.assign(options, {
                sourceWidth: nodeWidth
              });
            } else {
              Object.assign(options, {
                targetWidth: nodeWidth
              });
            }
            graph?.updateItem(edge, options);
          });
        }


        setCurrentEditDefaultData(object);
        dispatch(setObjectDetail({ id: object['x.object.id'], options: object }));
        infoForm.setFieldValue('lastChange', moment(timestamp).format("YYYY-MM-DD HH:mm:ss"));
      } else {
        notification.error({
          message: '更新实例失败',
          description: response.message || response.msg
        });
      }
      callback && callback(success, response);
    });
  }

  // 编辑类型属性
  const editTypeConfig = (data: any) => {
    setCurrentEditParam(data);
  };

  // 删除类型属性
  const deleteTypeConfig = (name: string, index: number) => {
    const newAttrs = JSON.parse(JSON.stringify(attrs));
    newAttrs.splice(index, 1);
    setAttrs(newAttrs);
  }

  // 更新项目信息
  const updateAppInfo = (graphId: number, info: any) => {
    updateGraphInfo(graphId, info, (success: boolean, response: any) => {
      if (success) {
        dispatch(setGraphData({ ...graphData, ...response }));
      } else {
        notification.error({
          message: '更新项目信息失败',
          description: response.message || response.msg
        });
      }
    });
  }

  const changeDescription = () => {
    if (!(window as any).PDB_GRAPH) return;

    infoForm.validateFields().then(value => {
      const { name, description } = value;
      if (props.route === 'object') {
        updateAppInfo(graphData?.id, { name, description });
      }

    }).catch(reason => {
      console.log("reason: ", reason)
    });
  }

  // 更改显示名称
  const changeName = () => {
    if (!(window as any).PDB_GRAPH) return;

    infoForm.validateFields().then(value => {
      const { name } = value;
      if (currentEditModel?.id) {
        const node = (window as any).PDB_GRAPH.findById(currentEditModel.id);
        if (!node || node.getModel().name === name) return;
        let nameLabel = 'x.object.name';
        if (currentEditType !== 'object') nameLabel = currentEditType === 'type' ? 'x.type.name' : 'r.type.name';
        updateItemData({
          ...currentEditDefaultData,
          [nameLabel]: name
        }, undefined, 'name');
      } else if (props.route === 'object') {
        updateAppInfo(graphData?.id, { name });
      }
    }).catch(reason => {
      console.log("reason: ", reason)
    });
  }

  // 更改显示icon
  const changeNodeMetadata = function (type: string, value: string, isDefault = false) {
    if (!(window as any).PDB_GRAPH || !currentEditDefaultData) return;
    const currentMetadata = JSON.parse(currentEditDefaultData[metadataKey] || '{}');
    const currentValue = _.get(currentMetadata, type, '');
    if (currentValue === value) return;
    const newMetadata = {
      ...currentMetadata,
      [type]: value
    };
    if ((type === 'borderColor' && isDefault) ||
      (type === 'icon' && !value)) {
      delete newMetadata[type];
    }
    updateItemData({
      ...currentEditDefaultData,
      [metadataKey]: JSON.stringify(newMetadata)
    }, undefined, metadataKey);
  }

  // 添加类型属性
  const addParam = () => {
    setCurrentEditParam({ index: attrs.length, isNew: true });
  }

  // 关闭属性编辑框
  const cancelEditParam = (newAttrs?: any) => {
    setCurrentEditParam(null);
    if (newAttrs) {
      const attFormValue = {};
      newAttrs && newAttrs.forEach((attr: AttrConfig) => {
        const { datetimeFormat, type, name } = attr;
        const value = attr.default;
        if (type === 'datetime') {
          value && Object.assign(attFormValue, { [name]: dayjs(moment(value).format(datetimeFormat), datetimeFormat) });
        } else {
          Object.assign(attFormValue, { [name]: value });
        }
      });
      attrForm.setFieldsValue(attFormValue);
      updateAttrs(newAttrs, (success: boolean) => {
        if (success) {
          setAttrs(newAttrs);
        }
      });
    }
  }

  // 对象管理 - 属性值修改
  const handleAttrChange = debounce((index: number, attr?: any) => {
    attrForm.validateFields().then(values => {
      const newValues = { ...values };
      if (attr && attr.type === 'datetime' && values[attr.name]) {
        const datetime = values[attr.name].format(attr.datetimeFormat);
        Object.assign(newValues, { [attr.name]: new Date(datetime) });
      }

      if (currentEditType === 'object') {
        if (attr && attr.name && newValues[attr.name] === null) {
          delete newValues[attr.name];
          const newData = JSON.parse(JSON.stringify({
            ...currentEditDefaultData,
            'x.object.version.attrvalue': {
              ...currentEditDefaultData['x.object.version.attrvalue'],
              ...newValues,
              [attr.name]: null
            }
          }));
          delete newData['x_attr_value'][attr.name];
          updateItemData(newData, undefined, 'attr');
        } else {
          updateItemData({
            ...currentEditDefaultData,
            'x_attr_value': {
              ...currentEditDefaultData['x_attr_value'],
              ...newValues
            }
          });
        }
      } else {
        if (attr && attr.name && newValues[attr.name] === null) {
          delete newValues[attr.name];
          const newData = JSON.parse(JSON.stringify({
            ...currentEditDefaultData,
            ...newValues
          }));
          delete newData[attr.name];
          updateItemData(newData);
        } else {
          updateItemData({
            ...currentEditDefaultData,
            ...newValues
          });
        }
      }
    }).catch(err => {
      console.log(err)
    });
  }, 500);

  // 自定义输入框addonBefore
  const rendeCustomAddon = (attr: any, children: ReactNode, addonBefore?: string) => {
    const { name, required, type } = attr;

    if (addonBefore) {
      return (
        <div className={`type-param-input type-param-${type}`}>
          <div className='param-addon-before'>{addonBefore}</div>
          <Form.Item name={name} rules={[{ required: required, message: '该属性为必填项' }]}>
            {children}
          </Form.Item>
        </div>
      )
    }
    return (
      <Form.Item name={name} rules={[{ required: required, message: '该属性为必填项' }]}>
        {children}
      </Form.Item>
    )
  }

  const formatCode = (code: string) => {
    return beautify(code, { indent_size: 2, space_in_empty_paren: true });
  };

  // 可编辑输入框
  const renderEditorInput = (type: string, defalutValue: any, addonBefore: string, attr: any, index: number, frontType?: string) => {
    if (!isEditing) {
      if (frontType === "code") {
        let height = 100;
        if (defalutValue) {
          const lineCount = defalutValue.split('\n').length; // 计算行数
          height = Math.min(lineCount * 22 + 68, 300); // 每行20px，最大300px
        }

        return (
          <div className='type-param-input'>
            <div className='param-addon-before'>{addonBefore}</div>
            <div className='param-code-editor readOnly' style={{ height }}>
              <CodeMirror
                value={formatCode(defalutValue)}
                options={{
                  lineNumbers: false,
                  theme: 'material',
                  readOnly: true,
                  cursorBlinkRate: -1,
                }}
                onBeforeChange={(editor, data, value) => { }}
              />
            </div>
          </div>
        );
      }
      return rendeCustomAddon(attr, (
        <Input addonBefore={addonBefore} readOnly disabled />
      ));
    }

    switch (type) {
      case 'boolean':
        return rendeCustomAddon(attr, (
          <Select onChange={() => handleAttrChange(index, attr)}>
            <Option value={true}>True</Option>
            <Option value={false}>False</Option>
          </Select>
        ), addonBefore);
      case 'datetime':
        const { datetimeFormat } = attr;
        return rendeCustomAddon(attr, (
          <DatePicker showTime={datetimeFormat !== 'YYYY-MM-DD'} format={datetimeFormat} onChange={() => handleAttrChange(index, attr)} />
        ), addonBefore);
      case 'string':
        if (frontType === 'code') {
          let height = 100;
          if (defalutValue) {
            const lineCount = defalutValue.split('\n').length; // 计算行数
            height = Math.min(lineCount * 22 + 68, 300); // 每行20px，最大300px
          }
          return (
            <div className='type-param-input'>
              <div className='param-addon-before'>{addonBefore}</div>
              <div className='param-code-editor'>
                <Form.Item name={attr.name} rules={[{ required: attr.required, message: '该属性为必填项' }]}>
                  <CodeEditor handleChange={() => handleAttrChange(index, attr)} />
                </Form.Item>
                {/* <CodeMirror
                value={attrForm.getFieldValue(attr.name)}
                options={{
                  lineNumbers: false,
                  theme: 'material',
                  cursorBlinkRate: -1,
                }}
                onBeforeChange={(editor, data, value) => {
                  attrForm.setFieldValue(attr.name, value);
                  handleAttrChange(index, attr);
                }}
              /> */}
              </div>
            </div>
          )
        }
        const { stringMaxLength } = attr
        return rendeCustomAddon(attr, (
          <Input addonBefore={addonBefore} maxLength={stringMaxLength} onChange={() => handleAttrChange(index, attr)} />
        ));
      case 'text':
        return rendeCustomAddon(attr, (
          <TextArea onChange={() => handleAttrChange(index, attr)} />
        ), addonBefore);
      case 'int':
        return rendeCustomAddon(attr, (
          <InputNumber addonBefore={addonBefore} precision={0} onChange={() => handleAttrChange(index, attr)} />
        ));
      case 'list':
        return rendeCustomAddon(attr, (
          <Select
            placeholder='默认值'
            options={attr.listEnums || []}
            onChange={() => handleAttrChange(index, attr)}
          >
          </Select>
        ), addonBefore);
      default:
        return rendeCustomAddon(attr, (
          <InputNumber addonBefore={addonBefore} onChange={() => handleAttrChange(index, attr)} />
        ));
    }
  }

  // 只读输入框
  const renderReadOnlyInput = (type: string, defalutValue: any, addonBefore: string, attr: any, frontType?: string) => {
    if (type === 'list') {
      return (
        <div className='type-param-input'>
          <div className='param-addon-before'>{addonBefore}</div>
          <Select
            value={defalutValue}
            placeholder='默认值'
            options={attr.listEnums || []}
          >
          </Select>
        </div>
      )
    }
    if (frontType === 'code') {
      let height = 100;
      if (defalutValue) {
        const lineCount = defalutValue.split('\n').length; // 计算行数
        height = Math.min(lineCount * 22 + 68, 300); // 每行22px，最大300px
      }
      return (
        <div className='type-param-input'>
          <div className='param-addon-before'>{addonBefore}</div>
          <div className='param-code-editor readOnly' style={{ height }}>
            <CodeMirror
              value={formatCode(defalutValue)}
              options={{
                lineNumbers: false,
                theme: 'material',
                readOnly: true,
                cursorBlinkRate: -1,
              }}
              onBeforeChange={(editor, data, value) => { }}
            />
          </div>
        </div>
      )
    }
    return (
      <Input
        value={defalutValue}
        addonBefore={addonBefore}
        placeholder='默认值'
        readOnly
      />
    );
  }

  const renderParamInput = (attr: any, index: number) => {
    if (!attr) return (<></>);
    const { type, frontType } = attr;
    const _default = attr.default;
    if (!typeMap[currentEditType]) return;
    let addonBefore = typeMap[currentEditType][type];
    if (frontType && _.get(typeMap[currentEditType], frontType)) {
      addonBefore = typeMap[currentEditType][frontType];
    }
    if (!location.pathname.endsWith("/edit") && !location.pathname.endsWith("/template")) {
      return renderEditorInput(type, _default, addonBefore, attr, index, frontType);
    }
    return renderReadOnlyInput(type, _default, addonBefore, attr, frontType);
  }

  const findParam = useCallback(
    (id: string) => {
      const card = attrs.filter((c) => `${c.name}` === id)[0]
      return {
        card,
        index: attrs.indexOf(card),
      }
    },
    [attrs],
  )

  const moveParam = useCallback(
    (id: string, atIndex: number) => {
      if (!id) {
        setParamDragging(false);
        updateAttrs(attrs);
        return;
      }
      setParamDragging(true);
      const { card, index } = findParam(id)
      setAttrs(
        update(attrs, {
          $splice: [
            [index, 1],
            [atIndex, 0, card],
          ],
        }),
      )
    },
    [findParam, attrs, setAttrs],
  );

  const [dndArea, setDndArea] = useState();
  const handleRef = useCallback((node: any) => setDndArea(node), []);
  const html5Options = useMemo(
    () => ({ rootElement: dndArea }),
    [dndArea]
  );

  // 属性列表
  const renderParams = () => {
    return (
      <div className='types-content' ref={handleRef}>
        {(typeLoading || attrLoading) ?
          <div style={{ padding: '1.6rem' }}>
            <Spin />
          </div> :
          (currentEditDefaultData &&
            <DndProvider backend={HTML5Backend} options={html5Options}>
              <div className='type-items'>
                {(attrs && attrs.length > 0) ?
                  <Form form={attrForm}>
                    {attrs.map((attr, index) => (
                      <ParamItem
                        key={attr.name}
                        index={index}
                        attr={attr}
                        isActive={currentEditParam && currentEditParam.name === attr.name}
                        canOperate={location.pathname.endsWith("/edit")}
                        canDrag={currentEditType === 'type'}
                        moveParam={moveParam}
                        deleteParam={deleteTypeConfig}
                        editParam={editTypeConfig}
                        findParam={findParam}
                      >
                        {renderParamInput(attr, index)}
                      </ParamItem>)
                    )}
                  </Form> :
                  <Empty image={require('@/assets/images/search_empty.png')} />
                }
              </div>
              {props.route === 'type' &&
                <div className='param-btn'>
                  <Button className='btn-default' onClick={addParam} block icon={<i className='spicon icon-tianjia2'></i>}>
                    添加属性
                  </Button>
                </div>
              }
            </DndProvider>
          )
        }
      </div>
    );
  }

  // const renderCommon = () => {
  //   return (
  //     <div className='pdb-type-common'>
  //       <div className='pdb-type-common-item'>
  //         <span>开启版本控制： </span>
  //         <Switch
  //           value={currentEditDefaultData['x.type.version']}
  //           onChange={checked => {
  //             updateItemData({
  //               ...currentEditDefaultData,
  //               'x.type.version': checked
  //             });
  //           }}
  //           disabled
  //         />
  //       </div>
  //     </div>
  //   )
  // }

  // 复制id
  const copyId = (ref: any) => {
    if (!ref || !ref.current) return;
    ref.current.select();
    document.execCommand("copy");
  }

  const rightPanelTabs = [{
    key: 'params',
    label: '属性列表',
    children: renderParams(),
  }];

  if (currentEditType === 'type') {
    // rightPanelTabs.push({
    //   key: 'common',
    //   label: '高级配置',
    //   children: renderCommon()
    // });
  } else if (currentEditType === 'relation') {
    if (props.route === 'type' || location.pathname.endsWith("/template")) {
      rightPanelTabs.push({
        key: 'bind',
        label: '连接对象',
        children: (
          <RelationBind
            data={currentEditDefaultData['r.type.binds'] || []}
            update={updateBinds}
            readOnly={location.pathname.endsWith("/template")}
          />)
      });
    }
  } else if (props.route === 'object' && !location.pathname.endsWith("/template")) {
    rightPanelTabs.push({
      key: 'relation',
      label: '关系列表',
      children: (<RelationList source={currentEditModel as NodeItemData} loading={typeLoading || attrLoading} />)
    });
    // hasVersion && rightPanelTabs.push({
    //   key: 'version',
    //   label: '版本列表',
    //   children: (<VersionList source={currentEditDefaultData} loading={typeLoading || attrLoading} checkoutVesion={checkoutVersion} />)
    // });
  }

  const appName = Form.useWatch('name', infoForm),
    appId = Form.useWatch('uid', infoForm);

  const renderPanelForm = function () {
    if (!currentEditModel) {
      return (
        <Form
          form={infoForm}
          style={{ maxWidth: 600 }}
          autoComplete='off'
          layout='vertical'
        >
          <div className='pdb-app-info'>
            <Form.Item
              className='pdb-app-name'
              label={`${props.route === 'object' ? '项目' : '模板'}名称`}
              rules={[{ required: true, message: '' }]}
            >
              <div className='info-name'>
                <div className='info-name-hidden'>{appName}</div>
                <Form.Item name='name' label={''} rules={[{ required: true, message: '' }]}>
                  <Input.TextArea
                    ref={inputRef}
                    placeholder={'点击编辑名称'}
                    onBlur={changeName}
                    onPressEnter={changeName}
                  />
                </Form.Item>
              </div>
            </Form.Item>
            <Form.Item label='ID'>
              <Form.Item name='uid' label='' style={{ opacity: 0 }}>
                <Input ref={idRef} readOnly />
              </Form.Item>
              <div className='copy-item'>
                <span>{appId}</span>
                <i className='spicon icon-fuzhi' onClick={() => copyId(idRef)}></i>
              </div>
            </Form.Item>
            {props.route !== 'type' &&
              <Form.Item className='info-description' name='description' label={`${props.route === 'object' ? '项目' : '模板'}描述`} >
                <TextArea
                  onBlur={changeDescription}
                  onPressEnter={changeDescription}
                />
              </Form.Item>
            }
            {currentEditType === 'object' &&
              <Form.Item name='typeName' label='类型' >
                <Input bordered={false} readOnly />
              </Form.Item>
            }
            <Form.Item name='created' label='创建时间' >
              <Input bordered={false} readOnly />
            </Form.Item>
            <Form.Item name='lastChange' label='更改时间' >
              <Input bordered={false} readOnly />
            </Form.Item>
          </div>
        </Form>
      );
    }
    return (
      <Form
        form={infoForm}
        style={{ maxWidth: 600 }}
        autoComplete='off'
      >
        <div className='pdb-info'>
          <div className='info-name'>
            <Form.Item name='name' label='' rules={[
              { required: true, message: '名称不能为空' },
              {
                validator: async (_, value) => {
                  if (value.length > 50) {
                    throw new Error('类型名称最多支持50个字符');
                  }
                  if (currentEditType === 'object') return;
                  const _types = JSON.parse(JSON.stringify(currentEditType === 'type' ? types : relations));

                  if (_types && _types.findIndex((_type: any, index: number) =>
                    _type[currentEditType === 'type' ? "x.type.name" : "r.type.name"] === value &&
                    _type[currentEditType === 'type' ? "x.type.id" : "r.type.id"] !== currentEditModel.uid
                  ) > -1) {
                    throw new Error('该名称已被使用');
                  }
                }
              }
            ]} >
              <Input.TextArea
                ref={inputRef}
                placeholder={'点击编辑名称'}
                onBlur={changeName}
                onPressEnter={changeName}
                disabled={currentEditType !== 'object' && location.pathname.endsWith("/template") || !isEditing}
              />
            </Form.Item>
            <div className='info-name-hidden'>{appName}</div>
          </div>
          {showMore &&
            <>
              <div className='info-id'>
                <Form.Item name='uid' label='ID' >
                  <Input ref={idRef} bordered={false} readOnly />
                </Form.Item>
                <i className='spicon icon-fuzhi' onClick={() => copyId(idRef)}></i>
              </div>
              {currentEditType === 'object' &&
                <Form.Item name='typeName' label='类型' >
                  <Input bordered={false} readOnly />
                </Form.Item>
              }
              {currentEditType === 'relation' && props.route === "object" &&
                <Form.Item name='source' label='源对象' >
                  <Input bordered={false} readOnly />
                </Form.Item>
              }
              {currentEditType === 'relation' && props.route === "object" &&
                <Form.Item name='target' label='目标对象' >
                  <Input bordered={false} readOnly />
                </Form.Item>
              }
              {!(currentEditType === "relation" && props.route === "object") &&
                <>
                  <Form.Item name='created' label='创建时间' >
                    <Input bordered={false} readOnly />
                  </Form.Item>
                  <Form.Item name='lastChange' label='更改时间' >
                    <Input bordered={false} readOnly />
                  </Form.Item>
                </>
              }
            </>
          }
          <div className='info-show-more' onClick={() => setShowMore(!showMore)}>
            <span>{showMore ? '收起' : '查看更多'}</span>
            {showMore ? <UpCircleOutlined /> : <DownCircleOutlined />}
          </div>
        </div>
      </Form>
    );
  }

  /**
   * 版本相关，暂不支持
   */
  // const handleEditItem = function () {
  //   modal.confirm({
  //     title: "编辑将生成一个新版本数据实体，请确认是否修订？",
  //     okText: "确定",
  //     cancelText: "取消",
  //     onOk: function () {
  //       checkOutObject(currentEditModel?.uid, (success: boolean, response: any) => {
  //         if (success) {
  //           getCheckoutVersion(currentEditModel?.uid, (success: boolean, response: any) => {
  //             dispatch(setIsEditing(true));
  //             setCurrentEditDefaultData({ ...currentEditDefaultData, 'x_checkout': true });
  //             const graph = (window as any).PDB_GRAPH;
  //             const item = graph.findById(currentEditModel?.id);
  //             if (item) {
  //               graph?.updateItem(item, {
  //                 data: {
  //                   ...currentEditModel?.data,
  //                   'x_checkout': true
  //                 }
  //               });
  //             }
  //             success && setCheckoutVersion(response);
  //           });
  //         } else {
  //           notification.error({
  //             message: '检出对象失败',
  //             description: response.message || response.msg
  //           });
  //         }
  //       });
  //     }
  //   });
  // }

  // const handleCheckIn = function () {
  //   modal.confirm({
  //     title: "确定发布此数据实体吗？",
  //     okText: "确定",
  //     cancelText: "取消",
  //     onOk: function () {
  //       checkInObject(currentEditModel?.uid, (success: boolean, response: any) => {
  //         if (success) {
  //           dispatch(setIsEditing(false));
  //           setCurrentEditDefaultData({ ...currentEditDefaultData, 'x_checkout': false });
  //           const graph = (window as any).PDB_GRAPH;
  //           const item = graph.findById(currentEditModel?.id);
  //           if (item) {
  //             graph?.updateItem(item, {
  //               data: {
  //                 ...currentEditModel?.data,
  //                 'x_checkout': false
  //               }
  //             });
  //           }
  //         } else {
  //           notification.error({
  //             message: '发布对象失败',
  //             description: response.message || response.msg
  //           });
  //         }
  //       });
  //     }
  //   });
  // }

  // const handleDiscard = function () {
  //   discardObject(currentEditModel?.uid, (success: boolean, response: any) => {
  //     if (success) {
  //       dispatch(setIsEditing(false));
  //       setCurrentEditDefaultData({ ...currentEditDefaultData, 'x_checkout': false });
  //       setCheckoutVersion({});
  //       const graph = (window as any).PDB_GRAPH;
  //       const item = graph.findById(currentEditModel?.id);
  //       if (item) {
  //         graph?.updateItem(item, {
  //           data: {
  //             ...currentEditModel?.data,
  //             'x_checkout': false
  //           }
  //         });
  //       }
  //     } else {
  //       notification.error({
  //         message: '取消检出对象失败',
  //         description: response.message || response.msg
  //       });
  //     }
  //   });
  // }

  return (
    <div className='pdb-right-panel' style={{ display: currentEditModel || props.route !== 'type' ? 'block' : 'none' }}>
      <div className='pdb-panel-container'>
        {searchAround.show && !(location.pathname.endsWith("/template") || location.pathname.endsWith("/edit")) && <SearchAround />}
        {currentEditParam &&
          <ParamEditor
            params={currentEditParam}
            attrs={attrs}
            currentEditDefaultData={currentEditDefaultData}
            cancel={cancelEditParam}
            currentEditType={currentEditType}
          />
        }
        {multiEditModel && multiEditModel.length > 0 ?
          <MultiModelParamEditor /> :
          <PdbPanel title={panelTitle} direction='right' canCollapsed={true}>
            {renderPanelForm()}
            {currentEditDefaultData && currentEditType !== 'relation' &&
              <div className='pdb-node-metadata'>
                <NodeIconPicker
                  disabled={currentEditType !== 'object' && location.pathname.endsWith("/template")}
                  changeIcon={(icon: string) => changeNodeMetadata('icon', icon)}
                  currentIcon={_.get(JSON.parse(currentEditDefaultData[metadataKey] || '{}'), 'icon', '')}
                />
                <Divider type='vertical' />
                <NodeColorPicker
                  type='fill'
                  disabled={currentEditType !== 'object' && location.pathname.endsWith("/template")}
                  changeColor={(color: string) => changeNodeMetadata('color', color)}
                  currentColor={_.get(JSON.parse(currentEditDefaultData[metadataKey] || '{}'), 'color', defaultNodeColor.fill)}
                />
                <NodeColorPicker
                  type='border'
                  disabled={currentEditType !== 'object' && location.pathname.endsWith("/template")}
                  fillColor={_.get(JSON.parse(currentEditDefaultData[metadataKey] || '{}'), 'color', defaultNodeColor.fill)}
                  changeColor={(color: string, isDefault?: boolean) => changeNodeMetadata('borderColor', color, isDefault)}
                  currentColor={_.get(JSON.parse(currentEditDefaultData[metadataKey] || '{}'), 'borderColor')}
                />
              </div>
            }
            {currentEditModel && <Tabs className='pdb-right-panel-tabs' items={rightPanelTabs} />}
            {/* {hasVersion &&
              <div className='pdb-right-panel-footer'>
                {isEditing ?
                  <>
                    {_.get(checkoutVersion, 'tags.0.props.v_version', '').toString() === '1' ?
                      <Tooltip title="当前为初始版本，无法取消">
                        <Button style={{ marginRight: 5 }} disabled>取消</Button>
                      </Tooltip> :
                      <Button style={{ marginRight: 5 }} onClick={handleDiscard}>取消</Button>
                    }
                    <Button type='primary' onClick={handleCheckIn}>发布</Button>
                  </> :
                  <Button onClick={handleEditItem}>编辑</Button>
                }
              </div>
            } */}
          </PdbPanel>
        }
      </div>
      {contextHolder}
    </div>
  );
}