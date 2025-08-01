import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Spin } from "antd";
import { StoreState } from "@/store";
import VTable from "./components/VTable";
import VersionHeader from "./components/VersionHeader";
import "./indicator.less";

export default function Indicator(props: any) {
  const wrapRef = useRef(null);
  const loading = useSelector((state: StoreState) => state.indicator.loading);
  const checkVersionList = useSelector(
    (state: StoreState) => state.indicator.checkVersionList
  );

  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(500);

  const PADDING = 24;

  const updateSize = () => {
    const wrapper: any = wrapRef.current;
    if (!wrapper || !wrapper.offsetWidth || !wrapper.offsetHeight) return;
    setWidth(wrapper.offsetWidth);
    setHeight(wrapper.offsetHeight);
  };

  useEffect(() => {
    updateSize();
    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  return (
    <div className="pdb-indicator" ref={wrapRef}>
      <VersionHeader />
      <Spin spinning={loading}>
        <VTable
          width={width - PADDING * 2}
          height={
            checkVersionList && checkVersionList.length > 0
              ? height - PADDING - 40
              : height - PADDING
          }
        />
      </Spin>
    </div>
  );
}
