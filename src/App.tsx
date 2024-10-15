import { Layout, notification, Spin, Tabs } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import _ from 'lodash';

import * as Editor from '@/reducers/editor';
import * as _Object from '@/reducers/object';
import * as Relation from '@/reducers/relation';
import * as Template from '@/reducers/template';
import * as Type from '@/reducers/type';
import { setCatalog, setPageLoading, setSystemInfo } from '@/reducers/app';

import ObjectLeft from '@/pages/left/object';
import ObjectGraph from '@/pages/graph/object';
import CommonRight from '@/pages/right/common/index';
import TypeLeft from '@/pages/left/type/index';
import TypeGraph from '@/pages/graph/type/index';
import CommonHeader from '@/pages/header/index';
import EditHeader from '@/pages/header/editHeader';
import ObjectHeaderExtra from '@/pages/header/ObjectHeaderExtra';
import Indicator from '@/pages/indicator/index';
import PdbContent from '@/components/Content';

import IndicatorLeft from '@/pages/left/indicator';
import IndicatorRight from '@/pages/right/indicator';

import { StoreState } from '@/store';
import { getFile, putFile } from '@/actions/minioOperate';
import { getSystemInfo } from '@/actions/system';

import { PdbConfig } from '.';
import './App.less';
import List from './pages/list';
import { getTypeByGraphId } from './actions/type';
import { getRelationByGraphId } from './actions/relation';
import { setRelations } from '@/reducers/relation';
import { setTypeLoading } from '@/reducers/editor';

const { Content } = Layout;
function App(props: PdbConfig) {
  const { theme, headerEXtraWidth } = props;
  const dispatch = useDispatch(),
    navigate = useNavigate(),
    location = useLocation();
  const catalog = useSelector((state: StoreState) => state.app.catalog),
    pageLoading = useSelector((state: StoreState) => state.app.pageLoading),
    systemInfo = useSelector((state: StoreState) => state.app.systemInfo);

  const [selectedTab, setSelectedTab] = useState("pdb");
  useEffect(() => {
    dispatch(setPageLoading(true));
    setSelectedTab(location.pathname.endsWith("/indicator") ? "indicator" : "pdb");
    getSystemInfo((success: boolean, response: any) => {
      if (success) {
        const { userId, graphId } = response;
        getAppFolderList(userId);
        graphId && getCommonData(graphId);
        dispatch(setSystemInfo(response));
        if (!_.get(window, 'pdbConfig.showAppList', false) && graphId && !location.pathname.endsWith(`/${graphId}`) && location.pathname.indexOf(`/${graphId}/`) === -1) {
          navigate(`/${graphId}`);
        }
      } else {
        notification.error({
          message: '获取系统信息失败：',
          description: response.message || response.msg
        });
      }
      dispatch(setPageLoading(false));
    });
    return () => {
      dispatch(Editor.reset());
      dispatch(_Object.reset());
      dispatch(Relation.reset());
      dispatch(Template.reset());
      dispatch(Type.reset());
    };
  }, []);

  const getCommonData = function (graphId: String) {
    getTypeByGraphId(graphId, null, (success: boolean, response: any) => {
      if (success) {
        dispatch(Type.setTypes(response || []));
      } else {
        notification.error({
          message: '获取对象类型列表失败',
          description: response.message || response.msg
        });
      }
      dispatch(setTypeLoading(false));
    });

    getRelationByGraphId(graphId, null, (success: boolean, response: any) => {
      let typeRelationMap: any = {};
      if (success) {
        dispatch(setRelations(response || []));
        (response || []).forEach(function (relation: Relation.RelationConfig) {
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
      dispatch(Editor.setRelationLoading(false));
      dispatch(Editor.setTypeRelationMap(typeRelationMap));
    });
  }

  const getAppFolderList = function (userId: number) {
    const path = `studio/${userId}/pdb/config`;
    getFile(path).then(data => {
      dispatch(setCatalog(data.catalog));
    }).catch(err => {
      putFile(path, JSON.stringify({ catalog })).then(res => {
        console.log(res)
      }, err => {
        console.log(err)
      });
    });
  }

  const renderCenterContent = function () {
    return (
      <Routes>
        <Route path="/:id/*" element={<ObjectGraph theme={theme} />} />
        <Route path="/:id/edit" element={<TypeGraph theme={theme} />} />
      </Routes>
    )
  }

  return (
    <div className='pdb'>
      {/* 隐藏列表页 */}
      <Routes>
        <Route path="/:id?" element={<List route="object" theme={theme} />}></Route>
      </Routes>
      <Layout className="pdb-layout">
        <Routes>
          <Route path="/:id/*" element={<CommonHeader route="object" centerContent={<ObjectHeaderExtra />} headerEXtraWidth={headerEXtraWidth} />} />
          {/* 类型管理顶部导航栏 */}
          <Route path="/:id/edit" element={<EditHeader route="object" headerEXtraWidth={headerEXtraWidth} />} />
          <Route path="/:id/indicator" element={<CommonHeader route="object" centerContent={<ObjectHeaderExtra />} headerEXtraWidth={headerEXtraWidth} />} />
        </Routes>
        <Content className="pdb-layout-content">
          <Routes>
            <Route path="/:id/template?" element={<ObjectLeft />} />
            {/* 类型管理左侧类型列表 */}
            <Route path="/:id/edit" element={<TypeLeft />} />
            {/* 指标设计左侧类型列表 */}
            <Route path="/:id/indicator" element={<IndicatorLeft />} />
          </Routes>
          <PdbContent>
            <Tabs
              className={"pdb-graph-tab" + (location.pathname.endsWith("/edit") ? " pdb-graph-tab-header-hidden" : "")}
              activeKey={selectedTab}
              items={[{
                key: "pdb",
                label: "模型画布",
                children: renderCenterContent()
              }, {
                key: "indicator",
                label: "指标设计",
                children: <Indicator />,
                disabled: pageLoading
              }]}
              onChange={(activeKey: string) => {
                const { graphId } = systemInfo;
                if (!graphId) return;
                if (activeKey === "indicator") {
                  navigate(`/${graphId}/indicator`);
                } else {
                  navigate(`/${graphId}`);
                }
                setSelectedTab(activeKey);
              }}
              centered
            />
            <Routes>
              <Route path="/:id/template?" element={<CommonRight route="object" />} />
              {/* 类型管理右侧列表 */}
              <Route path="/:id/edit" element={<CommonRight route='type' />} />
              {/* 指标设计右侧列表 */}
              <Route path="/:id/indicator" element={<IndicatorRight />} />
            </Routes>
          </PdbContent>
        </Content>
      </Layout>
      <Spin className='pdb-init-loading' spinning={pageLoading} />
    </div>
  );
}

export default App;

