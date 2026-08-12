import { Layout, notification, Spin, Tabs } from 'antd';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import _, { set } from 'lodash';

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
import PdbContent from '@/components/Content';

import IndicatorLeft from '@/pages/left/indicator';
import IndicatorRight from '@/pages/right/indicator';
import IndicatorAdanceRight from '@/pages/right/indicator/Advance';
import IndicatorIndex from './pages/indicator';
import Indicator from '@/pages/indicator/Indicator';
import IndicatorSimple from './pages/indicator/IndicatorSimple';
import IndicatorAdvance from './pages/graph/indicator';

import { StoreState } from '@/store';
import { getFile, putFile } from '@/actions/minioOperate';
import { getSystemInfo } from '@/actions/system';

import { PdbConfig } from '.';
import './App.less';
// import List from './pages/list';
import { getTypeList } from './actions/type';
import { getRelationByGraphId } from './actions/relation';
import { RelationConfig, setRelations } from '@/reducers/relation';
import { setQueryParams } from "@/reducers/query";
import { setRelationMap, setTypeLoading, setTypeMap } from '@/reducers/editor';
import { setRequestId, setNeedEditId, setNeedCheckId, setNeedVersionId } from '@/reducers/indicator';
import { TypeConfig } from '@/reducers/type';

import { getHashParameterByName } from '@/utils/common';

