
import { useEffect, useRef, useState, useCallback } from 'react';
import { Input, InputRef, Spin, message, Dropdown, Tag, Empty } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { StoreState } from '@/store';
import { getMetrics, getMetricDetail, metricHistory } from "@/actions/indicator";
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import _, { set } from 'lodash';
import { setMetrics, setCheckId, setEditId, setGroupBy, setDimension, setcheckVersionList, setNowCheckVersion,
  setFunc, setNeedCheckId, setNeedEditId, setCurrentBuzProcess, setNextShowConfiguration, 
  setExtraColumns} from "@/reducers/indicator";
import { setIndicatorLoading } from '@/reducers/editor';
import ChechDrawer from './CheckDrawer'
import VersionRecord from './VersionRecord'
import { getPdbIdList, getCurrentBuzProcess } from "@/actions/adapter";
import './index.less';
import { initialParams, setQueryParams, setApi } from '@/reducers/query';
import { setCurrent, setReadonly } from '@/reducers/indicatorSimple';

export default function List(props: any) {
  const navigate = useNavigate();
  const routerParams = useParams();
  const location = useLocation();
  const [isIndSearched, setIndSearchedStatus] = useState(false);
  const allIndicators = useSelector((state: StoreState) => state.indicator.list);
  const [indicatorList, setIndicatorList] = useState(allIndicators);
  const indicatorLoading = useSelector((state: StoreState) => state.editor.indicatorLoading)
  const checkId = useSelector((state: StoreState) => state.indicator.checkId);
  const editId = useSelector((state: StoreState) => state.indicator.editId);
  const needCheckId = useSelector((state: StoreState) => state.indicator.needCheckId);
  const needEditId = useSelector((state: StoreState) => state.indicator.needEditId);
  const needVersionId = useSelector((state: StoreState) => state.indicator.needVersionId);
  const requestId = useSelector((state: StoreState) => state.indicator.requestId);
  const [showCheckDrawer, setShowCheckDrawer] = useState(false);
  const [checkData, setCheckData] = useState(null);
  const searchRef = useRef<InputRef>(null);
  const dispatch = useDispatch();
  const [versionVisible, setVersionVisible] = useState(false);
  const [versionId, setVersionId] = useState(null);

  const { Search } = Input;

  useEffect(() => {
    if (requestId) {
      updateList()
    } else {
      updateListWithoutRequestId()
    }
  }, [])

  useEffect(() => {
    if (requestId) {
      updateList()
    }
  }, [requestId])

  useEffect(() => {
    setIndicatorList(JSON.parse(JSON.stringify(allIndicators)));
  }, [allIndicators]);


  useEffect(() => {
    if(allIndicators?.length) {
      checkNeed(needCheckId, needEditId, needVersionId, allIndicators)
    }
  }, [needCheckId, needEditId, allIndicators, needVersionId])

  const updateList = () => {
    dispatch(setIndicatorLoading(true));
    getMetrics(function (response: any) {
      if (response) {
        dispatch(setMetrics(response || []));
        getPdbIdList({ requestId: requestId }, (success: boolean, res: any) => {
          if (success) {
            const tempArr = response.filter((item: any) => (res?.data || []).includes(item.ori_id))
            dispatch(setMetrics(tempArr || []));
          } else {
            dispatch(setMetrics(response || []));
          }
        })
      } else {
        message.error('获取列表数据失败：' + response.message || response.msg);
      }
      dispatch(setIndicatorLoading(false));
    })
  }

  // 本地环境没有requestId，则不请求权限相关接口
  const updateListWithoutRequestId = () => {
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

  const checkNeed = (_needCheckId: string | null, _needEditId: string | null, _needVersionId: string | null, arr: any[]) => {
    // 如果URL中有checkId，则自动跳转到对应的指标
    if (_needCheckId) {
      const tempObj = arr.find((item: any) => (item.id).toString() === _needCheckId)
      if (tempObj) {
        const dimensionStr = tempObj.metric_params.dimension.name_cn
        const groupByArr = (tempObj.metric_params.group_by || []).map((item: any) => item.name_cn)
        dispatch(setCheckId(tempObj.id));
        dispatch(setExtraColumns(tempObj.metric_params.extra_columns))
        dispatch(setQueryParams(tempObj.pql_params.params));
        dispatch(setApi(tempObj.pql_params.api));
        dispatch(setNeedCheckId(null));
        dispatch(setNextShowConfiguration({
          dimension: dimensionStr,
          func: tempObj.metric_params.func,
          groupBy: groupByArr
        }))
        setTimeout(() => {
          // dispatch(setDimension(dimensionStr));
          // dispatch(setFunc(tempObj.metric_params.func));
          // dispatch(setGroupBy(groupByArr));
          dispatch(setcheckVersionList(null))
          dispatch(setNowCheckVersion(null))
        }, 500)
      } else {
        getMetricDetail({id: _needCheckId}, (success: boolean, res: any) => {
          if (success) {
            const dimensionStr = res.metric_params.dimension.name_cn
            const groupByArr = (res.metric_params.group_by || []).map((item: any) => item.name_cn)
            dispatch(setCheckId(res.id));
            dispatch(setExtraColumns(res.metric_params.extra_columns))
            dispatch(setQueryParams(res.pql_params.params));
            dispatch(setApi(res.pql_params.api));
            dispatch(setNeedCheckId(null));
            dispatch(setNextShowConfiguration({
              dimension: dimensionStr,
              func: tempObj.metric_params.func,
              groupBy: groupByArr
            }))
            // setTimeout(() => {
            //   dispatch(setDimension(dimensionStr));
            //   dispatch(setFunc(res.metric_params.func));
            //   dispatch(setGroupBy(groupByArr));
            // }, 500)
            metricHistory({ori_id: res.ori_id}, (success: boolean, resH: any) => {
              if (success) {
                dispatch(setcheckVersionList(resH))
                dispatch(setNowCheckVersion(res.version))
              }
            })
          }
        })
      }
    } else if (_needEditId) {
      const tempObj = arr.find((item: any) => (item.id).toString() === _needEditId)
      if(tempObj) {
        const dimensionStr = tempObj.metric_params.dimension.name_cn
        const groupByArr = (tempObj.metric_params.group_by || []).map((item: any) => item.name_cn)
        getCurrentBuzProcess({ requestId: requestId }, (success:boolean, res: any) => {
          dispatch(setEditId(tempObj.id));
          dispatch(setNeedEditId(null));
          dispatch(setExtraColumns(tempObj.metric_params.extra_columns))
          dispatch(setQueryParams(tempObj.pql_params.params));
          dispatch(setApi(tempObj.pql_params.api));
          if (success) {
            dispatch(setCurrentBuzProcess(res.data))
          }
          dispatch(setNextShowConfiguration({
            dimension: dimensionStr,
            func: tempObj.metric_params.func,
            groupBy: groupByArr
          }))
          setTimeout(() => {
            // dispatch(setDimension(dimensionStr));
            // dispatch(setFunc(tempObj.metric_params.func));
            // dispatch(setGroupBy(groupByArr));
            dispatch(setcheckVersionList(null))
            dispatch(setNowCheckVersion(null))
          }, 500)
        })
      } else {
        getMetricDetail({id: _needEditId}, (success: boolean, res: any) => {
          if (success) {
            const dimensionStr = res.metric_params.dimension.name_cn
            const groupByArr = (res.metric_params.group_by || []).map((item: any) => item.name_cn)
            dispatch(setEditId(res.id));
            dispatch(setExtraColumns(res.metric_params.extra_columns))
            dispatch(setQueryParams(res.pql_params.params));
            dispatch(setApi(res.pql_params.api));
            dispatch(setNeedEditId(null));
            dispatch(setNextShowConfiguration({
              dimension: dimensionStr,
              func: tempObj.metric_params.func,
              groupBy: groupByArr
            }))
            // setTimeout(() => {
            //   dispatch(setDimension(dimensionStr));
            //   dispatch(setFunc(res.metric_params.func));
            //   dispatch(setGroupBy(groupByArr));
            // }, 500)
            metricHistory({ori_id: res.ori_id}, (success: boolean, resH: any) => {
              if (success) {
                dispatch(setcheckVersionList(resH))
                dispatch(setNowCheckVersion(res.version))
              }
            })
          }
        })
      }
    } else if (_needVersionId) {
      const tempObj = arr.find((item: any) => (item.id).toString() === _needVersionId)
      if(tempObj) {
      }else {
        getMetricDetail({id: _needVersionId}, (success: boolean, res: any) => {
          setVersionId(res.ori_id)
          setVersionVisible(true)
        })
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

  const enterIndicatorSimple = (item: any, key: 'check2' | 'edit') => {
    console.log('--- enter indicator simple: ', item)
    dispatch(setCurrent(item))
    dispatch(setReadonly(key === 'check2'))
    navigate(`/${routerParams.id}/indicator/simple`)
  }

  const enterIndicatorProfession = (item: any, key: 'check2' | 'edit') => {
    const dimensionStr = item.metric_params.dimension.name_cn
    const groupByArr = (item.metric_params.group_by || []).map((item: any) => item.name_cn)
    key === 'check2' ? dispatch(setCheckId(item.id)) : dispatch(setEditId(item.id));
    dispatch(setExtraColumns(item.metric_params.extra_columns))
    dispatch(setQueryParams(item.pql_params.params));
    dispatch(setApi(item.pql_params.api));
    dispatch(setNextShowConfiguration({
      dimension: dimensionStr,
      func: item.metric_params.func,
      groupBy: groupByArr
    }))
    navigate(`/${routerParams.id}/indicator`)
    // setTimeout(() => {
    //   dispatch(setDimension(dimensionStr));
    //   dispatch(setFunc(item.metric_params.func));
    //   dispatch(setGroupBy(groupByArr));
    // }, 500)
  }

  const handleClickMenu = (item: any, menu: any) => {
    if (menu.key === 'check1') {
      setShowCheckDrawer(true)
      setCheckData(item)
    }
    if (['edit', 'check2'].includes(menu.key)) {
      // if (!item.type) enterIndicatorProfession(item, menu.key)
      // if (item.type === 1) 
        enterIndicatorSimple(item, menu.key)
    }
    if (menu.key ==='version') {
      setVersionVisible(true)
      setVersionId(item.ori_id)
    }
  }
  
  const handleDragStart = function (event: any, type: any) {
    event.dataTransfer.setData("drop_add", JSON.stringify(type));
  }

  const renderIndicatorTree = useCallback((type: string) => {
    let indList = JSON.parse(JSON.stringify(indicatorList));
    const draggable = location.pathname.endsWith('/indicator/advance');
    
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
          {!indicatorLoading &&
            <div className='type-list'>
              {indList.map((item: any, index: number) => {
                const label: any = item['name']
                const menus: any[] = [
                  {
                    label: '查看基础信息',
                    key: 'check1',
                  },
                  {
                    label: '查看指标定义',
                    key: 'check2',
                  },
                ]
                if (item.online === false) {
                  menus.push({ type: 'divider' })
                  menus.push({
                    label: '编辑',
                    key: 'edit',
                  })
                }
                menus.push({ type: 'divider' })
                menus.push({
                  label: '版本记录',
                  key: 'version',
                })
                return (
                  <Dropdown key={item.id}
                    overlayClassName='pdb-dropdown-menu'
                    menu={{
                      items: menus,
                      onClick: (menu) => handleClickMenu(item, menu)
                    }}
                    trigger={['contextMenu']}
                  >
                    <div
                      className={`type-item indicator-item ${(checkId === item.id || editId === item.id) ? 'indicator-item-selected' : ''}`}
                      draggable={draggable && item.type !== 2}
                      onDragStart={event => handleDragStart(event, item.data)}
                    >
                      <span className='item-name'>
                        <i className={'iconfont icon-zhibiao'} style={{ color: '#265CFF' }}></i>
                        <span className='type-item-label'>{label}</span>
                      </span>
                      <span className='item-status'>
                        {checkId === item.id && <Tag color="blue" className='indicator-tag'>查看中</Tag>}
                        {editId === item.id && <Tag color="blue" className='indicator-tag'>编辑中</Tag>}
                        {item.online === false && <Tag className='indicator-tag'>已下架</Tag>}
                      </span>
                    </div>
                  </Dropdown>
                );
              })}
            </div>
          }
          {
            draggable && (
              <>
                <div
                  className={`type-item indicator-item`}
                  draggable={draggable}
                  onDragStart={event => handleDragStart(event, {type: 'symbol'})}
                >
                  <span className='item-name'>
                    <i className={'iconfont '} style={{ color: '#00B42A' }}></i>
                    <span className='type-item-label'>运算符</span>
                  </span>
                </div>
                <div
                  className={`type-item indicator-item`}
                  draggable={draggable}
                  onDragStart={event => handleDragStart(event, {type: 'result'})}
                >
                  <span className='item-name'>
                    <i className={'iconfont '} style={{ color: '#b319f5' }}></i>
                    <span className='type-item-label'>结果</span>
                  </span>
                </div>
              </>
            )
          }
          {indList.length === 0 && !indicatorLoading && (
            isIndSearched ?
              <div className='no-data-info'>
                <div className='pdb-alert pdb-alert-danger'><i className="spicon icon-jingshi"></i>搜索结果为空</div>
              </div> :
              <div className='list-empty'>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
          )}
          {indicatorLoading && <Spin />}
        </div>
      </div>
    );
  }, [indicatorList, routerParams?.id, indicatorLoading, checkId, editId]);

  return (
    <div className='pdb-type-list'>
      {renderIndicatorTree('indicator')}
      <ChechDrawer isOpen={showCheckDrawer} onClose={() => setShowCheckDrawer(false)} data={checkData} />
      <VersionRecord visible={versionVisible} onClose={() => {setVersionVisible(false); setVersionId(null)}} versionId={versionId}/>
    </div>
  )
}