import { useEffect, useRef } from 'react';
import { message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import VTable from './components/VTable';
import { getCsv } from "@/actions/indicator";
import { setTableData } from "@/reducers/indicator";
import './index.less';

export default function Indicator(props: any) {
  const dispatch = useDispatch();

  useEffect(() => {
    getCsv(function (success: boolean, response: any) {
      if (success) {
        dispatch(setTableData(response.trim()));
      } else {
        message.error('获取列表数据失败：' + response.message || response.msg);
      }
    })
  }, [])

  return (
    <div className='pdb-indicator'>
      <VTable />
    </div>
  )
}