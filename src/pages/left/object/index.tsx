import { notification, Tabs } from 'antd';
import _ from 'lodash';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';

import { getObjectData } from '@/actions/object';
import { getTypeByGraphId } from '@/actions/type';
import { getRelationByGraphId } from '@/actions/relation';

import { setGraphData } from '@/reducers/object';
import { RelationConfig, setRelations } from '@/reducers/relation';
import { setTypes } from '@/reducers/type';
import { setRelationLoading, setTypeLoading, setTypeRelationMap } from '@/reducers/editor';

import PdbPanel from '@/components/Panel';
import IndicatorList from '@/pages/left/indicator/list';

import TypeList from './TypeList';
import './index.less';

export default function Left() {
  const routerParams = useParams();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!routerParams || !routerParams.id) return;
    getGraphData(Number(routerParams.id));
  }, [routerParams?.id]);

  function getGraphData(id: number) {
    getObjectData(id, (success: boolean, data: any) => {
      if (success) {
        dispatch(setGraphData(data));

      } else {
        notification.error({
          message: '获取项目信息失败',
          description: data.message || data.msg
        });
        dispatch(setTypeRelationMap({}));
      }
    });

    dispatch(setTypeLoading(true));
    dispatch(setRelationLoading(true));

    getTypeByGraphId(id, null, (success: boolean, response: any) => {
      if (success) {
        dispatch(setTypes(response || []));
      } else {
        notification.error({
          message: '获取对象类型列表失败',
          description: response.message || response.msg
        });
      }
      dispatch(setTypeLoading(false));
    });

    getRelationByGraphId(id, null, (success: boolean, response: any) => {
      let typeRelationMap: any = {};
      if (success) {
        dispatch(setRelations(response || []));
        (response || []).forEach(function (relation: RelationConfig) {
          const binds = _.get(relation['r.type.constraints'], 'r.binds', []),
            relationId = relation['r.type.name'];
          binds.forEach(function (bind) {
            const { source, target } = bind;
            if (typeRelationMap[source]) {
              if (typeRelationMap[source]['source']) {
                typeRelationMap[source]['source'].push(relationId);
              } else {
                Object.assign(typeRelationMap[source], { source: [relationId] });
              }
            } else {
              Object.assign(typeRelationMap, { [source]: { source: [relationId] } });
            }
            if (typeRelationMap[target]) {
              if (typeRelationMap[target]['target']) {
                typeRelationMap[target]['target'].push(relationId);
              } else {
                Object.assign(typeRelationMap[target], { target: [relationId] });
              }
            } else {
              Object.assign(typeRelationMap, { [target]: { target: [relationId] } });
            }
          });
        });
      } else {
        notification.error({
          message: '获取关系列表失败',
          description: response.message || response.msg
        });
      }
      dispatch(setRelationLoading(false));
      dispatch(setTypeRelationMap(typeRelationMap));
    });
  }

  const tabs = [{
    key: 'type',
    label: '类型列表',
    children: <div className='pdb-sider-content'><TypeList /></div>
  }, {
    key: 'indicator',
    label: '指标列表',
    children: <div className='pdb-sider-content'><IndicatorList /></div>
  }]

  const renderPanelContent = function () {
    return (
      <Tabs items={tabs} />
    )
  }

  return (
    // <PdbPanel
    //   className='pdb-type-left'
    //   direction="left"
    //   canCollapsed={true}
    //   customRender={renderPanelContent()}
    // />
    <PdbPanel className='pdb-type-left' title='类型列表' direction="left" canCollapsed={true}>
      <TypeList />
    </PdbPanel>
  );
}