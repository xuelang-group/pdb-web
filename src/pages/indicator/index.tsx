import { useDispatch, useSelector } from "react-redux";
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import IndicatorIndex from "./IndicatorIndex"
import IndicatorSimple from "./IndicatorSimple"
import IndicatorAdvance from "@/pages/graph/indicator"
import Indicator from "./Indicator"
import "./index.less";

export default function IndicatorWrapper(props: any) {
  const dispatch = useDispatch();

  return (
    <Routes>
      <Route path="/:id/indicator/index" element={<IndicatorIndex />} />
      <Route path="/:id/indicator/simple" element={<IndicatorSimple />} />
      <Route path="/:id/indicator/advance" element={<IndicatorAdvance />} />
      <Route path="/:id/indicator" element={<Indicator />} />
    </Routes>
  );
}
