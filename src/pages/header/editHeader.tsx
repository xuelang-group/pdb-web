import { Divider } from "antd";
import _ from "lodash";
import "moment/locale/zh-cn";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from 'react-router-dom';

import { resetSchema } from "@/actions/type";
import { setCurrentEditModel } from "@/reducers/editor";
import './index.less';

interface HeaderProps {
  route: string
  headerEXtraWidth?: number
}

export default function EditHeader(props: HeaderProps) {
  const routerParams = useParams(),
    dispatch = useDispatch();
  const { route, headerEXtraWidth } = props;
  const graphSavedMsg = useSelector((store: any) => store[route].graphSavedMsg);
  const navigate = useNavigate();

  let timer: any,
    len = 10.501562118716425,
    checkedPercent = 1,
    circum = 12 * Math.PI,
    percent = 0.8;
  const polylineRef: any = useRef(),
    circleRef: any = useRef();

  function drawPolyline() {
    timer = requestAnimationFrame(function () {
      if (!polylineRef.current) return;
      polylineRef.current.setAttribute('stroke-dashoffset', len - checkedPercent * len);
      window.cancelAnimationFrame(timer);
      timer = null;
      if (checkedPercent < 1) {
        checkedPercent += 0.05;
        drawPolyline();
      } else {
        checkedPercent = 0
      }
    });
  }

  function drawCircle() {
    timer = requestAnimationFrame(function () {
      if (!circleRef.current) return;
      circleRef.current.setAttribute('stroke-dashoffset', circum - percent * circum);
      window.cancelAnimationFrame(timer);
      timer = null;
      if (percent < 0.8) {
        percent += 0.02;
        drawCircle();
      } else {
        percent = 0;
        drawPolyline();
      }
    });
  }

  useEffect(() => {
    if (!(polylineRef.current && circleRef.current) || graphSavedMsg.status !== 'success') return;
    percent = 0;
    checkedPercent = 0
    circleRef.current.setAttribute('stroke-dashoffset', circum - percent * circum);
    polylineRef.current.setAttribute('stroke-dashoffset', len - checkedPercent * len);
    drawCircle();
  }, [graphSavedMsg?.status]);

  function exit() {
    navigate(`/${routerParams.id}`);
    resetSchema(routerParams.id, () => { });
    dispatch(setCurrentEditModel(null));
  }

  return (
    <div className='pdb-header pdb-header-edit'>
      <div className="pdb-header-info">
        <h2 className="pdb-header-title">
          类型管理
        </h2>
      </div>
      <div className="pdb-header-right" style={{ marginRight: headerEXtraWidth || 0 }}>
        <a
          className="pdb-header-button"
          onClick={exit}
        >
          退出
        </a>
        {Number(headerEXtraWidth) > 0 && <Divider />}
      </div>
    </div>
  )
}