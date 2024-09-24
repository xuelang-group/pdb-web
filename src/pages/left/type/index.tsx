import { Checkbox, Dropdown, Form, Input, InputRef, Modal, notification, Select, Spin, Switch, Tabs, Tooltip, Tree } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { useParams } from 'react-router-dom';
import _ from 'lodash';

import { defaultCircleR, nodeStateStyle } from '@/g6/type/node';
import { setCurrentEditModel, setRelationLoading, setTypeLoading } from '@/reducers/editor';
import { AttrConfig, getDefaultTypeConfig, setTypes, TypeConfig } from '@/reducers/type';
import { getDefaultRelationConfig, setRelations } from '@/reducers/relation';
import store, { StoreState } from '@/store';
import { fittingString } from '@/utils/objectGraph';
import { defaultNodeColor, getBorderColor, getTextColor, nodeColorList, uuid } from '@/utils/common';
import { getTypeByGraphId, deleteTypeByGraphId, addTypeByGraphId } from '@/actions/type';
import { addRelationByGraphId, deleteRelationByGraphId, getRelationByGraphId } from '@/actions/relation';
import PdbPanel from '@/components/Panel';
import './index.less';

const { Search } = Input;

export default function Left(props: any) {
  const routerParams = useParams(),
    location = useLocation();
  const [modal, contextHolder] = Modal.useModal();
  const currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel),
    types = useSelector((state: StoreState) => state.type.data),
    relations = useSelector((state: StoreState) => state.relation.data),
    typeLoading = useSelector((state: StoreState) => state.editor.typeLoading),
    relationLoading = useSelector((state: StoreState) => state.editor.relationLoading);

  const [modalType, setModalType] = useState(''),
    [isModalOpen, setModalOpen] = useState(false),
    [modalLoading, setModalLoading] = useState(false),
    [operateItem, setOperateItem] = useState({ type: '', item: {} } as { type: string, item: any }),
    [allTreeData, setAllTreeData] = useState([]),
    [treeData, setTreeData] = useState([]),
    [expandedKeys, setExpandedKeys] = useState([] as any),
    [searchValue, setSearchValue] = useState(''),
    [filterValue, setFilterValue] = useState(''),
    [isSearched, setSearchedStatus] = useState(false),
    [currentTab, setCurrentTab] = useState('type');
  const searchRef = useRef<InputRef>(null);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setTypeLoading(true));
    getTypeByGraphId(routerParams?.id, null, (success: boolean, response: any) => {
      dispatch(setTypeLoading(false));
      if (success) {
        dispatch(setTypes(response || []));
        const treeData = getTypeTreeData(response);
        setTreeData(treeData);
        setAllTreeData(treeData);

        if (currentEditModel && currentEditModel.type === 'type') {
          const { dataIndex, data } = currentEditModel;
          handleSelectItem(data, 'type', Number(dataIndex));
        }
      } else {
        notification.error({
          message: '获取对象类型列表失败',
          description: response.message || response.msg
        });
      }
    });

    dispatch(setRelationLoading(true));
    getRelationByGraphId(routerParams?.id, null, (success: boolean, response: any) => {
      dispatch(setRelationLoading(false));
      if (success) {
        dispatch(setRelations(response || []));

        if (currentEditModel && currentEditModel.type === 'relation') {
          const { dataIndex, data } = currentEditModel;
          handleSelectItem(data, 'relation', Number(dataIndex));
        }
      } else {
        notification.error({
          message: '获取关系列表失败',
          description: response.message || response.msg
        });
      }
    });
  }, []);

  useEffect(() => {
    const treeData = getTypeTreeData(types);
    setTreeData(treeData);
    setAllTreeData(treeData);
  }, [types]);

  useEffect(() => {
    const newData: any = [];
    const loop = (data: any, newData: any): any => {
      data.forEach((item: any) => {
        const strTitle = item.title as string;
        let title: any = strTitle, index = strTitle.toLowerCase().indexOf(filterValue.toLowerCase());
        if (index > -1) {
          const beforeStr = strTitle.substring(0, index),
            innerStr = strTitle.substring(index, index + filterValue.length),
            afterStr = strTitle.slice(index + filterValue.length);
          title =
            index > -1 ? (
              <span>
                {beforeStr}
                <span className="pdb-searched-value">{innerStr}</span>
                {afterStr}
              </span>
            ) : strTitle;
        } else {
          index = item.key === filterValue ? 0 : -1;
        }

        if (item.children && item.children.length > 0) {
          const children: Array<any> = [];
          loop(item.children, children);
          if (index > -1 || children.length > 0) {
            newData.push({ ...item, title, children });
          }
        } else if (index > -1) {
          newData.push({ ...item, title });
        }
      });
    };
    if (filterValue) {
      loop(allTreeData, newData);
      setTreeData(newData);
    } else {
      setTreeData(allTreeData);
    }
  }, [filterValue]);

  const getRelationList = function (list: Array<any>, keyWord: string): Array<any> {
    var arr = [];
    for (var i = 0; i < list.length; i++) {
      const item = list[i], idKey = 'r.type.name', labelKey = 'r.type.label';
      if (item[idKey] === keyWord || item[labelKey].toLowerCase().indexOf(keyWord.toLowerCase()) > -1) {
        const label: any = item[labelKey], _index = label.toLowerCase().indexOf(keyWord.toLowerCase());
        let title = (<span className='type-item-label'>{label}</span>);
        if (_index > -1) {
          const beforeStr = label.substring(0, _index),
            innerStr = label.substring(_index, _index + keyWord.length),
            afterStr = label.slice(_index + keyWord.length);
          title = (
            <span className='type-item-label'>
              {beforeStr}
              <span className="pdb-searched-value">{innerStr}</span>
              {afterStr}
            </span>
          );
        }
        arr.push({ ...list[i], title });
      }
    }
    return arr;
  }

  const getTypeTreeData = function (types: Array<TypeConfig>) {
    const data: any = [], expandedKeys: Array<string> = [];
    types.forEach((type: TypeConfig, dataIndex: number) => {
      if (!type['x.type.prototype'] || type['x.type.prototype'].length === 0) {
        const typeName = type['x.type.name'];
        const children: any = getTypeTreeChildren(types, typeName, expandedKeys);
        data.push({
          dataIndex,
          className: 'type-item isFolder',
          title: type['x.type.label'],
          key: typeName,
          data: type,
          children,
        });
        if (children.length > 0) expandedKeys.push(typeName);
      }
    });
    setExpandedKeys(expandedKeys);
    return data;
  }

  const getTypeTreeChildren = function (types: Array<TypeConfig>, typeName: string, expandedKeys: Array<string>) {
    const children: any = [];
    types.forEach((val: TypeConfig, dataIndex: number) => {
      if (val['x.type.prototype'] && val['x.type.prototype'].findIndex(id => id === typeName) > -1) {
        const typeName = val['x.type.name'],
          _children = getTypeTreeChildren(types, typeName, expandedKeys);
        children.push({
          dataIndex,
          className: 'type-item isLeaf',
          title: val['x.type.label'],
          key: typeName,
          data: val,
          children: _children,
        });
        if (_children.length > 0) expandedKeys.push(typeName);
      }
    });
    return children;
  }

  useEffect(() => {
    const tab = _.get(location, 'state.tab', 'type');
    if (tab !== currentTab) setCurrentTab(tab);
  }, [location]);

  // 添加对象类型
  const createType = function (type: any) {
    addTypeByGraphId(routerParams?.id, [type], (success: boolean, response: any) => {
      setModalLoading(false);
      const message = modalLabel[modalType] + typeLabel[operateItem.type];
      if (success) {
        let newTypes = JSON.parse(JSON.stringify(types));
        if (modalType === 'add' || modalType === 'copy' || modalType === 'inherit') {
          Object.assign(type, { ...response[0] });
          handleSelectItem(type, operateItem.type, newTypes.length);
          newTypes.push(type);
          notification.success({
            message: `${message}成功`,
          });
        }
        isModalOpen && handleModalCancel();
        dispatch(setTypes(newTypes));
      } else {
        notification.error({
          message: `${message}失败`,
          description: response.message || response.msg
        });
      }
    });
  }

  // 删除对象类型
  const removeType = function (typeName: string, nameLabel: string) {
    deleteTypeByGraphId(routerParams?.id, typeName, (success: boolean, response: any) => {
      setModalLoading(false);
      isModalOpen && handleModalCancel();
      if (success) {
        const newTypes = types.filter((val: any) => val[nameLabel] !== typeName);
        dispatch(setTypes(newTypes));
        notification.success({
          message: '删除对象成功',
        });
        const currentEditModel = store.getState().editor.currentEditModel;
        if (currentEditModel && currentEditModel.data[nameLabel] === typeName) {
          dispatch(setCurrentEditModel(null));
          (window as any).PDB_GRAPH.clear();
        }
      } else {
        notification.error({
          message: '删除对象失败',
          description: response.message || response.msg
        });
      }
    })
  }

  // 添加关系类型
  const createRelation = function (relation: any) {
    addRelationByGraphId(routerParams?.id, [relation], (success: boolean, response: any) => {
      setModalLoading(false);
      const message = modalLabel[modalType] + typeLabel[operateItem.type];
      if (success) {
        let newRelations = JSON.parse(JSON.stringify(relations));
        if (modalType === 'add' || modalType === 'copy') {
          Object.assign(relation, { ...response[0] });
          handleSelectItem(relation, operateItem.type, newRelations.length);
          newRelations.push(relation);
          notification.success({
            message: `${message}成功`,
          });
        }
        isModalOpen && handleModalCancel();
        dispatch(setRelations(newRelations));
      } else {
        notification.error({
          message: `${message}失败`,
          description: response.message || response.msg
        });
      }
    });
  }

  // 删除关系类型
  const removeRelation = function (typeName: string, nameLabel: string) {
    deleteRelationByGraphId(routerParams?.id, typeName, (success: boolean, response: any) => {
      setModalLoading(false);
      isModalOpen && handleModalCancel();
      if (success) {
        const newRelations = relations.filter((val: any) => val[nameLabel] !== typeName);
        dispatch(setRelations(newRelations));
        notification.success({
          message: '删除关系成功',
        });
        const currentEditModel = store.getState().editor.currentEditModel;
        if (currentEditModel && currentEditModel.data[nameLabel] === typeName) {
          dispatch(setCurrentEditModel(null));
          (window as any).PDB_GRAPH.clear();
        }
      } else {
        notification.error({
          message: '删除关系失败',
          description: response.message || response.msg
        });
      }
    })
  }

  // 新增对象类型/关系类型
  const handleAddItem = function (type: string) {
    let item = {};
    if (type === 'type') {
      item = getDefaultTypeConfig();
    } else {
      item = getDefaultRelationConfig();
    }

    setModalOpen(true);
    setModalType('add');
    setOperateItem({ type, item });
  }

  // 点击左侧item，画布更新
  const handleSelectItem = (item: any, type: string, index: number) => {
    const graph = (window as any).PDB_GRAPH;
    if (!graph) return;
    graph.clear();

    const prevLabel = type === 'type' ? 'x.' : 'r.';
    const name = item[prevLabel + 'type.label'];
    const centerPoint = graph.getViewPortCenterPoint();
    const { text } = fittingString(name, defaultCircleR * 2);

    let commonConfig = {
      label: text,
      name,
      uid: item[prevLabel + 'type.name'],
      data: item
    };

    let node;
    if (type === 'type') {
      getTypeByGraphId(routerParams?.id, item['x.type.name'], (success: boolean, response: any) => {
        let fill = defaultNodeColor.fill, stroke = defaultNodeColor.border;
        if (success && response && response[0]) {
          const data = response[0];
          Object.assign(commonConfig, { data });
          const metadata = JSON.parse(data['x.type.metadata'] || '{}');
          fill = _.get(metadata, 'color', fill);
          stroke = getBorderColor(_.get(metadata, 'borderColor'), fill);
          const iconKey = _.get(metadata, 'icon', '');
          Object.assign(commonConfig, {
            icon: iconKey
          });
        }
        node = graph.addItem('node', {
          ...centerPoint,
          ...commonConfig,
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
        const model = node.getModel();
        dispatch(setCurrentEditModel({ ...model, dataIndex: index }));
      });
    } else {
      const { x, y } = centerPoint;
      const sourceNode = graph.addItem('node', {
        x: x - 100,
        y,
        label: '',
        style: {
          fill: 'transparent',
          stroke: 'transparent',
        }
      });
      const targetNode = graph.addItem('node', {
        x: x + 100,
        y,
        label: '',
        style: {
          fill: 'transparent',
          stroke: 'transparent',
        }
      });
      node = graph.addItem('edge', {
        ...commonConfig,
        label: name,
        relationName: commonConfig.uid,
        source: sourceNode.get('id'),
        target: targetNode.get('id')
      });
      const model = node.getModel();
      dispatch(setCurrentEditModel({ ...model, dataIndex: index }));
    }
  }

  // 右键菜单
  const typeMenus = [{
    label: '复制',
    key: 'copy',
  }, {
    label: '继承',
    key: 'inherit',
  }, {
    label: '删除',
    key: 'delete',
  }];

  const relationMenus = [{
    label: '复制',
    key: 'copy',
  }, {
    label: '删除',
    key: 'delete',
  }];

  const modalLabel: any = {
    'delete': '删除',
    'copy': '复制',
    'inherit': '继承',
    'add': '新建'
  };

  const typeLabel: any = {
    'type': '对象',
    'relation': '关系'
  }

  const handleClickMenu = (menuInfo: any, type: string, item: any) => {
    const { key } = menuInfo;

    if (key === 'delete') {
      const title = modalLabel['delete'] + typeLabel[type] + '类型';
      const nameLabel = type === 'type' ? 'x.type.label' : 'r.type.label',
        idLabel = type === 'type' ? 'x.type.name' : 'r.type.name';
      modal.confirm({
        className: 'pdb-confirm-modal',
        title,
        icon: <i className="pdb-confirm-icon spicon icon-jinggao1 text-warning"></i>,
        getContainer: () => (document.getElementsByClassName('pdb')[0] || document.body) as any,
        content: (
          <>
            <div className='pdb-confirm-info'>是否删除 “{item[nameLabel]}” {typeLabel[type]}类型 ?</div>
            {currentTab === "type" && <div className='pdb-confirm-description'>(当此类型被其他类型继承时，无法删除此类型)</div>}
          </>
        ),
        okButtonProps: {
          danger: true
        },
        okText: "确定删除",
        cancelText: "取消",
        onOk: () => {
          setModalLoading(true);
          if (type === 'type') {
            removeType(item[idLabel], idLabel);
          } else {
            removeRelation(item[idLabel], idLabel);
          }
        },
        onCancel: () => {
          setModalLoading(false);
        }
      });
    } else {
      if (key === 'inherit') {
        modalForm.setFieldValue('prototype', item['x.type.name']);
      }
      setModalType(key);
      setOperateItem({ type, item });
      setModalOpen(true);
    }
  }

  const handleSearch = function (value: string) {
    !isSearched && setSearchedStatus(true);
    setFilterValue(value);
  }

  const renderList = useCallback((type: string) => {
    const prevLabel = type === 'type' ? 'x.' : 'r.';
    let list = JSON.parse(JSON.stringify(relations));
    if (filterValue) {
      list = getRelationList(list, filterValue);
    }
    return (
      <div className='list-container'>
        <div className='list-header'>
          <div className='pdb-search'>
            <Search
              ref={searchRef}
              className='pdb-search-input'
              value={searchValue}
              placeholder='搜索类型名称或ID'
              allowClear={true}
              enterButton={<i className='spicon icon-sousuo2' onClick={() => handleSearch(_.get(searchRef, "current.input.value", ""))}></i>}
              onChange={(event: any) => {
                if (!isSearched) {
                  setSearchedStatus(true);
                } else if (!event.target.value) {
                  setSearchedStatus(false);
                  handleSearch('');
                }
                setSearchValue(event.target.value);
              }}
              onSearch={handleSearch}
            />
          </div>
          <Tooltip title="新建">
            <i className='operation-icon spicon icon-tianjia' onClick={() => handleAddItem(type)} />
          </Tooltip>
        </div>
        <div className='list-content'>
          <div className='type-list relation-list'>
            {list.map((item: any, index: number) => {
              const label: any = item[prevLabel + 'type.label']
              return (
                <Dropdown overlayClassName='pdb-dropdown-menu' menu={{ items: type === 'type' ? typeMenus : relationMenus, onClick: (menu) => handleClickMenu(menu, type, item) }} trigger={['contextMenu']}>
                  <span
                    className={'type-item' + (currentEditModel && currentEditModel.data && currentEditModel.data[prevLabel + 'type.name'] === item[prevLabel + 'type.name'] ? ' selected' : '')}
                    onClick={() => handleSelectItem(item, type, index)}
                  >
                    <i className={'iconfont icon-' + (type === 'type' ? 'duixiangleixing' : 'guanxileixing')}></i>
                    {item.title || (<span className='type-item-label'>{label}</span>)}
                  </span>
                </Dropdown>
              );
            })}
          </div>
          {list.length === 0 && isSearched && !relationLoading &&
            <div className='no-data-info'>
              <div className='pdb-alert pdb-alert-danger'><i className="spicon icon-jingshi"></i>搜索结果为空</div>
            </div>
          }
          {relationLoading && <Spin />}
        </div>
      </div>
    );
  }, [types, relations, searchValue, currentEditModel?.id, isSearched, filterValue, relationLoading]);

  const renderTypeTree = useCallback((type: string) => {
    return (
      <div className='list-container'>
        <div className='list-header'>
          <div className='pdb-search'>
            <Search
              ref={searchRef}
              className='pdb-search-input'
              value={searchValue}
              placeholder='搜索类型名称或ID'
              allowClear={true}
              enterButton={<i className='spicon icon-sousuo2' onClick={() => handleSearch(_.get(searchRef, "current.input.value", ""))}></i>}
              onChange={(event: any) => {
                if (!isSearched) {
                  setSearchedStatus(true);
                } else if (!event.target.value) {
                  setSearchedStatus(false);
                  handleSearch('');
                }
                setSearchValue(event.target.value);
              }}
              onSearch={handleSearch}
            />
          </div>
          <Tooltip title="新建">
            <i className='operation-icon spicon icon-tianjia' onClick={() => handleAddItem(type)} />
          </Tooltip>
        </div>
        <div className='list-content'>
          <div className='type-list'>
            <Tree
              showLine={{ showLeafIcon: false }}
              treeData={treeData}
              selectedKeys={currentEditModel && currentEditModel.data ? [currentEditModel.data['x.type.name']] : []}
              switcherIcon={() => (<span></span>)}
              titleRender={(item: any) => (
                <Dropdown overlayClassName='pdb-dropdown-menu' menu={{ items: typeMenus, onClick: (menu) => handleClickMenu(menu, 'type', item.data) }} trigger={['contextMenu']}>
                  <span>
                    <i className='iconfont icon-duixiangleixing'></i>
                    <span className='type-item-label'>{item.title}</span>
                  </span>
                </Dropdown>
              )}
              expandedKeys={expandedKeys}
              blockNode
              showIcon
              onSelect={(selectedKeys, event) => handleSelectItem((event.node as any).data, 'type', (event.node as any).dataIndex)}
            />
          </div>
          {treeData.length === 0 && isSearched && !typeLoading &&
            <div className='no-data-info'>
              <div className='pdb-alert pdb-alert-danger'><i className="spicon icon-jingshi"></i>搜索结果为空</div>
            </div>
          }
          {typeLoading && <Spin />}
        </div>
      </div>
    );
  }, [types, currentEditModel?.id, treeData, searchValue, typeLoading]);

  const tabs = [{
    key: 'type',
    label: '对象',
    children: renderTypeTree('type')
  }, {
    key: 'relation',
    label: '关系',
    children: renderList('relation')
  }];

  // 弹窗 - 确定
  const handleModalOk = function () {
    modalForm.validateFields().then(values => {
      const { name, prototype } = values;
      const { type, item } = operateItem;
      if (!type || !item) return;
      setModalLoading(true);
      if (type === 'type') {
        const newType = {
          'x.type.name': 'Type.' + uuid(),
          'x.type.attrs': [],
          'x.type.prototype': item['x.type.prototype'] || [],
          'x.type.label': name,
          'x.type.version': false
        }
        if (modalType === 'copy') {
          Object.assign(newType, { 'x.type.attrs': item['x.type.attrs'] || [], 'x.type.version': item['x.type.version'] });
        } else if (modalType === 'add') {
          const colors = Object.keys(nodeColorList);
          Object.assign(newType, {
            'x.type.metadata': JSON.stringify({ color: colors[Math.floor(Math.random() * colors.length)] }),
            'x.type.version': values['x.type.version']
          });
        }
        if (prototype) {
          Object.assign(newType, { 'x.type.prototype': [prototype] });
          const new_attrs = JSON.parse(JSON.stringify(item['x.type.attrs'] || []));
          new_attrs.forEach((attr: AttrConfig) => {
            if (!attr.override) {
              Object.assign(attr, { override: prototype });
            }
          });
          Object.assign(newType, { 'x.type.attrs': new_attrs, 'x.type.version': item['x.type.version'] });
        }
        createType(newType);
      } else {
        const newRelation = {
          'r.type.name': 'Relation.' + uuid(),
          'r.type.label': name,
          'r.type.constraints': item['r.type.constraints'] || { 'r.binds': [] },
          'r.type.prototype': item['r.type.prototype'] || [],
        };
        createRelation(newRelation);
      }
    }).catch(errorInfo => {
    });
  }

  // 弹窗 - 取消
  const handleModalCancel = function () {
    setModalType('');
    setModalOpen(false);
    setOperateItem({ type: '', item: {} });
    modalForm.resetFields();
  }

  const [modalForm] = Form.useForm();

  const handleChangeTab = function (activeKey: string) {
    setCurrentTab(activeKey);
  }

  const layout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
  };

  const renderModal = () => {
    const { type, item } = operateItem;
    const title = modalLabel[modalType] + typeLabel[type] + '类型';
    const prototypeList = type === 'type' ? types : relations;
    return (
      <Modal
        title={title}
        open={isModalOpen}
        okText="确定"
        cancelText="取消"
        confirmLoading={modalLoading}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      >
        <Form {...layout} form={modalForm}>
          <Form.Item name="name" label="类型名称" rules={[
            { required: true, message: '类型名称不能为空' },
            {
              validator: async (_, value) => {
                const _types = JSON.parse(JSON.stringify(prototypeList));
                if (value.length > 50) {
                  throw new Error('类型名称最多支持50个字符');
                } else if (_types && _types.findIndex((_type: any, index: number) => _type[type === 'type' ? "x.type.label" : "r.type.label"] === value) > -1) {
                  throw new Error('该名称已被使用');
                }
              }
            }
          ]}>
            <Input />
          </Form.Item>
          {type === 'type' && modalType !== 'copy' &&
            <Form.Item name="prototype" label="继承自">
              <Select disabled={modalType === 'inherit'}>
                {prototypeList.map((item: any) => (
                  <Select.Option value={item['x.type.name']}>
                    {item['x.type.label']}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          }
          {type === 'type' && modalType === 'add' &&
            <Form.Item name="x.type.version" label="开启版本控制">
              <Switch />
            </Form.Item>
          }
        </Form>
      </Modal>
    )
  }

  return (
    <PdbPanel className='pdb-type-left' title='类型列表' direction='left' canCollapsed={true}>
      <Tabs defaultActiveKey="type" items={tabs} activeKey={currentTab} onChange={handleChangeTab} />
      {renderModal()}
      {contextHolder}
    </PdbPanel>
  );
}