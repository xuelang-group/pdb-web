import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import type { MenuProps } from "antd";
import {
  DownOutlined,
  CheckOutlined,
  RollbackOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { StoreState } from "@/store";
import {
  exit,
  setcheckVersionList,
  setNowCheckVersion,
  setCheckId,
  setNextShowConfiguration,
} from "@/reducers/indicator";
import { setShowSearch } from "@/reducers/editor";
import { setQueryParams, setApi, clearQuery } from "@/reducers/query";
import UseHistoryModal from "./components/UseHistoryModal";
import { getMetricDetail } from "@/actions/indicator";
import IndicatorIndex from "./IndicatorIndex"
import AddMode from "./AddMode"
import Indicator from "./Indicator"
import "./index.less";

export default function IndicatorWrapper(props: any) {
  const wrapRef = useRef(null);
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const loading = useSelector((state: StoreState) => state.indicator.loading);
  const query = useSelector((state: StoreState) => state.query.params);
  const [items, setItems] = useState<MenuProps["items"]>([]);
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
  
  const onBack = () => {
    const versionObj = (checkVersionList || [])[0];
    if (versionObj) {
      const { id } = versionObj;
      getMetricDetail({ id }, (success: boolean, res: any) => {
        if (success) {
          const dimensionStr = res.metric_params.dimension.name_cn;
          const groupByArr = (res.metric_params.group_by || []).map(
            (item: any) => item.name_cn
          );
          dispatch(setCheckId(res.id));
          dispatch(setQueryParams(res.pql_params.params));
          dispatch(setApi(res.pql_params.api));
          dispatch(setcheckVersionList(null));
          dispatch(setNowCheckVersion(null));
          dispatch(
            setNextShowConfiguration({
              dimension: dimensionStr,
              func: res.metric_params.func,
              groupBy: groupByArr,
            })
          );
          // setTimeout(() => {
          //   dispatch(setDimension(dimensionStr));
          //   dispatch(setFunc(res.metric_params.func));
          //   dispatch(setGroupBy(groupByArr));
          // }, 500)
        }
      });
    } else {
      dispatch(setcheckVersionList(null));
      dispatch(setNowCheckVersion(null));
      dispatch(exit());
      dispatch(clearQuery());
    }
  };

  useEffect(() => {
    dispatch(setShowSearch(true));
    return () => {
    };
  }, []);

  return (
    <>
      <Routes>
        <Route path="/:id/indicator/index" element={<IndicatorIndex />} />
        <Route path="/:id/indicator/mode/:type" element={<AddMode />} />
        <Route path="/:id/indicator" element={<Indicator />} />
      </Routes>
      <UseHistoryModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSuccess={onBack}
      />
    </>
  );
}
