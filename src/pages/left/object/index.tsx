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
  }];

  return (
    <PdbPanel className='pdb-type-left' title='类型列表' direction="left" canCollapsed={true}>
      <TypeList />
    </PdbPanel>
  );
}