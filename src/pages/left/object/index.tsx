import { Tabs } from 'antd';
import _ from 'lodash';

import PdbPanel from '@/components/Panel';
import IndicatorList from '@/pages/left/indicator/list';

import TypeList from './TypeList';
import './index.less';

export default function Left() {
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