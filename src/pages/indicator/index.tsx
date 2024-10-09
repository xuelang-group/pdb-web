import { useEffect, useRef } from 'react';
import { message } from "antd";
import VTable from './components/VTable';
import { getCsv } from "@/actions/indicator";
import './index.less';

export default function Indicator(props: any) {

  useEffect(() => {
    getCsv(function (success: boolean, response: any) {
      if (success) {
        console.log('--- getCsv: ', response)
      } else {
        message.error('获取列表数据失败：' + response.message || response.msg);
      }
      // setTreeLoading(false);
    })
  }, [])

  return (
    <div className='pdb-indicator'>
      <VTable />
    </div>
  )
}