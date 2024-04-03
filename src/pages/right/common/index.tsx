import { Input, Button, Form, InputRef, Tabs, Spin, notification, InputNumber, Select, DatePicker, Modal, Table, Empty, Divider } from 'antd';
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
import _ from 'lodash';

import type { StoreState } from '@/store';
import ParamEditor from './ParamEditor';
import { defaultNodeColor, formatDate, typeMap } from '@/utils/common';
import { resizeGraph } from '@/utils/objectGraph';
import { getTypeByGraphId, setTypeByGraphId } from '@/actions/type';
import { setRelationByGraphId } from '@/actions/relation';
import { createObjectRelation, getObject, setObject, updateObjectInfo } from '@/actions/object';
import { updateTemplateInfo } from '@/actions/template';
import { AttrConfig, setTypeDetail, TypeConfig } from '@/reducers/type';
import { RelationConfig, setRelationDetail } from '@/reducers/relation';
import { CustomObjectConfig, ObjectGraphDataState, setObjectDetail } from '@/reducers/object';
import { NodeItemData, setCurrentEditModel } from '@/reducers/editor';
import { TemplateGraphDataState, setGraphData } from '@/reducers/template';
import PdbPanel from '@/components/Panel';
import NodeIconPicker from '@/components/NodeIconPicker';
import NodeColorPicker from '@/components/NodeColorPicker';
import MultiModelParamEditor from './MultiModelParamEditor';
import { ParamItem } from './ParamItem';
import RelationBind from '../relation/RelationBind';
import RelationList from '../object/RelationList';
import ConstraintList from '../constraint/ConstraintList';

import './index.less';
import SearchAround from '@/components/SearchAround';


const { Option } = Select;

