
import { Layout, notification, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import _ from 'lodash';

import * as Editor from '@/reducers/editor';
import * as _Object from '@/reducers/object';
import * as Relation from '@/reducers/relation';
import * as Template from '@/reducers/template';
import * as Type from '@/reducers/type';
import { setCatalog, setSystemInfo } from '@/reducers/app';

import ObjectLeft from '@/pages/left/object';
import ObjectGraph from '@/pages/graph/object';
import TemplateGraph from '@/pages/graph/template/index';
import CommonRight from '@/pages/right/common/index';
import TypeLeft from '@/pages/left/type/index';
import TypeGraph from '@/pages/graph/type/index';
import List from '@/pages/list';
import CommonHeader from '@/pages/header/index';
import EditHeader from '@/pages/header/editHeader';
import ObjectHeaderExtra from '@/pages/header/ObjectHeaderExtra';
import PdbContent from '@/components/Content';

import { StoreState } from '@/store';
import { getFile, putFile } from '@/actions/minioOperate';
import { getSystemInfo } from '@/actions/system';

import { PdbConfig } from '.';
import './App.less';

const { Content } = Layout;
function App(props: PdbConfig) {
  const { theme, headerEXtraWidth } = props;
  const dispatch = useDispatch(),
    navigate = useNavigate();
  const catalog = useSelector((state: StoreState) => state.app.catalog);
  const [pageLoading, setPageLoading] = useState(false);
  useEffect(() => {
    setPageLoading(true);
    getSystemInfo((success: boolean, response: any) => {
      if (success) {
        const { userId, graphId } = response;
        dispatch(setSystemInfo(response));
        getAppFolderList(userId);
        navigate(`/${graphId}`);
      } else {
        notification.error({
          message: '获取系统信息失败：',
          description: response.message || response.msg
        });
      }
      setPageLoading(false);
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

  // if (!(window as any).location.pathname.startsWith("/web/") && (window as any).location.pathname !== "/web") {
  //   (window as any).location.href = "/web";
  // }

  return (
    <div className='pdb'>
      {/* 隐藏列表页 */}
      {/* <Routes>
        <Route path="/:id?/template?" element={<List route="object" theme={theme} />}></Route>
      </Routes> */}
      <Layout className="pdb-layout">
        <Routes>
          <Route path="/:id/template?" element={<CommonHeader route="object" centerContent={<ObjectHeaderExtra />} headerEXtraWidth={headerEXtraWidth} />} />
          <Route path="/:id/edit" element={<EditHeader route="object" headerEXtraWidth={headerEXtraWidth} />} />
        </Routes>
        <Content className="pdb-layout-content">
          <Routes>
            <Route path="/:id/template?" element={<ObjectLeft />} />
            <Route path="/:id/edit" element={<TypeLeft />} />
          </Routes>
          <PdbContent>
            <Routes>
              <Route path="/:id" element={<ObjectGraph theme={theme} />} />
              <Route path="/:id/template" element={<TemplateGraph theme={theme} />} />
              <Route path="/:id/edit" element={<TypeGraph theme={theme} />} />
            </Routes>
            <Routes>
              <Route path="/:id/template?" element={<CommonRight route="object" />} />
              <Route path="/:id/edit" element={<CommonRight route='type' />} />
            </Routes>
          </PdbContent>
        </Content>
      </Layout>
      <Spin className='pdb-init-loading' spinning={pageLoading} />
    </div>
  );
}

export default App;

