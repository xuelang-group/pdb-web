import { useEffect, useRef } from 'react';
import { message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from 'react-router-dom';
import VTable from './components/VTable';
import { getCsv } from "@/actions/indicator";
import { setTableData } from "@/reducers/indicator";
import { StoreState } from "@/store";
import './index.less';

export default function Indicator(props: any) {
  const location = useLocation()
  const dispatch = useDispatch();
  const query = useSelector((state: StoreState) => state.query.params);

  console.log('inicator pathname', query)
  useEffect(() => {
    console.log('inicator useEffect', query)
    getCsv(query, function (success: boolean, response: any) {
      if (success) {
        dispatch(setTableData(response.trim()));
      } else {
        message.error('获取列表数据失败：' + response.message || response.msg);
      }
    })
  }, [query])

  return (
    <div className='pdb-indicator'>
      <VTable />
    </div>
  )
}