import { setShowSearch } from '@/reducers/editor';
import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { StoreState } from "@/store";
import VTable from './components/VTable';
import './index.less';
import { Button, Dropdown, Space, Spin } from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined, CheckOutlined, RollbackOutlined, SaveOutlined } from '@ant-design/icons';
import { exit, setcheckVersionList, setNowCheckVersion, setCheckId, setGroupBy, setDimension,setFunc } from "@/reducers/indicator";
import { setQueryParams, setApi } from '@/reducers/query';
import { clearQuery } from "@/reducers/query";
import UseHistoryModal from './components/UseHistoryModal';
import { getMetricDetail } from "@/actions/indicator";

export default function Indicator(props: any) {
  const wrapRef = useRef(null);
  const dispatch = useDispatch();
  const [items, setItems] = useState<MenuProps['items']>([])
  const [modalVisible, setModalVisible] = useState(false)
  const loading = useSelector((state: StoreState) => state.indicator.loading);
  const checkVersionList = useSelector((state: StoreState) => state.indicator.checkVersionList);
  const nowCheckVersion = useSelector((state: StoreState) => state.indicator.nowCheckVersion);

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

  useEffect(() => {
    if (checkVersionList && checkVersionList.length > 0) {
      const arr = checkVersionList.map((item) => ({
        label: item.version === nowCheckVersion? (<span>{item.version}<CheckOutlined style={{marginLeft: '8px' , color: 'green'}}/></span>) : item.version,
        key: item.version,
      }))
      setItems(arr)
    }
  }, [checkVersionList, nowCheckVersion])

  
    const onCheck = (version: any) => {
      const versionObj = (checkVersionList || []).find((item) => item.version === version)
      if(versionObj) {
        const { id } = versionObj
        getMetricDetail({id}, (success: boolean, res: any) => {
          if (success) {
            const dimensionStr = res.metric_params.dimension.name_cn
            const groupByArr = (res.metric_params.group_by || []).map((item: any) => item.name_cn)
            dispatch(setCheckId(res.id));
            dispatch(setQueryParams(res.pql_params.params));
            dispatch(setApi(res.pql_params.api));
            dispatch(setNowCheckVersion(version))
            setTimeout(() => {
              dispatch(setDimension(dimensionStr));
              dispatch(setFunc(res.metric_params.func));
              dispatch(setGroupBy(groupByArr));
            }, 500)
          }
        })
      }
    }

  const onBack = () => {
    dispatch(setcheckVersionList(null))
    dispatch(setNowCheckVersion(null))
    dispatch(exit())
    dispatch(clearQuery())
  }

  return (
    <div className='pdb-indicator' ref={wrapRef}>
      <Spin spinning={loading}>
        {
          checkVersionList && checkVersionList.length > 0 && (
            <div className='pdb-indicator-header'>
              <span>
                历史版本：
                <Dropdown
                  menu={{
                    items, 
                    selectable: true,
                    defaultSelectedKeys: [nowCheckVersion],
                    onClick:({ item, key, keyPath, domEvent })=> { 
                      onCheck(key)
                    }
                  }} 
                  trigger={['click']}
                >
                  <a onClick={(e) => e.preventDefault()}>
                    {nowCheckVersion}
                    <DownOutlined />
                  </a>
                </Dropdown>
              </span>
              <span>
                <Button 
                  style={{ marginRight: '12px' }}
                  onClick={onBack}
                >
                  <RollbackOutlined />
                  回到最新版本
                </Button>
                <Button
                  type='primary'
                  onClick={() => {
                    setModalVisible(true)
                  }}
                >
                  <SaveOutlined />
                  启用此版本
                </Button>
              </span>
            </div>
          )
        }
        <VTable width={width - PADDING * 2} height={(checkVersionList && checkVersionList.length > 0) ? height - PADDING - 40 : height - PADDING} />
      </Spin>
      <UseHistoryModal visible={modalVisible} onCancel={() => setModalVisible(false)} onSuccess={onBack} />
    </div>
  )
}