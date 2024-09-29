import { useEffect, useRef } from 'react';
import VTable from './components/VTable';
import './index.less';

export default function Indicator(props: any) {

  useEffect(() => {

  }, [])

  return (
    <div className='pdb-indicator' style={{ flex: 1, width: 0 }}>
      <VTable />
    </div>
  )
}