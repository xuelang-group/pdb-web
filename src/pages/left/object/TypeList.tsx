import { Input, InputRef, Tabs, Tree, Dropdown, Tooltip, Spin, Button, Segmented, Empty } from 'antd';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import _ from 'lodash';

import './index.less';
import { TypeConfig, TypePrototypeConfig } from '@/reducers/type';
import { setCurrentEditModel } from '@/reducers/editor';
import { StoreState } from '@/store';
import { useLocation } from 'react-router';

const { Search } = Input;

export default function TypeList() {
  const allTypes = useSelector((state: StoreState) => state.type.data);
  const allRelations = useSelector((state: StoreState) => state.relation.data);
  const typeLoading = useSelector((state: StoreState) => state.editor.typeLoading),
    relationLoading = useSelector((state: StoreState) => state.editor.relationLoading),
    currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel);
  const [currentTab, setCurrentTab] = useState('type');
  const [list, setList] = useState(allTypes),
    [relationList, setRelationList] = useState(allRelations),
    [isSearched, setSearchedStatus] = useState(false),
    [isRelSearched, setRelSearchedStatus] = useState(false),
    [expandedKeys, setExpandedKeys] = useState([] as any),
    [treeData, setTreeData] = useState([]),
    currentGraphTab = useSelector((state: StoreState) => state.editor.currentGraphTab);
  const searchRef = useRef<InputRef>(null);
  const routerParams = useParams(),
    location = useLocation(),
    navigate = useNavigate(),
    dispatch = useDispatch();

  // 右键菜单
  const typeMenus = [{
    label: '编辑',
    key: 'edit',
  }];

  const getTypeTreeChildren = function (types: Array<TypeConfig>, typeName: string, expandedKeys: Array<string>) {
    const children: any = [];
    types.forEach((val: TypeConfig, dataIndex: number) => {
      if (val['x.type.prototype'] && val['x.type.prototype'].findIndex(({ id }: TypePrototypeConfig) => id === typeName) > -1) {
        const typeName = val['x.type.id'],
          _children = getTypeTreeChildren(types, typeName, expandedKeys);
        children.push({
          dataIndex,
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

  const getTypeTreeData = function (types: Array<TypeConfig>) {
    const data: any = [], expandedKeys: Array<string> = [];
    types.forEach((type: TypeConfig, dataIndex: number) => {
      if (!type['x.type.prototype'] || type['x.type.prototype'].length === 0) {
        const typeName = type['x.type.id'];
        const children: any = getTypeTreeChildren(types, typeName, expandedKeys);
        data.push({
          dataIndex,
          className: 'type-item isFolder',
          title: type['x.type.name'],
          key: typeName,
          data: type,
          children,
        });
        if (children.length > 0) expandedKeys.push(typeName);
      }
    });
    return { data, expandedKeys };
  }

  useEffect(() => {
    const { data, expandedKeys } = getTypeTreeData(list);
    setTreeData(JSON.parse(JSON.stringify(data)));
    setExpandedKeys(expandedKeys);
  }, [list]);

  useEffect(() => {
    setList(JSON.parse(JSON.stringify(allTypes)));
  }, [allTypes]);

  useEffect(() => {
    setRelationList(JSON.parse(JSON.stringify(allRelations)));
  }, [allRelations]);

  const handleSearch = function (value: string) {
    let types = JSON.parse(JSON.stringify(allTypes));
    if (value) {
      types = getList(types, value);
    }
    setList(types);
  }

  const handleRelationSearch = function (value: string) {
    let relations = JSON.parse(JSON.stringify(allRelations));
    if (value) {
      relations = getRelationList(relations, value);
    }
    setRelationList(relations);
  }

  const handleChangeTab = function (activeKey: string) {
    setCurrentTab(activeKey);
  }

  const getList = function (list: Array<any>, keyWord: string): Array<any> {
    var arr = [];
    for (var i = 0; i < list.length; i++) {
      const item = list[i], idKey = 'x.type.id', labelKey = 'x.type.name';
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

  const getRelationList = function (relList: Array<any>, keyWord: string): Array<any> {
    var arr = [];
    for (var i = 0; i < relList.length; i++) {
      const item = relList[i], idKey = 'r.type.id', labelKey = 'r.type.name';
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
        arr.push({ ...relList[i], title });
      }
    }
    return arr;
  }

  const handleDragStart = function (event: any, type: TypeConfig) {
    event.dataTransfer.setData("object_drop_add", JSON.stringify(type));
  }

  const handleClickMenu = function (id: any, tab: string, item?: any) {
    navigate(`/${id}/edit`, { state: { tab } });
    dispatch(setCurrentEditModel(item ? { ...item, name: item.title || item.name, type: tab } : null));
  }

  const handleSelectItem = function (data: any) {
    const graph = (window as any).PDB_GRAPH;
    if (!graph || data.length === 0 || !location.pathname.endsWith("/template")) return;
    const id = data[0];
    const item = graph.findById(id);
    if (item && item.getModel()) {
      if (currentEditModel && currentEditModel.id) {
        const currentItem = graph.findById(currentEditModel.id);
        if (currentItem) currentItem.setState('selected', false);
      }
      const { sourceNode, targetNode, ...otherModel } = item.getModel();
      dispatch(setCurrentEditModel(otherModel));
      item.setState('selected', true);
      graph.focusItem(item);
    }
  }

  const renderTypeTree = useCallback((type: string) => {
    return (
      <div className='list-container'>
        <div className='list-header'>
          <div className='pdb-search'>
            <Search
              ref={searchRef}
              className='pdb-search-input'
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
              }}
              onPressEnter={(event: any) => handleSearch(event.target.value)}
            />
          </div>
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
                selectedKeys={currentEditModel && currentEditModel.data ? [currentEditModel.data['x_type_name']] : []}
                switcherIcon={() => (<span></span>)}
                titleRender={(item: any) => (
                  <Dropdown
                    overlayClassName='pdb-dropdown-menu'
                    menu={{ items: typeMenus, onClick: (menu) => handleClickMenu(routerParams.id, 'type', item) }}
                    trigger={['contextMenu']}
                  >
                    <span
                      className='type-item'
                      // draggable={currentGraphTab === 'main'}
                      onDragStart={event => handleDragStart(event, item.data)}
                    >
                      <i className='iconfont icon-duixiangleixing'></i>
                      <span className='type-item-label'>{item.title}</span>
                    </span>
                  </Dropdown>
                )}
                expandedKeys={expandedKeys}
                blockNode
                showIcon
                onSelect={(selectedKeys, event) => handleSelectItem(selectedKeys)}
              />
            </div>
          }
          {list.length === 0 && isSearched && !typeLoading &&
            <div className='no-data-info'>
              <div className='pdb-alert pdb-alert-danger'><i className="spicon icon-jingshi"></i>搜索结果为空</div>
            </div>
          }
          {typeLoading && <Spin />}
        </div>
        <div className='list-footer'>
          <Button
            icon={<svg width="16" height="16" viewBox="0 0 16 16"><defs><clipPath id="master_svg0_3542_16775"><rect x="0" y="0" width="16" height="16" rx="0" /></clipPath></defs><g clip-path="url(#master_svg0_3542_16775)"><g><path d="M13.75,1.75L2.25,1.75C1.973437,1.75,1.75,1.973437,1.75,2.25L1.75,13.75C1.75,14.0266,1.973437,14.25,2.25,14.25L13.75,14.25C14.0266,14.25,14.25,14.0266,14.25,13.75L14.25,2.25C14.25,1.973437,14.0266,1.75,13.75,1.75ZM13.125,13.125L2.875,13.125L2.875,2.875L13.125,2.875L13.125,13.125ZM7.6875,6.25L10.5625,6.25C10.63125,6.25,10.6875,6.19375,10.6875,6.125L10.6875,5.375C10.6875,5.30625,10.63125,5.25,10.5625,5.25L7.6875,5.25C7.61875,5.25,7.5625,5.30625,7.5625,5.375L7.5625,6.125C7.5625,6.19375,7.61875,6.25,7.6875,6.25ZM7.6875,8.5L10.5625,8.5C10.63125,8.5,10.6875,8.44375,10.6875,8.375L10.6875,7.625C10.6875,7.55625,10.63125,7.5,10.5625,7.5L7.6875,7.5C7.61875,7.5,7.5625,7.55625,7.5625,7.625L7.5625,8.375C7.5625,8.44375,7.61875,8.5,7.6875,8.5ZM7.6875,10.75L10.5625,10.75C10.63125,10.75,10.6875,10.69375,10.6875,10.625L10.6875,9.875C10.6875,9.80625,10.63125,9.75,10.5625,9.75L7.6875,9.75C7.61875,9.75,7.5625,9.80625,7.5625,9.875L7.5625,10.625C7.5625,10.69375,7.61875,10.75,7.6875,10.75ZM5.3125,5.75C5.3125,6.09518,5.59232,6.375,5.9375,6.375C6.28268,6.375,6.5625,6.09518,6.5625,5.75C6.5625,5.40482,6.28268,5.125,5.9375,5.125C5.59232,5.125,5.3125,5.40482,5.3125,5.75ZM5.3125,8C5.3125,8.34518,5.59232,8.625,5.9375,8.625C6.28268,8.625,6.5625,8.34518,6.5625,8C6.5625,7.65482,6.28268,7.375,5.9375,7.375C5.59232,7.375,5.3125,7.65482,5.3125,8ZM5.3125,10.25C5.3125,10.59518,5.59232,10.875,5.9375,10.875C6.28268,10.875,6.5625,10.59518,6.5625,10.25C6.5625,9.90482,6.28268,9.625,5.9375,9.625C5.59232,9.625,5.3125,9.90482,5.3125,10.25Z" fill="#1C2126" fill-opacity="1" /></g></g></svg>}
            onClick={() => handleClickMenu(routerParams.id, 'type')}
          >
            类型管理
          </Button>
        </div>
      </div>
    );
  }, [treeData, routerParams?.id, typeLoading, currentEditModel, location.pathname]);

  const renderRelationTree = useCallback((type: string) => {
    const prevLabel = type === 'type' ? 'x.' : 'r.';
    let relList = JSON.parse(JSON.stringify(relationList));
    return (
      <div className='list-container'>
        <div className='list-header'>
          <div className='pdb-search'>
            <Search
              ref={searchRef}
              className='pdb-search-input'
              placeholder='搜索类型名称或ID'
              allowClear={true}
              enterButton={<i className='spicon icon-sousuo2' onClick={() => handleRelationSearch(_.get(searchRef, "current.input.value", ""))}></i>}
              onChange={(event: any) => {
                if (!isRelSearched) {
                  setRelSearchedStatus(true);
                } else if (!event.target.value) {
                  setRelSearchedStatus(false);
                  handleRelationSearch('');
                }
              }}
              onPressEnter={(event: any) => handleRelationSearch(event.target.value)}
            />
          </div>
        </div>
        <div className='list-content'>
          {relList.length === 0 ?
            <div className='list-empty'>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div> :
            <div className='type-list relation-list'>
              {relList.map((item: any, index: number) => {
                const label: any = item[prevLabel + 'type.name']
                return (
                  <Dropdown
                    overlayClassName='pdb-dropdown-menu'
                    menu={{
                      items: typeMenus,
                      onClick: (menu) => handleClickMenu(routerParams.id, 'relation', {
                        data: item,
                        dataIndex: index,
                        title: item['r.type.name'],
                        key: item['r.type.id']
                      })
                    }}
                    trigger={['contextMenu']}
                  >
                    <span
                      className='type-item'
                    >
                      <i className={'iconfont icon-' + (type === 'type' ? 'duixiangleixing' : 'guanxileixing')}></i>
                      {(<span className='type-item-label'>{label}</span>)}
                    </span>
                  </Dropdown>
                );
              })}
            </div>
          }
          {relList.length === 0 && isRelSearched && !relationLoading &&
            <div className='no-data-info'>
              <div className='pdb-alert pdb-alert-danger'><i className="spicon icon-jingshi"></i>搜索结果为空</div>
            </div>
          }
          {relationLoading && <Spin />}
        </div>
        <div className='list-footer'>
          <Button
            icon={<svg width="16" height="16" viewBox="0 0 16 16"><defs><clipPath id="master_svg0_3542_16775"><rect x="0" y="0" width="16" height="16" rx="0" /></clipPath></defs><g clip-path="url(#master_svg0_3542_16775)"><g><path d="M13.75,1.75L2.25,1.75C1.973437,1.75,1.75,1.973437,1.75,2.25L1.75,13.75C1.75,14.0266,1.973437,14.25,2.25,14.25L13.75,14.25C14.0266,14.25,14.25,14.0266,14.25,13.75L14.25,2.25C14.25,1.973437,14.0266,1.75,13.75,1.75ZM13.125,13.125L2.875,13.125L2.875,2.875L13.125,2.875L13.125,13.125ZM7.6875,6.25L10.5625,6.25C10.63125,6.25,10.6875,6.19375,10.6875,6.125L10.6875,5.375C10.6875,5.30625,10.63125,5.25,10.5625,5.25L7.6875,5.25C7.61875,5.25,7.5625,5.30625,7.5625,5.375L7.5625,6.125C7.5625,6.19375,7.61875,6.25,7.6875,6.25ZM7.6875,8.5L10.5625,8.5C10.63125,8.5,10.6875,8.44375,10.6875,8.375L10.6875,7.625C10.6875,7.55625,10.63125,7.5,10.5625,7.5L7.6875,7.5C7.61875,7.5,7.5625,7.55625,7.5625,7.625L7.5625,8.375C7.5625,8.44375,7.61875,8.5,7.6875,8.5ZM7.6875,10.75L10.5625,10.75C10.63125,10.75,10.6875,10.69375,10.6875,10.625L10.6875,9.875C10.6875,9.80625,10.63125,9.75,10.5625,9.75L7.6875,9.75C7.61875,9.75,7.5625,9.80625,7.5625,9.875L7.5625,10.625C7.5625,10.69375,7.61875,10.75,7.6875,10.75ZM5.3125,5.75C5.3125,6.09518,5.59232,6.375,5.9375,6.375C6.28268,6.375,6.5625,6.09518,6.5625,5.75C6.5625,5.40482,6.28268,5.125,5.9375,5.125C5.59232,5.125,5.3125,5.40482,5.3125,5.75ZM5.3125,8C5.3125,8.34518,5.59232,8.625,5.9375,8.625C6.28268,8.625,6.5625,8.34518,6.5625,8C6.5625,7.65482,6.28268,7.375,5.9375,7.375C5.59232,7.375,5.3125,7.65482,5.3125,8ZM5.3125,10.25C5.3125,10.59518,5.59232,10.875,5.9375,10.875C6.28268,10.875,6.5625,10.59518,6.5625,10.25C6.5625,9.90482,6.28268,9.625,5.9375,9.625C5.59232,9.625,5.3125,9.90482,5.3125,10.25Z" fill="#1C2126" fill-opacity="1" /></g></g></svg>}
            onClick={() => handleClickMenu(routerParams.id, 'relation')}
          >
            类型管理
          </Button>
        </div>
      </div>
    );
  }, [relationList, routerParams?.id, relationLoading]);

  return (
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
      {currentTab === 'type' ? renderTypeTree('type') : renderRelationTree('relation')}
    </div>
  )
}