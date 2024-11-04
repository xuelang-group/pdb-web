import { setShowSearch } from '@/reducers/editor';
import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { StoreState } from "@/store";
import VTable from './components/VTable';
import './index.less';
import { Spin } from 'antd';

export default function Indicator(props: any) {
  const wrapRef = useRef(null);
  const dispatch = useDispatch();
  const loading = useSelector((state: StoreState) => state.indicator.loading);

  const [width, setWidth] = useState(1000)
  const [height, setHeight] = useState(500)

  const PADDING = 24

  const updateSize = () => {
    const wrapper: any = wrapRef.current;
    if (!wrapper || !wrapper.offsetWidth || !wrapper.offsetHeight) return
    setWidth(wrapper.offsetWidth)
    setHeight(wrapper.offsetHeight)
  }

  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize)
    
    dispatch(setShowSearch(true));
    return () => {
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  return (
    <div className='pdb-indicator' ref={wrapRef}>
      <Spin spinning={loading}>
        <VTable width={width - PADDING * 2} height={height - PADDING} />
      </Spin>
    </div>
  )
}