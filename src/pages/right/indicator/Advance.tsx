import { Button, Col, Flex, Form, Modal, Radio, Row, Select, Space } from "antd";
import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PdbPanel from "@/components/Panel";
import { StoreState } from "@/store";
import { find, forEach, map } from "lodash";

const SIMPLE_MAP = {
  'division': '除',
  'subtraction': '减'
}

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
  const selected = useSelector((state: StoreState) => state.indicatorAdvance.selected);
  const upstreams = useSelector((state: StoreState) => state.indicatorAdvance.upstreams);
  const [upEnd, setUpEnd] = useState('')

  const handleChangeUpstream = (edgeId: string) => {
    const graph = (window as any).INDICATOR_GRAPH
    const model = graph.findById(edgeId).getModel()
    setUpEnd(edgeId)
    graph.updateItem(edgeId, {...model, end: true})
    graph.setItemState(edgeId, 'end', true)
    forEach(upstreams, (item) => {
      if (item.edgeId !== edgeId) {
        graph.setItemState(item.edgeId, 'end', false)
      }
    })
  }

  useEffect(() => {
    if (upstreams) {
      const end = find(upstreams, {end: true})
      setUpEnd(end?.edgeId || '')
    }
  }, [upstreams])

  return (
    <div className="pdb-right-panel">
      <PdbPanel title="指标配置" direction="right" canCollapsed={true}>
        <div className="pdb-app-info">
          { selected?.type === 'symbol' && ['divide', 'minus'].includes(selected?.label) && (
              <Form.Item label={`被${selected?.label === 'divide' ? '除' : '减'}数`} >
                {
                  upstreams && <Radio.Group value={upEnd} onChange={(e) => handleChangeUpstream(e.target.value)}>
                    {upstreams.map(item => (<Radio key={item.edgeId} value={item.edgeId}>{item.label}</Radio>))}
                  </Radio.Group>
                }
              </Form.Item>
          )}
        </div>
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
