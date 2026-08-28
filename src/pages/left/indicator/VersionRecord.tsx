import { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Modal, Tag, Table, message } from "antd";
import { metricHistory, getMetricDetail } from "@/actions/indicator";
import { setQueryParams, setApi } from '@/reducers/query';
import { setcheckVersionList, setNowCheckVersion, setNextShowConfiguration, setExtraColumns } from "@/reducers/indicator";
import { setCurrent, setReadonly } from "@/reducers/indicatorSimple";
import { setAdvReadonly, setGraphData, setMetricInfo, setMetricParams, setPqlParams, updateColumnConfig } from "@/reducers/indicatorAdvance";
import moment from "moment";
import { StoreState } from "@/store";


export default function VersionRecord(props: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const routerParams = useParams();
  const dispatch = useDispatch();
  const requestId = useSelector((state: StoreState) => state.indicator.requestId);
  const [verData, setVerData] = useState([])

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

  const enterIndicatorAdvance = (item: any) => {
    dispatch(setAdvReadonly(true))
    dispatch(setMetricInfo(item))
    dispatch(setGraphData(item.graph_data))
    dispatch(setMetricParams(item.metric_params || {}))
    dispatch(updateColumnConfig(item.column_config || []))
    dispatch(setPqlParams(item.pql_params))
    if (!location.pathname.endsWith("/indicator/advance")) {
      navigate(`/${routerParams.id}/indicator/advance${requestId ? ('?requestId=' + requestId) : ''}`)
    }
  }

  const enterIndicatorSimple = (item: any) => {
    dispatch(setCurrent(item))
    dispatch(setReadonly(true))
    !location.pathname.endsWith("/indicator/simple") && navigate(`/${routerParams.id}/indicator/simple${requestId ? ('?requestId=' + requestId) : ''}`)
  }

  const enterIndicatorProfession = (item: any) => {
    const dimensionStr = item.metric_params.dimension.name_cn
    const groupByArr = (item.metric_params.group_by || []).map((item: any) => item.name_cn)
    dispatch(setExtraColumns(item.metric_params.extra_columns))
    dispatch(setQueryParams(item.pql_params.params));
    dispatch(setApi(item.pql_params.api));
    dispatch(setNextShowConfiguration({
      dimension: dimensionStr,
      func: item.metric_params.func,
      groupBy: groupByArr
    }))
    !location.pathname.endsWith("/indicator") && navigate(`/${routerParams.id}/indicator${requestId ? ('?requestId=' + requestId) : ''}`)
  }

  const onCheck = (record: any) => {
    getMetricDetail({id: record.id}, (success: boolean, res: any) => {
      if (success) {
        if (res.type === 2) {
          enterIndicatorAdvance(res)
        } else if (res.type === 1) {
          enterIndicatorSimple(res)
        } else {
          enterIndicatorProfession(res)
        }
        dispatch(setcheckVersionList(verData))
        dispatch(setNowCheckVersion(record.version))
        onCancel()
      } else {
        message.error(res.message)
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
      <Table rowKey="id"
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
            render: (text: any) => moment(text).format("YYYY-MM-DD HH:mm:ss")
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