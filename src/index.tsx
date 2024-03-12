import ReactDOM from 'react-dom/client';
import { message, notification, Modal } from 'antd';
import 'oss-js-upload/src/oss-js-upload.js';
import 'aliyun-sdk2/dist/aliyun-sdk.min.js';

import { addTemplate, deleteTemplate, getTemplateList, updateTemplateInfo, getTemplateData, deleteTemplates, updateTemplatesInfo } from './actions/template';
import { createObject, getObjectData, getObjectList, removeObject, removeObjects, updateObjectInfo, updateObjects } from './actions/object';
import store from './store';
import App from './App';

import '@/assets/iconfont/index';
import '@/assets/less/index.less';
import './index.css';
import { Provider } from 'react-redux';
export interface PdbConfig {
  locale: string
  theme: string
  messages: any
  headerEXtraWidth?: number
}

let currentRoot: any = null;
export function init(rootContainer: Element, config: PdbConfig = { locale: 'zh', messages: {}, headerEXtraWidth: 0, theme: 'light' }) {
  if (currentRoot) {
    (window as any).PDB_GRAPH = null;
    currentRoot.unmount();
  }
  const root = ReactDOM.createRoot(rootContainer);
  message.config({ prefixCls: 'pdb-ant-message' });
  notification.config({ prefixCls: 'pdb-ant-notification' });
  Modal.config({ rootPrefixCls: 'pdb-ant' });
  root.render(
    <Provider store={store}>
      <App {...config} />
    </Provider>
  );
  currentRoot = root;
}

export const apiService = (type: string) => ({
  'pdbTemplate': {
    list: getTemplateList,
    create: addTemplate,
    remove: deleteTemplate,
    update: updateTemplateInfo,
    get: getTemplateData,
    batchRemove: deleteTemplates,
    batchUpdateInfo: updateTemplatesInfo
  },
  'pdbObject': {
    list: getObjectList,
    create: createObject,
    remove: removeObject,
    update: updateObjectInfo,
    get: getObjectData,
    batchRemove: removeObjects,
    batchUpdateInfo: updateObjects
  }
})[type];

// 如果当前代码不是作为库被引用，而是直接运行
if (typeof window !== 'undefined' && window.document) {
  const container = document.getElementById('root');
  if (container) {
    const container = document.getElementById('root') as HTMLElement;
    init(container);
  }
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
