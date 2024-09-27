import { Layout, notification, Spin } from 'antd';
import { useEffect } from 'react';
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

import { StoreState } from '@/store';
import { getFile, putFile } from '@/actions/minioOperate';
import { getSystemInfo } from '@/actions/system';

import { PdbConfig } from '.';
import './App.less';
import List from './pages/list';

const { Content } = Layout;
function App(props: PdbConfig) {
  const { theme, headerEXtraWidth } = props;
  const dispatch = useDispatch(),
    navigate = useNavigate(),
    location = useLocation();
  const catalog = useSelector((state: StoreState) => state.app.catalog),
    pageLoading = useSelector((state: StoreState) => state.app.pageLoading),
    systemInfo = useSelector((state: StoreState) => state.app.systemInfo);
  useEffect(() => {
    dispatch(setPageLoading(true));
    getSystemInfo((success: boolean, response: any) => {
      if (success) {
        const { userId, graphId } = response;
        getAppFolderList(userId);

        if (!_.get(window, 'pdbConfig.showAppList', false) && graphId && !location.pathname.endsWith(`/web/${graphId}`) && !location.pathname.endsWith(`/web/${graphId}/edit`)) {
          // navigate(`/${graphId}`);
          dispatch(setSystemInfo(response));
        } else {
          dispatch(setSystemInfo({ ...systemInfo, userId }));
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

  return (
    <div className='pdb'>
      {/* 隐藏列表页 */}
      <Routes>
        <Route path="/:id?" element={<List route="object" theme={theme} />}></Route>
      </Routes>
      <Layout className="pdb-layout">
        <Routes>
          <Route path="/:id/template?" element={<CommonHeader route="object" centerContent={<ObjectHeaderExtra />} headerEXtraWidth={headerEXtraWidth} />} />
          <Route path="/:id/edit" element={<EditHeader route="object" headerEXtraWidth={headerEXtraWidth} />} />
          <Route path="/:id/indicator" element={<CommonHeader route="object" centerContent={<ObjectHeaderExtra />} headerEXtraWidth={headerEXtraWidth}  />} />
        </Routes>
        <Content className="pdb-layout-content">
          <Routes>
            <Route path="/:id/template?" element={<ObjectLeft />} />
            <Route path="/:id/edit" element={<TypeLeft />} />
            <Route path="/:id/indicator" element={<TypeLeft />} />
          </Routes>
          <PdbContent>
            <Routes>
              <Route path="/:id/template?" element={<ObjectGraph theme={theme} />} />
              <Route path="/:id/edit" element={<TypeGraph theme={theme} />} />
              <Route path="/:id/indicator" element={<Indicator theme={theme} />} />
            </Routes>
            <Routes>
              <Route path="/:id/template?" element={<CommonRight route="object" />} />
              <Route path="/:id/edit" element={<CommonRight route='type' />} />
              <Route path="/:id/indicator" element={<CommonRight route='object' />} />
            </Routes>
          </PdbContent>
        </Content>
      </Layout>
      <Spin className='pdb-init-loading' spinning={pageLoading} />
    </div>
  );
}

export default App;

