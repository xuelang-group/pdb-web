import { Input, InputRef, notification, Tabs, Tree } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import _ from 'lodash';

import { StoreState } from '@/store';
import { getType } from '@/actions/type';
import { getRelation } from '@/actions/relation';
import { setTypes, TypeConfig } from '@/reducers/type';
import { RelationConfig, setRelations } from '@/reducers/relation';
import PdbPanel from '@/components/Panel';

import './index.less';

const { Search } = Input;
export default function Left() {
  const types = useSelector((state: StoreState) => state.type.data);
  const relations = useSelector((state: StoreState) => state.relation.data);
  const disableType = useSelector((state: StoreState) => state.template.disableType);

  const [searchValue, setSearchValue] = useState(''),
    [filterValue, setFilterValue] = useState(''),
    [isSearched, setSearchedStatus] = useState(false),
    [allTreeData, setAllTreeData] = useState([]),
    [treeData, setTreeData] = useState([]),
    [expandedKeys, setExpandedKeys] = useState([] as any);
  const searchRef = useRef<InputRef>(null);

  const dispatch = useDispatch(),
    routerParams = useParams();

  useEffect(() => {
    getType(null, (success: boolean, response: any) => {
      if (success) {
        const treeData = getTypeTreeData(response);
        setTreeData(treeData);
        setAllTreeData(treeData);
        dispatch(setTypes(response || []));
      } else {
        notification.error({
          message: '获取对象类型列表失败',
          description: response.message || response.msg
        });
      }
    });
    getRelation(null, (success: boolean, response: any) => {
      if (success) {
        dispatch(setRelations(response || []));
      } else {
        notification.error({
          message: '获取关系列表失败',
          description: response.message || response.msg
        });
      }
    });
  }, [routerParams?.id]);

  useEffect(() => {
    const treeData = getTypeTreeData(types);
    setTreeData(treeData);
    setAllTreeData(treeData);
  }, [types]);

  useEffect(() => {
    const newData: any = new Array();
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
          const children = new Array();
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

  // 对象 - 拖拽
  const handleDragStart = function (event: any, item: TypeConfig) {
    event.dataTransfer.setData("template_drop_add", JSON.stringify(item));
  }

  const [selectedRelation, setSelectedRelation] = useState(null as any);

  // 关系 - 选中
  const handleSelectRelation = function (item: RelationConfig, type: string) {
    if (type === 'relation') {
      setSelectedRelation(item);
      (window as any).PDB_GRAPH.emit('edge:enable', item);
    }
  }

  const handleSearch = function (value: string) {
    !isSearched && setSearchedStatus(true);
    setFilterValue(value);
  }

  const renderList = (type: string) => {
    const keyLabel = type === 'type' ? 'x.type.name' : 'r.type.name',
      nameLabel = type === 'type' ? 'x.type.label' : 'r.type.label';
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
        </div>
        <div className='list-content'>
          <div className='relation-list'>
            {list.map((item: any, index: number) => (
              <div
                className={'type-item' + (selectedRelation && selectedRelation[keyLabel] === item[keyLabel] ? ' selected' : '') + (disableType[item[keyLabel]] ? ' disabled' : '')}
                draggable={type === 'type' && !disableType[item[keyLabel]]}
                onDragStart={event => handleDragStart(event, item)}
                onClick={() => handleSelectRelation(item, type)}
              >
                <i className={'iconfont icon-' + (type === 'type' ? 'duixiangleixing' : 'guanxileixing')}></i>
                {item.title || (<span className='type-item-label'>{item[nameLabel]}</span>)}
                {disableType[item[keyLabel]] && <span className='type-item-used'>已使用</span>}
              </div>
            ))}
          </div>
          {list.length === 0 && isSearched &&
            <div className='no-data-info'>
              <div className='pdb-alert pdb-alert-danger'><i className="spicon icon-jingshi"></i>搜索结果为空</div>
            </div>
          }
        </div>
      </div>
    )
  };

  const renderTypeTree = () => {
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
        </div>
        <div className='list-content'>
          <div className='type-list'>
            <Tree
              treeData={treeData}
              switcherIcon={() => (<span></span>)}
              titleRender={(item: any) => (
                <div
                  style={{ display: 'flex' }}
                  className={disableType[item.data['x_type_name']] ? 'disabled' : ''}
                  draggable={!disableType[item.data['x_type_name']]}
                  onDragStart={event => handleDragStart(event, item.data)}
                  onClick={() => handleSelectRelation(item.data, 'type')}
                >
                  <i className={'iconfont icon-duixiangleixing'}></i>
                  <span className='type-item-label'>{item.title}</span>
                  {disableType[item.data['x_type_name']] && <span className='type-item-used'>已使用</span>}
                </div>
              )}
              expandedKeys={expandedKeys}
              blockNode
              showIcon
            />
          </div>
          {treeData.length === 0 && isSearched &&
            <div className='no-data-info'>
              <div className='pdb-alert pdb-alert-danger'><i className="spicon icon-jingshi"></i>搜索结果为空</div>
            </div>
          }
        </div>
      </div>
    );
  };

  const tabs = [{
    key: 'type',
    label: '对象',
    children: renderTypeTree()
  }, {
    key: 'relation',
    label: '关系',
    children: renderList('relation')
  }];

  const hanldeChangeTab = function () {
    (window as any).PDB_GRAPH.emit('edge:enable', null);
    setSelectedRelation(null);
  }

  return (
    <PdbPanel className='pdb-template-left' title='类型列表' direction='left' canCollapsed={true}>
      <Tabs defaultActiveKey="type" items={tabs} onChange={hanldeChangeTab} />
    </PdbPanel>
  );
}