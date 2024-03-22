import { Divider, Layout } from "antd";
import _ from "lodash";
import "moment/locale/zh-cn";
import { ReactNode, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { setCollapsed } from "@/reducers/app";
import './index.less'

const title: any = {
  'template': '模板',
  'object': '项目'
}

interface HeaderProps {
  route: string
  headerEXtraWidth?: number
  centerContent?: ReactNode
}

export default function Header(props: HeaderProps) {
  const { route, headerEXtraWidth, centerContent } = props;
  const graphData = useSelector((store: any) => store[route].graphData);
  const graphSavedMsg = useSelector((store: any) => store[route].graphSavedMsg);
  const dispatch = useDispatch();

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

  const handleCollapsed = function() {
    dispatch(setCollapsed(false));
  }
  
  return (
    <Layout.Header className='pdb-header'>
      {/* {(window as any).PDB && */}
      <a className="pdb-header-button" onClick={handleCollapsed}>
        <i className="spicon icon-jiantou-zuo"></i>
      </a>
      {/* } */}
      <div className="pdb-header-info">
        <h2 className="pdb-header-title">
          {_.get(graphData, 'name', '')}
        </h2>
        <div className="pdb-header-title-sub">
          <span>{title[route]}</span>
          {graphSavedMsg && graphSavedMsg.msg &&
            <div className="pdb-app-saved">
              <span className="pdb-app-saving">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
                  <circle ref={circleRef} fill="none" strokeLinecap="round" cx="7" cy="7" r="6" strokeWidth="1" strokeDasharray="37.69911184307752 37.69911184307752" strokeDashoffset="7.5398223686155035"></circle>
                  <polyline ref={polylineRef} fill="none" strokeLinejoin="round" strokeLinecap="round" strokeWidth="1" points="5,6 7,8.5 11.8,3" strokeDasharray="10.501562118716425 10.501562118716425" strokeDashoffset="0"></polyline>
                </svg>
              </span>
              <span>{graphSavedMsg.msg}</span>
            </div>
          }
        </div>
      </div>
      <div  className="pdb-header-center">{centerContent}</div>
      <div className="pdb-header-right" style={{ marginRight: headerEXtraWidth || 0 }}>
        {/* <div className="pdb-header-toolbar">
          <div className="pdb-header-toolbar-item">
            <i className="spicon icon-daoru"></i>
          </div>
        </div> */}
        {Number(headerEXtraWidth) > 0 && <Divider />}
      </div>
    </Layout.Header>
  )
}