
import { ConfigProvider, Layout } from 'antd';
import antdLocale from 'antd/es/locale/zh_CN';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import _ from 'lodash';

import * as Editor from '@/reducers/editor';
import * as _Object from '@/reducers/object';
import * as Relation from '@/reducers/relation';
import * as Template from '@/reducers/template';
import * as Type from '@/reducers/type';

import ObjectLeft from '@/pages/left/object';
import ObjectGraph from '@/pages/graph/object';

import TemplateLeft from '@/pages/left/template/index';
import TemplateGraph from '@/pages/graph/template/index';
import CommonRight from '@/pages/right/common/index';

import TypeLeft from '@/pages/left/type/index';
import TypeGraph from '@/pages/graph/type/index';
import List from '@/pages/list';
import CommonHeader from '@/pages/header/index';

import PdbContent from '@/components/Content';
import { getIconUrl } from '@/components/NodeIconPicker/CustomIconList';

import { StoreState } from '@/store';
import ossOperate from '@/actions/ossOperate';
import { PdbConfig } from '.';
import ObjectHeaderExtra from './pages/header/ObjectHeaderExtra';

import './App.less';


const { Content, Header } = Layout;
function App(props: PdbConfig) {
  const { locale, messages, theme, headerEXtraWidth } = props;
  const dispatch = useDispatch();
  const iconMap = useSelector((state: StoreState) => state.editor.iconMap), // 当前对象原始数据
    userId = useSelector((state: StoreState) => state.app.appConfig.userId);
  useEffect(() => {
    return () => {
      dispatch(Editor.reset());
      dispatch(_Object.reset());
      dispatch(Relation.reset());
      dispatch(Template.reset());
      dispatch(Type.reset());
    };
  }, []);

  // 获取自定义图标列表
  const getIconList = async function (callback: Function) {
    if (!iconMap) {
      callback && callback(iconMap);
      return
    };
    const _iconMap = {};
    const path = 'studio/' + userId + '/pdb/icons/';
    ossOperate().list(path).then(async (res: any) => {
      let fetchList = new Array();
      await _.get(res, 'data.Contents', []).forEach(function (file: any) {
        const icon = file.Key;
        const fetch = getIconUrl(icon).then(url => {
          if (url) {
            Object.assign(_iconMap, { [icon]: url });
          }
        });
        fetchList.push(fetch);
      });
      Promise.all(fetchList).then(function () {
        dispatch(Editor.setIconMap(_iconMap));
        callback && callback(_iconMap);
      });
    }).catch(err => { 
      callback && callback({});
    });
  }

  return (
    <div className='pdb'>
      <IntlProvider locale={locale} messages={messages}>
        <ConfigProvider
          locale={antdLocale}
          prefixCls='pdb-ant'
          theme={{
            token: {
              borderRadius: 2
            }
          }}
          getPopupContainer={node => (document.getElementsByClassName('pdb')[0] || document.body) as HTMLElement}
        >
          <Router basename='/web/pdb'>
            <Routes>
              <Route path="/template/:id?" element={<List route="template" theme={theme} />}></Route>
              <Route path="/object/:id?" element={<List route="object" theme={theme} />}></Route>
            </Routes>
            <Layout className="pdb-layout">
              <Routes>
                <Route path="/template/:id" element={<CommonHeader route="template" headerEXtraWidth={headerEXtraWidth} />} />
                <Route path="/object/:id" element={<CommonHeader route="object" centerContent={<ObjectHeaderExtra />} headerEXtraWidth={headerEXtraWidth} />} />
              </Routes>
              <Content className="pdb-layout-content">
                <Routes>
                  <Route path="/template/:id" element={<TemplateLeft />} />
                  <Route path="/object/:id" element={<ObjectLeft />} />
                  <Route path="/type" element={<TypeLeft getIconList={getIconList} />} />
                </Routes>
                <PdbContent>
                  <Routes>
                    <Route path="/template/:id" element={<TemplateGraph theme={theme} getIconList={getIconList} />} />
                    <Route path="/object/:id" element={<ObjectGraph theme={theme} getIconList={getIconList} />} />
                    <Route path="/type" element={<TypeGraph theme={theme} />} />
                    <Route path="/edit/:id?" element={<TypeGraph theme={theme} />} />
                  </Routes>
                  <Routes>
                    <Route path="/template/:id" element={<CommonRight route="template" />} />
                    <Route path="/object/:id" element={<CommonRight route="object" />} />
                    <Route path="/type" element={<CommonRight route="type" />} />
                  </Routes>
                </PdbContent>
              </Content>
            </Layout>
          </Router>
        </ConfigProvider>
      </IntlProvider>
    </div>
  );
}

export default App;

