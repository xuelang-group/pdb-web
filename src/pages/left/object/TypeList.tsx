import { Input, InputRef,Tabs,Tree,Dropdown } from 'antd';
import { useEffect, useRef, useState, useCallback } from 'react';

import './index.less';
import { TypeConfig } from '@/reducers/type';
import { useSelector } from 'react-redux';
import { StoreState } from '@/store';
import { useParams, useNavigate } from 'react-router-dom';
import _ from 'lodash';

const { Search } = Input;

export default function TypeList(props: any) {
  const allTypes = useSelector((state: StoreState) => state.type.data);
  const allRelations  = useSelector((state: StoreState) => state.relation.data);
  const [currentTab, setCurrentTab] = useState('type');
  const [list, setList] = useState(allTypes),
    [relationList, setRelationList] = useState(allRelations),
    [isSearched, setSearchedStatus] = useState(false),
    [isRelSearched, setRelSearchedStatus] = useState(false),
    currentGraphTab = useSelector((state: StoreState) => state.editor.currentGraphTab);
  const searchRef = useRef<InputRef>(null);
  const routerParams = useParams();
  const navigate = useNavigate();

  // 右键菜单
  const typeMenus = [{
    label: '编辑',
    key: 'edit',
  }];

  useEffect(() => {
    setList(JSON.parse(JSON.stringify(allTypes)));
  }, [allTypes])

  useEffect(() => {
    setRelationList(JSON.parse(JSON.stringify(allRelations)));
  }, [allRelations])

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
      const item = list[i], idKey = 'x.type.name', labelKey = 'x.type.label';
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
      const item = relList[i], idKey = 'r.type.name', labelKey = 'r.type.label';
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

  const handleClickMenu = function (id: any) {
    navigate(`/edit/${id}`)
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
              enterButton={<i className='spicon icon-sousuo2'></i>}
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
          <i
            className='operation-icon spicon icon-tianjia' 
            onClick={() => handleClickMenu(routerParams.id)} 
          />
        </div>
        <div className='list-content'>
          <div className='type-list'>
            <Tree
              treeData={list.map((item: any) => ({
                title:  item['x.type.label'],
                key: item['x.type.name'],
                className: 'type-item',
              }))}
              // selectedKeys={currentEditModel ? [currentEditModel.data['x.type.name']] : []}
              switcherIcon={() => (<span></span>)}
              titleRender={(item: any) => (
                <Dropdown
                  overlayClassName='pdb-dropdown-menu'
                  menu={{ items: typeMenus, onClick: (menu) => handleClickMenu(routerParams.id) }}
                  trigger={['contextMenu']}
                >
                  <span
                    className='type-item' 
                    draggable={currentGraphTab === 'main'}
                    onDragStart={event => handleDragStart(event, item)}
                  >
                    <i className='iconfont icon-duixiangleixing'></i>
                    <span className='type-item-label'>{item.title}</span>
                  </span>
                </Dropdown>
              )}
              // expandedKeys={expandedKeys}
              blockNode
              showIcon
              // onSelect={(selectedKeys, event) => handleSelectItem((event.node as any).data, 'type', (event.node as any).dataIndex)}
            />
          </div>
          {list.length === 0 && isSearched &&
            <div className='no-data-info'>
              <div className='pdb-alert pdb-alert-danger'><i className="spicon icon-jingshi"></i>搜索结果为空</div>
            </div>
          }
        </div>
      </div>
    );
  }, [list, routerParams?.id]);

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
              // value={relationSearchValue}
              placeholder='搜索类型名称或ID'
              allowClear={true}
              enterButton={<i className='spicon icon-sousuo2'></i>}
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
          <i 
            className='operation-icon spicon icon-tianjia'
            onClick={() => handleClickMenu(routerParams.id)} 
          />
        </div>
        <div className='list-content'>
          <div className='type-list relation-list'>
            {relList.map((item: any, index: number) => {
              const label: any = item[prevLabel + 'type.label']
              return (
                <Dropdown overlayClassName='pdb-dropdown-menu' menu={{ items: typeMenus, onClick: (menu) => handleClickMenu(routerParams.id) }} trigger={['contextMenu']}>
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
          {relList.length === 0 && isRelSearched &&
            <div className='no-data-info'>
              <div className='pdb-alert pdb-alert-danger'><i className="spicon icon-jingshi"></i>搜索结果为空</div>
            </div>
          }
        </div>
      </div>
    );
  }, [relationList, routerParams?.id]);

  const tabs = [{
    key: 'type',
    label: '对象',
    children: renderTypeTree('type')
  }, {
    key: 'relation',
    label: '关系',
    children: renderRelationTree('relation')
  }];

  return (
    <Tabs defaultActiveKey="type" items={tabs} activeKey={currentTab} onChange={handleChangeTab} />
    // <div className='list-container'>
    //   <div className='list-header'>
    //     <div className='pdb-search'>
    //       <Search
    //         ref={searchRef}
    //         className='pdb-search-input'
    //         placeholder='搜索类型名称或ID'
    //         allowClear={true}
    //         enterButton={<i className='spicon icon-sousuo2'></i>}
    //         onChange={(event: any) => {
    //           if (!isSearched) {
    //             setSearchedStatus(true);
    //           } else if (!event.target.value) {
    //             setSearchedStatus(false);
    //             handleSearch('');
    //           }
    //         }}
    //         onPressEnter={(event: any) => handleSearch(event.target.value)}
    //       />
    //     </div>
    //     <i className='operation-icon spicon icon-tianjia' onClick={() => {window.location.href = `/web/pdb/edit/${routerParams.id}`}} />
    //   </div>
    //   <div className='list-content'>
    //     <div className='type-list'>
    //       {list.map((item: any, index: number) => (
    //         <span className='type-item' draggable={currentGraphTab === 'main'} onDragStart={event => handleDragStart(event, item)}>
    //           <i className='iconfont icon-duixiangleixing'></i>
    //           {item.title || item['x.type.label']}
    //         </span>
    //       ))}
    //     </div>
    //     {list.length === 0 && isSearched &&
    //       <div className='no-data-info'>
    //         <div className='pdb-alert pdb-alert-danger'><i className="spicon icon-jingshi"></i>搜索结果为空</div>
    //       </div>
    //     }
    //   </div>
    // </div>
  )
}