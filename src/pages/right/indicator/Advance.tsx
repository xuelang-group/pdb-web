import { Button, Col, Flex, Form, Modal, Row, Space } from "antd";
import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PdbPanel from "@/components/Panel";
import { StoreState } from "@/store";

export default function Advance(props: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const routerParams = useParams();
  // const [infoForm] = Form.useForm();
  // const [modal, contextHolder] = Modal.useModal();
  const requestId = useSelector(
    (state: StoreState) => state.indicator.requestId
  );
  const api = useSelector((state: StoreState) => state.query.api);
  const query = useSelector((state: StoreState) => state.query.params);
  const systemInfo = useSelector((state: StoreState) => state.app.systemInfo);
  return (
    <div className="pdb-right-panel">
      <PdbPanel title="指标配置" direction="right" canCollapsed={true}>
        <div className="pdb-app-info"></div>
        <Space
          direction="vertical"
          style={{ margin: "auto 0 16px", padding: "0 17px" }}
          size={16}
        >
          <Row gutter={8}>
            <Col span={12}>
              <Button block type="primary" onClick={() => {}}>
                试计算
              </Button>
            </Col>
            <Col span={12}>
              <Button block type="primary" onClick={() => {}}>
                保存指标
              </Button>
            </Col>
          </Row>
          <Button
            block
            onClick={() => {
              navigate(`/${systemInfo.graphId}/indicator/index`);
            }}
          >
            退出
          </Button>
        </Space>
      </PdbPanel>
    </div>
  );
}
