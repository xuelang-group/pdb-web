
import { useEffect, useRef, useState, useCallback } from 'react';
import { Input, InputRef, Spin, message, Dropdown, Tag } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { StoreState } from '@/store';
import { getMetrics } from "@/actions/indicator";
import { useParams, useNavigate } from 'react-router-dom';
import _, { set } from 'lodash';
import { setMetrics, setCheckId, setEditId, setGroupBy, setDimention, setFunc, setNeedCheckId, setNeedEditId } from "@/reducers/indicator";
import { setIndicatorLoading } from '@/reducers/editor';
import ChechDrawer from './CheckDrawer'
import './index.less';
import { initialParams, setQueryParams, setApi } from '@/reducers/query';

export default function List(props: any) {
  const [isIndSearched, setIndSearchedStatus] = useState(false);
  const allIndicators = useSelector((state: StoreState) => state.indicator.list);
  const [indicatorList, setIndicatorList] = useState(allIndicators);
  const indicatorLoading = useSelector((state: StoreState) => state.editor.indicatorLoading)
  const checkId = useSelector((state: StoreState) => state.indicator.checkId);
  const editId = useSelector((state: StoreState) => state.indicator.editId);
  const needCheckId = useSelector((state: StoreState) => state.indicator.needCheckId);
  const needEditId = useSelector((state: StoreState) => state.indicator.needEditId);
  const [showCheckDrawer, setShowCheckDrawer] = useState(false);
  const [checkData, setCheckData] = useState(null);
  const searchRef = useRef<InputRef>(null);
  const routerParams = useParams()
  const dispatch = useDispatch();

  const { Search } = Input;

  useEffect(() => {
    updateList()
  }, [])

  useEffect(() => {
    setIndicatorList(JSON.parse(JSON.stringify(allIndicators)));
  }, [allIndicators]);


  useEffect(() => {
    checkNeed(needCheckId, needEditId, allIndicators)
  }, [needCheckId, needEditId, allIndicators])

  const updateList = () => {
    dispatch(setIndicatorLoading(true));
    getMetrics(function (response: any) {
      if (response) {
        dispatch(setMetrics(response || []));
      } else {
        message.error('获取列表数据失败：' + response.message || response.msg);
      }
      dispatch(setIndicatorLoading(false));
    })
  }

  const checkNeed = (_needCheckId: string | null, _needEditId: string | null, arr: any[]) => {
    // 如果URL中有checkId，则自动跳转到对应的指标
    if(_needCheckId) {
      const tempObj = arr.find((item: any) => (item.id).toString() === _needCheckId)
      if(tempObj) {
        dispatch(setCheckId(tempObj.id));
        dispatch(setQueryParams(tempObj.pql_params.params));
        dispatch(setDimention(tempObj.metric_params.dimention));
        dispatch(setFunc(tempObj.metric_params.func));
        dispatch(setGroupBy(tempObj.metric_params.group_by));
        dispatch(setApi(tempObj.pql_params.api));
        dispatch(setNeedCheckId(null));
      }
    } else if(_needEditId) {
      const tempObj = arr.find((item: any) => (item.id).toString() === _needEditId)
      if(tempObj) {
        dispatch(setEditId(tempObj.id));
        dispatch(setQueryParams(tempObj.pql_params.params));
        dispatch(setDimention(tempObj.metric_params.dimention));
        dispatch(setFunc(tempObj.metric_params.func));
        dispatch(setGroupBy(tempObj.metric_params.group_by));
        dispatch(setApi(tempObj.pql_params.api));
        dispatch(setNeedEditId(null));
      }
    }
  }

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

  const handleClickMenu = (item: any, menu: any) => {
    if (menu.key === 'check1') {
      setShowCheckDrawer(true)
      setCheckData(item)
    }
    if (menu.key === 'check2') {
      dispatch(setCheckId(item.id));
      dispatch(setQueryParams(item.pql_params.params));
      dispatch(setDimention(item.metric_params.dimention));
      dispatch(setFunc(item.metric_params.func));
      dispatch(setGroupBy(item.metric_params.group_by));
      dispatch(setApi(item.pql_params.api));
    }
    if (menu.key === 'edit') {
      dispatch(setEditId(item.id));
      dispatch(setQueryParams(item.pql_params.params));
      dispatch(setDimention(item.metric_params.dimention));
      dispatch(setFunc(item.metric_params.func));
      dispatch(setGroupBy(item.metric_params.group_by));
      dispatch(setApi(item.pql_params.api));
    }
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
              const menus: any[] =[
                {
                  label: '查看基础信息',
                  key: 'check1',
                },
                {
                  label: '查看指标定义',
                  key: 'check2',
                },
              ]
              if(item.online === false) {
                menus.push({ type: 'divider' })
                menus.push({
                  label: '编辑',
                  key: 'edit',
                })
              }
              return (
                <Dropdown
                  overlayClassName='pdb-dropdown-menu'
                  menu={{
                    items: menus,
                    onClick: (menu) => handleClickMenu(item, menu)
                  }}
                  trigger={['contextMenu']}
                >
                  <span
                    className={`type-item ${(checkId === item.id || editId === item.id) ? 'indicator-item-selected' : ''}`}
                  >
                    <i className={'iconfont icon-zhibiao'} style={{ color: '#265CFF' }}></i>
                    {(<span className='type-item-label'>{label}</span>)}
                    {item.online === false && <Tag className='indicator-tag'>已下架</Tag>}
                    {checkId === item.id && <Tag color="blue" className='indicator-tag'>查看中</Tag>}
                    {editId === item.id && <Tag color="blue" className='indicator-tag'>编辑中</Tag>}
                  </span>
                </Dropdown>
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
  }, [indicatorList, routerParams?.id, indicatorLoading, checkId, editId]);

    return (
      <div className='pdb-type-list'>
        {renderIndicatorTree('indicator')}
        <ChechDrawer isOpen={showCheckDrawer} onClose={() => setShowCheckDrawer(false)} data={checkData}/>
      </div>
    )
  }