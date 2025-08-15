
import { useEffect, useRef, useState, useCallback } from 'react';
import { Input, InputRef, Spin, message, Dropdown, Tag, Empty } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { StoreState } from '@/store';
import { getMetrics, getMetricDetail, metricHistory } from "@/actions/indicator";
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import _, { isEmpty } from 'lodash';
import { setMetrics, setCheckId, setEditId, resetData, setcheckVersionList, setNowCheckVersion,
  setNeedCheckId, setNeedEditId, setCurrentBuzProcess, setNextShowConfiguration, 
  setExtraColumns } from "@/reducers/indicator";
import { setIndicatorLoading } from '@/reducers/editor';
import ChechDrawer from './CheckDrawer'
import VersionRecord from './VersionRecord'
import { getPdbIdList, getCurrentBuzProcess } from "@/actions/adapter";
import './index.less';
import { setQueryParams, setApi } from '@/reducers/query';
import { setCurrent, setReadonly } from '@/reducers/indicatorSimple';
import { getHashParameterByName, inidcatorSymbolMap } from '@/utils/common';
import { setAdvReadonly, setGraphData, setMetricInfo, setMetricParams, setPqlParams, updateColumnConfig } from '@/reducers/indicatorAdvance';

export default function List(props: any) {
  const navigate = useNavigate();
  const routerParams = useParams();
  const location = useLocation();
  const [isIndSearched, setIndSearchedStatus] = useState(false);
  const [pdbIds, setPdbIds] = useState<Array<string | number>>([]);
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
  const [draggable, setDraggable] = useState(false);
  const [versionId, setVersionId] = useState(null);

  const { Search } = Input;

  useEffect(() => {
    const urlRequestId = getHashParameterByName('requestId'); // 获取requestId
    if (requestId || urlRequestId) {
      updateList(requestId || urlRequestId)
    } else {
      updateListWithoutRequestId()
    }
  }, [])

  useEffect(() => {
    // 高级指标，左侧指标列表可拖曳
    setDraggable(location.pathname.endsWith('/indicator/advance'))
  }, [location.pathname])

  useEffect(() => {
    const data = JSON.parse(JSON.stringify(allIndicators))
    const tempArr = isEmpty(pdbIds) ? data : data.filter((item: any) => pdbIds.includes(item.ori_id))
    setIndicatorList(tempArr);
  }, [allIndicators]);


  useEffect(() => {
    if(allIndicators?.length) {
      checkNeed(needCheckId, needEditId, needVersionId, allIndicators)
    }
  }, [needCheckId, needEditId, allIndicators, needVersionId])

  /**
   * 更新列表数据的函数
   * 该函数用于获取指标数据，并根据请求ID筛选数据后更新到状态中
   */
  const updateList = (id: string | null) => {    
    getPdbIdList({ requestId: id }, (success: boolean, res: any) => {
      if (success) {
        setPdbIds(res?.data || [])
      } 
      updateListWithoutRequestId()
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
        dispatch(setCheckId(tempObj.id));
        dispatch(setNeedCheckId(null));
        
        if (tempObj.type === 2) 
          enterIndicatorAdvance(tempObj, true)
        if (tempObj.type === 1) 
          enterIndicatorSimple(tempObj, true)
        if (!tempObj.type) enterIndicatorProfession(tempObj, true)

        setTimeout(() => {
          dispatch(setcheckVersionList(null))
          dispatch(setNowCheckVersion(null))
        }, 500)
      } else {
        getMetricDetail({id: _needCheckId}, (success: boolean, res: any) => {
          if (success) {
            dispatch(setCheckId(res.id));
            dispatch(setNeedCheckId(null));            
        
            if (res.type === 2) 
              enterIndicatorAdvance(res, true)
            if (res.type === 1) 
              enterIndicatorSimple(res, true)
            if (!res.type) enterIndicatorProfession(res, true)

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
        getCurrentBuzProcess({ requestId: requestId }, (success:boolean, res: any) => {
          dispatch(setEditId(tempObj.id));
          dispatch(setNeedEditId(null));
        
          if (tempObj.type === 2) 
            enterIndicatorAdvance(tempObj, false)
          if (tempObj.type === 1) 
            enterIndicatorSimple(tempObj, false)
          if (!tempObj.type) enterIndicatorProfession(tempObj, false)
          
          if (success) {
            dispatch(setCurrentBuzProcess(res.data))
          }
          setTimeout(() => {
            dispatch(setcheckVersionList(null))
            dispatch(setNowCheckVersion(null))
          }, 500)
        })
      } else {
        getMetricDetail({id: _needEditId}, (success: boolean, res: any) => {
          if (success) {
            dispatch(setEditId(res.id));
            dispatch(setNeedEditId(null));
        
            if (tempObj.type === 2) 
              enterIndicatorAdvance(tempObj, false)
            if (tempObj.type === 1) 
              enterIndicatorSimple(tempObj, false)
            if (!tempObj.type) enterIndicatorProfession(tempObj, false)

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

  const enterIndicatorAdvance = (item: any, isCheck: boolean) => {
    dispatch(setMetricInfo(item))
    dispatch(setGraphData(item.graph_data))
    dispatch(setMetricParams(item.metric_params || {}))
    dispatch(updateColumnConfig(item.column_config || []))
    dispatch(setPqlParams(item.pql_params))
    dispatch(setAdvReadonly(isCheck))
    if (!location.pathname.endsWith("/indicator/advance")) {
      navigate(`/${routerParams.id}/indicator/advance`)
    }
  }

  const enterIndicatorSimple = (item: any, isCheck: boolean) => {
    dispatch(setCurrent(item))
    dispatch(setReadonly(isCheck))
    !location.pathname.endsWith("/indicator/simple") && navigate(`/${routerParams.id}/indicator/simple`)
  }

  const enterIndicatorProfession = (item: any, isCheck: boolean) => {
    const dimensionStr = item.metric_params.dimension.name_cn
    const groupByArr = (item.metric_params.group_by || []).map((item: any) => item.name_cn)
    dispatch(resetData())
    dispatch(setExtraColumns(item.metric_params.extra_columns))
    dispatch(setQueryParams(item.pql_params.params));
    dispatch(setApi(item.pql_params.api));
    dispatch(setNextShowConfiguration({
      dimension: dimensionStr,
      func: item.metric_params.func || '',
      groupBy: groupByArr
    }))
    navigate(`/${routerParams.id}/indicator`)
  }

  const handleClickMenu = (item: any, menu: any) => {
    if (menu.key === 'check1') {
      setShowCheckDrawer(true)
      setCheckData(item)
    }
    if (['edit', 'check2'].includes(menu.key)) {
      menu.key === 'check2' ? dispatch(setCheckId(item.id)) : dispatch(setEditId(item.id));
      if (item.type === 2) 
        enterIndicatorAdvance(item, menu.key === 'check2')
      if (item.type === 1) 
        enterIndicatorSimple(item, menu.key === 'check2')
      if (!item.type) enterIndicatorProfession(item, menu.key === 'check2')
    }
    if (menu.key ==='version') {
      setVersionVisible(true)
      setVersionId(item.ori_id)
      dispatch(setCheckId(item.id))
    }
  }
  
  const handleDragStart = function (event: any, type: any) {
    const data = JSON.stringify(type)
    event.dataTransfer.setData("drop_add", data);
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
                      draggable={draggable}
                      onDragStart={event => handleDragStart(event, { label: item.name, data: {id: item.id, ori_id: item.ori_id, name: item.name, name_cn: item.name_cn, type: item.type}})}
                    >
                      <span className='item-name'>
                        {
                          item.type !== 2 ? <i className={`iconfont icon-zhibiao`} style={{ color: '#265CFF' }}></i> :
                          <svg className="svg-icon" aria-hidden="true">
                            <use xlinkHref="#icon-gaojizhibiao">
                            </use>
                          </svg>
                        }
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
            draggable && !isEmpty(indList) && (
              <>
                {Object.keys(inidcatorSymbolMap).map(item => (<div key={item}
                  className={`type-item indicator-item`}
                  draggable={draggable}
                  onDragStart={event => handleDragStart(event, {type: 'symbol', label: item})}
                >
                  <span className='item-name'>
                    <i className={'iconfont icon-yunsuanfu'} style={{ color: '#265CFF' }}></i>
                    <span className='type-item-label'>运算符[ {inidcatorSymbolMap[item]} ]</span>
                  </span>
                </div>))}
                <div
                  className={`type-item indicator-item`}
                  draggable={draggable}
                  onDragStart={event => handleDragStart(event, { label: '计算结果', id: 'end'})}
                >
                  <span className='item-name'>
                    <i className={'iconfont icon-jieguo'} style={{ color: '#265CFF' }}></i>
                    <span className='type-item-label'>计算结果</span>
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
  }, [indicatorList, routerParams?.id, indicatorLoading, checkId, editId, draggable]);

  return (
    <div className='pdb-type-list'>
      {renderIndicatorTree('indicator')}
      <ChechDrawer isOpen={showCheckDrawer} onClose={() => setShowCheckDrawer(false)} data={checkData} />
      <VersionRecord visible={versionVisible} onClose={() => {setVersionVisible(false); setVersionId(null)}} versionId={versionId}/>
    </div>
  )
}