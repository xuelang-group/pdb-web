import { Modal, Form, Input, Tag, Spin, Table } from "antd";
import { StoreState } from '@/store';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { metricHistory, getMetricDetail } from "@/actions/indicator";
import { setQueryParams, setApi } from '@/reducers/query';
import { setCheckId, setGroupBy, setDimension,setFunc, setcheckVersionList, setNowCheckVersion, setNextShowConfiguration } from "@/reducers/indicator";
import { useEffect, useState } from "react";


export default function VersionRecord(props: any) {
  const [verData, setVerData] = useState([])
  const navigate = useNavigate();
  const routerParams = useParams();
  const dispatch = useDispatch();

  useEffect(() => {
    if (props.versionId) {
      metricHistory({ori_id:props.versionId}, (success: boolean, res: any) => {
        if (success) {
          setVerData(res)
        }
      })
    }
  }, [props.versionId])

  const onCancel = () => {
    props.onClose()
  }

  const onCheck = (record: any) => {
    getMetricDetail({id: record.id}, (success: boolean, res: any) => {
      if (success) {
        const dimensionStr = res.metric_params.dimension.name_cn
        const groupByArr = (res.metric_params.group_by || []).map((item: any) => item.name_cn)
        navigate(`/${routerParams.id}/indicator`)
        dispatch(setCheckId(res.id));
        dispatch(setQueryParams(res.pql_params.params));
        dispatch(setApi(res.pql_params.api));
        dispatch(setcheckVersionList(verData))
        dispatch(setNowCheckVersion(record.version))
        onCancel()
        dispatch(setNextShowConfiguration({
          dimension: dimensionStr,
          func: res.metric_params.func,
          groupBy: groupByArr
        }))
        // setTimeout(() => {
        //   dispatch(setDimension(dimensionStr));
        //   dispatch(setFunc(res.metric_params.func));
        //   dispatch(setGroupBy(groupByArr));
        // }, 500)
      }
    })
  }

  return (
    <Modal
      open={props.visible}
      title='版本记录'
      onCancel={onCancel}
      footer={null}
      width={960}
      maskClosable={false}
    >
      <Table 
        columns={[
          {
            title: '版本号',
            dataIndex:'version',
            key:'version',
            render: (text: any, record: any, index: number) => 
              index === 0 ? <span>{text}<Tag className='indicator-tag'>最新版本</Tag></span> : text
          },
          {
            title: '创建时间',
            dataIndex: 'created_at',
            key: 'created_at',
          },
          {
            title: '操作',
            dataIndex: 'operation',
            key: 'operation',
            render: (text: any, record: any) => (
              <a
                onClick={() => {
                  onCheck(record)
                }}
                style={{ cursor: 'pointer' }}
              >
                查看
              </a>
            )
          },
        ]}
        dataSource={verData}
        pagination={false}
      />
    </Modal>
  )
}