import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Dropdown, message } from "antd";
import type { MenuProps } from "antd";
import { StoreState } from "@/store";
import {
  DownOutlined,
  CheckOutlined,
  RollbackOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  exit,
  setcheckVersionList,
  setNowCheckVersion,
  resetData,
  setNextShowConfiguration,
  setExtraColumns,
  setMetrics,
} from "@/reducers/indicator";
import { setQueryParams, setApi } from "@/reducers/query";
import { clearQuery } from "@/reducers/query";
import UseHistoryModal from "./UseHistoryModal";
import { getMetricDetail, getMetrics } from "@/actions/indicator";
import { setCurrent, setReadonly } from "@/reducers/indicatorSimple";
import { setAdvReadonly, setGraphData, setMetricInfo, setMetricParams, setPqlParams, updateColumnConfig } from "@/reducers/indicatorAdvance";
import { setIndicatorLoading } from "@/reducers/editor";

export default function Indicator(props: any) {
  const navigate = useNavigate();
  const routerParams = useParams();
  const dispatch = useDispatch();
  const [items, setItems] = useState<MenuProps["items"]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const requestId = useSelector(
    (state: StoreState) => state.indicator.requestId
  );
  const checkVersionList = useSelector(
    (state: StoreState) => state.indicator.checkVersionList
  );
  const nowCheckVersion = useSelector(
    (state: StoreState) => state.indicator.nowCheckVersion
  );

  useEffect(() => {
    if (checkVersionList && checkVersionList.length > 0) {
      const arr = checkVersionList.map((item) => ({
        label:
          item.version === nowCheckVersion ? (
            <span>
              {item.version}
              <CheckOutlined style={{ marginLeft: "8px", color: "green" }} />
            </span>
          ) : (
            item.version
          ),
        key: item.version,
      }));
      setItems(arr);
    }
  }, [checkVersionList, nowCheckVersion]);

  const enterIndicatorAdvance = (item: any) => {
    dispatch(setMetricInfo(item))
    dispatch(setGraphData(item.graph_data))
    dispatch(setMetricParams(item.metric_params || {}))
    dispatch(updateColumnConfig(item.column_config || []))
    dispatch(setPqlParams(item.pql_params))
  }

  const enterIndicatorSimple = (item: any) => {
    dispatch(setCurrent(item))
    dispatch(setReadonly(true))
  }

  const enterIndicatorProfession = (item: any) => {
    const dimensionStr = item.metric_params.dimension.name_cn
    const groupByArr = (item.metric_params.group_by || []).map((item: any) => item.name_cn)
    dispatch(resetData())
    dispatch(setExtraColumns(item.metric_params.extra_columns))
    dispatch(setQueryParams(item.pql_params.params));
    dispatch(setApi(item.pql_params.api));
    dispatch(setNextShowConfiguration({
      dimension: dimensionStr,
      func: item.metric_params.func,
      groupBy: groupByArr
    }))
  }

  const renderVersion = (versionObj: any, newest?: boolean) => {
    const { id, version } = versionObj;
    getMetricDetail({ id }, (success: boolean, res: any) => {
      if (success) {
        if (res.type === 2) {
          enterIndicatorAdvance(res)
        } else if (res.type === 1) {
          enterIndicatorSimple(res)
          newest && dispatch(setReadonly(false))
        } else {
          enterIndicatorProfession(res)
          newest && dispatch(setAdvReadonly(false))
        }
        if (newest) { 
          // 回到最新版本  
          dispatch(setcheckVersionList(null));
          dispatch(setNowCheckVersion(null));
        } else {
          dispatch(setNowCheckVersion(version));
        }
      }
    });
  }

  const onCheck = (version: any) => {
    const versionObj = (checkVersionList || []).find(
      (item) => item.version === version
    );
    if (versionObj) {
      renderVersion(versionObj)
    }
  };
  
  const onBack = () => {
    const versionObj = (checkVersionList || [])[0];
    if (versionObj) {
      renderVersion(versionObj, true)
    } else {
      dispatch(setcheckVersionList(null));
      dispatch(setNowCheckVersion(null));
      dispatch(exit());
      dispatch(clearQuery());
      navigate(`/${routerParams.id}/indicator${requestId ? ('?requestId=' + requestId) : ''}`);
    }
  };

  const onSuccess = () => {
    dispatch(setcheckVersionList(null));
    dispatch(setNowCheckVersion(null));
    dispatch(setIndicatorLoading(true));
    getMetrics(function (response: any) {
      if (response) {
        dispatch(setMetrics(response || []));
      } else {
        message.error('获取列表数据失败：' + response.message || response.msg);
      }
      dispatch(setIndicatorLoading(false));
    })
  }

  const renderHistoryHeader = () => (
    <div className="pdb-indicator-header">
      <span>
        历史版本：
        <Dropdown
          menu={{
            items,
            selectable: true,
            defaultSelectedKeys: [nowCheckVersion],
            onClick: ({ item, key, keyPath, domEvent }) => {
              onCheck(key);
            },
          }}
          trigger={["click"]}
        >
          <a onClick={(e) => e.preventDefault()}>
            {nowCheckVersion}
            <DownOutlined />
          </a>
        </Dropdown>
      </span>
      <span>
        <Button style={{ marginRight: "12px" }} onClick={onBack}>
          <RollbackOutlined />
          回到最新版本
        </Button>
        <Button
          type="primary"
          onClick={() => {
            setModalVisible(true);
          }}
        >
          <SaveOutlined />
          启用此版本
        </Button>
      </span>
    </div>
  )

  return (
    <>
      {checkVersionList && checkVersionList.length > 0 && renderHistoryHeader()}
      
      <UseHistoryModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSuccess={onSuccess}
      />
    </>
  )
}
