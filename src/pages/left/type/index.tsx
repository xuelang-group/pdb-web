import type { MenuProps } from 'antd';
import { Dropdown, Empty, Form, Input, InputRef, Modal, notification, Segmented, Select, Spin, Tooltip, Tree, Switch, Radio, message, Alert } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import _, { find, findIndex, map } from 'lodash';
import Icon from '@ant-design/icons';

import { defaultCircleR, nodeStateStyle } from '@/g6/node';
import { setCurrentEditModel, setRelationLoading, setTypeLoading } from '@/reducers/editor';
import { AttrConfig, getDefaultTypeConfig, setTypes, setVersionModal, TypeConfig, TYPE_ID_PREFIX, TypePrototypeConfig, setCurrentVersion, setStateType } from '@/reducers/type';
import { getDefaultRelationConfig, RELATION_ID_PREFIX, setRelations } from '@/reducers/relation';
import store, { StoreState } from '@/store';
import { fittingString } from '@/utils/objectGraph';
import { defaultNodeColor, getBorderColor, getDefaultCopyName, getTextColor, nodeColorList, uuid } from '@/utils/common';
import { getTypeList, deleteType, addType, getTypeInfo, copyType, updateTypeVerisonControl, setType, getTypeVerisonList } from '@/actions/type';
import { addRelation, deleteRelation, getRelation } from '@/actions/relation';
import PdbPanel from '@/components/Panel';
import VersionModal from './versionModal';
import VersionState from './VersionState';
import './index.less';

const { Search } = Input;

const TypeVersionIcon = <Icon component={TypeIcon} />

