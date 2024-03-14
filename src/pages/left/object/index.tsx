import { getObjectData, getGraphTemplate } from '@/actions/object';
import { getTypeByGraphId } from '@/actions/type';
import { getRelationByGraphId } from '@/actions/relation';
import PdbPanel from '@/components/Panel';
import { setGraphData, setObjectTemplateInfo } from '@/reducers/object';
import { setRelations } from '@/reducers/relation';
import { ConnectionState, ObjectState, TemplateGraphDataState } from '@/reducers/template';
import { setTypes } from '@/reducers/type';
import { notification } from 'antd';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import './index.less';
import QueryList from './QueryList';
import TypeList from './TypeList';

export default function Left() {
  const [typeList, setTypeList] = useState([] as any);
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
        getTypeByGraphId(id, null, (success: boolean, response: any) => {
          if (success) {
            dispatch(setTypes(response || []));
          } else {
            notification.error({
              message: '获取对象类型列表失败',
              description: response.message || response.msg
            });
          }
        })
        getRelationByGraphId(id, null, (success: boolean, response: any) => {
          if (success) {
            dispatch(setRelations(response || []));
          } else {
            notification.error({
              message: '获取关系列表失败',
              description: response.message || response.msg
            });
          }
        });
        // getGraphTemplate(id, (success: boolean, response: any) => {
        //   if (success) {
        //     initObjectInfo(response);
        //     dispatch(setObjectTemplateInfo(response));
        //     const { connections, processes } = response;
        //     const types = Object.values(processes as Array<ObjectState>).map((item: ObjectState) => item.metadata),
        //       relations = Object.values(Object.fromEntries(connections.map((item: any) => [item['r.type.name'], item])))
        //         .map((item: ConnectionState) => item.metadata);
        //     dispatch(setTypes(types));
        //     dispatch(setRelations(relations));
        //   } else {
        //     notification.error({
        //       message: '获取项目模板信息失败',
        //       description: response.message || response.msg
        //     });
        //   }
        // });
      } else {
        notification.error({
          message: '获取项目信息失败',
          description: data.message || data.msg
        });
      }
    });
  }

  const initObjectInfo = (templateInfo: TemplateGraphDataState) => {
    const { processes } = templateInfo;
    setTypeList(Object.values(processes));
  }

  return (
    <div className='pdb-left-sider'>
      <PdbPanel className='pdb-type-left' title='类型列表' direction="left">
        <TypeList list={typeList} />
      </PdbPanel>
      {/* <PdbPanel className='pdb-object-search-left' title='查询构建器' direction="left">
        <QueryList />
      </PdbPanel> */}
    </div>
  );
}