interface RightProps {
  route: string // 路由
}
export default function Right(props: RightProps) {
  const routerParams = useParams(),
    dispatch = useDispatch(),
    idRef = useRef<any>(),
    location = useLocation();

  const graphData = useSelector((state: any) => state[props.route].graphData),
    currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel),
    multiEditModel = useSelector((state: StoreState) => state.editor.multiEditModel),
    searchAround = useSelector((state: StoreState) => state.editor.searchAround);

  const [currentEditDefaultData, setCurrentEditDefaultData] = useState(null as any), // 当前对象原始数据
    [currentEditType, setCurrentEditType] = useState(''), // 当前编辑的是对象，类型还是关系
    [attrs, setAttrs] = useState([] as any[]), // 属性列表
    [typeLoading, setTypeLoading] = useState(false),
    [currentEditParam, setCurrentEditParam] = useState(null as any), // 当前编辑类型属性
    [showMore, setShowMore] = useState(Boolean(!currentEditModel)), // 查看更多
    [metadataKey, setMetadataKey] = useState(''),
    [attrLoading, setAttrLoading] = useState(false),
    [panelTitle, setPanelTitle] = useState('');

  const [infoForm] = Form.useForm(),
    [attrForm] = Form.useForm();
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    setMetadataKey(props.route === 'object' ? 'x.metadata' : 'x.type.metadata');
  }, [props.route]);

  useEffect(() => {
    if (currentEditModel || !graphData || JSON.stringify(graphData) === '{}') return;
    if (props.route === 'template') {
      const { name, tid, last_change, created, description } = graphData as TemplateGraphDataState
      infoForm.setFieldsValue({
        name,
        uid: tid,
        lastChange: moment(last_change).format("YYYY-MM-DD HH:mm:ss"),
        created: moment(created).format("YYYY-MM-DD HH:mm:ss"),
        description
      });
    } else if (props.route === 'object') {
      const { name, id, gmt_modified, gmt_create, description, data } = graphData as ObjectGraphDataState
      infoForm.setFieldsValue({
        name,
        uid: id,
        lastChange: moment(gmt_modified).format("YYYY-MM-DD HH:mm:ss"),
        created: moment(gmt_create).format("YYYY-MM-DD HH:mm:ss"),
        description
      });
    }
  }, [graphData]);

  useEffect(() => {
    resizeGraph();
  }, [currentEditParam]);

  async function initData(currentEditType: string, currentEditDefaultData: any, currentEditModel: any) {
    let prevLabel = 'x.';
    let uid = '';
    let _currentEditDefaultData = JSON.parse(JSON.stringify(currentEditDefaultData));
    let _attrs: any = [];

    // 获取属性列表
    if (currentEditType === 'object') {
      if (_currentEditDefaultData['x.type.name']) {
        _attrs = await getObjectTypeInfo(_currentEditDefaultData['x.type.name']);
      }
      getObjectInfo(_currentEditDefaultData.uid, _attrs);
      uid = _currentEditDefaultData.uid;
    } else {
      if (currentEditType === 'type') {
        prevLabel = 'x.type.';
        _attrs = _currentEditDefaultData['x.type.attrs'] || [];
      } else {
        prevLabel = 'r.type.';
        const constraints = _currentEditDefaultData['r.type.constraints' || { 'r.binds': [] }];
        Object.keys(constraints).map(key => {
          if (!key.startsWith('r.')) {
            _attrs.push(constraints[key]);
          }
        });
      }
      _attrs && _attrs.forEach((attr: any) => {
        const { datetimeFormat, type, name } = attr;
        if (type === 'datetime') {
          _currentEditDefaultData[name] && Object.assign(_currentEditDefaultData, {
            [name]: dayjs(moment(_currentEditDefaultData[name]).format(datetimeFormat), datetimeFormat)
          });
        } else if (currentEditType === 'relation') {
          let value = attr.default;
          if (currentEditModel && currentEditModel.attrs && currentEditModel.attrs.hasOwnProperty(name)) {
            value = currentEditModel.attrs[name];
          }
          Object.assign(_currentEditDefaultData, {
            [name]: value
          });
        }
      });
      setAttrs(_attrs);
      uid = _currentEditDefaultData[prevLabel + 'name'];
    }

    setCurrentEditDefaultData(_currentEditDefaultData);
    const attFormValue = {};
    _attrs.forEach((attr: AttrConfig) => {
      const { type, name, datetimeFormat } = attr;
      let value = attr.default;
      if (currentEditModel && currentEditModel.attrs && currentEditModel.attrs.hasOwnProperty(name)) {
        value = currentEditModel.attrs[name];
      }
      if (type === 'datetime') {
        value && Object.assign(attFormValue, { [name]: dayjs(moment(value).format(datetimeFormat), datetimeFormat) });
      } else {
        Object.assign(attFormValue, { [name]: value });
      }
    });
    attrForm.setFieldsValue(attFormValue);

    const formValues = {
      name: currentEditModel?.name,
      uid,
      lastChange: _currentEditDefaultData ? formatDate(_currentEditDefaultData[prevLabel + 'last_change']) : '',
      created: _currentEditDefaultData ? formatDate(_currentEditDefaultData[prevLabel + 'created']) : ''
    };

    if (currentEditType === 'object') {
      Object.assign(formValues, {
        typeName: _currentEditDefaultData['x.type.name'] || ''
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
    if (currentEditModel) {
      if (currentEditModel.data.hasOwnProperty('x.type.name')) {
        panelTitle = '对象属性'
      } else if (currentEditModel.data.hasOwnProperty('r.type.name')) {
        panelTitle = '关系属性'
      }
    }
    setPanelTitle(panelTitle);
    if (!currentEditModel) {
      if (!graphData) return;
      if (props.route === 'template') {
        const { name, tid, last_change, created } = graphData as TemplateGraphDataState;
        infoForm.setFieldsValue({
          name,
          uid: tid,
          lastChange: last_change,
          created
        });
      } else if (props.route === 'object') {
        const { name, id, gmt_modified, gmt_create } = graphData as ObjectGraphDataState;
        infoForm.setFieldsValue({
          name,
          uid: id,
          lastChange: gmt_modified,
          created: gmt_create
        });
      }
      return;
    }
    const currentEditDefaultData = JSON.parse(JSON.stringify(currentEditModel.data || {}));

    // 判断当前编辑的类型
    let currentEditType = 'object';
    if (currentEditDefaultData['x.type.label']) {
      currentEditType = 'type';
    } else if (currentEditDefaultData['r.type.label']) {
      currentEditType = 'relation';
    }
    setCurrentEditType(currentEditType);
    initData(currentEditType, currentEditDefaultData, currentEditModel);

    return () => {
      setCurrentEditParam(null);
      setCurrentEditDefaultData(null);
      setCurrentEditType('');
    }
  }, [currentEditModel?.id]);

  const [paramDragging, setParamDragging] = useState(false);

  useEffect(() => {
    if (currentEditType === 'object' || !currentEditModel || paramDragging) return;
    updateAttrs(attrs);
  }, [attrs]);

  // 更新属性列表
  const updateAttrs = function (attrs: any) {
    if (!currentEditDefaultData) return;
    if (currentEditType === 'type') {
      if (JSON.stringify(currentEditDefaultData['x.type.attrs']) !== JSON.stringify(attrs)) {
        updateItemData({
          ...currentEditDefaultData,
          'x.type.attrs': attrs
        }, 'x.type.attrs');
      }
    } else {
      const constraints = currentEditDefaultData['r.type.constraints'];
      const new_constraints = JSON.parse(JSON.stringify(constraints || {}));
      Object.keys(new_constraints).forEach(key => {
        if (!key.startsWith('r.')) delete new_constraints[key];
      });
      attrs.forEach((attr: any) => {
        Object.assign(new_constraints, { [attr.name]: attr });
      });
      if (JSON.stringify(constraints) !== JSON.stringify(new_constraints)) {
        updateItemData({
          ...currentEditDefaultData,
          'r.type.constraints': new_constraints
        }, 'r.type.constraints');
      }
    }
  }

  // 关系类型 - 连接对象更新
  const updateBinds = function (newBind: any) {
    if (currentEditType === 'relation' && currentEditModel) {
      const constraints = JSON.parse(JSON.stringify(currentEditDefaultData['r.type.constraints'] || {}));
      if (JSON.stringify(newBind) !== JSON.stringify(constraints['r.binds'])) {
        Object.assign(constraints, { 'r.binds': newBind });
        updateItemData({
          ...currentEditDefaultData,
          'r.type.constraints': constraints
        }, 'r.type.constraints');
      }
    }
  }

  const getObjectInfo = function (uid: string, attrs: any) {
    setAttrLoading(true);
    getObject({ uid }, (success: boolean, response: any) => {
      if (success && response && response[0]) {
        setCurrentEditDefaultData(response[0]);
        const filedValue = response[0];
        const attFormValue = {};
        attrs && attrs.forEach((attr: AttrConfig) => {
          const { datetimeFormat, type, name } = attr;
          const value = filedValue[name] !== undefined ? filedValue[name] : attr.default;
          if (type === 'datetime') {
            value && Object.assign(attFormValue, { [name]: dayjs(moment(value).format(datetimeFormat), datetimeFormat) });
          } else {
            Object.assign(attFormValue, { [name]: value });
          }
        });
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
      getTypeByGraphId(routerParams?.id, typeName, (success: boolean, response: any) => {
        setTypeLoading(false);
        if (success) {
          const attrs = _.get(response[0], 'x.type.attrs', []);
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
  const updateItemData = function (data: any, key?: string, deleteConfig?: any) {
    if (currentEditType === 'type') {
      updateType(data);
    } else if (currentEditType === 'relation') {
      updateRelation(data);
    } else {
      updateObject(data, key, deleteConfig);
    }
  }

  // 更新对象类型
  const updateType = (type: TypeConfig) => {
    if (!(window as any).PDB_GRAPH || !currentEditModel?.id) return;
    const item = (window as any).PDB_GRAPH.findById(currentEditModel?.id);
    const timestamp = new Date().getTime();

    setTypeByGraphId(routerParams?.id, [type], (success: boolean, response: any) => {
      if (success) {
        const label = type['x.type.label'],
          name = type['x.type.name'];
        if (name !== currentEditModel.name) {
          const icon = _.get(JSON.parse(type['x.type.metadata'] || '{}'), 'icon', '');
          (window as any).PDB_GRAPH?.updateItem(item, {
            icon: icon,
            data: type,
            name: label
          });
        }

        setCurrentEditDefaultData(type);
        if (currentEditModel.dataIndex) {
          dispatch(setTypeDetail({ index: Number(currentEditModel.dataIndex), options: type }));
        } else {
          dispatch(setTypeDetail({ name, options: type }));
        }
        infoForm.setFieldValue('lastChange', formatDate(timestamp));
      } else {
        notification.error({
          message: '更新对象类型失败',
          description: response.message || response.msg
        });
      }
    });
  }

  // 更新关系类型
  const updateRelation = (relation: RelationConfig) => {
    if (!(window as any).PDB_GRAPH || !currentEditModel?.id) return;
    const graph = (window as any).PDB_GRAPH;
    if (props.route === "object") {
      const { source, target, relationName } = currentEditModel;
      const attrs = {}, modelAtts = {};

      Object.keys(relation).forEach(function (key) {
        if (!key.startsWith("r.type.")) {
          Object.assign(attrs, { [`${relationName}|${key}`]: _.get(relation, key) });
          Object.assign(modelAtts, { [key]: _.get(relation, key) });
        }
      });
      const config = [{
        uid: source,
        [relationName as string]: [{
          uid: target,
          ...attrs
        }]
      }];

      createObjectRelation(config, (success: boolean, response: any) => {
        if (success) {
          graph.updateItem(currentEditModel.id, { attrs: modelAtts });
        } else {
          notification.error({
            message: '更新关系属性失败',
            description: response.message || response.msg
          });
        }
      });
    } else {
      const item = (window as any).PDB_GRAPH.findById(currentEditModel?.id);
      const timestamp = new Date().getTime();

      setRelationByGraphId(routerParams?.id, [relation], (success: boolean, response: any) => {
        if (success) {
          const name = relation['r.type.name'],
            label = relation['r.type.label'];

          if (label !== currentEditModel.name) {
            (window as any).PDB_GRAPH?.updateItem(item, {
              data: relation,
              name: label
            });
          }

          setCurrentEditDefaultData(relation);
          if (currentEditModel.dataIndex) {
            dispatch(setRelationDetail({ index: Number(currentEditModel.dataIndex), options: relation }));
          } else {
            dispatch(setRelationDetail({ name, options: relation }));
          }
          infoForm.setFieldValue('lastChange', formatDate(timestamp));
        } else {
          notification.error({
            message: '更新关系类型失败',
            description: response.message || response.msg
          });
        }
      });
    }
  }

  // 更新对象
  const updateObject = (object: CustomObjectConfig, key?: string, deleteConfig?: any) => {
    if (!(window as any).PDB_GRAPH || !currentEditModel?.id) return;
    const item = (window as any).PDB_GRAPH.findById(currentEditModel?.id);
    const timestamp = new Date().getTime();

    const { id, currentParent, collapsed, ...newObject } = JSON.parse(JSON.stringify(object));
    delete newObject['x.id'];

    const params = { 'set': [newObject] };
    if (deleteConfig) Object.assign(params, { 'delete': deleteConfig });

    setObject(params, (success: boolean, response: any) => {
      if (success) {
        const name = object['x.name'];
        const icon = _.get(JSON.parse(object['x.metadata'] || '{}'), 'icon', '');
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
        if (currentEditModel.dataIndex) {
          dispatch(setObjectDetail({ index: Number(currentEditModel.dataIndex), options: object }));
        } else {
          dispatch(setObjectDetail({ uid: object.uid, options: object }));
        }
        infoForm.setFieldValue('lastChange', formatDate(timestamp));
      } else {
        notification.error({
          message: '更新实例失败',
          description: response.message || response.msg
        });
      }
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

  // 更新模板名称和描述
  const updateTemplate = (info: any) => {
    updateTemplateInfo(info, (success: boolean, response: any) => {
      if (success) {
        dispatch(setGraphData({ ...graphData, ...info }));
      } else {
        notification.error({
          message: '更新模板信息失败',
          description: response.message || response.msg
        });
      }
    });
  }

  // 更新项目信息
  const updateAppInfo = (info: any) => {
    updateObjectInfo(info, (success: boolean, response: any) => {
      if (success) {
        dispatch(setGraphData({ ...graphData, ...info }));
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
      if (props.route === 'template') {
        const { tid } = graphData as TemplateGraphDataState;
        updateTemplate({ tid, name, description });
      } else if (props.route === 'object') {
        const { id } = graphData as ObjectGraphDataState;
        updateAppInfo({ graphId: id, name, description });
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
        let nameLabel = 'x.name';
        if (currentEditType !== 'object') nameLabel = currentEditType === 'type' ? 'x.type.label' : 'r.type.label';
        updateItemData({
          ...currentEditDefaultData,
          [nameLabel]: name
        }, 'name');
      } else if (props.route === 'template') {
        const { tid } = graphData as TemplateGraphDataState;
        updateTemplate({ tid, name });
      } else if (props.route === 'object') {
        const { id } = graphData as ObjectGraphDataState;
        updateAppInfo({ graphId: id, name });
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
    if (props.route === 'template' && currentEditModel) {
      if (currentEditType === 'type') {
        const newGraphData = JSON.parse(JSON.stringify(graphData));
        const processes = _.get(newGraphData, `processes`);

        if (processes && processes[currentEditModel.uid as any]) {
          const newData = processes[currentEditModel.uid as any];
          const newMetadata = {
            ...JSON.parse(newData.metadata[metadataKey] || '{}'),
            [type]: value
          };
          if ((type === 'borderColor' && isDefault) ||
            (type === 'icon' && !value)) {
            delete newMetadata[type];
          }
          Object.assign(newData.metadata, {
            [metadataKey]: JSON.stringify(newMetadata)
          });
          Object.assign(newGraphData.processes, {
            [currentEditModel.uid as any]: newData
          });
          if (JSON.stringify(graphData) !== JSON.stringify(newGraphData)) dispatch(setGraphData(newGraphData));
          const icon = _.get(newMetadata, 'icon', '');
          (window as any).PDB_GRAPH.updateItem(currentEditModel.uid, {
            icon: icon,
            data: {
              ...newData.metadata,
              [metadataKey]: JSON.stringify(newMetadata)
            }
          });
          setCurrentEditDefaultData({
            ...newData.metadata,
            [metadataKey]: JSON.stringify(newMetadata)
          });
        }
      }
      return;
    }

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
    }, metadataKey);
  }

  // 添加类型属性
  const addParam = () => {
    setCurrentEditParam({ index: attrs.length, isNew: true });
  }

  // 关闭属性编辑框
  const cancelEditParam = (newAttrs?: any) => {
    setCurrentEditParam(null);
    newAttrs && setAttrs(newAttrs);
  }

  // 对象管理 - 属性值修改
  const handleAttrChange = debounce((index: number, attr?: any) => {
    attrForm.validateFields().then(values => {
      const newValues = { ...values };
      if (attr && attr.type === 'datetime' && values[attr.name]) {
        const datetime = values[attr.name].format(attr.datetimeFormat);
        Object.assign(newValues, { [attr.name]: new Date(datetime).getTime() });
      }
      const graph = (window as any).PDB_GRAPH;
      if (props.route === 'template' && currentEditModel) {
        if (currentEditType === 'type') {
          const newGraphData = JSON.parse(JSON.stringify(graphData));
          const processes = _.get(newGraphData, `processes`);

          if (processes && processes[currentEditModel.uid as any]) {
            const newData = processes[currentEditModel.uid as any];
            const newAttrs = newData.metadata['x.type.attrs'];
            newAttrs[index]['default'] = newValues[newAttrs[index]['name']];
            Object.assign(newData.metadata, {
              'x.type.attrs': newAttrs
            });
            Object.assign(newGraphData.processes, {
              [currentEditModel.uid as any]: newData
            });
            if (JSON.stringify(graphData) !== JSON.stringify(newGraphData)) dispatch(setGraphData(newGraphData));
            graph.updateItem(currentEditModel.uid, {
              data: {
                ...currentEditModel.data,
                'x.type.attrs': newAttrs,
                'x.type.label': newData.metadata['x.type.label']
              }
            });
          }
        } else {
          const newGraphData = JSON.parse(JSON.stringify(graphData));
          const connections = _.get(newGraphData, `connections`);
          const { data, source, target } = currentEditModel;
          let newData: any = null;
          for (let connection of connections) {
            if (connection['r.type.name'] === data['r.type.name'] && connection.src.process === source && connection.tgt.process === target) {
              Object.keys(newValues).forEach(key => {
                if (connection.metadata['r.type.constraints'][key]) {
                  Object.assign(connection.metadata['r.type.constraints'][key], { default: newValues[key] });
                }
              });
              newData = connection.metadata;
              break;
            }
          }
          if (!newData) return;
          Object.assign(newGraphData, { connections });

          if (JSON.stringify(graphData) !== JSON.stringify(newGraphData)) dispatch(setGraphData(newGraphData));
          graph.updateItem(currentEditModel.id, {
            data: newData
          });
        }
        return;
      }
      if (attr && attr.name && newValues[attr.name] === null) {
        delete newValues[attr.name];
        const newData = JSON.parse(JSON.stringify(currentEditDefaultData));
        delete newData[attr.name];
        updateItemData(newData, 'attr', [{ uid: currentEditDefaultData.uid, [attr.name]: null }]);
      } else {
        updateItemData({
          ...currentEditDefaultData,
          [attr.name]: newValues[attr.name]
        });
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

  // 关联属性 - 值编辑框
  const hanldeSelectRefer = (attr: any) => {
    console.log(attr);
    Modal.confirm({
      title: '请选择类型为"业务域"的对象实例：',
      icon: null,
      content: (
        <Table
          rowSelection={{
            type: 'radio',
            onChange: (selectedRowKeys: React.Key[], selectedRows: any) => {
            },
          }}
          columns={[{
            title: '实例名称',
            dataIndex: 'x.name',
            key: 'x.name'
          }, {
            title: '实例ID',
            dataIndex: 'uid',
            key: 'uid'
          }]}
          dataSource={[]}
        />
      )
    });
  }

  // 可编辑输入框
  const renderEditorInput = (type: string, defalutValue: any, addonBefore: string, attr: any, index: number) => {
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
      case 'refer':
        return rendeCustomAddon(attr, (
          <Input addonBefore={addonBefore} readOnly onClick={() => hanldeSelectRefer(attr)} />
        ))
      default:
        return rendeCustomAddon(attr, (
          <InputNumber addonBefore={addonBefore} onChange={() => handleAttrChange(index, attr)} />
        ));
    }
  }

  // 只读输入框
  const renderReadOnlyInput = (type: string, defalutValue: any, addonBefore: string, attr: any) => {
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
    const { type } = attr;
    const _default = attr.default;
    if (!typeMap[currentEditType]) return;
    const addonBefore = typeMap[currentEditType][type];

    return renderEditorInput(type, _default, addonBefore, attr, index);
    // return renderReadOnlyInput(type, _default, addonBefore, attr);
  }

  const editCurrentType = () => {
    (window as any).PDB.goto('/web/pdb/type', {
      type: currentEditType,
      uid: currentEditModel?.uid
    });
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
                        canOperate={currentEditType !== 'object' && props.route !== 'template'}
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
              {/* {currentEditType !== 'object' &&
                <div className='param-btn'>
                  {props.route !== 'template' ?
                    <Button className='btn-default' onClick={addParam} block icon={<i className='spicon icon-tianjia2'></i>}>
                      添加属性
                    </Button> :
                    <Button className='btn-default' onClick={editCurrentType} block>
                      编辑此类型
                    </Button>
                  }
                </div>
              } */}
            </DndProvider>
          )
        }
      </div>
    );
  }

  // 复制id
  const copyId = (ref: any) => {
    if (!ref || !ref.current) return;
    ref.current.select();
    document.execCommand("copy");
  }

  const changeTgtCardinality = _.debounce((value: number | null) => {
    if (!currentEditModel) return;
    const { source, target } = currentEditModel;
    const currentGraphData = JSON.parse(JSON.stringify(graphData));
    for (let i = 0; i < currentGraphData.connections.length; i++) {
      const currentConnection = currentGraphData.connections[i];
      if (currentConnection.src.process === source && currentConnection.tgt.process === target) {
        const constraintConfig = {
          type: 'max_tgt',
          value
        };
        if (currentConnection.metadata['r.constraints'] && currentConnection.metadata['r.constraints'].length > 0) {
          const firstConstraint = currentConnection.metadata['r.constraints'][0];
          if (firstConstraint.type === 'max_tgt') {
            firstConstraint.value = value;
          } else {
            currentConnection.metadata['r.constraints'].unshift(constraintConfig);
          }
        } else {
          Object.assign(currentConnection.metadata, {
            'r.constraints': [constraintConfig]
          })
        }
      }
    }
    if (JSON.stringify(graphData) !== JSON.stringify(currentGraphData)) dispatch(setGraphData(currentGraphData));
  }, 500);

  // 更改关系目标对象上限
  const handleChangeTgtCardinality = (value: number | null) => {
    if (!currentEditModel) return;
    const tgtCardinality = value === null ? Infinity : value;
    dispatch(setCurrentEditModel({ ...currentEditModel, tgtCardinality }));
    const graph = (window as any).PDB_GRAPH;
    const label = JSON.parse(JSON.stringify(currentEditModel.label));
    if (typeof label === 'object') label[2] = value;
    graph.updateItem(currentEditModel.id, { tgtCardinality, label });
    changeTgtCardinality(value);
  }

  const rightPanelTabs = [{
    key: 'params',
    label: '属性列表',
    children: renderParams(),
  }];

  if (currentEditType === 'relation') {
    if (props.route === 'type') {
      rightPanelTabs.push({
        key: 'bind',
        label: '连接对象',
        children: (
          <RelationBind
            data={currentEditDefaultData && currentEditDefaultData['r.type.constraints'] ? (currentEditDefaultData['r.type.constraints']['r.binds'] || []) : []}
            update={updateBinds}
            readOnly={false}
          />)
      });
    }
  } else if (props.route === 'object') {
    rightPanelTabs.push({
      key: 'relation',
      label: '关系列表',
      children: (<RelationList source={currentEditModel as NodeItemData} />)
    });
  } else if (props.route === 'template') {
    rightPanelTabs.push({
      key: 'constraint',
      label: '约束',
      children: (<ConstraintList />)
    });
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
            <div className='info-name-hidden'>{appName}</div>
            <Form.Item name='name' label='' rules={[{ required: true, message: '' }]} >
              <Input.TextArea
                ref={inputRef}
                placeholder={'点击编辑名称'}
                onBlur={changeName}
                onPressEnter={changeName}
                disabled={(currentEditModel.data || {}).hasOwnProperty("r.type.name")}
              />
            </Form.Item>
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
              {currentEditType === 'relation' &&
                <Form.Item name='source' label='源对象' >
                  <Input bordered={false} readOnly />
                </Form.Item>
              }
              {currentEditType === 'relation' &&
                <Form.Item name='target' label='目标对象' >
                  <Input bordered={false} readOnly />
                </Form.Item>
              }
              <Form.Item name='created' label='创建时间' >
                <Input bordered={false} readOnly />
              </Form.Item>
              <Form.Item name='lastChange' label='更改时间' >
                <Input bordered={false} readOnly />
              </Form.Item>
            </>
          }
          <div className='info-show-more' onClick={() => setShowMore(!showMore)}>
            <span>{showMore ? '收起' : '查看更多'}</span>
            {/* <i className={'spicon icon-expand' + (showMore ? ' up' : '')}></i> */}
            {showMore ? <UpCircleOutlined /> : <DownCircleOutlined />}
          </div>
        </div>
      </Form>
    );
  }

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
          />}
        {multiEditModel && multiEditModel.length > 0 ?
          <MultiModelParamEditor /> :
          <PdbPanel title={panelTitle} direction='right' canCollapsed={true}>
            {renderPanelForm()}
            {currentEditType === 'type' &&
              <div className='pdb-node-metadata'>
                <NodeIconPicker changeIcon={(icon: string) => changeNodeMetadata('icon', icon)} currentIcon={_.get(JSON.parse(currentEditDefaultData[metadataKey] || '{}'), 'icon', '')} />
                <Divider type='vertical' />
                <NodeColorPicker
                  type='fill'
                  changeColor={(color: string) => changeNodeMetadata('color', color)}
                  currentColor={_.get(JSON.parse(currentEditDefaultData[metadataKey] || '{}'), 'color', defaultNodeColor.fill)}
                />
                <NodeColorPicker
                  type='border'
                  fillColor={_.get(JSON.parse(currentEditDefaultData[metadataKey] || '{}'), 'color', defaultNodeColor.fill)}
                  changeColor={(color: string, isDefault?: boolean) => changeNodeMetadata('borderColor', color, isDefault)}
                  currentColor={_.get(JSON.parse(currentEditDefaultData[metadataKey] || '{}'), 'borderColor')}
                />
              </div>
            }
            {currentEditModel && <Tabs className='pdb-right-panel-tabs' items={rightPanelTabs} />}
          </PdbPanel>
        }
      </div>
    </div>
  );
}