export default function Left() {
  const location = useLocation();
  const dispatch = useDispatch();

  const [modal, contextHolder] = Modal.useModal();
  const searchRef = useRef<InputRef>(null);

  const graphData = useSelector((state: StoreState) => state.object.graphData),
    currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel),
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
    [prototype, setPrototype] = useState<TypeConfig | undefined>(),
    [currentTab, setCurrentTab] = useState('type');

  useEffect(() => {
    if (!graphData?.id) return;
    dispatch(setTypeLoading(true));
    getTypeList(graphData?.id, (success: boolean, response: any) => {
      dispatch(setTypeLoading(false));
      if (success) {
        dispatch(setTypes(response || []));
        const treeData = getTypeTreeData(response);
        setTreeData(treeData);
        setAllTreeData(treeData);

        if (currentEditModel && _.get(currentEditModel.data, 'x.type.id')) {
          handleSelectItem(currentEditModel.data, 'type');
        }
      } else {
        notification.error({
          message: '获取对象类型列表失败',
          description: response.message || response.msg
        });
      }
    });

    dispatch(setRelationLoading(true));
    getRelation(graphData?.id, null, (success: boolean, response: any) => {
      dispatch(setRelationLoading(false));
      if (success) {
        dispatch(setRelations(response || []));

        if (currentEditModel && _.get(currentEditModel.data, 'r.type.id')) {
          handleSelectItem(currentEditModel.data, 'relation');
        }
      } else {
        notification.error({
          message: '获取关系列表失败',
          description: response.message || response.msg
        });
      }
    });
  }, [graphData?.id]);

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
      const item = list[i], idKey = 'r.type.id', labelKey = 'r.type.name';
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
    types.forEach((type: TypeConfig) => {
      if (!type['x.type.version.prototype'] || !type['x.type.version.prototype']['x.type.id']) {
        const typeName = type['x.type.id'];
        const children: any = getTypeTreeChildren(types, typeName, expandedKeys);
        data.push({
          className: 'type-item isFolder',
          title: type['x.type.name'],
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
    types.forEach((val: TypeConfig) => {
      if (val['x.type.version.prototype'] && val['x.type.version.prototype']['x.type.id'] === typeName) {
        const typeName = val['x.type.id'],
          _children = getTypeTreeChildren(types, typeName, expandedKeys);
        children.push({
          className: 'type-item isLeaf',
          title: val['x.type.name'],
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

  // 添加、继承、复制对象类型回调函数
  const handleTypeCallback = (success: boolean, response: any, type: any) => {
    setModalLoading(false);
    const message = modalLabel[modalType] + typeLabel[operateItem.type];
    if (success) {
      let newTypes = JSON.parse(JSON.stringify(types));
      if (modalType === 'add' || modalType === 'copy' || modalType === 'inherit') {
        const newType = modalType === 'copy' ? response : Object.assign({}, type, { ...response[0] });
        handleSelectItem(newType, operateItem.type);
        newTypes.push(newType);
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
  };
  const createType = function (type: any) {
    addType(graphData?.id, [type], (success: boolean, response: any) => {      
      handleTypeCallback(success, response, type);
    });
  }

  // 删除对象类型
  const removeType = function (typeName: string, nameLabel: string) {
    deleteType(graphData?.id, typeName, (success: boolean, response: any) => {
      setModalLoading(false);
      isModalOpen && handleModalCancel();
      if (success) {
        const newTypes = types.filter((val: any) => val[nameLabel] !== typeName);
        dispatch(setTypes(newTypes));
        notification.success({
          message: '删除对象成功',
        });
        const currentEditModel = store.getState().editor.currentEditModel;
        if (currentEditModel && _.get(currentEditModel.data, nameLabel) === typeName) {
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
    addRelation(graphData?.id, [relation], (success: boolean, response: any) => {
      setModalLoading(false);
      const message = modalLabel[modalType] + typeLabel[operateItem.type];
      if (success) {
        let newRelations = JSON.parse(JSON.stringify(relations));
        if (modalType === 'add' || modalType === 'copy') {
          Object.assign(relation, { ...response[0] });
          handleSelectItem(relation, operateItem.type);
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
    deleteRelation(graphData?.id, typeName, (success: boolean, response: any) => {
      setModalLoading(false);
      isModalOpen && handleModalCancel();
      if (success) {
        const newRelations = relations.filter((val: any) => val[nameLabel] !== typeName);
        dispatch(setRelations(newRelations));
        notification.success({
          message: '删除关系成功',
        });
        const currentEditModel = store.getState().editor.currentEditModel;
        if (currentEditModel && _.get(currentEditModel.data, nameLabel) === typeName) {
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
      modalForm.setFieldValue('x.type.version', true);
    } else {
      item = getDefaultRelationConfig();
    }

    setModalOpen(true);
    setModalType('add');
    setOperateItem({ type, item });
  }

  // 点击左侧item，画布更新
  const handleSelectItem = (item: any, type: string) => {
    const graph = (window as any).PDB_GRAPH;
    if (!graph) return;
    graph.clear();

    const prevLabel = type === 'type' ? 'x.' : 'r.';
    const name = item[prevLabel + 'type.name'];
    const centerPoint = graph.getViewPortCenterPoint();
    const { text } = fittingString(name, defaultCircleR * 2);

    let commonConfig = {
      label: text,
      data: item
    };

    let node;
    if (type === 'type') {
      getTypeInfo(graphData?.id, [item['x.type.id']], (success: boolean, response: any) => {
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
        dispatch(setCurrentEditModel({ ...model }));
        dispatch(setCurrentVersion(undefined))
      });
    } else {
      getRelation(graphData?.id, [item['r.type.id']], (success: boolean, response: any) => {
        if (success && response && response[0]) {
          const data = response[0];
          Object.assign(commonConfig, { data });
        }
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
          source: sourceNode.get('id'),
          target: targetNode.get('id')
        });
        const model = node.getModel();
        dispatch(setCurrentEditModel({ ...model }));
      });
    }
  }

  // 右键菜单
  const typeMenus: MenuProps['items'] = [{
    label: '复制',
    key: 'copy',
  }, {
    label: '继承',
    key: 'inherit',
  }, {
    label: '删除',
    key: 'delete',
  }, {
    type: 'divider',
  }, {
    label: '发布',
    key: 'publish',
  }, {
    type: 'divider',
  }, {
    label: '版本控制',
    key: 'control',
  }, {
    label: '版本记录',
    key: 'history',
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
    'add': '新建',
    'publish': '发布',
    'history': '版本记录',
  };

  const typeLabel: any = {
    'type': '对象',
    'relation': '关系'
  }

  const handleDelete = (type: string, item: any) => {
    const title = modalLabel['delete'] + typeLabel[type] + '类型';
    const nameLabel = type === 'type' ? 'x.type.name' : 'r.type.name',
      idLabel = type === 'type' ? 'x.type.id' : 'r.type.id';
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
  }

  // 类型版本控制切换
  const onToggleControl = (typeId: string, checked: boolean, versionName?: string) => {
    if (!graphData?.id) {
      message.error("缺少 graphId ！")
      return
    }
    const params: {graphId: number; "x.type.id": string; "x.type.version": boolean; "x.type.version.name"?: string} = {
      graphId: graphData?.id,
      "x.type.id": typeId, 
      "x.type.version": checked,
    }
    versionName && (params["x.type.version.name"] = versionName)
    updateTypeVerisonControl(params, (success: boolean, response: any) => {
      setModalLoading(false);
      isModalOpen && handleModalCancel();
      if (success) {
        const newTypes: TypeConfig[] = JSON.parse(JSON.stringify(types));
        const targetTypeIndex = findIndex(newTypes, tp => tp['x.type.id'] == typeId);
        newTypes[targetTypeIndex]['x.type.version'] = checked        
        handleSelectItem(newTypes[targetTypeIndex], 'type');
        dispatch(setTypes(newTypes));
        notification.success({
          message: `${checked ? '开启' : '关闭'}版本控制成功`,
        });
      } else {
        notification.error({
          message: `${checked ? '开启' : '关闭'}版本控制失败`,
          description: response.message || response.msg
        });
      }
    })
  }

  // 关闭类型版本控制
  const closeVersionControl = (item: any) => {
    // 是否"锁定当前版本"被子对象继承
    const index = findIndex(types, (tp) => {
      const proto = tp['x.type.version.prototype']
      return !!proto && tp['x.type.version.reference'] == 1 && proto['x.type.id'] === item['x.type.id']
    });
    const content = index > -1 ? (
      <>
        <div>当前最新版本 V{item['x.type.version.name']} 已被引用，若关闭版本控制，系统将自动复制 V{item['x.type.version.name']} 为对象类型副本，并迁移所有引用子对象至该副本。</div>
        <div>关闭版本控制后，版本更新将暂停，现有版本记录会被保留，并可在重启版本控制后继续使用。</div>
      </>
    ) : '关闭版本控制后，版本更新将暂停，现有版本记录会被保留，并可在重启版本控制后继续使用。';
    
    modal.confirm({
      className: 'pdb-confirm-modal',
      title: '确定要关闭版本控制吗？',
      icon: <i className="pdb-confirm-icon spicon icon-jinggao1 text-warning"></i>,
      getContainer: () => (document.getElementsByClassName('pdb')[0] || document.body) as any,
      content: content,
      okText: "确定",
      cancelText: "取消",
      onOk: () => {
        setModalLoading(true);
        onToggleControl(item['x.type.id'], !item['x.type.version']);
      },
      onCancel: () => {
        setModalLoading(false);
      }
    });
  }

  // 开启类型版本控制
  const openVersionControl = (key: string, type: string, item: any) => {
    /** 正常情况下，版本控制从 关闭 --> 开启，直接打开开关即可。
     * 但想到 2 种特殊情况：
     * 特殊情况1：对象类型A关闭版本控制前，最新版本为V1.5.0。
     * 关闭版本控制后，又进行了对象A的若干属性更改并发布。此时再打开版本控制，需要设置并发布一个新版本。
     * 特殊情况2：对象类型A曾有过多版本，然后关闭了版本控制，此时B继承了A，继承时，无需选择版本引用方式；若后续，A又打开了版本控制，此时，B对A的版本引用方式自动设置为「跟踪最新版本」，用户可手动再进行修改
     */
    getTypeVerisonList(graphData.id, {
      'x.type.id': item['x.type.id']
    }, (success: boolean, response: any) => {
      if (success) {
        if (response.total > 1) {
          setModalType(key);
          setOperateItem({ type, item });
          setModalOpen(true);
        } else {
          onToggleControl(item['x.type.id'], true)
        }
      } else {
      } 
    })
  }

  const handleClickMenu = (menuInfo: any, type: string, item: any) => {
    const { key } = menuInfo;
    switch(key) {
      case 'delete':
        handleDelete(type, item);
        break;
      case 'history':
        handleSelectItem(item, 'type')
        dispatch(setVersionModal({open: true, type: item}));
        break;
      case 'reference-0':
      case 'reference-1':
        const refer = key === 'reference-1' ? 1 : 0;
        const currentType = Object.assign({}, item)
        currentType['x.type.version.reference'] = refer
        setType(graphData.id, [currentType], (success: boolean, response: any) => {
          if (success) {
            const newTypes: TypeConfig[] = JSON.parse(JSON.stringify(types));
            const targetTypeIndex = findIndex(newTypes, tp => tp['x.type.id'] == item['x.type.id']);
            newTypes[targetTypeIndex] = currentType
            dispatch(setTypes(newTypes));
            handleSelectItem(currentType, 'type');
            notification.success({
              message: `${refer ? '锁定当前' : '跟踪最新'}版本成功`,
            });
          } else {
            notification.error({
              message: `${refer ? '锁定当前' : '跟踪最新'}版本失败`,
              description: response.message || response.msg
            });
          }
        })
        break;
      case 'control':
        item['x.type.version'] ? closeVersionControl(item) : openVersionControl(key, type, item);
        break;
      case 'publish': // 检出|发布
        handleSelectItem(item, 'type')
        dispatch(setStateType(item))
        break;
      default:
        if (['copy', 'inherit'].includes(key)) {
          modalForm.setFieldValue('prototype', item['x.type.id']);
          modalForm.setFieldValue('x.type.version', item['x.type.version']);
          setPrototype(item);
          if (key === 'inherit') {
            // 继承自已开启版本控制的对象，则默认跟踪最新版本
            const refer = item['x.type.version'] ? 0 : item['x.type.version.reference']
            modalForm.setFieldValue('x.type.version.reference', refer);
          }
          if (key === 'copy') {
            const copyName = getDefaultCopyName(item['x.type.name'])
            modalForm.setFieldValue('name', copyName);
            // 被复制对象已开启版本控制，复制范围
            item['x.type.version'] && modalForm.setFieldValue('copyMethod', 0);
          }
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
          {list.length === 0 ?
            <div className='list-empty'>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div> :
            <div className='type-list relation-list'>
              {list.map((item: any, index: number) => {
                const label: any = item[prevLabel + 'type.name']
                const items = type === 'type' ? map(typeMenus, menu => {
                  if (menu?.key === 'control') {
                    return {
                      ...menu, 
                      extra: <Switch size="small" checkedChildren="ON" unCheckedChildren="OFF" checked={item.data['x.type.version']} />
                    }
                  }
                  if (menu?.key === 'history') {
                    return {
                      ...menu,
                      disabled: !item.data['x.type.version']
                    }
                  }
                  return menu
                }) : relationMenus;
                return (
                  <Dropdown
                    key={item['r.type.id']}
                    overlayClassName='pdb-dropdown-menu'
                    menu={{
                      items: items,
                      onClick: (menu: any) => handleClickMenu(menu, type, item)
                    }}
                    trigger={['contextMenu']}
                  >
                    <span
                      className={'type-item' + (currentEditModel && _.get(currentEditModel.data, prevLabel + 'type.id') === item[prevLabel + 'type.id'] ? ' selected' : '')}
                      onClick={() => handleSelectItem(item, type)}
                    >
                      <i className={'iconfont icon-' + (type === 'type' ? 'duixiangleixing' : 'guanxileixing')}></i>
                      {item.title || (<span className='type-item-label'>{label}</span>)}
                    </span>
                  </Dropdown>
                );
              })}
            </div>
          }
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
          {treeData.length === 0 ?
            <div className='list-empty'>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div> :
            <div className='type-list'>
              <Tree
                showLine={{ showLeafIcon: false }}
                treeData={treeData}
                selectedKeys={currentEditModel ? [_.get(currentEditModel.data, 'x.type.id', '')] : []}
                switcherIcon={() => (<span></span>)}
                titleRender={(item: any) => {
                  const items = map(typeMenus, menu => {
                    if (menu?.key === 'control') {
                      return {
                        ...menu, 
                        extra: <Switch style={{'pointerEvents': 'none'}} size="small" checkedChildren="ON" unCheckedChildren="OFF" checked={item.data['x.type.version']} />
                      }
                    }
                    if (menu?.key === 'history') {
                      return {
                        ...menu,
                        disabled: !item.data['x.type.version']
                      }
                    }
                    if (menu?.key === 'publish') {
                      return {
                        ...menu,
                        label: item.data['x.type.version.state'] ? '检出' : '发布'
                      }
                    }
                    return menu
                  });
                  const parentTypeId = item.data['x.type.version.prototype']['x.type.id']
                  const parentType = parentTypeId && find(types, {'x.type.id': parentTypeId});
                  const parentTypeVersion = parentType ? !!parentType['x.type.version'] : false;
                  const reference = item.data['x.type.version.reference']
                  if (parentTypeVersion) {
                    // 如果父对象开启了版本控制，其子对象的右键菜单选项中，会多一项“父对象引用方式”，可在级联菜单中，修改其引用父对象版本的方式。
                    items.push({type: 'divider'})
                    items.push({
                      key: 'reference',
                      label: '父对象引用方式',
                      children: [
                        {
                          key: 'reference-0',
                          label: '跟踪最新版本',
                          extra: reference == 0 ? <i className="spicon icon-xuanzhong1" /> : ''
                        },
                        {
                          key: 'reference-1',
                          label: '锁定当前版本',
                          extra: reference ? <i className="spicon icon-xuanzhong1" /> : ''
                        },
                      ],
                    })
                  }
                  const state = item.data["x.type.version.state"]
                  return (
                    <Dropdown
                      overlayClassName='pdb-dropdown-menu'
                      menu={{
                        items,
                        selectable: parentTypeVersion,
                        selectedKeys: parentTypeVersion && ('x.type.version.reference' in item.data) ? [`reference-${reference}`] : [],
                        onClick: (menu: any) => {
                          menu.domEvent.stopPropagation()
                          handleClickMenu(menu, 'type', item.data)
                        }
                      }}
                      trigger={['contextMenu']}
                    >
                      <span>
                        { !item.data['x.type.version']
                          ? <i className='iconfont icon-duixiangleixing'></i>
                          : TypeVersionIcon
                        }
                        <span className='type-item-label'>{item.title}
                          <Tooltip title={state ? '已发布' : '未发布'}>
                          <span className={`type-item-state ${state ? 'published' : ''}`}></span>
                          </Tooltip>
                        </span>
                      </span>
                    </Dropdown>
                  )
                }}
                expandedKeys={expandedKeys}
                blockNode
                showIcon
                onSelect={(selectedKeys: any, event: { node: any; }) => handleSelectItem((event.node as any).data, 'type')}
              />
            </div>
          }
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

  // const tabs = [{
  //   key: 'type',
  //   label: '对象',
  //   children: renderTypeTree('type')
  // }, {
  //   key: 'relation',
  //   label: '关系',
  //   children: renderList('relation')
  // }];

  // 弹窗 - 确定
  const handleModalOk = function () {
    modalForm.validateFields().then((values: { [x: string]: any; name?: any; prototype?: any; }) => {
      const { name } = values;
      const { type, item } = operateItem;
      if (!type || !item) return;
      setModalLoading(true);
      if (type === 'type') {
        const newType = {
          'x.type.id': uuid(TYPE_ID_PREFIX),
          'x.type.name': name,
        }
        switch(modalType) {
          case 'copy':
            copyType(graphData?.id, {
              ...newType,
              'x.type.version.name': values['x.type.version.name'],
              'copyMethod': values['copyMethod']
            }, (success: boolean, response: any) => {      
              handleTypeCallback(success, response, {});
            })
            break;
          case 'control':
            onToggleControl(item["x.type.id"], true, values["x.type.version.name"])
            break;
          default:
            Object.assign(newType, {
              'x.type.version.attrs': [],
              'x.type.version.prototype': item['x.type.version.prototype'] || {},
              'x.type.version': values['x.type.version'] === undefined ? true : values['x.type.version'],
            });
            if (modalType === 'add') {
              const colors = Object.keys(nodeColorList);
              Object.assign(newType, {
                'x.type.metadata': JSON.stringify({ color: colors[Math.floor(Math.random() * colors.length)] }),
              });
            }
            if (values.prototype) {
              const versionPrototype: TypePrototypeConfig = { 'x.type.id': values.prototype }
              if (prototype) {
                versionPrototype['x.type.version.id'] = prototype['x.type.version.id']
              }
              Object.assign(newType, {
                'x.type.version.prototype': versionPrototype, 
                'x.type.version.reference': values['x.type.version.reference']
              });
              const new_attrs = JSON.parse(JSON.stringify(item['x.type.version.attrs'] || []));
              new_attrs.forEach((attr: AttrConfig) => {
                if (!attr.override) {
                  Object.assign(attr, { override: values.prototype });
                }
              });
              Object.assign(newType, { 'x.type.version.attrs': new_attrs, 'x.type.version': item['x.type.version'] });
            }
            createType(newType);
        }
      } else {
        const newRelation = {
          'r.type.id': uuid(RELATION_ID_PREFIX),
          'r.type.name': name,
          'r.type.binds': item['r.type.binds'] || [],
          'r.type.attrs': item['r.type.attrs'] || []
        };
        createRelation(newRelation);
      }
    }).catch((errorInfo: any) => {
    });
  }

  // 弹窗 - 取消
  const handleModalCancel = function () {
    setModalType('');
    setModalOpen(false);
    setOperateItem({ type: '', item: {} });
    setPrototype(undefined);
    modalForm.resetFields();
  }

  const [modalForm] = Form.useForm();
  const copyMethod = Form.useWatch('copyMethod', modalForm);

  const handleChangeTab = function (activeKey: string) {
    setCurrentTab(activeKey);
  }

  const layout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
  };

  const onPrototypeChange = (typeId: string) => {
    const type = typeId ? types.find(item => item['x.type.id'] == typeId) : undefined
    if (type && type['x.type.version']) {
      modalForm.setFieldValue('x.type.version.reference', 0);
    }
    setPrototype(type)
  }

  const onValidateTypeName = async (_: any, value: string | any[]) => {
    const _types = JSON.parse(JSON.stringify(types));
    if (value.length > 50) {
      throw new Error('类型名称最多支持50个字符');
    } else if (_types && _types.findIndex((_type: any, index: number) => _type["x.type.name"] === value) > -1) {
      throw new Error('该名称已被使用');
    }
  }
  const onValidateRelationName = async (_: any, value: string | any[]) => {
    const _types = JSON.parse(JSON.stringify(relations));
    if (value.length > 50) {
      throw new Error('类型名称最多支持50个字符');
    } else if (_types && _types.findIndex((_type: any, index: number) => _type["r.type.name"] === value) > -1) {
      throw new Error('该名称已被使用');
    }
  }

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
        {modalType === 'control' && <Alert message="检测到内容更新，创建新版本后即可启用版本控制。" type="warning" showIcon />}
        <Form {...layout} form={modalForm}>
          {
            ['publish', 'control'].includes(modalType) ? (
              <Form.Item style={{marginBottom: 0}}
                name='x.type.version.name'
                label={`${!item['x.type.version.name'] ? '新' : ''}版本号`}
                rules={[{required: true, message: '版本号不能为空'}]} 
              >
                <Input addonBefore="V" placeholder={'仅允许数字，以 . 作为分隔符，例：1.0.0'} />
              </Form.Item>
            ) : (
            <Form.Item name="name" label="类型名称" rules={[
              { required: true, message: '类型名称不能为空' },
              {
                validator: type === 'type' ? onValidateTypeName : onValidateRelationName
              }
            ]}
              style={type === 'type' && (modalType !== 'copy' || prototype && prototype['x.type.version']) ? {} : { marginBottom: 0 }}
            >
              <Input />
            </Form.Item>
          )}
          {type === 'type' && ['add', 'inherit'].includes(modalType) && 
            <Form.Item name="prototype" label="继承自">
              <Select disabled={modalType === 'inherit'} onChange={onPrototypeChange}>
                {prototypeList.map((item: any) => (
                  <Select.Option key={item['x.type.id']} value={item['x.type.id']}>
                    {item['x.type.name']}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          }
          { 
            type === 'type' && prototype && prototype['x.type.version'] && (
              modalType === 'copy' ? <>
                <Form.Item name="copyMethod" label="复制范围">
                  <Radio.Group>
                    <Radio value={0}>最新版本</Radio>
                    <Radio value={1}>最新版本及其全部历史版本</Radio>
                  </Radio.Group>
                </Form.Item>
                {
                  copyMethod === 0 && <Form.Item name='x.type.version.name' label='版本号'>
                      <Input addonBefore="V" placeholder={'仅允许数字，以 . 作为分隔符，例：1.0.0'} />
                  </Form.Item>
                }
              </> : <Form.Item name="x.type.version.reference" label="版本引用方式">
                <Radio.Group>
                  <Radio value={0}>跟踪最新版本</Radio>
                  <Radio value={1}>锁定当前版本</Radio>
                </Radio.Group>
              </Form.Item>
            )
          }
          {type === 'type' && (['add', 'inherit'].includes(modalType) || prototype && prototype['x.type.version']) &&
            <Form.Item name="x.type.version" label="开启版本控制">
              <Switch disabled={modalType === 'copy'} checkedChildren="ON" unCheckedChildren="OFF" defaultChecked  />
            </Form.Item>
          }
        </Form>
      </Modal>
    )
  }

  return (
    <PdbPanel className='pdb-type-left' title='类型列表' direction='left' canCollapsed={true}>
      {/* <Tabs defaultActiveKey="type" items={tabs} activeKey={currentTab} onChange={handleChangeTab} /> */}
      <div className='pdb-type-list'>
        <Segmented
          value={currentTab}
          options={[{
            label: '对象',
            value: 'type'
          }, {
            label: '关系',
            value: 'relation'
          }]}
          onChange={handleChangeTab}
          block
        />
        {currentTab === 'type' ? renderTypeTree('type') : renderList('relation')}
      </div>
      {renderModal()}
      {contextHolder}
      <VersionModal types={types} />
      <VersionState />
    </PdbPanel>
  );
}

function TypeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" version="1.1" width="16" height="16" viewBox="0 0 16 16"><defs><clipPath id="master_svg0_3796_019418"><rect x="0" y="0" width="16" height="16" rx="0"/></clipPath></defs><g clip-path="url(#master_svg0_3796_019418)"><g><path d="M11.400000095367432,6.900000095367432C8.914720095367432,6.900000095367432,6.900000095367432,8.914720095367432,6.900000095367432,11.400000095367432C6.900000095367432,13.885280095367431,8.914720095367432,15.900000095367432,11.400000095367432,15.900000095367432C13.885280095367431,15.900000095367432,15.900000095367432,13.885280095367431,15.900000095367432,11.400000095367432C15.900000095367432,8.914720095367432,13.885280095367431,6.900000095367432,11.400000095367432,6.900000095367432ZM11.406000095367432,14.225500095367432L8.506000095367432,9.631000095367432L9.967000095367432,9.631000095367432L12.135500095367432,13.067000095367431L11.406000095367432,14.225500095367432ZM12.456000095367433,12.542000095367431L11.717000095367432,11.400000095367432L12.833000095367431,9.632000095367431L14.294000095367432,9.632000095367431L12.456000095367433,12.542000095367431L12.456000095367433,12.542000095367431Z" fill="#FFBF00" fill-opacity="1"/></g><g><path d="M8.972398447265626,6.59759L8.564068447265626,6.3625L8.564068447265626,5.31406C9.254698447265625,5.079689999999999,9.751568447265624,4.42656,9.751568447265624,3.65625C9.751568447265624,2.689063,8.968758447265625,1.90625,8.001568447265626,1.90625C7.034378447265625,1.90625,6.251568447265625,2.689063,6.251568447265625,3.65625C6.251568447265625,4.42656,6.748448447265625,5.079689999999999,7.439068447265625,5.31406L7.439068447265625,6.3625L5.314068447265625,7.58594C5.101568447265625,7.70781,4.970318447265625,7.93594,4.970318447265625,8.18125L4.970318447265625,10.55L4.142198447265625,11.02969C3.596878447265625,10.54844,2.785948447265625,10.44531,2.123443447265625,10.82969C1.287506347265625,11.31406,1.003131447265625,12.38285,1.482818447265625,13.21875C1.964069447265625,14.05465,3.028128447265625,14.34215,3.860948447265625,13.85935C4.525008447265625,13.47505,4.840628447265625,12.71875,4.6984484472656245,12.00315L5.459378447265625,11.56094L6.011428447265625,11.87897Q5.999998447265625,11.69185,5.999998447265625,11.5Q5.999998447265625,10.95039,6.093758447265625,10.43962L6.093758447265625,8.43438L7.739088447265625,7.48629Q8.314528447265625,6.94244,8.972398447265626,6.59759ZM8.000008447265625,2.90625C7.585948447265625,2.90625,7.250008447265625,3.24219,7.250008447265625,3.65625C7.250008447265625,4.07031,7.585948447265625,4.40625,8.000008447265625,4.40625C8.414068447265624,4.40625,8.750008447265625,4.07031,8.750008447265625,3.65625C8.750008447265625,3.24219,8.414068447265624,2.90625,8.000008447265625,2.90625ZM2.345318447265625,12.71875C2.550008447265625,13.07815,3.007818447265625,13.20005,3.364068447265625,12.99375C3.721878447265625,12.78755,3.843758447265625,12.32815,3.637508447265625,11.97035C3.432818447265625,11.61094,2.9750084472656253,11.48906,2.618758447265625,11.69531C2.260948447265625,11.90156,2.139068447265625,12.36095,2.345318447265625,12.71875Z" fill-rule="evenodd" fill="#0084FF" fill-opacity="1"/></g></g></svg>
  )
}