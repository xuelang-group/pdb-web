import { Button, Input, InputRef, Modal, notification, Spin } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { Loading3QuartersOutlined, FormOutlined } from '@ant-design/icons';

import './index.less';
import _ from 'lodash';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { StoreState } from '@/store';
import { QueryItemState, QueryResultState, setList, setQueryState, setResult } from '@/reducers/query';
import QueryBuilder from '@/components/QueryBuilder';
import { getRelationByGraphId } from '@/actions/relation';
import { setRelations } from '@/reducers/relation';
import { getQueryResult, runQuery } from '@/actions/query';
import moment from 'moment';
import { addToolbarConfig } from '@/reducers/editor';
import { getFile } from '@/actions/minioOperate';

const { Search } = Input;

export default function QueryList(props: any) {
  const routerParams = useParams();
  const searchRef = useRef<InputRef>(null),
    queryRef = useRef<any>(null);
  const dispatch = useDispatch();

  const queryList = useSelector((state: StoreState) => state.query.list),
    queryStatus = useSelector((state: StoreState) => state.query.status),
    queryResult = useSelector((state: StoreState) => state.query.result),
    currentGraphTab = useSelector((state: StoreState) => state.editor.currentGraphTab),
    userId = useSelector((state: StoreState) => state.app.systemInfo.userId);

  const [isSearched, setSearchedStatus] = useState(false),
    [searchValue, setSearchValue] = useState(''),
    [queryItems, setQueryItems] = useState<QueryItemState[]>([]),
    [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setQueryItems(searchValue ? queryList.map(query => ({
      ...query,
      hidden: query.name.toLowerCase().indexOf(searchValue.toLowerCase()) === -1
    })) : JSON.parse(JSON.stringify(queryList)));
  }, [queryList]);

  useEffect(() => {
    const graphId = routerParams.id;
    if (!graphId) return;
    const queryPath = 'studio/' + userId + '/pdb/graph/' + graphId + '/query.json';
    getFile(queryPath).then(function (data: any) {
      dispatch(setList(data));
      const queryStatus = data.map(() => ({ loading: false }));
      dispatch(setQueryState(queryStatus));
    }).catch(() => {
      dispatch(setList([]));
      dispatch(setQueryState([]));
    });
    return () => {
      dispatch(setList([]));
      dispatch(setQueryState([]));
      dispatch(setResult([]));
    }
  }, [routerParams?.id]);

  const handleSearch = function (value: string) {
    setSearchValue(value);
    setQueryItems(value ? queryList.map(query => ({
      ...query,
      hidden: query.name.toLowerCase().indexOf(value.toLowerCase()) === -1
    })) : queryList);
  }

  const handleModalOpen = function () {
    setModalOpen(true);
    getRelationByGraphId(routerParams?.id, null, (success: boolean, response: any) => {
      if (success) {
        dispatch(setRelations(response || []));
      } else {
        notification.error({
          message: '获取关系列表失败',
          description: response.message || response.msg
        });
      }
    });
  }

  const handleRunQuery = function (query: any, index: number) {
    const { type, name, match, condition } = query;
    const graphId = routerParams.id;
    let data = { graphId };
    if (type === 'uid') {
      // 对象id
      const uid = _.get(condition, 'uid', '').split(',');
      Object.assign(data, { uid });
    } else if (type === 'x.name' && match === 'batch') {
      // 对象名称 + 批量匹配
      const names = _.get(condition, 'names', '').split(',');
      Object.assign(data, { names, match: 'eq' });
    } else if (type === 'x.type.name' && match === 'type') {
      const type = _.get(condition, 'type', []);
      Object.assign(data, { type });
    } else {
      const tableData = _.get(query, 'condition.table', []);
      if (type === 'x.name' && match !== 'batch') {
        // 对象名称 + 条件匹配
        const match = _.get(condition, 'match', ''),
          names = tableData.map((val: any) => val.name);
        Object.assign(data, { names, match });
      } else {
        const type = _.get(condition, 'type', []);
        const connectives = _.get(condition, 'match', '') === 'allofterms' ? 'and' : 'or';
        if (match === 'type_attr') {
          const attrs = tableData.map(({ key, value, name, ...other }: any, index: number) => {
            let data = { value, name, function: other.function };
            if (index > 0) {
              Object.assign(data, { connectives });
            }
            if (other.datetimeFormat) {
              let newValue;
              if (typeof value === 'string') {
                newValue = moment(value).format(other.datetimeFormat);
              } else {
                newValue = [moment(value[0]).format(other.datetimeFormat), moment(value[1]).format(other.datetimeFormat)];
              }
              Object.assign(data, { value: newValue });
            }
            return data;
          });
          Object.assign(data, { type, attrs });
        } else {
          const constraints = tableData.map(({ key, isTarget, ...other }: any, index: number) => {
            const _other = JSON.parse(JSON.stringify(other));
            if (isTarget) {
              Object.assign(_other, {
                name: `~${_other.name}`
              });
            }
            return (
              index === 0 ? _other : {
                ..._other,
                connectives
              });
          });
          Object.assign(data, { type, constraints });
        }
      }
    }

    const newQueryStatus = JSON.parse(JSON.stringify(queryStatus)),
      newQueryResult = JSON.parse(JSON.stringify(queryResult));
    Object.assign(newQueryStatus[index], { loading: true });
    dispatch(setQueryState(newQueryStatus));

    let queryResultIndex = newQueryResult.findIndex((result: QueryResultState) => result.index === index);
    const newResult = {
      index,
      name,
      data: []
    };
    if (queryResultIndex > -1) {
      Object.assign(newQueryResult[queryResultIndex], newResult);
    } else {
      queryResultIndex = newQueryResult.length;
      newQueryResult.push(newResult);
    }

    dispatch(setResult(newQueryResult));

    runQuery(type, data, (success: any, response: any) => {
      if (success) {
        const uid = response.map((val: any) => val.uid);
        getQueryResult({ uid, graphId, depth: 5 }, (success: boolean, response: any) => {
          Object.assign(newQueryStatus[index], { loading: false });
          dispatch(setQueryState(newQueryStatus));
          if (success) {
            Object.assign(newQueryResult[queryResultIndex], {
              "data": response
            });
            dispatch(setResult(newQueryResult));
            dispatch(addToolbarConfig(queryResultIndex));
          }
        });
      } else {
        Object.assign(newQueryStatus[index], { loading: false });
        dispatch(setQueryState(newQueryStatus));
        newQueryResult.pop();
        notification.error({
          message: `执行${name}失败`,
          description: response.message || response.msg
        });
      }
    });
  }

  const handleModalCancel = function () {
    queryRef.current.save(() => {
      setModalOpen(false);
    });
  }

  return (
    <div className='list-container'>
      <div className='list-header'>
        <div className='pdb-search'>
          <Search
            ref={searchRef}
            className='pdb-search-input'
            placeholder='搜索查询名称'
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
          {currentGraphTab === 'main' &&
            <span className='pdb-query-edit-btn'>
              <FormOutlined onClick={handleModalOpen} />
            </span>
          }
        </div>
      </div>
      <div className='list-content'>
        {queryItems.length > 0 &&
          <div className='pdb-query-list'>
            {queryItems.map((query, index) => {
              let label = <span className='pdb-query-item-name'>{query.name}</span>;
              const isHidden = _.get(query, 'hidden');
              if (!isHidden) {
                const index = query.name.toLowerCase().indexOf(searchValue.toLowerCase()),
                  beforeStr = query.name.substring(0, index),
                  innerStr = query.name.substring(index, index + searchValue.length),
                  afterStr = query.name.slice(index + searchValue.length);
                label = (
                  <span className='pdb-query-item-name'>
                    {beforeStr}
                    <span className="pdb-searched-value">{innerStr}</span>
                    {afterStr}
                  </span>
                );
              }
              return (
                <div className={'pdb-query-item' + (currentGraphTab === 'main' ? '' : ' pdb-query-item-disabled')} style={{ display: (isHidden ? 'none' : 'flex') }}>
                  {_.get(queryStatus[index], 'loading') ?
                    <Loading3QuartersOutlined spin /> :
                    <i className='iconfont icon-chaxungoujianqi'></i>
                  }
                  {label}
                  {!_.get(queryStatus[index], 'loading') && currentGraphTab === 'main' &&
                    <span className='pdb-query-item-operation pdb-query-search-btn' onClick={() => handleRunQuery(query, index)}>执行</span>
                  }
                </div>
              );
            })}
          </div>
        }
        {queryItems.length === 0 && isSearched &&
          <div className='no-data-info'>
            <div className='pdb-alert pdb-alert-danger'><i className="spicon icon-jingshi"></i>搜索结果为空</div>
          </div>
        }
      </div>
      <Modal
        title='查询构建器'
        wrapClassName='pdb-query-modal'
        open={isModalOpen}
        onCancel={handleModalCancel}
        width={960}
        footer={null}
        destroyOnClose
      >
        <QueryBuilder ref={queryRef} onRunQuery={handleRunQuery} />
      </Modal>
    </div>
  )
}