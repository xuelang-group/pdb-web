import { Input, InputRef } from 'antd';
import { useEffect, useRef, useState } from 'react';

import './index.less';
import { TypeConfig } from '@/reducers/type';
import { useSelector } from 'react-redux';
import { StoreState } from '@/store';
import { useParams } from 'react-router-dom';
import _ from 'lodash';

const { Search } = Input;

export default function TypeList(props: any) {
  const allTypes = useSelector((state: StoreState) => state.type.data);
  const [list, setList] = useState(allTypes),
    [isSearched, setSearchedStatus] = useState(false),
    currentGraphTab = useSelector((state: StoreState) => state.editor.currentGraphTab);
  const searchRef = useRef<InputRef>(null);
  const routerParams = useParams();

  useEffect(() => {
    setList(JSON.parse(JSON.stringify(allTypes)));
  }, [allTypes])

  const handleSearch = function (value: string) {
    let types = JSON.parse(JSON.stringify(allTypes));
    if (value) {
      types = getList(types, value);
    }
    setList(types);
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

  const handleDragStart = function (event: any, type: TypeConfig) {
    event.dataTransfer.setData("object_drop_add", JSON.stringify(type));
  }

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
        <i className='operation-icon spicon icon-tianjia' onClick={() => {window.location.href = `/web/pdb/edit/${routerParams.id}`}} />
      </div>
      <div className='list-content'>
        <div className='type-list'>
          {list.map((item: any, index: number) => (
            <span className='type-item' draggable={currentGraphTab === 'main'} onDragStart={event => handleDragStart(event, item)}>
              <i className='iconfont icon-duixiangleixing'></i>
              {item.title || item['x.type.label']}
            </span>
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
}