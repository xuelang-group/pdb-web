import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setShowSearch(true));
    return () => {
    };
  }, []);

  return (
    <Routes>
      <Route path="/:id/indicator/index" element={<IndicatorIndex />} />
      <Route path="/:id/indicator/mode/:type" element={<AddMode />} />
      <Route path="/:id/indicator" element={<Indicator />} />
    </Routes>
  );
}
