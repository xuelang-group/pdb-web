
import { useEffect, useRef, useState, useCallback } from 'react';
import { Input, InputRef, Spin, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { StoreState } from '@/store';
import { getMetrics } from "@/actions/indicator";
import { useParams, useNavigate } from 'react-router-dom';
import _ from 'lodash';
import { setMetrics } from "@/reducers/indicator";
import { setIndicatorLoading } from '@/reducers/editor';
import './index.less';

export default function List(props: any) {
  const [isIndSearched, setIndSearchedStatus] = useState(false);
  const allIndicators = useSelector((state: StoreState) => state.indicator.list);
  const [indicatorList, setIndicatorList] = useState(allIndicators);
  const indicatorLoading = useSelector((state: StoreState) => state.editor.indicatorLoading)
  const searchRef = useRef<InputRef>(null);
  const routerParams = useParams()
  const dispatch = useDispatch();

  const { Search } = Input;

  useEffect(() => {
    dispatch(setIndicatorLoading(true));
    getMetrics(function (response: any) {
      if (response) {
        dispatch(setMetrics(response || []));
      } else {
        message.error('获取列表数据失败：' + response.message || response.msg);
      }
      dispatch(setIndicatorLoading(false));
    })
  }, [])

  useEffect(() => {
    setIndicatorList(JSON.parse(JSON.stringify(allIndicators)));
  }, [allIndicators]);

  const getIndicatorList = function (indList: Array<any>, keyWord: string): Array<any> {
    var arr = [];
    for (var i = 0; i < indList.length; i++) {
      const item = indList[i], idKey = 'id', labelKey = 'name';
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
        arr.push({ ...indList[i], title });
      }
    }
    return arr;
  }

  const handleIndSearch = function (value: string) {
    let indicators = JSON.parse(JSON.stringify(allIndicators));
    if (value) {
      indicators = getIndicatorList(indicators, value);
    }
    setIndicatorList(indicators);
  }

  const renderIndicatorTree = useCallback((type: string) => {
    let indList = JSON.parse(JSON.stringify(indicatorList));
    return (
      <div className='list-container'>
        <div className='list-header'>
          <div className='pdb-search pdb-search-indicator'>
            <Search
              ref={searchRef}
              className='pdb-search-input'
              placeholder='搜索类型名称或ID'
              allowClear={true}
              enterButton={<i className='spicon icon-sousuo2' onClick={() => handleIndSearch(_.get(searchRef, "current.input.value", ""))}></i>}
              onChange={(event: any) => {
                if (!isIndSearched) {
                  setIndSearchedStatus(true);
                } else if (!event.target.value) {
                  setIndSearchedStatus(false);
                  handleIndSearch('');
                }
              }}
              onPressEnter={(event: any) => handleIndSearch(event.target.value)}
            />
          </div>
        </div>
        <div className='list-content'>
          <div className='type-list relation-list'>
            {!indicatorLoading && indList.map((item: any, index: number) => {
              const label: any = item['name']
              return (
                <span
                  className='type-item'
                >
                  <i className={'iconfont icon-zhibiao'} style={{ color: '#265CFF' }}></i>
                  {(<span className='type-item-label'>{label}</span>)}
                </span>
              );
            })}
          </div>
          {indList.length === 0 && isIndSearched && !indicatorLoading &&
            <div className='no-data-info'>
              <div className='pdb-alert pdb-alert-danger'><i className="spicon icon-jingshi"></i>搜索结果为空</div>
            </div>
          }
          {indicatorLoading && <Spin />}
        </div>
      </div>
    );
  }, [indicatorList, routerParams?.id, indicatorLoading]);

    return (
      <div className='pdb-type-list'>
        {renderIndicatorTree('indicator')}
      </div>
    )
  }