const { Content } = Layout;
let prevPathname = "";
function App(props: PdbConfig) {
  const { theme, headerEXtraWidth } = props;
  const dispatch = useDispatch(),
    navigate = useNavigate(),
    location = useLocation();
  const catalog = useSelector((state: StoreState) => state.app.catalog),
    pageLoading = useSelector((state: StoreState) => state.app.pageLoading),
    graphLoading = useSelector((state: StoreState) => state.editor.graphLoading),
    systemInfo = useSelector((state: StoreState) => state.app.systemInfo),
    relations = useSelector((state: StoreState) => state.relation.data),
    types = useSelector((state: StoreState) => state.type.data);
  const query = useSelector((state: StoreState) => state.query.params);
  const checkId = useSelector((state: StoreState) => state.indicator.checkId);
  const editId = useSelector((state: StoreState) => state.indicator.editId);
  const allIndicators = useSelector((state: StoreState) => state.indicator.list);
  const requestId = useSelector((state: StoreState) => state.indicator.requestId);

  const [selectedTab, setSelectedTab] = useState("");
  useEffect(() => {
    prevPathname = location.pathname;
    dispatch(setPageLoading(true));
    setSelectedTab(location.pathname.indexOf("/indicator") > -1 ? "indicator" : "pdb");
    let requestId: string | null = null
    const getRequestId = function() {
      requestId = getHashParameterByName('requestId'); // 获取requestId
      const needCheckId = getHashParameterByName('checkId'); // 获取需要查看的id
      const needEditId = getHashParameterByName('editId'); // 获取需要编辑的id
      const needVersionId = getHashParameterByName('versionId'); // 获取需要编辑的id
      if(requestId) {
        dispatch(setRequestId(requestId))
      } else {
        navigate(`/error`)
      }
      if(needCheckId) {
        dispatch(setNeedCheckId(needCheckId))
      }
      if(needEditId) {
        dispatch(setNeedEditId(needEditId))
      }
      if(needVersionId) {
        dispatch(setNeedVersionId(needVersionId))
      }
    }
    getRequestId()
    getSystemInfo((success: boolean, response: any) => {
      if (success) {
        const { userId, graphId } = response;
        getAppFolderList(userId);
        graphId && getCommonData(graphId);
        dispatch(setSystemInfo(response));
        if (requestId && !location.pathname.endsWith(`/error`) && !_.get(window, 'pdbConfig.showAppList', false) && graphId && !location.pathname.endsWith(`/${graphId}`) && location.pathname.indexOf(`/${graphId}/`) === -1) {
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
    window.addEventListener('hashchange', getRequestId);
    return () => {
      dispatch(Editor.reset());
      dispatch(_Object.reset());
      dispatch(Relation.reset());
      dispatch(Template.reset());
      dispatch(Type.reset());
      (window as any).PDB_GRAPH = null;
      window.removeEventListener('hashchange', getRequestId);
    };
  }, []);

  useEffect(() => {
    const relationMap = {};
    relations.forEach((item: RelationConfig) => {
      Object.assign(relationMap, {
        [item['r.type.name']]: { ...item }
      });
    });
    dispatch(setRelationMap(relationMap));
  }, [relations]);

  useEffect(() => {
    const typeMap = {};
    types.forEach((item: TypeConfig) => {
      Object.assign(typeMap, {
        [item['x.type.name']]: { ...item }
      });
    });
    dispatch(setTypeMap(typeMap));
  }, [types]);

  useEffect(() => {
    if (prevPathname.indexOf("/indicator") > -1 && location.pathname.indexOf("/indicator") === -1) {
      setSelectedTab("pdb");
      systemInfo.graphId && getCommonData(systemInfo.graphId.toString());
    } else if (prevPathname.indexOf("/indicator") === -1 && location.pathname.indexOf("/indicator") > -1) {
      setSelectedTab("indicator");
    }
    prevPathname = location.pathname;
  }, [location.pathname]);

  const getCommonData = function (graphId: string) {
    getTypeList(graphId, (success: boolean, response: any) => {
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

  const handleTabChange = (activeKey: string) => {
    const { graphId } = systemInfo;
    if (!graphId) return;
    setSelectedTab(activeKey);
    if (activeKey === "indicator") {
      const id = checkId || editId;
      const indicator = id && allIndicators.find((item: any) => item.id == id);
      const suffix = requestId ? ('?requestId=' + requestId) : ''
      if (indicator) {
        const type = indicator.type;
        if (type === 2) {
          navigate(`/${graphId}/indicator/advance${suffix}`)
        } else if (type === 1) {
          navigate(`/${graphId}/indicator/simple${suffix}`)
        } else {
          navigate(`/${graphId}/indicator${suffix}`)
          dispatch(setQueryParams(indicator.pql_params.params));
        }
      } else if (query && query.graphId) {
        const pql = query.pql[0];
        pql.length > 1 ? navigate(`/${graphId}/indicator${suffix}`) : navigate(`/${graphId}/indicator/index${suffix}`)
      } else {
        navigate(`/${graphId}/indicator/index${suffix}`)
      }
    } else {
      navigate(`/${graphId}`);
    }
  }

  const renderCenterContent = function () {
    return (
      <Routes>
        <Route path="/:id/*" element={<ObjectGraph theme={theme} />} />
        <Route path="/:id/edit" element={<TypeGraph theme={theme} />} />
      </Routes>
    )
  }

  const renderIndicator = function() {
    return (
      <Routes>
        <Route path="/:id/indicator/index" element={<IndicatorIndex />} />
        <Route path="/:id/indicator/simple" element={<IndicatorSimple />} />
        <Route path="/:id/indicator/advance" element={<IndicatorAdvance />} />
        <Route path="/:id/indicator" element={<Indicator />} />
      </Routes>
    )
  }

  return (
    <div className='pdb'>
      {/* 隐藏列表页 */}
      {/* <Routes>
        <Route path="/:id?" element={<List route="object" theme={theme} />}></Route>
      </Routes> */}
      <Layout className="pdb-layout">
        <Routes>
          <Route path="/:id/*" element={<CommonHeader route="object" centerContent={<ObjectHeaderExtra />} headerEXtraWidth={headerEXtraWidth} />} />
          {/* 类型管理顶部导航栏 */}
          <Route path="/:id/edit" element={<EditHeader route="object" headerEXtraWidth={headerEXtraWidth} />} />
        </Routes>
        <Content className="pdb-layout-content">
          <Routes>
            <Route path="/:id" element={<ObjectLeft />} />
            {/* 类型管理左侧类型列表 */}
            <Route path="/:id/edit" element={<TypeLeft />} />
            {/* 指标设计左侧类型列表 */}
            <Route path="/:id/indicator/*" element={<IndicatorLeft />} />
          </Routes>
          <PdbContent>
            <Tabs
              className={"pdb-graph-tab" + (location.pathname.endsWith("/edit") ? " pdb-graph-tab-header-hidden" : "")}
              activeKey={selectedTab}
              items={[{
                key: "pdb",
                label: "主线设计",
                children: renderCenterContent()
              }, {
                key: "indicator",
                label: "指标设计",
                // children: <Indicator />,
                children: renderIndicator(),
                disabled: pageLoading || graphLoading
              }]}
              onChange={handleTabChange}
              centered
            />
            <Routes>
              <Route path="/:id" element={<CommonRight route="object" />} />
              {/* 类型管理右侧列表 */}
              <Route path="/:id/edit" element={<CommonRight route='type' />} />
              {/* 指标设计右侧列表 */}
              <Route path="/:id/indicator/advance" element={<IndicatorAdanceRight />} />
              <Route path="/:id/indicator/*" element={<IndicatorRight />} />
            </Routes>
          </PdbContent>
        </Content>
      </Layout>
      <Spin className='pdb-init-loading' spinning={pageLoading} />
    </div>
  );
}

export default App;

